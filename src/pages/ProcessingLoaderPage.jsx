import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { InvokeCommand } from '@aws-sdk/client-lambda'
import { s3Client, dynamoClient, lambdaClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'

const STEPS = [
  { label: 'Ingesting Files',          icon: 'inbox'         },
  { label: 'Classifying Documents',    icon: 'sync'          },
  { label: 'Extracting Identity Data', icon: 'manage_search' },
  { label: 'Running Fraud Checks',     icon: 'security'      },
]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function ProcessingLoaderPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const appId = state?.appId
  const product = state?.product
  const files = state?.files ?? []

  const [step, setStep] = useState(0)

  useEffect(() => {
    async function run() {
      try {
        // ── Step 0: Ingesting Files ──────────────────────────────────────────
        // Upload each file to S3, then update DynamoDB with the document list
        const uploadedDocs = []
        for (const file of files) {
          const key = `${appId}/${Date.now()}-${file.name}`
          const arrayBuffer = await file.raw.arrayBuffer()
          await s3Client.send(new PutObjectCommand({
            Bucket: awsConfig.s3BucketName,
            Key: key,
            Body: new Uint8Array(arrayBuffer),
            ContentType: file.raw.type || 'application/octet-stream',
          }))
          uploadedDocs.push({ key, name: file.name, size: file.size, uploadedAt: new Date().toISOString() })
        }

        await dynamoClient.send(new UpdateCommand({
          TableName: awsConfig.dynamoTableName,
          Key: { appId },
          UpdateExpression: 'SET documents = :docs, #st = :st, updatedAt = :ts',
          ExpressionAttributeNames: { '#st': 'status' },
          ExpressionAttributeValues: {
            ':docs': uploadedDocs,
            ':st': 'uploaded',
            ':ts': new Date().toISOString(),
          },
        }))

        // ── Step 1: Classifying Documents ────────────────────────────────────
        // Invoke Lambda and advance to step 2 after 3 seconds while it runs
        setStep(1)
        const lambdaPromise = lambdaClient.send(new InvokeCommand({
          FunctionName: awsConfig.classifyDocumentFunctionName,
          Payload: new TextEncoder().encode(JSON.stringify({ appId })),
        }))

        await sleep(3000)

        // ── Step 2: Extracting Identity Data ─────────────────────────────────
        // Stays here until Lambda completes (Lambda writes aiResults to DynamoDB)
        setStep(2)
        await lambdaPromise

        // ── Step 3: Running Fraud Checks ─────────────────────────────────────
        setStep(3)
        await sleep(2500)

        navigate('/cases/overview', { state: { appId, product } })
      } catch (err) {
        console.error('Processing failed:', err)
      }
    }

    run()
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

          {/* Animation */}
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
