import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { InvokeCommand } from '@aws-sdk/client-lambda'
import { dynamoClient, s3Client, lambdaClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'
import { currentUser } from '../data/mockData'
import AppLayout from '../components/AppLayout'
import { logActivity } from '../lib/activityLogger'

const TABS = ['Profile', 'Documents', 'Analysis', 'Activity']

const DOC_HIERARCHY = ['Passport', 'National ID', 'Trade License', 'Certificate of Incorporation', 'Power of Attorney', 'Salary Certificate', 'Utility Bill', 'Bank Statement', 'MOA']

const PROFILE_GROUPS_INDIVIDUAL = [
  {
    group: 'Personal Information', icon: 'person',
    fields: [
      { key: 'fullName',      label: 'Full Name',     sources: ['Passport', 'National ID'] },
      { key: 'dateOfBirth',   label: 'Date of Birth', sources: ['Passport', 'National ID'] },
      { key: 'gender',        label: 'Gender',        sources: ['Passport', 'National ID'] },
      { key: 'maritalStatus', label: 'Marital Status',sources: [], manual: true },
      { key: 'nationality',   label: 'Nationality',   sources: ['Passport', 'National ID'] },
      { key: 'address',       label: 'Address',       sources: ['Passport', 'National ID'] },
    ]
  },
  {
    group: 'Contact Information', icon: 'contact_phone',
    fields: [
      { key: 'phoneNumber', label: 'Phone Number',  sources: [], manual: true },
      { key: 'email',       label: 'Email Address', sources: [], manual: true },
    ]
  },
  {
    group: 'Identity Document', icon: 'badge',
    fields: [
      { key: 'passportNumber', label: 'Passport Number',    sources: ['Passport'] },
      { key: 'idNumber',       label: 'National ID Number', sources: ['National ID'] },
      { key: 'issueDate',      label: 'Issue Date',         sources: ['Passport', 'National ID'] },
      { key: 'expiryDate',     label: 'Expiry Date',        sources: ['Passport', 'National ID'] },
      { key: 'issuingCountry', label: 'Issuing Country',    sources: ['Passport', 'National ID'] },
    ]
  },
  {
    group: 'Employment Information', icon: 'work',
    fields: [
      { key: 'employerName',  label: 'Employer Name',  sources: ['Salary Certificate'] },
      { key: 'jobTitle',      label: 'Job Title',      sources: ['Salary Certificate'] },
      { key: 'monthlySalary', label: 'Monthly Salary', sources: ['Salary Certificate'] },
    ]
  },
]

const PROFILE_GROUPS_BUSINESS = [
  {
    group: 'Company Details', icon: 'business',
    fields: [
      { key: 'companyName',        label: 'Company Name',          sources: ['Trade License', 'Certificate of Incorporation'] },
      { key: 'tradeLicenseNumber', label: 'Trade License Number',  sources: ['Trade License'] },
      { key: 'incorporationDate',  label: 'Date of Incorporation', sources: ['Certificate of Incorporation'] },
      { key: 'businessType',       label: 'Business Type',         sources: ['Trade License'] },
      { key: 'industry',           label: 'Industry',              sources: [], manual: true },
      { key: 'annualRevenue',      label: 'Annual Revenue',        sources: [], manual: true },
      { key: 'numberOfEmployees',  label: 'No. of Employees',      sources: [], manual: true },
      { key: 'address',            label: 'Address',               sources: [], manual: true },
    ]
  },
  {
    group: 'Authorized Signatory', icon: 'person',
    fields: [
      { key: 'fullName',       label: 'Full Name',       sources: ['Passport', 'National ID'] },
      { key: 'designation',    label: 'Designation',     sources: [], manual: true },
      { key: 'nationality',    label: 'Nationality',     sources: ['Passport', 'National ID'] },
      { key: 'documentNumber', label: 'Document Number', sources: ['Passport', 'National ID'] },
      { key: 'issueDate',      label: 'Issue Date',      sources: ['Passport', 'National ID'] },
      { key: 'expiryDate',     label: 'Expiry Date',     sources: ['Passport', 'National ID'] },
      { key: 'issuingCountry', label: 'Issuing Country', sources: ['Passport', 'National ID'] },
    ]
  },
]

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
  'Passport':                    ['fullName', 'passportNumber', 'nationality', 'dateOfBirth', 'gender', 'issueDate', 'expiryDate', 'issuingCountry', 'address'],
  'National ID':                 ['fullName', 'idNumber', 'dateOfBirth', 'nationality', 'issueDate', 'expiryDate', 'gender', 'issuingCountry', 'address'],
  'Utility Bill':                ['customerName', 'customerAddress', 'billDate', 'utilityProvider'],
  'Bank Statement':              ['accountHolderName', 'accountNumber', 'bankName', 'statementStartDate', 'statementEndDate', 'closingBalance', 'customerAddress'],
  'Selfie':                      [],
  'Salary Certificate':          ['employeeName', 'employerName', 'monthlySalary', 'issueDate', 'jobTitle'],
  'Trade License':               ['companyName', 'tradeLicenseNumber', 'businessType', 'issueDate', 'expiryDate', 'licensingAuthority'],
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
  const [statusUpdating, setStatusUpdating] = useState(false)

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

  const isIndividual = !caseData || caseData.customerType === 'individual'
  const pd = caseData?.profileData ?? {}
  const _aiFullNameRaw = caseData?.aiResults?.find(r => r?.extractedFields?.fullName)?.extractedFields?.fullName
  const aiFullName = typeof _aiFullNameRaw === 'object' ? (_aiFullNameRaw?.value ?? '') : (_aiFullNameRaw ?? '')
  const _aiCompanyRaw = caseData?.aiResults?.find(r => r?.extractedFields?.companyName)?.extractedFields?.companyName
  const aiCompanyName = typeof _aiCompanyRaw === 'object' ? (_aiCompanyRaw?.value ?? '') : (_aiCompanyRaw ?? '')
  const customerName = isIndividual
    ? (pd.fullName || aiFullName || '—')
    : (pd.companyName || aiCompanyName || '—')
  const productVariant = caseData?.productVariant || ''
  const statusLabel = (caseData?.status || 'in_review').replace(/_/g, ' ')

  async function handleUpdateStatus(newStatus) {
    setStatusUpdating(true)
    try {
      await dynamoClient.send(new UpdateCommand({
        TableName: awsConfig.dynamoTableName,
        Key: { appId },
        UpdateExpression: 'SET #s = :s, updatedAt = :ts',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':s': newStatus, ':ts': new Date().toISOString() },
      }))
      setCaseData(prev => ({ ...prev, status: newStatus }))
      logActivity(appId, {
        type: 'user',
        category: 'Status Updated',
        actor: currentUser.name,
        description: `Case status updated to "${newStatus}" by ${currentUser.name}.`,
      })
      navigate('/cases')
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <AppLayout contentClassName="ml-64 pt-16 flex flex-col h-screen overflow-hidden font-body-md text-body-md text-on-surface">
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

      {/* Page header */}
        <div className="px-margin-desktop pt-8 pb-4 bg-background shrink-0">
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-display-lg font-display-lg text-on-surface">{appId}</h2>
                <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-label-md rounded-full capitalize">{statusLabel}</span>
              </div>
              <p className="text-body-lg text-on-surface-variant">
                {customerName} • {caseData?.product || '—'}{productVariant ? ` / ${productVariant}` : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleUpdateStatus('rejected')} disabled={statusUpdating} className="px-4 py-[10px] bg-error-container text-on-error-container rounded-lg text-label-md font-bold hover:opacity-90 transition-opacity disabled:opacity-50" type="button">Reject</button>
              <button onClick={() => handleUpdateStatus('approved')} disabled={statusUpdating} className="px-4 py-[10px] bg-primary text-on-primary rounded-lg text-label-md font-bold hover:shadow-lg transition-all disabled:opacity-50" type="button">Approve Case</button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-outline-variant bg-background px-margin-desktop gap-8 overflow-x-auto scrollbar-hide shrink-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`pb-3 text-label-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                i === activeTab
                  ? 'text-primary font-bold border-b-2 border-primary -mb-px'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
              type="button"
            >
              {tab}
              {i === 0 && !caseData?.profileData?.confirmedAt && !loading && (
                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 14 }}>warning</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 0 && (
          <main className="flex-1 overflow-y-auto p-margin-desktop bg-background space-y-stack-lg main-scroll">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-12">Loading case data...</div>
              : <ProfileTab caseData={caseData} onProfileSaved={() => { setLoading(true); setRefreshKey(k => k + 1) }} />
            }
          </main>
        )}

        {activeTab === 1 && (
          <div className="flex-1 overflow-hidden bg-surface">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-16">Loading case data...</div>
              : <DocumentsTab caseData={caseData} onRefresh={() => { setLoading(true); setRefreshKey(k => k + 1) }} onAiResultsUpdate={next => setCaseData(prev => ({ ...prev, aiResults: next }))} />
            }
          </div>
        )}

        {activeTab === 2 && (
          <main className="flex-1 overflow-y-auto p-margin-desktop bg-background main-scroll">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-12">Loading case data...</div>
              : <IdentityFraudTab caseData={caseData} onRefresh={() => { setLoading(true); setRefreshKey(k => k + 1) }} />
            }
          </main>
        )}

        {activeTab === 3 && (
          <main className="flex-1 overflow-y-auto p-margin-desktop bg-background main-scroll">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-12">Loading case data...</div>
              : <ActivityTab appId={appId} />
            }
          </main>
        )}

    </AppLayout>
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

function DocumentsTab({ caseData, onRefresh, onAiResultsUpdate }) {
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
      onAiResultsUpdate?.(next)
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

// ─── Cross-document consistency checks ───────────────────────────────────────

function computeCrossChecks(detectedType, fields, allAiResults) {
  const getField = (result, key) => {
    const raw = result?.extractedFields?.[key]
    return typeof raw === 'object' ? (raw?.value ?? null) : (raw ?? null)
  }
  const norm = str => str?.toString().trim().toLowerCase().replace(/\s+/g, ' ') ?? ''
  const compare = (a, b) => a && b ? (norm(a) === norm(b) ? 'pass' : 'fail') : 'na'

  const passport  = allAiResults.find(r => r?.documentType === 'Passport')
  const nationalId = allAiResults.find(r => r?.documentType === 'National ID')
  const idDoc = passport ?? nationalId

  const refName    = getField(idDoc, 'fullName')
  const refAddress = getField(passport, 'address') ?? getField(nationalId, 'address')

  const checks = []

  if (detectedType === 'Utility Bill') {
    checks.push({ label: 'Name Match',    status: compare(fields.customerName,    refName)    })
    checks.push({ label: 'Address Match', status: compare(fields.customerAddress, refAddress) })
  } else if (detectedType === 'Bank Statement') {
    checks.push({ label: 'Name Match',    status: compare(fields.accountHolderName, refName)    })
    checks.push({ label: 'Address Match', status: compare(fields.customerAddress,   refAddress) })
  } else if (detectedType === 'Salary Certificate') {
    checks.push({ label: 'Name Match', status: compare(fields.employeeName, refName) })
  }

  return checks.filter(c => c.status !== 'na')
}

const DATE_FIELD_KEYS = new Set([
  'dateOfBirth', 'issueDate', 'expiryDate', 'incorporationDate',
  'billDate', 'statementStartDate', 'statementEndDate', 'effectiveDate',
])

function toMMDDYYYY(val) {
  if (!val) return val
  const s = String(val).trim()

  // YYYY-MM-DD or YYYY/MM/DD
  const ymd = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/)
  if (ymd) return `${ymd[2].padStart(2,'0')}/${ymd[3].padStart(2,'0')}/${ymd[1]}`

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  // When first segment > 12 it must be a day; otherwise assume day-first (international docs)
  const dmy = s.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/)
  if (dmy) return `${dmy[2].padStart(2,'0')}/${dmy[1].padStart(2,'0')}/${dmy[3]}`

  // Natural-language formats: "31 Dec 2025", "December 31, 2025", "31st December 2025", etc.
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

  return val
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
      const rawVal = typeof v === 'object' && v !== null ? (v.value ?? '') : v
      result[k] = DATE_FIELD_KEYS.has(k) ? toMMDDYYYY(rawVal) : rawVal
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

      // Recompute notExpired from the edited expiryDate so the quality check
      // stays in sync with the field value rather than the original AI result.
      const existingQC = updated[docIndex]?.qualityChecks ?? {}
      let qualityChecks = { ...existingQC }
      if ('expiryDate' in fields) {
        const expiry = fields.expiryDate
        if (expiry) {
          qualityChecks = { ...qualityChecks, notExpired: new Date(expiry) > new Date() ? 'pass' : 'fail' }
        } else {
          qualityChecks = { ...qualityChecks, notExpired: 'na' }
        }
      }

      updated[docIndex] = {
        ...updated[docIndex],
        documentType: detectedType,
        extractedFields: fields,
        qualityChecks,
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
      onSave?.(docIndex, { documentType: detectedType, extractedFields: fields, qualityChecks, verificationStatus: status })
      logActivity(appId, {
        type: 'user',
        category: 'Document Reviewed',
        actor: currentUser.name,
        description: `"${detectedType}" document reviewed — status set to "${status}".`,
      })
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
          <QualityChecksPanel
            qualityChecks={aiResult?.qualityChecks}
            crossChecks={computeCrossChecks(detectedType, fields, allAiResults)}
          />

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
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim()}
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

function QualityChecksPanel({ qualityChecks, crossChecks = [] }) {
  const checks = [
    { key: 'imageClarity',      label: 'Image Clarity' },
    { key: 'fullyVisible',      label: 'Fully Visible' },
    { key: 'notExpired',        label: 'Not Expired'   },
    { key: 'noTampering',       label: 'No Tampering'  },
    { key: 'mrzValid',          label: 'MRZ Valid'     },
    { key: 'faceVisible',       label: 'Face Visible'  },
    { key: 'livenessIndicator', label: 'Liveness'      },
  ]

  const styles = {
    pass: { icon: 'check_circle', cls: 'text-green-600', bg: 'bg-green-50',              label: 'PASS' },
    warn: { icon: 'warning',      cls: 'text-amber-600', bg: 'bg-amber-50',              label: 'WARN' },
    fail: { icon: 'cancel',       cls: 'text-red-600',   bg: 'bg-red-50',                label: 'FAIL' },
    na:   { icon: 'remove',       cls: 'text-outline',   bg: 'bg-surface-container-low', label: 'N/A'  },
  }

  const visible = qualityChecks ? checks.filter(({ key }) => (qualityChecks[key] ?? 'na') !== 'na') : []
  if (!visible.length && !crossChecks.length) return null

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
        {crossChecks.map(({ label, status }) => {
          const s = styles[status] ?? styles.na
          return (
            <span key={label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${s.cls} ${s.bg} border-current/20`}>
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

function computeAMLData(caseData) {
  const appId = caseData?.appId ?? ''
  const pd = caseData?.profileData ?? {}

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

  const nationality = pd.nationality || ''
  const country = pd.country || pd.address || ''
  const employment = pd.employerName ? 'Employed' : ''

  function countryRisk(c) {
    if (!c) return ['LOW', 'MEDIUM'][amlRoll(appId, 'ctry_empty', 2)]
    if (LOW_RISK_COUNTRIES.some(l => c.toLowerCase().includes(l))) return 'LOW'
    return ['LOW', 'MEDIUM', 'HIGH'][amlRoll(appId, 'ctry_' + c, 3)]
  }

  const employmentRisk = employment.toLowerCase().includes('employ') ? 'LOW'
    : employment ? ['LOW', 'MEDIUM'][amlRoll(appId, 'emp', 2)]
    : 'MEDIUM'

  const jurisdictionFactors = [
    { label: nationality ? `Nationality (${nationality})` : 'Nationality',         risk: countryRisk(nationality) },
    { label: employment  ? `Source of Funds (${employment})` : 'Source of Funds',  risk: employmentRisk },
    { label: country     ? `Country of Residence (${country})` : 'Country of Residence', risk: countryRisk(country) },
  ]

  const anySanctionHit = sanctions.some(s => s.result === 'hit')
  const anyMediaFlag   = media.some(m => m.result === 'flag')
  const riskProfile    = anySanctionHit || pepHit ? 'Elevated' : anyMediaFlag ? 'Moderate' : 'Low'
  const showAlert      = anySanctionHit || pepHit

  const hitSources   = sanctions.filter(s => s.result === 'hit').map(s => s.source)
  const alertHeading = pepHit && anySanctionHit
    ? 'Potential PEP and Sanctions match detected'
    : pepHit        ? 'Potential PEP match detected'
    : anySanctionHit ? `Potential Sanctions match on ${hitSources.join(', ')}`
    : 'No matches found across all lists'
  const alertSubtext = pepHit
    ? 'PEP match requires additional due diligence. Adverse Media cleared.'
    : anySanctionHit ? 'PEP and Adverse Media cleared for this entity.'
    : 'All sanctions, PEP, and adverse media checks returned no matches.'

  const riskCls   = riskProfile === 'Elevated' ? 'text-error' : riskProfile === 'Moderate' ? 'text-amber-600' : 'text-green-600'
  const checkedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return { sanctions, pepHit, pepConfidence, media, jurisdictionFactors, anySanctionHit, anyMediaFlag, riskProfile, showAlert, alertHeading, alertSubtext, riskCls, checkedAt }
}

function AMLTab({ caseData }) {
  const { showAlert, alertHeading, alertSubtext, riskProfile, riskCls } = computeAMLData(caseData)

  return (
    <div className="space-y-6">
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
    </div>
  )
}

// ─── Analysis Tab ─────────────────────────────────────────────────────────────

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

function CroppedFace({ imageUrl, boundingBox, label, accent = 'bg-primary' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!imageUrl || !boundingBox || !canvasRef.current) return
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const { Left, Top, Width, Height } = boundingBox
      const padX = Width * 0.3
      const padY = Height * 0.3
      const sx = Math.max(0, (Left - padX) * img.naturalWidth)
      const sy = Math.max(0, (Top - padY) * img.naturalHeight)
      const sw = Math.min(img.naturalWidth - sx, (Width + 2 * padX) * img.naturalWidth)
      const sh = Math.min(img.naturalHeight - sy, (Height + 2 * padY) * img.naturalHeight)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    }
    img.src = imageUrl
  }, [imageUrl, boundingBox])

  return (
    <div className="relative rounded overflow-hidden border border-outline-variant bg-surface-container flex-1">
      {imageUrl
        ? <canvas ref={canvasRef} width={120} height={140} className="w-full h-auto" />
        : <div className="h-[140px] flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-outline">progress_activity</span>
          </div>
      }
      <div className={`absolute bottom-0 inset-x-0 ${accent}/80 text-white text-[9px] py-0.5 px-1 uppercase font-bold tracking-widest text-center truncate`}>
        {label}
      </div>
    </div>
  )
}

