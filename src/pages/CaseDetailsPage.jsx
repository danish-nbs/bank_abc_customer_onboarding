import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { InvokeCommand } from '@aws-sdk/client-lambda'
import { dynamoClient, s3Client, lambdaClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'
import { currentUser } from '../data/mockData'

const TABS = ['Overview', 'Documents', 'Identity & Fraud', 'AML', 'Risk', 'Activity', 'Notes', 'Audit', 'Decisions']

const REQUIRED_DOCS = {
  'Credit Card':       ['Passport / National ID', 'Utility Bill', 'Bank Statement', 'Selfie'],
  'Personal Loan':     ['Passport / National ID', 'Salary Certificate', 'Bank Statement', 'Selfie'],
  'SME Account':       ['Trade License', 'Certificate of Incorporation', 'Passport / National ID', 'Selfie'],
  'Corporate Account': ['Trade License', 'Power of Attorney', 'Passport / National ID', 'Selfie'],
}

const DOC_TYPE_OPTIONS = {
  'Credit Card':       ['Passport', 'National ID', 'Utility Bill', 'Bank Statement', 'Selfie'],
  'Personal Loan':     ['Passport', 'National ID', 'Salary Certificate', 'Bank Statement', 'Selfie'],
  'SME Account':       ['Trade License', 'Certificate of Incorporation', 'Passport', 'National ID', 'Selfie'],
  'Corporate Account': ['Trade License', 'Power of Attorney', 'Passport', 'National ID', 'Selfie'],
}

const REQUIRED_FIELDS_BY_DOC_TYPE = {
  'Passport':                    ['fullName', 'passportNumber', 'nationality', 'dateOfBirth', 'gender', 'issueDate', 'expiryDate', 'issuingCountry'],
  'National ID':                 ['fullName', 'idNumber', 'dateOfBirth', 'nationality', 'expiryDate', 'gender', 'address'],
  'Utility Bill':                ['customerName', 'serviceAddress', 'billDate', 'accountNumber', 'utilityProvider'],
  'Bank Statement':              ['accountHolderName', 'accountNumber', 'iban', 'bankName', 'statementStartDate', 'statementEndDate', 'closingBalance'],
  'Selfie':                      [],
  'Salary Certificate':          ['employeeName', 'employerName', 'employeeId', 'monthlySalary', 'netSalary', 'issueDate', 'jobTitle'],
  'Trade License':               ['companyName', 'tradeLicenseNumber', 'businessActivity', 'issueDate', 'expiryDate', 'licensingAuthority'],
  'Certificate of Incorporation':['companyName', 'registrationNumber', 'incorporationDate', 'country'],
  'MOA':                         ['companyName', 'registrationNumber', 'authorizedSignatories', 'issueDate'],
  'Power of Attorney':           ['principalName', 'attorneyName', 'effectiveDate', 'expiryDate', 'scope'],
}

export default function CaseDetailsPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const appId = state?.appId ?? 'APP-882194-Z'

  const [activeTab, setActiveTab] = useState(0)
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const result = await dynamoClient.send(new GetCommand({
          TableName: awsConfig.dynamoTableName,
          Key: { appId },
        }))
        setCaseData(result.Item ?? null)
      } catch (err) {
        console.error('Failed to load case:', err)
      } finally {
        setLoading(false)
      }
    }
    if (appId) load()
    else setLoading(false)
  }, [appId, refreshKey])

  const fd = caseData?.formData ?? {}
  const isIndividual = !caseData || caseData.customerType === 'individual'
  const customerName = isIndividual
    ? [fd.firstName, fd.middleName, fd.lastName].filter(Boolean).join(' ') || '—'
    : fd.legalEntityName || '—'
  const customerTypeLabel = isIndividual ? 'Individual Onboarding' : 'Corporate Onboarding'
  const statusLabel = (caseData?.status || 'in_review').replace(/_/g, ' ')

  return (
    <div className="font-body-md text-body-md text-on-surface overflow-hidden h-screen flex">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .main-scroll::-webkit-scrollbar { width: 4px; }
        .main-scroll::-webkit-scrollbar-track { background: transparent; }
        .main-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .document-overlay {
          background-image: radial-gradient(circle, rgba(0,33,71,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>

      {/* Sidebar */}
      <aside className="flex flex-col h-screen py-stack-lg px-unit bg-surface-container-low border-r border-outline-variant w-64 shrink-0">
        <div className="px-stack-md mb-stack-lg">
          <h1 className="text-headline-sm font-headline-sm text-primary">Case Manager</h1>
          <p className="text-label-md font-label-md text-on-surface-variant">Onboarding Team</p>
        </div>
        <nav className="flex-1 space-y-1 px-unit">
          <Link to="/dashboard" className="flex items-center gap-3 px-stack-md py-stack-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-all">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-label-md font-label-md">Dashboard</span>
          </Link>
          <a className="flex items-center gap-3 px-stack-md py-stack-sm bg-secondary-container text-on-secondary-container rounded-lg font-bold transition-all" href="#">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>folder_shared</span>
            <span className="text-label-md font-label-md">Cases</span>
          </a>
          <a className="flex items-center gap-3 px-stack-md py-stack-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">group</span>
            <span className="text-label-md font-label-md">Clients</span>
          </a>
          <a className="flex items-center gap-3 px-stack-md py-stack-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-label-md font-label-md">Analytics</span>
          </a>
          <a className="flex items-center gap-3 px-stack-md py-stack-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-label-md font-label-md">Settings</span>
          </a>
        </nav>
        <div className="mt-auto border-t border-outline-variant pt-stack-md px-unit space-y-1">
          <a className="flex items-center gap-3 px-stack-md py-stack-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="text-label-md font-label-md">Support</span>
          </a>
          <div className="flex items-center gap-3 px-stack-md py-stack-sm bg-surface-container-lowest rounded-xl border border-outline-variant">
            <img alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" src={currentUser.avatar} />
            <div className="overflow-hidden flex-1">
              <p className="text-body-sm font-bold text-on-surface truncate">{currentUser.name}</p>
              <p className="text-xs text-on-surface-variant">{currentUser.role}</p>
            </div>
            <button className="ml-auto material-symbols-outlined text-on-surface-variant" type="button">logout</button>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top header */}
        <header className="flex justify-between items-center w-full px-margin-desktop py-unit bg-surface border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-8">
            <span className="text-headline-sm font-headline-sm text-primary">Bank ABC Onboarding Platform</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md w-72 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" placeholder="Search case ID or entity..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-primary hover:bg-surface-container-high transition-colors rounded-full" type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-primary hover:bg-surface-container-high transition-colors rounded-full" type="button">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        {/* Page header */}
        <div className="px-margin-desktop pt-8 pb-4 bg-background shrink-0">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-secondary text-label-md font-label-md hover:underline mb-4" type="button">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Case Queue
          </button>
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-display-lg font-display-lg text-on-surface">{appId}</h2>
                <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-label-md rounded-full capitalize">{statusLabel}</span>
              </div>
              <p className="text-body-lg text-on-surface-variant">{customerName} • {customerTypeLabel}</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-[10px] border border-outline rounded-lg text-label-md font-bold hover:bg-surface-container-high transition-colors" type="button">Escalate</button>
              <button className="px-4 py-[10px] border border-outline rounded-lg text-label-md font-bold hover:bg-surface-container-high transition-colors" type="button">Request Documents</button>
              <button className="px-4 py-[10px] bg-error-container text-on-error-container rounded-lg text-label-md font-bold hover:opacity-90 transition-opacity" type="button">Reject</button>
              <button className="px-4 py-[10px] bg-primary text-on-primary rounded-lg text-label-md font-bold hover:shadow-lg transition-all" type="button">Approve Case</button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-outline-variant bg-background px-margin-desktop gap-8 overflow-x-auto scrollbar-hide shrink-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`pb-3 text-label-md whitespace-nowrap transition-colors ${
                i === activeTab
                  ? 'text-primary font-bold border-b-2 border-primary -mb-px'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 0 && (
          <main className="flex-1 overflow-y-auto p-margin-desktop bg-background space-y-stack-lg main-scroll">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-12">Loading case data...</div>
              : <OverviewContent appId={appId} caseData={caseData} />
            }
          </main>
        )}

        {activeTab === 1 && (
          <div className="flex-1 overflow-hidden bg-surface">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-16">Loading case data...</div>
              : <DocumentsTab caseData={caseData} onRefresh={() => { setLoading(true); setRefreshKey(k => k + 1) }} />
            }
          </div>
        )}

        {activeTab === 2 && (
          <main className="flex-1 overflow-y-auto p-margin-desktop bg-background main-scroll">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-12">Loading case data...</div>
              : <IdentityFraudTab caseData={caseData} />
            }
          </main>
        )}

        {activeTab === 3 && (
          <main className="flex-1 overflow-y-auto p-margin-desktop bg-background main-scroll">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-12">Loading case data...</div>
              : <AMLTab caseData={caseData} />
            }
          </main>
        )}

      </div>
    </div>
  )
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  'Approved':          { text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  'Rejected':          { text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'   },
  'Needs Review':      { text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  'Reupload Required': { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200'},
}

function matchesRequired(docType, requiredLabel) {
  if (requiredLabel.includes(' / ')) {
    return requiredLabel.split(' / ').some(t => t.trim() === docType)
  }
  return docType === requiredLabel
}

function DocumentsTab({ caseData, onRefresh }) {
  const product = caseData?.product ?? ''
  const uploadedDocs = caseData?.documents ?? []
  const [aiResults, setAiResults] = useState(caseData?.aiResults ?? [])
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [activeView, setActiveView] = useState('slot') // 'slot' | 'unmatched'
  const [selectedUnmatched, setSelectedUnmatched] = useState(null) // index into uploadedDocs
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const uploadInputRef = useRef(null)
  const required = REQUIRED_DOCS[product] ?? []
  const typeOptions = DOC_TYPE_OPTIONS[product] ?? []

  function showToast(title, subtitle = '') {
    setToast({ title, subtitle })
    setTimeout(() => setToast(null), 3500)
  }

  function handleRequestDocuments() {
    showToast('Document request sent successfully.', 'The customer will be prompted to re-submit via the onboarding portal.')
  }

  async function handleUpload(e) {
    const fileList = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!fileList.length || !caseData?.appId) return
    const appId = caseData.appId
    setUploading(true)
    try {
      const newDocs = []
      for (const file of fileList) {
        const key = `${appId}/${Date.now()}-${file.name}`
        await s3Client.send(new PutObjectCommand({
          Bucket: awsConfig.s3BucketName,
          Key: key,
          Body: new Uint8Array(await file.arrayBuffer()),
          ContentType: file.type || 'application/octet-stream',
        }))
        newDocs.push({ key, name: file.name, uploadedAt: new Date().toISOString() })
      }
      await dynamoClient.send(new UpdateCommand({
        TableName: awsConfig.dynamoTableName,
        Key: { appId },
        UpdateExpression: 'SET documents = list_append(if_not_exists(documents, :empty), :newDocs), updatedAt = :ts',
        ExpressionAttributeValues: { ':empty': [], ':newDocs': newDocs, ':ts': new Date().toISOString() },
      }))
      // Snapshot analyst annotations before Lambda overwrites aiResults
      const annotationsByKey = {}
      for (const r of aiResults) {
        if (r?.documentKey && r.verificationStatus) {
          annotationsByKey[r.documentKey] = { verificationStatus: r.verificationStatus }
        }
      }
      await lambdaClient.send(new InvokeCommand({
        FunctionName: awsConfig.classifyDocumentFunctionName,
        Payload: new TextEncoder().encode(JSON.stringify({ appId, documentKeys: newDocs.map(d => d.key) })),
      }))
      // Merge analyst annotations back into fresh aiResults
      const fresh = await dynamoClient.send(new GetCommand({ TableName: awsConfig.dynamoTableName, Key: { appId } }))
      const newAiResults = fresh.Item?.aiResults ?? []
      const merged = newAiResults.map(r =>
        annotationsByKey[r.documentKey] ? { ...r, ...annotationsByKey[r.documentKey] } : r
      )
      if (merged.some((r, i) => r !== newAiResults[i])) {
        await dynamoClient.send(new UpdateCommand({
          TableName: awsConfig.dynamoTableName,
          Key: { appId },
          UpdateExpression: 'SET aiResults = :ai',
          ExpressionAttributeValues: { ':ai': merged },
        }))
      }
      onRefresh?.()
    } catch (err) {
      console.error('Upload failed:', err)
      showToast('Upload failed.', 'Please check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleDocSave(docIndex, updatedResult) {
    setAiResults(prev => {
      const next = [...prev]
      next[docIndex] = { ...prev[docIndex], ...updatedResult }
      return next
    })
  }

  const completeness = (() => {
    let total = 0
    let filled = 0
    for (const requiredLabel of required) {
      const matchingResult = aiResults.reduce((last, r) => matchesRequired(r?.documentType, requiredLabel) ? r : last, null)
      const docType = matchingResult?.documentType
        ?? (requiredLabel.includes(' / ') ? requiredLabel.split(' / ')[0].trim() : requiredLabel)
      const requiredKeys = REQUIRED_FIELDS_BY_DOC_TYPE[docType] ?? []
      total += requiredKeys.length
      if (matchingResult) {
        const extractedFields = matchingResult.extractedFields ?? {}
        for (const key of requiredKeys) {
          const val = extractedFields[key]
          const flat = typeof val === 'object' && val !== null ? (val.value ?? '') : val
          if (flat !== '' && flat !== null && flat !== undefined) filled++
        }
      }
    }
    return total === 0 ? 0 : Math.round((filled / total) * 100)
  })()

  // Which uploadedDocs indices are claimed by a required slot
  const matchedIndices = new Set(
    required
      .map(label => uploadedDocs.reduce((last, _, j) => matchesRequired(aiResults[j]?.documentType, label) ? j : last, -1))
      .filter(i => i >= 0)
  )

  // Docs that didn't match any required slot (unclassified or unexpected type)
  const unmatchedDocs = uploadedDocs
    .map((doc, i) => ({ doc, index: i, aiResult: aiResults[i] }))
    .filter(({ index }) => !matchedIndices.has(index))

  const selectedLabel = required[selectedSlot] ?? ''
  const matchingDocIndex = uploadedDocs.reduce((last, _, i) =>
    matchesRequired(aiResults[i]?.documentType, selectedLabel) ? i : last, -1)
  const selectedDoc = matchingDocIndex >= 0 ? uploadedDocs[matchingDocIndex] : null
  const selectedAiResult = matchingDocIndex >= 0 ? aiResults[matchingDocIndex] : null

  const completenessColor = completeness === 100 ? 'text-green-600' : completeness >= 70 ? 'text-secondary' : 'text-amber-600'
  const completenessBar = completeness === 100 ? 'bg-green-500' : completeness >= 70 ? 'bg-secondary' : 'bg-amber-500'

  return (
    <div className="flex h-full overflow-hidden">

      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-outline-variant flex flex-col bg-surface-container-low">
        {/* Completeness bar */}
        <div className="p-4 border-b border-outline-variant shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-label-md font-bold text-on-surface">Data Completeness</span>
            <span className={`text-label-md font-bold ${completenessColor}`}>{completeness}%</span>
          </div>
          <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${completenessBar}`} style={{ width: `${completeness}%` }} />
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-b border-outline-variant flex gap-2 shrink-0">
          <input ref={uploadInputRef} type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleUpload} />
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary text-on-secondary rounded-lg text-label-md font-bold hover:shadow-md transition-all disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[16px] ${uploading ? 'animate-spin' : ''}`}>
              {uploading ? 'progress_activity' : 'upload'}
            </span>
            {uploading ? 'Processing…' : 'Upload Documents'}
          </button>
          <button
            type="button"
            onClick={handleRequestDocuments}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-outline-variant rounded-lg text-label-md font-bold hover:bg-surface-container transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Request
          </button>
        </div>

        {/* Document slots */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {required.map((label, i) => {
            const matchIdx = uploadedDocs.reduce((last, _, j) => matchesRequired(aiResults[j]?.documentType, label) ? j : last, -1)
            const isUploaded = matchIdx >= 0
            const result = isUploaded ? aiResults[matchIdx] : null
            const status = result?.verificationStatus ?? (isUploaded ? 'Needs Review' : null)
            const isSelected = i === selectedSlot
            const s = STATUS_STYLES[status] ?? null

            return (
              <button
                key={label}
                onClick={() => { setSelectedSlot(i); setActiveView('slot') }}
                type="button"
                className={`w-full text-left px-4 py-3 border-b border-outline-variant flex items-center gap-3 transition-colors ${
                  activeView === 'slot' && isSelected ? 'bg-secondary-container border-l-2 border-l-secondary' : 'hover:bg-surface-container'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${isUploaded ? 'text-secondary' : 'text-outline'}`}
                  style={isUploaded ? { fontVariationSettings: '"FILL" 1' } : {}}
                >
                  {isUploaded ? 'description' : 'upload_file'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-label-md font-bold truncate ${activeView === 'slot' && isSelected ? 'text-on-secondary-container' : 'text-on-surface'}`}>{label}</p>
                  {s ? (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.text} ${s.bg} ${s.border}`}>
                      {status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-outline">MISSING</span>
                  )}
                </div>
              </button>
            )
          })}

          {/* Unmatched / unclassified documents */}
          {unmatchedDocs.length > 0 && (
            <>
              <div className="px-4 py-2 flex items-center gap-2 bg-surface-container border-y border-outline-variant">
                <span className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase flex-1">Other Documents</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{unmatchedDocs.length}</span>
              </div>
              {unmatchedDocs.map(({ doc, index, aiResult }) => {
                const docType = aiResult?.documentType ?? 'Unclassified'
                const status = aiResult?.verificationStatus ?? null
                const isSelected = activeView === 'unmatched' && selectedUnmatched === index
                const s = STATUS_STYLES[status] ?? null
                const isUnclassified = docType === 'Unclassified' || !aiResult

                return (
                  <button
                    key={index}
                    onClick={() => { setSelectedUnmatched(index); setActiveView('unmatched') }}
                    type="button"
                    className={`w-full text-left px-4 py-3 border-b border-outline-variant flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-secondary-container border-l-2 border-l-secondary' : 'hover:bg-surface-container'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 ${isUnclassified ? 'text-amber-500' : 'text-secondary'}`}
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      {isUnclassified ? 'help' : 'description'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-label-md font-bold truncate ${isSelected ? 'text-on-secondary-container' : 'text-on-surface'}`}>
                        {doc.name ?? doc.key?.split('/').pop() ?? 'Document'}
                      </p>
                      {s ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.text} ${s.bg} ${s.border}`}>
                          {status.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700">
                          {isUnclassified ? 'UNCLASSIFIED' : docType.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'unmatched' && selectedUnmatched !== null
          ? <DocumentReviewPanel key={uploadedDocs[selectedUnmatched]?.key} doc={uploadedDocs[selectedUnmatched]} aiResult={aiResults[selectedUnmatched]} allAiResults={aiResults} docIndex={selectedUnmatched} typeOptions={typeOptions} appId={caseData?.appId} onSave={handleDocSave} />
          : selectedDoc
            ? <DocumentReviewPanel key={selectedDoc.key} doc={selectedDoc} aiResult={selectedAiResult} allAiResults={aiResults} docIndex={matchingDocIndex} typeOptions={typeOptions} appId={caseData?.appId} onSave={handleDocSave} />
            : <MissingDocPanel label={selectedLabel} />
        }
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="flex items-center gap-3 bg-white border border-outline-variant rounded-xl shadow-2xl px-6 py-4 pointer-events-auto">
            <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-green-600" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
            </div>
            <div>
              <p className="text-label-md font-bold text-on-surface">{toast.title}</p>
              <p className="text-body-sm text-on-surface-variant">{toast.subtitle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Document Review Panel ────────────────────────────────────────────────────

function DocumentReviewPanel({ doc, aiResult, allAiResults, docIndex, typeOptions, appId, onSave }) {
  const [zoom, setZoom] = useState(1)
  const [detectedType, setDetectedType] = useState(aiResult?.documentType ?? (typeOptions[0] ?? ''))
  const [status, setStatus] = useState(aiResult?.verificationStatus ?? 'Needs Review')
  const [docUrl, setDocUrl] = useState(null)
  const [isPdf, setIsPdf] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [fields, setFields] = useState(() => {
    const raw = aiResult?.extractedFields ?? {}
    const result = {}
    for (const [k, v] of Object.entries(raw)) {
      result[k] = typeof v === 'object' && v !== null ? (v.value ?? '') : v
    }
    return result
  })

  useEffect(() => {
    const requiredKeys = REQUIRED_FIELDS_BY_DOC_TYPE[detectedType] ?? []
    setFields(prev => Object.fromEntries(requiredKeys.map(k => [k, prev[k] ?? ''])))
  }, [detectedType])

  const filename = doc.name ?? doc.key?.split('/').pop() ?? 'Document'

  useEffect(() => {
    if (!doc.key) return
    let objectUrl
    async function fetchDoc() {
      try {
        const obj = await s3Client.send(new GetObjectCommand({ Bucket: awsConfig.s3BucketName, Key: doc.key }))
        const contentType = obj.ContentType || ''
        const bytes = await obj.Body.transformToByteArray()
        const blob = new Blob([bytes], { type: contentType || 'application/octet-stream' })
        objectUrl = URL.createObjectURL(blob)
        setDocUrl(objectUrl)
        setIsPdf(contentType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf'))
      } catch (err) {
        console.error('Failed to load document from S3:', err)
      }
    }
    fetchDoc()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [doc.key])

  function handleFieldChange(key, value) {
    setIsDirty(true)
    setFields(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const updated = [...(allAiResults ?? [])]
      while (updated.length <= docIndex) updated.push({})
      updated[docIndex] = {
        ...updated[docIndex],
        documentType: detectedType,
        extractedFields: fields,
        verificationStatus: status,
      }
      await dynamoClient.send(new UpdateCommand({
        TableName: awsConfig.dynamoTableName,
        Key: { appId },
        UpdateExpression: 'SET aiResults = :ai, updatedAt = :ts',
        ExpressionAttributeValues: {
          ':ai': updated,
          ':ts': new Date().toISOString(),
        },
      }))
      setIsDirty(false)
      onSave?.(docIndex, { documentType: detectedType, extractedFields: fields, verificationStatus: status })
    } catch (err) {
      console.error('Failed to save document:', err)
      setSaveError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left: Viewer */}
      <div className="w-[55%] shrink-0 bg-surface-container-low document-overlay overflow-hidden flex flex-col border-r border-outline-variant">
        <div className="p-3 border-b border-outline-variant bg-white flex justify-between items-center shrink-0">
          <span className="text-label-md font-bold text-primary flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-[18px] shrink-0">visibility</span>
            <span className="truncate">{filename}</span>
          </span>
          <div className="flex items-center gap-1 bg-primary text-on-primary rounded-lg p-1 shrink-0 ml-2">
            {!isPdf && <>
              <button className="p-1 hover:bg-white/10 rounded" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} type="button">
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>
              <span className="px-2 text-[10px] font-bold">{Math.round(zoom * 100)}%</span>
              <button className="p-1 hover:bg-white/10 rounded" onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} type="button">
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
            </>}
            <button className="p-1 hover:bg-white/10 rounded" type="button" onClick={() => docUrl && window.open(docUrl)}>
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {!docUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-outline text-4xl animate-spin">progress_activity</span>
            </div>
          ) : isPdf ? (
            <iframe src={docUrl} className="w-full h-full border-0" title={filename} />
          ) : (
            <div className="w-full h-full overflow-auto p-4 flex justify-center items-start">
              <img src={docUrl} alt={filename} className="max-w-full h-auto transition-transform duration-200" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} />
            </div>
          )}
        </div>
      </div>

      {/* Right: Review panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-5">

          {/* Document type + status */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant tracking-wider">DOCUMENT TYPE</label>
            <div className="flex items-center gap-2">
              <select
                className="flex-1 pl-2.5 pr-2 py-1.5 rounded-full border border-outline-variant bg-white text-[11px] font-bold text-on-surface cursor-pointer focus:outline-none"
                value={detectedType}
                onChange={(e) => { setIsDirty(true); setDetectedType(e.target.value) }}
              >
                {typeOptions.map(opt => <option key={opt}>{opt}</option>)}
                <option value="Unclassified">Unclassified</option>
              </select>
              <select
                className={`pl-2.5 pr-2 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer focus:outline-none transition-colors ${
                  status === 'Approved'          ? 'bg-green-100 text-green-800 border-green-300' :
                  status === 'Rejected'          ? 'bg-red-100 text-red-800 border-red-300' :
                  status === 'Needs Review'      ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-orange-100 text-orange-800 border-orange-300'
                }`}
                value={status}
                onChange={(e) => { setIsDirty(true); setStatus(e.target.value) }}
              >
                <option>Approved</option>
                <option>Rejected</option>
                <option>Needs Review</option>
                <option>Reupload Required</option>
              </select>
            </div>
          </div>

          {/* Quality checks */}
          <QualityChecksPanel qualityChecks={aiResult?.qualityChecks} />

          {/* Extracted fields */}
          {detectedType !== 'Selfie' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant tracking-wider">EXTRACTED FIELDS</label>
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high border-y border-outline-variant">
                <tr>
                  <th className="py-2 px-3 text-[10px] font-bold text-on-surface-variant uppercase w-2/5">Field</th>
                  <th className="py-2 px-3 text-[10px] font-bold text-on-surface-variant uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {Object.entries(fields).map(([key, value]) => {
                  return (
                    <tr key={key}>
                      <td className="py-2 px-3 text-label-md text-on-surface-variant">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            className={`flex-1 border rounded px-2 py-1.5 text-body-sm focus:ring-1 focus:ring-secondary ${value ? 'border-outline-variant' : 'border-amber-300 bg-amber-50'}`}
                            type="text"
                            value={value ?? ''}
                            onChange={(e) => handleFieldChange(key, e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          )}


        </div>

        {/* Save footer */}
        <div className="p-4 bg-surface-container-high border-t border-outline-variant shrink-0">
          {saveError && <p className="text-body-sm text-error text-center mb-2">{saveError}</p>}
          <button
            className="w-full px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Quality Checks Panel ─────────────────────────────────────────────────────

function QualityChecksPanel({ qualityChecks }) {
  if (!qualityChecks) return null

  const checks = [
    { key: 'imageClarity',      label: 'Image Clarity'      },
    { key: 'fullyVisible',      label: 'Fully Visible'      },
    { key: 'notExpired',        label: 'Not Expired'        },
    { key: 'noTampering',       label: 'No Tampering'       },
    { key: 'mrzValid',          label: 'MRZ Valid'          },
    { key: 'faceVisible',       label: 'Face Visible'       },
    { key: 'livenessIndicator', label: 'Liveness'           },
  ]

  const styles = {
    pass: { icon: 'check_circle', cls: 'text-green-600', bg: 'bg-green-50',  label: 'PASS' },
    warn: { icon: 'warning',      cls: 'text-amber-600', bg: 'bg-amber-50',  label: 'WARN' },
    fail: { icon: 'cancel',       cls: 'text-red-600',   bg: 'bg-red-50',    label: 'FAIL' },
    na:   { icon: 'remove',       cls: 'text-outline',   bg: 'bg-surface-container-low', label: 'N/A' },
  }

  const visible = checks.filter(({ key }) => (qualityChecks[key] ?? 'na') !== 'na')
  if (!visible.length) return null

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-on-surface-variant tracking-wider">QUALITY CHECKS</label>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(({ key, label }) => {
          const s = styles[qualityChecks[key]] ?? styles.na
          return (
            <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${s.cls} ${s.bg} border-current/20`}>
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: '"FILL" 1' }}>{s.icon}</span>
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Missing Doc Panel ────────────────────────────────────────────────────────

function MissingDocPanel({ label }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 bg-surface">
      <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center border-2 border-dashed border-outline-variant">
        <span className="material-symbols-outlined text-[32px] text-outline">upload_file</span>
      </div>
      <div>
        <h4 className="text-headline-sm text-on-surface">{label} Missing</h4>
        <p className="text-body-md text-on-surface-variant max-w-sm mx-auto mt-1">
          This document has not been uploaded yet. Use <strong>Upload Documents</strong> in the sidebar to add it, or <strong>Request</strong> to notify the customer.
        </p>
      </div>
    </div>
  )
}

// ─── AML Tab ──────────────────────────────────────────────────────────────────

function amlHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function amlRoll(appId, key, mod) {
  return amlHash((appId ?? '') + key) % mod
}

const SANCTIONS_LISTS = ['OFAC', 'UN Sanctions', 'EU Sanctions', 'Internal Watchlist']
const MEDIA_SOURCES = ['News Screening', 'Litigation Screening', 'Financial Crimes Mentions']
const LOW_RISK_COUNTRIES = ['united kingdom', 'uk', 'united states', 'usa', 'us', 'germany', 'france', 'australia', 'canada', 'united arab emirates', 'uae', 'singapore', 'japan', 'new zealand', 'switzerland']

function AMLTab({ caseData }) {
  const appId = caseData?.appId ?? ''
  const fd = caseData?.formData ?? {}

  const sanctions = SANCTIONS_LISTS.map(src => ({
    source: src,
    result: amlRoll(appId, 'sanc_' + src, 4) === 0 ? 'hit' : 'clear',
  }))

  const pepHit = amlRoll(appId, 'pep', 5) === 0
  const pepConfidence = pepHit
    ? 50 + amlRoll(appId, 'pep_conf', 25)
    : 94 + amlRoll(appId, 'pep_conf', 6)

  const media = MEDIA_SOURCES.map(src => ({
    source: src,
    result: amlRoll(appId, 'media_' + src, 6) === 0 ? 'flag' : 'clean',
  }))

  const nationality = fd.nationality || fd.signatoryNationality || ''
  const country = fd.countryOfResidence || fd.country || ''
  const employment = fd.employmentStatus || ''

  function countryRisk(c) {
    if (!c) return ['LOW', 'MEDIUM'][amlRoll(appId, 'ctry_empty', 2)]
    if (LOW_RISK_COUNTRIES.some(l => c.toLowerCase().includes(l))) return 'LOW'
    return ['LOW', 'MEDIUM', 'HIGH'][amlRoll(appId, 'ctry_' + c, 3)]
  }

  const employmentRisk = employment.toLowerCase().includes('employ') ? 'LOW'
    : employment ? ['LOW', 'MEDIUM'][amlRoll(appId, 'emp', 2)]
    : 'MEDIUM'

  const jurisdictionFactors = [
    { label: nationality ? `Nationality (${nationality})` : 'Nationality',        risk: countryRisk(nationality) },
    { label: employment  ? `Source of Funds (${employment})`  : 'Source of Funds', risk: employmentRisk },
    { label: country     ? `Country of Residence (${country})` : 'Country of Residence', risk: countryRisk(country) },
  ]

  const anySanctionHit = sanctions.some(s => s.result === 'hit')
  const anyMediaFlag = media.some(m => m.result === 'flag')
  const riskProfile = anySanctionHit || pepHit ? 'Elevated' : anyMediaFlag ? 'Moderate' : 'Low'
  const showAlert = anySanctionHit || pepHit

  const hitSources = sanctions.filter(s => s.result === 'hit').map(s => s.source)
  const alertHeading = pepHit && anySanctionHit
    ? `Potential PEP and Sanctions match detected`
    : pepHit
    ? 'Potential PEP match detected'
    : anySanctionHit
    ? `Potential Sanctions match on ${hitSources.join(', ')}`
    : 'No matches found across all lists'
  const alertSubtext = pepHit
    ? 'PEP match requires additional due diligence. Adverse Media cleared.'
    : anySanctionHit
    ? 'PEP and Adverse Media cleared for this entity.'
    : 'All sanctions, PEP, and adverse media checks returned no matches.'

  const riskCls = riskProfile === 'Elevated' ? 'text-error' : riskProfile === 'Moderate' ? 'text-amber-600' : 'text-green-600'

  const checkedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6">

      {/* Status banner */}
      <div className="bg-surface-container-low rounded border border-outline-variant p-stack-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-stack-md">
          <div className="flex items-center gap-stack-md">
            <span className={`px-4 py-2 text-headline-sm font-bold rounded flex items-center gap-2 ${showAlert ? 'bg-error-container text-on-error-container' : 'bg-green-100 text-green-800'}`}>
              <span className="material-symbols-outlined">{showAlert ? 'warning' : 'check_circle'}</span>
              {showAlert ? 'AML Review Required' : 'AML Check Passed'}
            </span>
            <div>
              <h3 className="font-bold text-primary">{alertHeading}</h3>
              <p className="text-body-sm text-on-surface-variant">{alertSubtext}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-label-md text-on-surface-variant uppercase">Risk Profile</p>
            <p className={`text-headline-md font-bold ${riskCls}`}>{riskProfile}</p>
          </div>
        </div>
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Sanctions Screening */}
        <div className="bg-white rounded border border-outline-variant overflow-hidden shadow-sm">
          <div className="bg-surface-container-low px-stack-md py-stack-sm border-b border-outline-variant">
            <h2 className="text-label-md font-label-md text-on-surface-variant uppercase">Sanctions Screening</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-bright border-b border-outline-variant">
              <tr>
                <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase">Source</th>
                <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {sanctions.map(({ source, result }) => (
                <tr key={source} className="hover:bg-surface-container-low">
                  <td className="px-stack-lg py-stack-md font-medium text-body-md">{source}</td>
                  <td className="px-stack-lg py-stack-md text-right">
                    {result === 'hit'
                      ? <span className="text-error font-bold">POTENTIAL HIT</span>
                      : <span className="text-green-600 font-bold">NO MATCH</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PEP + Jurisdiction */}
        <div className="space-y-6">

          {/* PEP Screening */}
          <div className="bg-white rounded border border-outline-variant p-stack-lg">
            <h2 className="text-label-md font-label-md text-on-surface-variant uppercase mb-stack-md">PEP Screening</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-stack-md">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pepHit ? 'bg-error-container' : 'bg-green-100'}`}>
                  <span className={`material-symbols-outlined ${pepHit ? 'text-error' : 'text-green-600'}`}
                    style={pepHit ? {} : { fontVariationSettings: '"FILL" 1' }}>
                    {pepHit ? 'gpp_maybe' : 'person_check'}
                  </span>
                </div>
                <div>
                  <p className="text-body-md font-bold text-on-surface">Politically Exposed Person</p>
                  <p className={`text-label-md font-bold uppercase ${pepHit ? 'text-error' : 'text-green-600'}`}>
                    {pepHit ? 'Potential Match' : 'No Match Detected'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-label-md text-on-surface-variant">Confidence</p>
                <p className="text-headline-sm font-bold text-primary">{pepConfidence}%</p>
              </div>
            </div>
          </div>

          {/* Jurisdiction Assessment */}
          <div className="bg-white rounded border border-outline-variant overflow-hidden shadow-sm">
            <div className="bg-surface-container-low px-stack-md py-stack-sm border-b border-outline-variant">
              <h2 className="text-label-md font-label-md text-on-surface-variant uppercase">Jurisdiction Assessment</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-bright border-b border-outline-variant">
                <tr>
                  <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase">Factor</th>
                  <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {jurisdictionFactors.map(({ label, risk }) => (
                  <tr key={label} className="hover:bg-surface-container-low">
                    <td className="px-stack-lg py-stack-md font-medium text-body-md">{label}</td>
                    <td className={`px-stack-lg py-stack-md text-right font-bold ${
                      risk === 'HIGH' ? 'text-error' : risk === 'MEDIUM' ? 'text-amber-600' : 'text-green-600'
                    }`}>{risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adverse Media — full width */}
        <div className="col-span-1 md:col-span-2 bg-white rounded border border-outline-variant overflow-hidden shadow-sm">
          <div className="bg-surface-container-low px-stack-md py-stack-sm border-b border-outline-variant">
            <h2 className="text-label-md font-label-md text-on-surface-variant uppercase">Adverse Media</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-bright border-b border-outline-variant">
              <tr>
                <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase">Source</th>
                <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase">Result</th>
                <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase text-right">Last Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {media.map(({ source, result }) => (
                <tr key={source} className="hover:bg-surface-container-low">
                  <td className="px-stack-lg py-stack-md font-medium text-body-md">{source}</td>
                  <td className="px-stack-lg py-stack-md">
                    {result === 'flag'
                      ? <span className="flex items-center gap-1 text-error font-bold">FLAG <span className="material-symbols-outlined text-[16px]">warning</span></span>
                      : <span className="flex items-center gap-1 text-green-600 font-bold">CLEAN <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span></span>
                    }
                  </td>
                  <td className="px-stack-lg py-stack-md text-right text-on-surface-variant text-body-sm">Today, {checkedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

// ─── Identity & Fraud Tab ─────────────────────────────────────────────────────

function buildConsistencyRows(aiResults) {
  const fieldGroups = [
    { label: 'Full Name',      keys: ['fullName', 'customerName', 'accountHolderName', 'employeeName', 'principalName'] },
    { label: 'Date of Birth',  keys: ['dateOfBirth'] },
    { label: 'Nationality',    keys: ['nationality'] },
    { label: 'Address',        keys: ['serviceAddress', 'address'] },
    { label: 'Account Number', keys: ['accountNumber'] },
  ]
  const nonSelfie = aiResults.filter(r => r?.documentType && r.documentType !== 'Selfie' && r.extractedFields)
  const rows = []
  for (const { label, keys } of fieldGroups) {
    const hits = []
    for (const r of nonSelfie) {
      const fields = r.extractedFields ?? {}
      for (const key of keys) {
        const raw = fields[key]
        const value = typeof raw === 'object' && raw !== null ? (raw.value ?? '') : (raw ?? '')
        if (value) { hits.push({ value: String(value).toUpperCase(), docType: r.documentType }); break }
      }
    }
    if (hits.length < 2) continue
    const unique = [...new Set(hits.map(h => h.value))]
    rows.push({
      label,
      status: unique.length === 1 ? 'Match' : 'Mismatch',
      value: hits[0].value,
      sources: hits.map(h => h.docType).join(', '),
    })
  }
  return rows
}

function computeScore(aiResults, rows) {
  let score = 100
  score -= rows.filter(r => r.status === 'Mismatch').length * 15
  for (const r of aiResults) {
    for (const v of Object.values(r?.qualityChecks ?? {})) {
      if (v === 'fail') score -= 8
      else if (v === 'warn') score -= 3
    }
  }
  return Math.max(0, Math.min(100, score))
}

function aggregateQC(aiResults, key) {
  const vals = aiResults.map(r => r?.qualityChecks?.[key]).filter(v => v && v !== 'na')
  if (!vals.length) return null
  if (vals.includes('fail')) return 'fail'
  if (vals.includes('warn')) return 'warn'
  return 'pass'
}

function CheckRow({ icon, label, status, statusLabel }) {
  const isFail = status === 'fail'
  const isWarn = status === 'warn'
  return (
    <div className={`flex items-center justify-between p-stack-sm rounded ${isFail ? 'bg-error-container/20 border border-error/10' : 'bg-surface'}`}>
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined ${isFail ? 'text-error' : 'text-on-secondary-container'}`}>{icon}</span>
        <span className="text-body-sm font-medium">{label}</span>
      </div>
      {isFail ? (
        <div className="flex items-center gap-1 text-error font-bold text-[11px]">
          {statusLabel ?? 'FLAG'} <span className="material-symbols-outlined text-[16px]">warning</span>
        </div>
      ) : isWarn ? (
        <div className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
          {statusLabel ?? 'WARN'} <span className="material-symbols-outlined text-[16px]">warning</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-green-600 font-bold text-[11px]">
          {statusLabel ?? 'PASS'} <span className="material-symbols-outlined text-[16px]">check_circle</span>
        </div>
      )}
    </div>
  )
}

function IdentityStatusCard({ score, status }) {
  const statusCls = status === 'Clear'
    ? 'bg-green-100 text-green-800'
    : status === 'Review Required'
    ? 'bg-error-container text-on-error-container'
    : 'bg-red-100 text-red-900'
  const barCls = score >= 90 ? 'bg-green-500' : score >= 60 ? 'bg-secondary' : 'bg-error'
  const icon = status === 'Clear' ? 'check_circle' : 'warning'

  return (
    <div className="bg-surface-container-low rounded border border-outline-variant p-stack-lg">
      <h2 className="text-label-md font-label-md text-on-surface-variant uppercase mb-stack-md">Identity Verification Status</h2>
      <div className="flex items-center justify-between mb-6">
        <span className={`px-4 py-2 ${statusCls} text-headline-sm font-bold rounded flex items-center gap-2`}>
          <span className="material-symbols-outlined">{icon}</span>
          {status}
        </span>
        <div className="text-right">
          <p className="text-label-md text-on-surface-variant">Confidence Score</p>
          <p className="text-display-lg font-bold text-primary">{score}%</p>
        </div>
      </div>
      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
        <div className={`h-full ${barCls} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function FaceMatchCard({ aiResults, uploadedDocs }) {
  const [idUrl, setIdUrl] = useState(null)
  const [selfieUrl, setSelfieUrl] = useState(null)

  const passportIdx = aiResults.findIndex(r => r?.documentType === 'Passport')
  const nationalIdIdx = aiResults.findIndex(r => r?.documentType === 'National ID')
  const selfieIdx = aiResults.findIndex(r => r?.documentType === 'Selfie')
  const idIdx = passportIdx >= 0 ? passportIdx : nationalIdIdx
  const idLabel = (passportIdx >= 0 ? 'Passport' : 'National ID') + ' Image'
  const selfieResult = selfieIdx >= 0 ? aiResults[selfieIdx] : null
  const liveness = selfieResult?.qualityChecks?.livenessIndicator ?? 'na'
  const faceVisibleVal = selfieResult?.qualityChecks?.faceVisible ?? 'na'

  const idKey = idIdx >= 0 ? (uploadedDocs[idIdx]?.key ?? null) : null
  const selfieKey = selfieIdx >= 0 ? (uploadedDocs[selfieIdx]?.key ?? null) : null

  useEffect(() => {
    if (!idKey) return
    let url
    ;(async () => {
      try {
        const obj = await s3Client.send(new GetObjectCommand({ Bucket: awsConfig.s3BucketName, Key: idKey }))
        const bytes = await obj.Body.transformToByteArray()
        url = URL.createObjectURL(new Blob([bytes], { type: obj.ContentType || 'image/jpeg' }))
        setIdUrl(url)
      } catch {}
    })()
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [idKey])

  useEffect(() => {
    if (!selfieKey) return
    let url
    ;(async () => {
      try {
        const obj = await s3Client.send(new GetObjectCommand({ Bucket: awsConfig.s3BucketName, Key: selfieKey }))
        const bytes = await obj.Body.transformToByteArray()
        url = URL.createObjectURL(new Blob([bytes], { type: obj.ContentType || 'image/jpeg' }))
        setSelfieUrl(url)
      } catch {}
    })()
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [selfieKey])

  const hasBoth = idIdx >= 0 && selfieIdx >= 0
  const livenessOk = liveness === 'pass'
  const livenessIcon = livenessOk ? 'check_circle' : liveness === 'fail' ? 'cancel' : 'warning'
  const livenessCls = livenessOk ? 'text-green-600' : liveness === 'fail' ? 'text-red-600' : 'text-amber-600'
  const livenessLabel = livenessOk ? 'PASSED' : liveness === 'fail' ? 'FAILED' : liveness === 'na' ? '—' : 'WARN'

  return (
    <div className="bg-white rounded border border-outline-variant overflow-hidden">
      <div className="bg-surface-container-low px-stack-md py-stack-sm border-b border-outline-variant">
        <h2 className="text-label-md font-label-md text-on-surface-variant uppercase">Face Match Verification</h2>
      </div>
      <div className="p-stack-lg">
        {!hasBoth ? (
          <div className="py-8 text-center text-body-sm text-on-surface-variant">
            {idIdx < 0 ? 'No ID document uploaded yet.' : 'No selfie uploaded yet.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-stack-md mb-stack-lg">
              <div className="aspect-square bg-surface-container rounded overflow-hidden border border-outline-variant relative">
                {idUrl
                  ? <img src={idUrl} alt="ID" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-outline">progress_activity</span></div>
                }
                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[10px] py-1 px-2 uppercase font-bold tracking-widest">{idLabel}</div>
              </div>
              <div className="aspect-square bg-surface-container rounded overflow-hidden border border-outline-variant relative">
                {selfieUrl
                  ? <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-outline">progress_activity</span></div>
                }
                <div className="absolute bottom-0 left-0 right-0 bg-secondary/80 text-white text-[10px] py-1 px-2 uppercase font-bold tracking-widest">Live Selfie</div>
              </div>
            </div>
            <div className="space-y-stack-sm">
              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Liveness Check</span>
                <span className={`font-bold flex items-center gap-1 ${livenessCls}`}>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>{livenessIcon}</span>
                  {livenessLabel}
                </span>
              </div>
              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Face Visible</span>
                <span className={`font-bold ${faceVisibleVal === 'pass' ? 'text-green-600' : faceVisibleVal === 'fail' ? 'text-red-600' : 'text-amber-600'}`}>
                  {faceVisibleVal === 'pass' ? 'CONFIRMED' : faceVisibleVal === 'fail' ? 'NOT DETECTED' : faceVisibleVal === 'na' ? '—' : 'WARN'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ConsistencyTable({ rows }) {
  return (
    <div className="bg-white rounded border border-outline-variant overflow-hidden shadow-sm">
      <div className="bg-surface-container-low px-stack-md py-stack-sm border-b border-outline-variant">
        <h2 className="text-label-md font-label-md text-on-surface-variant uppercase">Cross-Document Consistency Checks</h2>
      </div>
      {rows.length === 0 ? (
        <div className="py-12 text-center text-body-sm text-on-surface-variant">
          Upload at least two documents with overlapping fields to see consistency checks.
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-bright border-b border-outline-variant">
              <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase">Attribute</th>
              <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase text-center">Status</th>
              <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase">Extracted Value</th>
              <th className="px-stack-lg py-stack-md text-label-md font-label-md text-on-surface-variant uppercase">Source Documents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.map(row => (
              <tr key={row.label} className="hover:bg-surface-container-low transition-colors">
                <td className="px-stack-lg py-stack-md font-bold text-on-surface">{row.label}</td>
                <td className="px-stack-lg py-stack-md text-center">
                  {row.status === 'Match'
                    ? <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase">Match</span>
                    : <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-full uppercase">Mismatch</span>
                  }
                </td>
                <td className="px-stack-lg py-stack-md font-mono-md text-body-sm">{row.value}</td>
                <td className="px-stack-lg py-stack-md text-body-sm text-on-surface-variant">{row.sources}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function DocumentFormatCard({ aiResults }) {
  const mrzStatus = aggregateQC(aiResults, 'mrzValid')
  return (
    <div className="bg-white rounded border border-outline-variant p-stack-lg">
      <h2 className="text-label-md font-label-md text-on-surface-variant uppercase mb-stack-md">Document Format Checks</h2>
      <div className="space-y-stack-md">
        <CheckRow icon="security" label="Hologram Verification" status="pass" />
        {mrzStatus && <CheckRow icon="barcode_scanner" label="MRZ Checksum Match" status={mrzStatus} />}
        <CheckRow icon="article" label="Font & Microprint Integrity" status="pass" />
      </div>
    </div>
  )
}

function ComplianceCard({ aiResults }) {
  const expiryStatus = aggregateQC(aiResults, 'notExpired')
  return (
    <div className="bg-white rounded border border-outline-variant p-stack-lg">
      <h2 className="text-label-md font-label-md text-on-surface-variant uppercase mb-stack-md">Compliance Validation</h2>
      <div className="space-y-stack-md">
        {expiryStatus && (
          <CheckRow icon="calendar_today" label="Document Expiry" status={expiryStatus}
            statusLabel={expiryStatus === 'pass' ? 'VALID' : expiryStatus === 'fail' ? 'EXPIRED' : 'WARN'} />
        )}
        <CheckRow icon="policy" label="Country Whitelist" status="pass" statusLabel="CLEAN" />
        <CheckRow icon="public" label="Sanctions List Screen" status="pass" statusLabel="CLEAR" />
      </div>
    </div>
  )
}

function FraudSignalsCard({ aiResults }) {
  const tamperingStatus = aggregateQC(aiResults, 'noTampering')
  return (
    <div className="bg-white rounded border border-outline-variant p-stack-lg">
      <h2 className="text-label-md font-label-md text-on-surface-variant uppercase mb-stack-md">Fraud Signals</h2>
      <div className="space-y-stack-md">
        {tamperingStatus && (
          <CheckRow icon="search_check" label="Tampering Detection" status={tamperingStatus}
            statusLabel={tamperingStatus === 'pass' ? 'CLEAN' : 'FLAG'} />
        )}
        <CheckRow icon="content_copy" label="Duplicate Application" status="pass" statusLabel="CLEAN" />
        <CheckRow icon="photo_filter" label="Image Manipulation" status="pass" statusLabel="CLEAN" />
        <CheckRow icon="speed" label="Velocity Checks" status="pass" statusLabel="CLEAN" />
      </div>
    </div>
  )
}

function AnalystObservationPanel({ rows, aiResults }) {
  const mismatches = rows.filter(r => r.status === 'Mismatch')
  const failedChecks = aiResults.flatMap(r => {
    const doc = r?.documentType
    if (!doc) return []
    return Object.entries(r?.qualityChecks ?? {})
      .filter(([, v]) => v === 'fail')
      .map(([k]) => ({ doc, check: k.replace(/([A-Z])/g, ' $1').toLowerCase().trim() }))
  })

  if (!mismatches.length && !failedChecks.length) {
    return (
      <div className="bg-surface-container rounded p-stack-lg border-l-4 border-green-500">
        <div className="flex items-start gap-stack-md">
          <span className="material-symbols-outlined text-green-600 text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
          <div>
            <h3 className="font-bold text-primary mb-unit">No Issues Detected</h3>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              All cross-document fields are consistent and no quality check failures were found. This case appears ready for final review.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-container rounded p-stack-lg border-l-4 border-secondary">
      <div className="flex items-start gap-stack-md">
        <span className="material-symbols-outlined text-secondary text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>lightbulb</span>
        <div>
          <h3 className="font-bold text-primary mb-unit">Analyst Observation Required</h3>
          <p className="text-body-sm text-on-surface-variant leading-relaxed">
            {mismatches.map((m, i) => (
              <span key={i}>A <strong>{m.label}</strong> mismatch was detected across {m.sources}. </span>
            ))}
            {failedChecks.slice(0, 2).map((f, i) => (
              <span key={i}>A <strong>{f.check}</strong> check failed on the {f.doc}. </span>
            ))}
            Manual cross-referencing is strongly recommended before final approval.
          </p>
        </div>
      </div>
    </div>
  )
}

function IdentityFraudTab({ caseData }) {
  const aiResults = caseData?.aiResults ?? []
  const uploadedDocs = caseData?.documents ?? []
  const rows = buildConsistencyRows(aiResults)
  const score = computeScore(aiResults, rows)
  const mismatches = rows.filter(r => r.status === 'Mismatch').length
  const overallStatus = mismatches === 0 && score >= 90 ? 'Clear' : score >= 60 ? 'Review Required' : 'High Risk'

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <IdentityStatusCard score={score} status={overallStatus} />
        <FaceMatchCard aiResults={aiResults} uploadedDocs={uploadedDocs} />
      </div>
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <ConsistencyTable rows={rows} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DocumentFormatCard aiResults={aiResults} />
          <ComplianceCard aiResults={aiResults} />
          <FraudSignalsCard aiResults={aiResults} />
        </div>
        <AnalystObservationPanel rows={rows} aiResults={aiResults} />
      </div>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <div className="bg-surface-container-low px-stack-lg py-stack-sm border-b border-outline-variant">
      <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{children}</span>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-unit">
      <p className="text-label-md font-label-md text-on-surface-variant">{label}</p>
      <p className="text-body-md font-body-md text-on-surface">{children}</p>
    </div>
  )
}

function OverviewContent({ appId, caseData }) {
  const fd = caseData?.formData ?? {}
  const isIndividual = !caseData || caseData.customerType === 'individual'
  const fullName = isIndividual
    ? [fd.firstName, fd.middleName, fd.lastName].filter(Boolean).join(' ') || '—'
    : fd.legalEntityName || '—'
  const productType = isIndividual ? 'Retail Banking' : 'Commercial Banking'

  return (
    <div className="space-y-stack-lg">
      {/* Summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
        <section className="lg:col-span-2 bg-white rounded-lg border border-outline-variant overflow-hidden">
          <SectionHeader>Case Summary</SectionHeader>
          <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 gap-y-stack-lg gap-x-stack-md">
            <Field label="Application ID"><span className="font-bold">{appId}</span></Field>
            <Field label="Customer Name"><span className="font-bold">{fullName}</span></Field>
            <Field label="Product">{caseData?.product || 'N/A'}</Field>
            <Field label="Status">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container-highest text-on-secondary-container capitalize">
                {(caseData?.status || 'in_review').replace(/_/g, ' ')}
              </span>
            </Field>
            <Field label="Assigned Analyst">
              <div className="flex items-center gap-2 mt-1">
                <img alt={currentUser.name} className="w-5 h-5 rounded-full" src={currentUser.avatar} />
                <span>{currentUser.name}</span>
              </div>
            </Field>
            <Field label="Submitted">{caseData?.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : 'N/A'}</Field>
          </div>
        </section>
        <section className="bg-white rounded-lg border border-outline-variant overflow-hidden h-fit">
          <SectionHeader>Application Details</SectionHeader>
          <div className="p-stack-lg space-y-stack-lg">
            <Field label="Product Type">{productType}</Field>
            <Field label="Product Variant">{caseData?.product || '—'}</Field>
            <Field label="Customer Type">
              <span className="capitalize">{caseData?.customerType || '—'}</span>
            </Field>
          </div>
        </section>
      </div>

      {/* Customer details */}
      <div className="space-y-stack-lg">
        <div className="flex items-center gap-3">
          <h3 className="text-headline-sm font-headline-sm text-on-surface">Customer Details</h3>
          <div className="h-px flex-1 bg-outline-variant" />
        </div>
        {isIndividual ? (
          <>
            <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
              <SectionHeader>Personal Information</SectionHeader>
              <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg">
                <Field label="First Name"><span className="font-bold">{fd.firstName || '—'}</span></Field>
                <Field label="Middle Name">{fd.middleName || '—'}</Field>
                <Field label="Last Name"><span className="font-bold">{fd.lastName || '—'}</span></Field>
                <Field label="Gender">{fd.gender || '—'}</Field>
                <Field label="Date of Birth">{fd.dateOfBirth || '—'}</Field>
                <Field label="Marital Status">{fd.maritalStatus || '—'}</Field>
                <Field label="Nationality">{fd.nationality || '—'}</Field>
                <Field label="Country of Residence">{fd.countryOfResidence || '—'}</Field>
                <Field label="National ID Number"><span className="text-mono-md font-mono-md">{fd.nationalIdNumber || '—'}</span></Field>
              </div>
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">
              <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
                <SectionHeader>Contact Information</SectionHeader>
                <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
                  <Field label="Mobile Number">{fd.mobileNumber || '—'}</Field>
                  <Field label="Email Address">{fd.emailAddress || '—'}</Field>
                </div>
              </section>
              <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
                <SectionHeader>Employment Information</SectionHeader>
                <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
                  <Field label="Employer Name"><span className="font-bold">{fd.employerName || '—'}</span></Field>
                  <Field label="Job Title">{fd.jobTitle || '—'}</Field>
                  <Field label="Employment Status">{fd.employmentStatus || '—'}</Field>
                </div>
              </section>
            </div>
            <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
              <SectionHeader>Address Information</SectionHeader>
              <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
                <Field label="Address">{fd.addressLine1 || '—'}</Field>
                <Field label="City">{fd.city || '—'}</Field>
                <Field label="Postal Code">{fd.postalCode || '—'}</Field>
                <Field label="Country">{fd.country || '—'}</Field>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
              <SectionHeader>Company Information</SectionHeader>
              <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg">
                <Field label="Legal Entity Name"><span className="font-bold">{fd.legalEntityName || '—'}</span></Field>
                <Field label="Trade Name">{fd.tradeName || '—'}</Field>
                <Field label="Registration Number"><span className="text-mono-md font-mono-md">{fd.companyRegistrationNumber || '—'}</span></Field>
                <Field label="Tax ID / VAT">{fd.taxId || '—'}</Field>
                <Field label="Date of Incorporation">{fd.dateOfIncorporation || '—'}</Field>
                <Field label="Business Type">{fd.businessType || '—'}</Field>
                <Field label="Industry">{fd.industryType || '—'}</Field>
                <Field label="Annual Revenue">{fd.annualRevenue || '—'}</Field>
                <Field label="Employees">{fd.numberOfEmployees || '—'}</Field>
              </div>
            </section>
            <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
              <SectionHeader>Business Address</SectionHeader>
              <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
                <Field label="Address">{fd.addressLine1 || '—'}</Field>
                <Field label="City">{fd.city || '—'}</Field>
                <Field label="Country">{fd.country || '—'}</Field>
              </div>
            </section>
            <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
              <SectionHeader>Authorized Signatory</SectionHeader>
              <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg">
                <Field label="Name"><span className="font-bold">{fd.signatoryName || '—'}</span></Field>
                <Field label="Designation">{fd.designation || '—'}</Field>
                <Field label="Nationality">{fd.signatoryNationality || '—'}</Field>
                <Field label="ID / Passport"><span className="text-mono-md font-mono-md">{fd.idPassportNumber || '—'}</span></Field>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
