import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { dynamoClient, s3Client, bedrockClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'

const STEPS = [
  { label: 'Ingesting Files',          icon: 'inbox'         },
  { label: 'Classifying Documents',    icon: 'sync'          },
  { label: 'Extracting Identity Data', icon: 'manage_search' },
  { label: 'Running Fraud Checks',     icon: 'security'      },
]

const BEDROCK_PROMPT = `You are a KYC document verification AI for Bank ABC.
Analyze each provided document and return ONLY a valid JSON array — no markdown, no explanation.
Each element must follow this exact structure:
[
  {
    "documentType": "Passport | National ID | Trade License | Certificate of Incorporation | MOA | Power of Attorney | Bank Statement | Utility Bill | Salary Certificate | Selfie | Other",
    "extractedFields": { "fieldName": "value" },
    "confidenceScore": 0-100,
    "fraudIndicators": [],
    "verificationStatus": "verified | needs_review | suspicious",
    "summary": "one sentence summary"
  }
]`

async function fetchDocumentAsBase64(key) {
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: awsConfig.s3BucketName,
    Key: key,
  }))
  const bytes = await response.Body.transformToByteArray()
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return { base64: btoa(binary), contentType: response.ContentType || 'application/octet-stream' }
}

function mediaTypeToBlockType(contentType) {
  if (contentType.startsWith('image/')) return 'image'
  if (contentType === 'application/pdf') return 'document'
  return 'image'
}

async function invokeBedrockOnDocuments(documents) {
  if (!documents || documents.length === 0) return []

  const contentBlocks = []
  for (const doc of documents) {
    try {
      const { base64, contentType } = await fetchDocumentAsBase64(doc.key)
      const blockType = mediaTypeToBlockType(contentType)
      contentBlocks.push({
        type: blockType,
        source: { type: 'base64', media_type: contentType, data: base64 },
      })
    } catch (err) {
      console.warn(`Could not fetch document ${doc.key}:`, err)
    }
  }

  if (contentBlocks.length === 0) return []

  contentBlocks.push({ type: 'text', text: BEDROCK_PROMPT })

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages: [{ role: 'user', content: contentBlocks }],
  })

  const response = await bedrockClient.send(new InvokeModelCommand({
    modelId: awsConfig.bedrockModelId,
    contentType: 'application/json',
    accept: 'application/json',
    body,
  }))

  const decoded = JSON.parse(new TextDecoder().decode(response.body))
  const text = decoded.content?.[0]?.text ?? '[]'

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

export default function ProcessingLoaderPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const appId = state?.appId
  const [step, setStep] = useState(0)

  useEffect(() => {
    const total = Math.floor(Math.random() * 5001) + 5000
    const interval = total / STEPS.length

    // Animate steps
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i + 1), interval * (i + 1))
    )

    // Run actual processing
    async function run() {
      try {
        const result = await dynamoClient.send(new GetCommand({
          TableName: awsConfig.dynamoTableName,
          Key: { appId },
        }))
        const caseRecord = result.Item ?? {}
        const aiResults = await invokeBedrockOnDocuments(caseRecord.documents ?? [])
        await dynamoClient.send(new UpdateCommand({
          TableName: awsConfig.dynamoTableName,
          Key: { appId },
          UpdateExpression: 'SET aiResults = :ai, #st = :st, updatedAt = :ts',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: {
            ':ai': aiResults,
            ':st': 'in_review',
            ':ts': new Date().toISOString(),
          },
        }))
      } catch (err) {
        console.error('Processing failed:', err)
      }
    }

    // Navigate when both animation and processing are done
    Promise.all([
      run(),
      new Promise((resolve) => setTimeout(resolve, total + 400)),
    ]).then(() => navigate('/cases/overview', { state }))

    return () => timers.forEach(clearTimeout)
  }, [])

  const progress = Math.round((step / STEPS.length) * 100)

  return (
    <div className="bg-background text-on-background h-screen flex overflow-hidden">
      <style>{`
        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .spin-slow {
          animation: spin 3s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <main className="flex-1 h-full flex items-center justify-center p-gutter">
        <div className="bg-surface border border-outline-variant rounded-lg w-full max-w-2xl p-stack-lg shadow-sm flex flex-col items-center">

          {/* Animation area */}
          <div className="relative w-48 h-48 mb-stack-lg flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-secondary pulse-ring" />
            <div className="absolute inset-4 rounded-full border-4 border-surface-container-high border-t-primary spin-slow" />
            <div className="bg-surface-container-low rounded-full w-24 h-24 flex items-center justify-center z-10 shadow-sm border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-4xl">document_scanner</span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-stack-lg">
            <h1 className="text-headline-md font-headline-sm text-primary mb-stack-sm">Processing Case Data</h1>
            <p className="text-body-md font-body-md text-on-surface-variant">Please wait while we verify the submitted documents.</p>
          </div>

          {/* Steps */}
          <div className="w-full space-y-unit">
            {STEPS.map((s, i) => {
              const done = i < step
              const active = i === step

              if (done) return (
                <div key={s.label} className="flex items-center justify-between p-stack-sm bg-surface-container-low border border-outline-variant rounded">
                  <div className="flex items-center gap-stack-sm">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                    <span className="text-label-md font-label-md text-on-background">{s.label}</span>
                  </div>
                  <span className="text-mono-md font-mono-md text-secondary">[Complete]</span>
                </div>
              )

              if (active) return (
                <div key={s.label} className="flex items-center justify-between p-stack-sm bg-surface border border-primary ring-1 ring-primary/20 rounded shadow-sm">
                  <div className="flex items-center gap-stack-sm">
                    <span className="material-symbols-outlined text-primary spin-slow">sync</span>
                    <span className="text-label-md font-label-md text-primary">{s.label}</span>
                  </div>
                  <span className="text-mono-md font-mono-md text-primary">[In Progress]</span>
                </div>
              )

              return (
                <div key={s.label} className="flex items-center justify-between p-stack-sm bg-surface opacity-50 border border-outline-variant rounded">
                  <div className="flex items-center gap-stack-sm">
                    <span className="material-symbols-outlined text-outline">hourglass_empty</span>
                    <span className="text-label-md font-label-md text-outline">{s.label}</span>
                  </div>
                  <span className="text-mono-md font-mono-md text-outline">[Pending]</span>
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-stack-lg w-full">
            <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-right text-mono-md font-mono-md text-on-surface-variant mt-unit text-xs">{progress}%</p>
          </div>

          {/* Cancel */}
          <div className="mt-stack-lg text-center">
            <button
              className="px-stack-md py-stack-sm border border-outline-variant rounded text-label-md font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors"
              onClick={() => navigate(-1)}
              type="button"
            >
              Cancel Processing
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