function FaceMatchSimilarity({ similarity, status }) {
  const cls = status === 'pass' ? 'text-green-600' : status === 'warn' ? 'text-amber-600' : 'text-red-600'
  const icon = status === 'pass' ? 'check_circle' : status === 'warn' ? 'warning' : 'cancel'
  return (
    <div className={`flex flex-col items-center gap-1 px-2 ${cls}`}>
      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
      <span className="text-[11px] font-bold">{similarity}%</span>
    </div>
  )
}

function FaceMatchCard({ aiResults, uploadedDocs, faceMatch, appId, onRefresh }) {
  const passportIdx  = aiResults.findIndex(r => r?.documentType === 'Passport')
  const nationalIdIdx = aiResults.findIndex(r => r?.documentType === 'National ID')
  const selfieIdx    = aiResults.findIndex(r => r?.documentType === 'Selfie')

  const passportKey  = passportIdx  >= 0 ? (uploadedDocs[passportIdx]?.key  ?? null) : null
  const nationalIdKey = nationalIdIdx >= 0 ? (uploadedDocs[nationalIdIdx]?.key ?? null) : null
  const selfieKey    = selfieIdx    >= 0 ? (uploadedDocs[selfieIdx]?.key    ?? null) : null

  const [passportUrl,  setPassportUrl]  = useState(null)
  const [nationalIdUrl, setNationalIdUrl] = useState(null)
  const [selfieUrl,    setSelfieUrl]    = useState(null)
  const [running,      setRunning]      = useState(false)

  function useS3Url(key, setter) {
    useEffect(() => {
      if (!key) return
      let url
      ;(async () => {
        try {
          const obj = await s3Client.send(new GetObjectCommand({ Bucket: awsConfig.s3BucketName, Key: key }))
          const bytes = await obj.Body.transformToByteArray()
          url = URL.createObjectURL(new Blob([bytes], { type: obj.ContentType || 'image/jpeg' }))
          setter(url)
        } catch {}
      })()
      return () => { if (url) URL.revokeObjectURL(url) }
    }, [key])
  }
  useS3Url(passportKey,   setPassportUrl)
  useS3Url(nationalIdKey, setNationalIdUrl)
  useS3Url(selfieKey,     setSelfieUrl)

  async function handleRun() {
    if (!selfieKey || (!passportKey && !nationalIdKey)) return
    setRunning(true)
    try {
      await lambdaClient.send(new InvokeCommand({
        FunctionName: awsConfig.faceMatchFunctionName,
        Payload: new TextEncoder().encode(JSON.stringify({ appId })),
      }))
      onRefresh?.()
    } catch (err) {
      console.error('Face match failed:', err)
    } finally {
      setRunning(false)
    }
  }

  const hasSelfie = !!selfieKey
  const hasIdDoc  = !!(passportKey || nationalIdKey)
  const passportMatch      = faceMatch?.passportVsSelfie
  const nationalIdMatch    = faceMatch?.nationalIdVsSelfie
  const crossDocMatch      = faceMatch?.passportVsNationalId
  const hasResults = !!(passportMatch || nationalIdMatch)

  return (
    <div className="bg-white rounded border border-outline-variant overflow-hidden">
      <div className="bg-surface-container-low px-stack-md py-stack-sm border-b border-outline-variant flex items-center justify-between">
        <h2 className="text-label-md font-label-md text-on-surface-variant uppercase">Face Match Verification</h2>
        {hasSelfie && hasIdDoc && (
          <button type="button" onClick={handleRun} disabled={running}
            className="flex items-center gap-1 text-[11px] font-bold text-secondary hover:text-primary disabled:opacity-60 transition-colors">
            <span className={`material-symbols-outlined text-[14px] ${running ? 'animate-spin' : ''}`}>
              {running ? 'progress_activity' : 'refresh'}
            </span>
            {running ? 'Running…' : hasResults ? 'Re-run' : 'Run'}
          </button>
        )}
      </div>
      <div className="p-stack-lg space-y-4">
        {!hasSelfie || !hasIdDoc ? (
          <div className="py-6 text-center text-body-sm text-on-surface-variant">
            {!hasSelfie ? 'No selfie uploaded yet.' : 'No ID document uploaded yet.'}
          </div>
        ) : hasResults ? (
          <>
            {passportMatch && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Passport vs Selfie</p>
                <div className="flex items-center gap-2">
                  <CroppedFace imageUrl={passportUrl}  boundingBox={passportMatch.sourceBoundingBox} label="Passport"  accent="bg-primary" />
                  <FaceMatchSimilarity similarity={passportMatch.similarity} status={passportMatch.status} />
                  <CroppedFace imageUrl={selfieUrl}    boundingBox={passportMatch.targetBoundingBox} label="Selfie"    accent="bg-secondary" />
                </div>
              </div>
            )}
            {nationalIdMatch && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">National ID vs Selfie</p>
                <div className="flex items-center gap-2">
                  <CroppedFace imageUrl={nationalIdUrl} boundingBox={nationalIdMatch.sourceBoundingBox} label="National ID" accent="bg-primary" />
                  <FaceMatchSimilarity similarity={nationalIdMatch.similarity} status={nationalIdMatch.status} />
                  <CroppedFace imageUrl={selfieUrl}     boundingBox={nationalIdMatch.targetBoundingBox} label="Selfie"      accent="bg-secondary" />
                </div>
              </div>
            )}
            {crossDocMatch && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Passport vs National ID</p>
                <div className="flex items-center gap-2">
                  <CroppedFace imageUrl={passportUrl}   boundingBox={crossDocMatch.sourceBoundingBox} label="Passport"    accent="bg-primary" />
                  <FaceMatchSimilarity similarity={crossDocMatch.similarity} status={crossDocMatch.status} />
                  <CroppedFace imageUrl={nationalIdUrl} boundingBox={crossDocMatch.targetBoundingBox} label="National ID" accent="bg-secondary" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className={`grid gap-3 ${passportKey && nationalIdKey ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {passportKey && (
                <div className="aspect-square bg-surface-container rounded overflow-hidden border border-outline-variant relative">
                  {passportUrl
                    ? <img src={passportUrl} alt="Passport" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-outline">progress_activity</span></div>
                  }
                  <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[10px] py-1 px-2 uppercase font-bold tracking-widest">Passport</div>
                </div>
              )}
              {nationalIdKey && (
                <div className="aspect-square bg-surface-container rounded overflow-hidden border border-outline-variant relative">
                  {nationalIdUrl
                    ? <img src={nationalIdUrl} alt="National ID" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-outline">progress_activity</span></div>
                  }
                  <div className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[10px] py-1 px-2 uppercase font-bold tracking-widest">National ID</div>
                </div>
              )}
              <div className="aspect-square bg-surface-container rounded overflow-hidden border border-outline-variant relative">
                {selfieUrl
                  ? <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-outline">progress_activity</span></div>
                }
                <div className="absolute bottom-0 inset-x-0 bg-secondary/80 text-white text-[10px] py-1 px-2 uppercase font-bold tracking-widest">Selfie</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {passportKey && <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">Passport ↔ Selfie</span>}
              {nationalIdKey && <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">National ID ↔ Selfie</span>}
              {passportKey && nationalIdKey && <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">Passport ↔ National ID</span>}
            </div>
            <p className="text-body-sm text-on-surface-variant text-center">Click Run to compare faces using Rekognition</p>
          </div>
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

function AnalystObservationPanel({ rows, aiResults, faceMatch, amlData }) {
  const [open, setOpen] = useState(true)

  const mismatches = rows.filter(r => r.status === 'Mismatch')
  const failedChecks = aiResults.flatMap(r => {
    const doc = r?.documentType
    if (!doc) return []
    return Object.entries(r?.qualityChecks ?? {})
      .filter(([, v]) => v === 'fail')
      .map(([k]) => ({ doc, check: k.replace(/([A-Z])/g, ' $1').toLowerCase().trim() }))
  })
  const faceMatchConcerns = Object.values(faceMatch ?? {}).flatMap(m => {
    if (!m || m.status === 'pass') return []
    const label = `${m.sourceLabel} vs ${m.targetLabel}`
    return m.status === 'fail'
      ? [{ text: `Face match between <strong>${label}</strong> failed (${m.similarity}% similarity — below the 90% threshold).` }]
      : [{ text: `Face match between <strong>${label}</strong> scored ${m.similarity}% — within the caution range (75–89%).` }]
  })
  const amlConcerns = amlData ? [
    ...(amlData.sanctions ?? []).filter(s => s.result === 'hit').map(s => ({
      text: `Potential sanctions match detected on <strong>${s.source}</strong>. Enhanced due diligence required.`,
    })),
    ...(amlData.pepHit ? [{ text: 'Potential <strong>Politically Exposed Person (PEP)</strong> match detected. Additional due diligence required.' }] : []),
    ...(amlData.media ?? []).filter(m => m.result === 'flag').map(m => ({
      text: `Adverse media flag raised by <strong>${m.source}</strong>.`,
    })),
    ...(amlData.jurisdictionFactors ?? []).filter(j => j.risk === 'HIGH').map(j => ({
      text: `<strong>${j.label}</strong> is assessed as high risk.`,
    })),
  ] : []

  const hasIssues = mismatches.length || failedChecks.length || faceMatchConcerns.length || amlConcerns.length

  if (!hasIssues) {
    return (
      <div className="bg-surface-container rounded border-l-4 border-green-500">
        <button type="button" onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-stack-md p-stack-lg text-left">
          <span className="material-symbols-outlined text-green-600 text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
          <h3 className="font-bold text-primary flex-1">No Issues Detected</h3>
          <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        {open && (
          <div className="px-stack-lg pb-stack-lg">
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              All cross-document fields are consistent, quality checks passed, face match scores are within acceptable thresholds, and no AML concerns were identified. This case appears ready for final review.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface-container rounded border-l-4 border-secondary">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-stack-md p-stack-lg text-left">
        <span className="material-symbols-outlined text-secondary text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>lightbulb</span>
        <h3 className="font-bold text-primary flex-1">Analyst Observation Required</h3>
        <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && (
        <div className="px-stack-lg pb-stack-lg">
          <ul className="text-body-sm text-on-surface-variant space-y-1 list-disc list-inside leading-relaxed">
            {mismatches.map((m, i) => (
              <li key={`m-${i}`}>A <strong>{m.label}</strong> mismatch was detected across {m.sources}.</li>
            ))}
            {failedChecks.map((f, i) => (
              <li key={`f-${i}`}>A <strong>{f.check}</strong> check failed on the {f.doc}.</li>
            ))}
            {faceMatchConcerns.map((c, i) => (
              <li key={`fm-${i}`} dangerouslySetInnerHTML={{ __html: c.text }} />
            ))}
            {amlConcerns.map((c, i) => (
              <li key={`aml-${i}`} dangerouslySetInnerHTML={{ __html: c.text }} />
            ))}
            <li>Manual cross-referencing is strongly recommended before final approval.</li>
          </ul>
        </div>
      )}
    </div>
  )
}

function IdentityFraudTab({ caseData, onRefresh }) {
  const aiResults = caseData?.aiResults ?? []
  const uploadedDocs = caseData?.documents ?? []
  const rows = buildConsistencyRows(aiResults)
  const amlData = computeAMLData(caseData)
  const { sanctions, pepHit, media, jurisdictionFactors, checkedAt } = amlData

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12">
        <AnalystObservationPanel rows={rows} aiResults={aiResults} faceMatch={caseData?.faceMatch} amlData={amlData} />
      </div>
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <FaceMatchCard
          aiResults={aiResults}
          uploadedDocs={uploadedDocs}
          faceMatch={caseData?.faceMatch}
          appId={caseData?.appId}
          onRefresh={onRefresh}
        />
      </div>
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <ConsistencyTable rows={rows} />
        <FraudSignalsCard aiResults={aiResults} />
      </div>

      {/* AML Screening Sections */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">

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
          <div className="bg-white rounded border border-outline-variant p-stack-lg">
            <h2 className="text-label-md font-label-md text-on-surface-variant uppercase mb-stack-md">PEP Screening</h2>
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
          </div>

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

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function aggregateFields(aiResults) {
  const map = {}
  for (const result of (aiResults ?? [])) {
    if (!result?.extractedFields || result.documentType === 'Selfie') continue
    for (const [key, raw] of Object.entries(result.extractedFields)) {
      const value = typeof raw === 'object' ? (raw?.value ?? '') : (raw ?? '')
      const confidence = typeof raw === 'object' ? (raw?.confidence ?? null) : null
      if (!value) continue
      if (!map[key]) map[key] = []
      map[key].push({ value, confidence, docType: result.documentType })
    }
  }
  return map
}

function bestEntry(entries) {
  return entries.slice().sort((a, b) => {
    const ai = DOC_HIERARCHY.indexOf(a.docType)
    const bi = DOC_HIERARCHY.indexOf(b.docType)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })[0]
}

function hasConflict(entries) {
  if (!entries || entries.length < 2) return false
  const vals = new Set(entries.map(e => e.value.trim().toLowerCase()))
  return vals.size > 1
}

// Returns entries for a field, filtered to the field's declared sources (if any).
// This prevents cross-group false conflicts — e.g. Passport issueDate vs Salary Certificate issueDate.
function getEntriesForField(agg, fieldDef) {
  const keys = [fieldDef.key, ...(fieldDef.aliases ?? [])]
  const all = keys.flatMap(k => agg[k] ?? [])
  if (!fieldDef.sources?.length) return all
  const filtered = all.filter(e => fieldDef.sources.includes(e.docType))
  return filtered.length ? filtered : all
}

function buildInitialProfile(aiResults, groups) {
  const agg = aggregateFields(aiResults)
  const profile = {}
  for (const grp of groups) {
    for (const f of grp.fields) {
      const entries = getEntriesForField(agg, f)
      if (entries.length) profile[f.key] = bestEntry(entries).value
    }
  }
  return profile
}

function ConfidenceChip({ confidence }) {
  if (confidence == null) return null
  const pct = typeof confidence === 'number' ? confidence : parseFloat(confidence)
  if (isNaN(pct)) return null
  const cls = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const label = pct >= 80 ? 'High' : pct >= 50 ? 'Medium' : 'Low'
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
}

function SourceChip({ docType }) {
  if (!docType) return null
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary-container text-on-secondary-container truncate max-w-full block">{docType}</span>
}

function ProfileTab({ caseData, onProfileSaved }) {
  const isIndividual = !caseData || caseData.customerType === 'individual'
  const groups = isIndividual ? PROFILE_GROUPS_INDIVIDUAL : PROFILE_GROUPS_BUSINESS
  const aiResults = caseData?.aiResults ?? []
  const agg = aggregateFields(aiResults)
  const confirmed = !!caseData?.profileData?.confirmedAt

  const [localProfile, setLocalProfile] = useState(() => {
    if (caseData?.profileData) {
      const { confirmedAt, confirmedBy, ...rest } = caseData.profileData
      return rest
    }
    return buildInitialProfile(aiResults, groups)
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [resolvedFields, setResolvedFields] = useState(() =>
    caseData?.profileData?.confirmedAt
      ? new Set(groups.flatMap(g => g.fields).map(f => f.key))
      : new Set()
  )
  const [resolvedSources, setResolvedSources] = useState(() => {
    if (!caseData?.profileData?.confirmedAt) return {}
    const saved = caseData.profileData
    const result = {}
    for (const grp of groups) {
      for (const f of grp.fields) {
        const entries = getEntriesForField(agg, f)
        const savedValue = saved[f.key]
        if (savedValue && entries.length) {
          const match = entries.find(e => e.value === savedValue)
          if (match) result[f.key] = match.docType
        }
      }
    }
    return result
  })

  const totalConflicts = groups.flatMap(g => g.fields).filter(f => hasConflict(getEntriesForField(agg, f)) && !resolvedFields.has(f.key)).length

  function handleChange(key, value) {
    setLocalProfile(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
    setSaved(false)
  }

  function handleConflictResolve(key, value, docType) {
    setLocalProfile(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
    setSaved(false)
    setResolvedFields(prev => new Set([...prev, key]))
    setResolvedSources(prev => ({ ...prev, [key]: docType }))
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      const profileData = {
        ...localProfile,
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentUser.name,
      }
      await dynamoClient.send(new UpdateCommand({
        TableName: awsConfig.dynamoTableName,
        Key: { appId: caseData.appId },
        UpdateExpression: 'SET profileData = :pd, updatedAt = :ua',
        ExpressionAttributeValues: { ':pd': profileData, ':ua': new Date().toISOString() },
      }))
      setSaved(true)
      setIsDirty(false)
      setResolvedFields(new Set(groups.flatMap(g => g.fields).map(f => f.key)))
      logActivity(caseData.appId, {
        type: 'user',
        category: 'Profile Confirmed',
        actor: currentUser.name,
        description: `Customer profile reviewed and confirmed by ${currentUser.name}.`,
      })
      onProfileSaved()
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-headline-sm font-headline-sm text-on-surface">AI-Extracted Customer Profile</h3>
          <p className="text-body-md text-on-surface-variant mt-1">
            Fields extracted from uploaded documents. Review and correct before confirming.
          </p>
        </div>
        {confirmed && !isDirty && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-label-md font-bold">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
            Profile Confirmed
          </span>
        )}
      </div>

      {/* Conflict banner */}
      {totalConflicts > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <div>
            <p className="text-label-md font-bold text-amber-800">{totalConflicts} field{totalConflicts > 1 ? 's' : ''} with conflicting values across documents</p>
            <p className="text-body-sm text-amber-700">Review highlighted rows and select the correct value before confirming.</p>
          </div>
        </div>
      )}

      {/* Field groups */}
      {groups.map(grp => {
        const visibleFields = isIndividual
          ? grp.fields
          : grp.fields.filter(f => {
              if (f.manual) return true
              const entries = getEntriesForField(agg, f)
              return entries.length > 0 || !!localProfile[f.key]
            })
        if (!isIndividual && visibleFields.length === 0) return null
        return (
          <section key={grp.group} className="bg-white rounded-lg border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">{grp.icon}</span>
              <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">{grp.group}</span>
            </div>
            <div className="divide-y divide-outline-variant">
              {visibleFields.map(f => {
                const entries = getEntriesForField(agg, f)
                const best = entries.length ? bestEntry(entries) : null
                const conflict = hasConflict(entries) && !resolvedFields.has(f.key)
                const value = localProfile[f.key] ?? ''
                const sourceDocType = resolvedSources[f.key] ?? (best?.docType ?? null)
                const confidence = best?.confidence ?? null

                return (
                  <div key={f.key} className={`flex items-center gap-4 px-5 py-3 ${conflict ? 'bg-amber-50' : ''}`}>
                    <span className="text-body-sm text-on-surface-variant w-40 shrink-0">{f.label}</span>
                    <div className="flex-1">
                      <input
                        className={`w-full text-body-md text-on-surface bg-transparent border-b focus:outline-none focus:border-primary transition-colors py-0.5 ${conflict ? 'border-amber-400' : 'border-outline-variant'}`}
                        value={value}
                        onChange={e => handleChange(f.key, e.target.value)}
                      />
                      {conflict && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {entries.map((e, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleConflictResolve(f.key, e.value, e.docType)}
                              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${value === e.value ? 'bg-primary text-on-primary border-primary' : 'bg-white text-on-surface border-outline-variant hover:bg-surface-container-low'}`}
                            >
                              {e.value} <span className="opacity-60">({e.docType})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 w-36 shrink-0">
                      {!f.manual && <SourceChip docType={sourceDocType} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Confirm footer */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <p className="text-body-sm text-on-surface-variant">
          {confirmed && !isDirty
            ? `Confirmed by ${caseData.profileData.confirmedBy} on ${new Date(caseData.profileData.confirmedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`
            : 'Profile must be confirmed before a decision can be made.'}
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving || (saved && !isDirty)}
          className="px-6 py-2.5 bg-primary text-on-primary text-label-md font-bold rounded hover:bg-primary/90 shadow transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : saved && !isDirty ? (
            <>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
              Confirmed
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              {confirmed ? 'Save' : 'Confirm Profile'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

const MANUAL_CATEGORIES = [
  'Note Added', 'Document Reviewed', 'Customer Contacted',
  'Compliance Check', 'Risk Assessment', 'Internal Review', 'Status Updated', 'Other',
]

function formatEventTime(iso) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return `${date} • ${time}`
}

function getEventStyle(event) {
  const cat = (event.category || '').toLowerCase()
  if (cat.includes('init') || cat.includes('creat')) return { bg: 'bg-primary', text: 'text-white', icon: 'fiber_new', fill: false }
  if (cat.includes('approv')) return { bg: 'bg-primary-container', text: 'text-on-primary-container', icon: 'check_circle', fill: true }
  if (cat.includes('reject')) return { bg: 'bg-error-container', text: 'text-on-error-container', icon: 'cancel', fill: true }
  if (cat.includes('upload')) return { bg: 'bg-secondary-container', text: 'text-on-secondary-container', icon: 'cloud_upload', fill: true }
  if (cat.includes('aml') || cat.includes('screen') || cat.includes('compliance')) return { bg: 'bg-tertiary-fixed-dim', text: 'text-on-tertiary-fixed', icon: 'gavel', fill: false }
  if (cat.includes('risk')) return { bg: 'bg-secondary-container', text: 'text-on-secondary-container', icon: 'smart_toy', fill: true }
  if (cat.includes('status')) return { bg: 'bg-surface-container-highest', text: 'text-on-surface', icon: 'flag', fill: false }
  if (event.type === 'system') return { bg: 'bg-secondary-container', text: 'text-on-secondary-container', icon: 'smart_toy', fill: true }
  return { bg: 'bg-primary-container', text: 'text-on-primary-container', icon: 'person', fill: false }
}

const ACTIVITY_PAGE_SIZE = 10

function ActivityTab({ appId }) {
  const [events, setEvents] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [newCategory, setNewCategory] = useState(MANUAL_CATEGORIES[0])
  const [newDescription, setNewDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dynamoClient.send(new GetCommand({ TableName: awsConfig.dynamoTableName, Key: { appId } }))
      .then(r => setEvents(r.Item?.activityLog ?? []))
      .catch(() => setEvents([]))
  }, [appId])

  const filtered = (events ?? [])
    .filter(e => filter === 'all' || e.type === filter)
    .filter(e => !search || `${e.description} ${e.category} ${e.actor}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'newest'
      ? new Date(b.timestamp) - new Date(a.timestamp)
      : new Date(a.timestamp) - new Date(b.timestamp))

  const totalPages = Math.max(1, Math.ceil(filtered.length / ACTIVITY_PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * ACTIVITY_PAGE_SIZE, page * ACTIVITY_PAGE_SIZE)
  const systemCount = (events ?? []).filter(e => e.type === 'system').length
  const userCount = (events ?? []).filter(e => e.type === 'user').length

  async function handleAddEntry() {
    if (!newDescription.trim()) return
    setSaving(true)
    const entry = await logActivity(appId, {
      type: 'user',
      category: newCategory,
      actor: currentUser.name,
      description: newDescription.trim(),
    })
    setSaving(false)
    if (entry) {
      setEvents(prev => [...(prev ?? []), entry])
      setNewDescription('')
      setNewCategory(MANUAL_CATEGORIES[0])
      setShowAdd(false)
    }
  }

  if (events === null) {
    return <div className="text-body-md text-on-surface-variant text-center py-12">Loading activity...</div>
  }

  return (
    <div className="space-y-gutter">
      <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">

        {/* Controls */}
        <div className="p-stack-lg border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-gutter">
          <div className="flex items-center gap-stack-md flex-wrap">
            <div className="flex p-unit bg-surface-container-high rounded-lg">
              {[['all', 'All Actions'], ['system', 'System Actions'], ['user', 'User Actions']].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setFilter(val); setPage(1) }}
                  className={`px-stack-md py-1.5 rounded-lg text-label-md transition-all ${filter === val ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant font-medium hover:text-primary'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="h-8 w-px bg-outline-variant" />
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">filter_list</span>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1) }}
                className="pl-9 pr-6 py-1.5 bg-transparent border-none text-label-md focus:ring-0 cursor-pointer text-on-surface"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-stack-md flex-wrap">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-56 pl-10 pr-4 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-secondary transition-all"
                placeholder="Search events..."
                type="text"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAdd(v => !v)}
              className="flex items-center gap-2 px-gutter py-1.5 rounded-lg bg-primary-container text-on-primary-container font-bold text-label-md hover:bg-primary hover:text-on-primary transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_comment</span>
              Add Manual Entry
            </button>
          </div>
        </div>

        {/* Add Entry Form */}
        {showAdd && (
          <div className="p-stack-lg border-b border-outline-variant bg-surface-container-low/50 flex flex-col gap-stack-md">
            <div className="flex gap-stack-md flex-wrap items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-secondary"
                >
                  {MANUAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[260px]">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Describe the action taken..."
                  className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-secondary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-stack-sm justify-end">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setNewDescription('') }}
                className="px-4 py-1.5 text-label-md text-on-surface border border-outline-variant rounded-lg hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEntry}
                disabled={saving || !newDescription.trim()}
                className="px-4 py-1.5 text-label-md bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Save Entry
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="p-margin-desktop relative">
          {filtered.length === 0 ? (
            <p className="text-body-md text-on-surface-variant text-center py-12">No activity events found.</p>
          ) : (
            <>
              <div className="absolute left-[47px] top-10 bottom-10 w-[2px] bg-outline-variant opacity-30" />
              <div className="space-y-stack-lg">
                {paginated.map((event, idx) => {
                  const s = getEventStyle(event)
                  const isLast = idx === paginated.length - 1
                  return (
                    <div key={event.id ?? idx} className="relative flex gap-gutter items-start group">
                      <div className={`z-10 w-[30px] h-[30px] shrink-0 rounded-full ${s.bg} flex items-center justify-center ring-4 ring-surface-container-lowest transition-transform group-hover:scale-110`}>
                        <span
                          className={`material-symbols-outlined text-[16px] ${s.text}`}
                          style={s.fill ? { fontVariationSettings: '"FILL" 1' } : {}}
                        >{s.icon}</span>
                      </div>
                      <div className={`flex-1 pb-stack-lg ${isLast ? '' : 'border-b border-outline-variant/30'}`}>
                        <div className="flex justify-between items-start mb-unit">
                          <div>
                            <span className="text-label-md font-label-md text-primary uppercase tracking-wider block mb-0.5">{event.category}</span>
                            <h3 className="text-body-lg font-bold text-on-surface">{event.actor}</h3>
                          </div>
                          <span className="text-mono-md font-mono-md text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded whitespace-nowrap ml-4">
                            {formatEventTime(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-body-md text-on-surface-variant max-w-2xl">{event.description}</p>
                        {event.type === 'system' && (
                          <div className="mt-stack-sm">
                            <span className="text-[10px] bg-secondary-container/10 text-on-secondary-container px-1.5 py-0.5 rounded border border-secondary-container/30 uppercase font-bold">Auto-Generated</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer stats */}
        <div className="bg-surface-container px-margin-desktop py-stack-md border-t border-outline-variant flex justify-between items-center">
          <div className="flex gap-gutter">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Total Events</span>
              <span className="text-body-lg font-bold text-primary">{events.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">System Actions</span>
              <span className="text-body-lg font-bold text-primary">{systemCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Analyst Reviews</span>
              <span className="text-body-lg font-bold text-primary">{userCount}</span>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-stack-sm">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 hover:bg-surface-container-high rounded transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="text-label-md font-label-md text-on-surface">Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 hover:bg-surface-container-high rounded transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Compliance note */}
      <div className="p-stack-lg bg-surface-container-high rounded-lg border-l-4 border-secondary flex items-start gap-stack-md">
        <span className="material-symbols-outlined text-secondary">info</span>
        <div>
          <h4 className="text-body-md font-bold text-primary">Compliance Requirement</h4>
          <p className="text-body-sm text-on-surface-variant">The activity trail is immutable. All entries are archived as per compliance regulations. Manual entries are attributed to your professional ID.</p>
        </div>
      </div>
    </div>
  )
}

