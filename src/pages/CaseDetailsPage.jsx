import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { dynamoClient, s3Client } from '../lib/awsClients'
import { awsConfig } from '../aws-config'
import { currentUser } from '../data/mockData'

const TABS = ['Overview', 'Documents', 'Entities', 'Risk', 'Activity', 'Notes', 'Audit', 'Decisions']

const REQUIRED_DOCS = {
  'Credit Card':       ['Passport / National ID', 'Utility Bill', 'Bank Statement', 'Selfie'],
  'Personal Loan':     ['Passport / National ID', 'Salary Certificate', 'Bank Statement', 'Selfie'],
  'SME Account':       ['Trade License', 'Certificate of Incorporation', 'Passport / National ID', 'Selfie'],
  'Corporate Account': ['Trade License', 'MOA', 'Power of Attorney', 'Passport / National ID', 'Selfie'],
}

const DOC_TYPE_OPTIONS = {
  'Credit Card':       ['Passport', 'National ID', 'Utility Bill', 'Bank Statement', 'Selfie'],
  'Personal Loan':     ['Passport', 'National ID', 'Salary Certificate', 'Bank Statement', 'Selfie'],
  'SME Account':       ['Trade License', 'Certificate of Incorporation', 'Passport', 'National ID', 'Selfie'],
  'Corporate Account': ['Trade License', 'MOA', 'Power of Attorney', 'Passport', 'National ID', 'Selfie'],
}

