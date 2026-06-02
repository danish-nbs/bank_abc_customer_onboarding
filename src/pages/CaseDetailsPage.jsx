import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { InvokeCommand } from '@aws-sdk/client-lambda'
import { dynamoClient, s3Client, lambdaClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'
import { currentUser } from '../data/mockData'

const TABS = ['Overview', 'Documents', 'Entities', 'Risk', 'Activity', 'Notes', 'Audit', 'Decisions']

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