export default function CaseDetailsPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const appId = state?.appId ?? 'APP-882194-Z'

  const [activeTab, setActiveTab] = useState(0)
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)

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
  }, [appId])

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
        <div className="flex border-b border-outline-variant bg-background px-margin-desktop gap-8 overflow-x-auto scrollbar-hide shrink-0 mt-6">
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
          <main className="flex-1 overflow-y-auto p-margin-desktop bg-surface space-y-stack-lg main-scroll">
            {loading
              ? <div className="text-body-md text-on-surface-variant text-center py-12">Loading case data...</div>
              : <DocumentsTab caseData={caseData} />
            }
          </main>
        )}

      </div>
    </div>
  )
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ caseData }) {
  const product = caseData?.product ?? ''
  const uploadedDocs = caseData?.documents ?? []
  const aiResults = caseData?.aiResults ?? []
  const required = REQUIRED_DOCS[product] ?? []
  const typeOptions = DOC_TYPE_OPTIONS[product] ?? []

  const completeness = required.length > 0
    ? Math.min(100, Math.round((uploadedDocs.length / required.length) * 100))
    : 0
  const circumference = 251.2
  const dashOffset = circumference * (1 - completeness / 100)

  const missingRequired = required.slice(uploadedDocs.length)

  return (
    <>
      {/* Completeness Section */}
      <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-start gap-12">
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle className="text-surface-container-highest" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
              <circle className="text-secondary" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" strokeWidth="8" />
            </svg>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-headline-sm font-bold text-primary">{completeness}%</span>
          </div>
          <p className="text-label-md font-bold text-on-surface-variant">Completeness</p>
        </div>
        <div className="flex-1">
          <h3 className="text-headline-sm mb-4">Required Documents Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {required.map((label, i) => {
              const uploaded = i < uploadedDocs.length
              return (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-lg border ${uploaded ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className={`material-symbols-outlined ${uploaded ? 'text-green-600' : 'text-amber-600'}`}>
                    {uploaded ? 'check_circle' : 'pending'}
                  </span>
                  <span className="text-body-sm font-medium">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Document Cards */}
      <div className="space-y-stack-lg">
        {uploadedDocs.map((doc, i) => (
          <DocumentCard key={doc.key} doc={doc} aiResult={aiResults[i]} typeOptions={typeOptions} />
        ))}
        {missingRequired.map((label) => (
          <MissingDocCard key={label} label={label} />
        ))}
      </div>
    </>
  )
}

function DocumentCard({ doc, aiResult, typeOptions }) {
  const [zoom, setZoom] = useState(1)
  const [detectedType, setDetectedType] = useState(aiResult?.documentType ?? (typeOptions[0] ?? ''))
  const [status, setStatus] = useState('Needs Review')
  const [notes, setNotes] = useState('')
  const [docUrl, setDocUrl] = useState(null)
  const [isPdf, setIsPdf] = useState(false)
  const [fields, setFields] = useState(() => {
    const raw = aiResult?.extractedFields ?? {}
    const result = {}
    for (const [k, v] of Object.entries(raw)) {
      result[k] = typeof v === 'object' && v !== null ? (v.value ?? '') : v
    }
    return result
  })

  const confidence = aiResult?.confidenceScore ?? null
  const filename = doc.name ?? doc.key?.split('/').pop() ?? 'Document'

  useEffect(() => {
    if (!doc.key) return
    let objectUrl
    async function fetchDoc() {
      try {
        const obj = await s3Client.send(new GetObjectCommand({
          Bucket: awsConfig.s3BucketName,
          Key: doc.key,
        }))
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

  function changeZoom(delta) {
    setZoom(z => Math.min(Math.max(0.5, z + delta), 2.0))
  }

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex h-[700px]">

      {/* Left: Viewer */}
      <div className="w-1/2 bg-surface-container-low relative document-overlay overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant bg-white flex justify-between items-center shrink-0">
          <span className="text-label-md font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            VIEWER: {filename}
          </span>
          <div className="flex items-center gap-1 bg-primary text-on-primary rounded-lg p-1">
            {!isPdf && <>
              <button className="p-1 hover:bg-white/10 rounded" onClick={() => changeZoom(-0.1)} type="button">
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>
              <span className="px-2 text-[10px] font-bold">{Math.round(zoom * 100)}%</span>
              <button className="p-1 hover:bg-white/10 rounded" onClick={() => changeZoom(0.1)} type="button">
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
              <img
                src={docUrl}
                alt={filename}
                className="max-w-full h-auto transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Details */}
      <div className="flex-1 flex flex-col border-l border-outline-variant overflow-hidden">

        {/* Detected As & Status */}
        <div className="p-6 border-b border-outline-variant space-y-6 shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1 pr-4">
              <label className="text-label-md font-bold text-on-surface-variant">DETECTED AS</label>
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 bg-white border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-2 focus:ring-secondary"
                  value={detectedType}
                  onChange={(e) => setDetectedType(e.target.value)}
                >
                  {typeOptions.map(opt => <option key={opt}>{opt}</option>)}
                  {detectedType && !typeOptions.includes(detectedType) && <option>{detectedType}</option>}
                </select>
                {confidence !== null && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold rounded border border-green-200 whitespace-nowrap">
                    {confidence}% CONFIDENCE
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2 w-48">
              <label className="text-label-md font-bold text-on-surface-variant">STATUS</label>
              <select
                className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-body-md font-bold focus:ring-2 focus:ring-secondary"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Approved</option>
                <option>Rejected</option>
                <option>Needs Review</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-label-md font-bold text-on-surface-variant">REASON / NOTES</label>
            <textarea
              className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2 text-body-md focus:ring-2 focus:ring-secondary h-16 resize-none"
              placeholder="Add a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Extracted Fields */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          {Object.keys(fields).length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-label-md font-bold text-on-surface">EXTRACTED FIELDS</h4>
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-high border-y border-outline-variant">
                  <tr>
                    <th className="py-2 px-4 text-[10px] font-bold text-on-surface-variant uppercase">Field Name</th>
                    <th className="py-2 px-4 text-[10px] font-bold text-on-surface-variant uppercase">Extracted Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {Object.entries(fields).map(([key, value]) => (
                    <tr key={key}>
                      <td className="py-3 px-4 text-label-md text-on-surface-variant w-1/3">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          className="w-full border border-outline-variant rounded px-2 py-1.5 text-body-sm focus:ring-1 focus:ring-secondary"
                          type="text"
                          value={value ?? ''}
                          onChange={(e) => setFields(f => ({ ...f, [key]: e.target.value }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-body-sm text-on-surface-variant text-center py-8">No extracted fields available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-high border-t border-outline-variant flex gap-3 shrink-0">
          <button className="flex-1 px-4 py-2 border border-outline-variant bg-white rounded-lg text-label-md font-bold hover:bg-surface-container transition-colors" type="button">Flag For QC</button>
          <button className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:shadow-lg transition-all" type="button">Save Changes</button>
        </div>
      </div>
    </div>
  )
}

function MissingDocCard({ label }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-outline-variant p-12 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-outline">upload_file</span>
      </div>
      <div>
        <h4 className="text-headline-sm text-on-surface">{label} Missing</h4>
        <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">This document has not been uploaded yet. You can upload it manually or request it from the client.</p>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 border border-outline rounded-lg text-label-md font-bold hover:bg-surface-container transition-colors" type="button">Request Document</button>
        <button className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-label-md font-bold hover:shadow-lg transition-all" type="button">Upload File</button>
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
