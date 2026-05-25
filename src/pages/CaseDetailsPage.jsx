import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { currentUser } from '../data/mockData'

const TABS = ['Overview', 'Documents', 'Identity and Fraud Verification', 'AML', 'Risk Assessment', 'Notes', 'Audit Trail']

const DOC_SUBTABS = [
  { label: 'Certificate of Incorporation', icon: 'description' },
  { label: 'Tax ID Document',              icon: 'badge'        },
  { label: 'Articles of Association',      icon: 'history_edu'  },
]

const INITIAL_FIELDS = {
  legalEntityName: 'Starlight Global Holdings LLC',
  registrationNumber: 'DE-9921-X81',
  dateOfIncorporation: '12 Oct 2014',
  registeredAddress: '148 High Street, Suite 500, London, EC1A 4JQ, United Kingdom',
}

export default function CaseDetailsPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const appId = state?.appId ?? 'APP-882194-Z'

  const [activeTab, setActiveTab] = useState(0)
  const [activeDoc, setActiveDoc] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [fields, setFields] = useState(INITIAL_FIELDS)

  function changeZoom(delta) {
    setZoom((z) => Math.min(Math.max(0.5, z + delta), 2.5))
  }

  return (
    <div className="font-body-md text-body-md text-on-surface overflow-hidden h-screen flex">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .main-scroll::-webkit-scrollbar { width: 4px; }
        .main-scroll::-webkit-scrollbar-track { background: transparent; }
        .main-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .doc-panel::-webkit-scrollbar { width: 4px; }
        .doc-panel::-webkit-scrollbar-track { background: transparent; }
        .doc-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
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
        <div className="mt-auto border-t border-outline-variant pt-stack-md px-unit">
          <div className="flex items-center gap-3 px-stack-md py-stack-sm mb-stack-md">
            <img alt={currentUser.name} className="w-10 h-10 rounded-full object-cover border border-outline-variant" src={currentUser.avatar} />
            <div>
              <p className="text-body-sm font-bold text-on-surface">{currentUser.name}</p>
              <p className="text-label-md text-on-surface-variant">{currentUser.role}</p>
            </div>
          </div>
          <a className="flex items-center gap-3 px-stack-md py-stack-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">contact_support</span>
            <span className="text-label-md font-label-md">Support</span>
          </a>
          <a className="flex items-center gap-3 px-stack-md py-stack-sm text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-label-md font-label-md">Log Out</span>
          </a>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top header */}
        <header className="flex justify-between items-center w-full px-margin-desktop py-stack-md bg-surface border-b border-outline-variant shrink-0">
          <span className="text-headline-sm font-headline-sm text-primary">Bank ABC Onboarding Platform</span>
          <div className="flex items-center gap-stack-lg">
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full bg-surface-container rounded-lg border-none pl-10 text-body-sm focus:ring-2 focus:ring-secondary" placeholder="Search across cases..." type="text" />
            </div>
            <div className="flex items-center gap-stack-md">
              <span className="material-symbols-outlined cursor-pointer text-on-surface-variant hover:text-primary transition-colors">notifications</span>
              <span className="material-symbols-outlined cursor-pointer text-on-surface-variant hover:text-primary transition-colors">help</span>
            </div>
          </div>
        </header>

        {/* Page header */}
        <div className="px-margin-desktop pt-stack-lg pb-0 bg-background shrink-0">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-secondary text-label-md font-label-md hover:underline w-fit mb-stack-sm" type="button">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Case Queue
          </button>
          <div className="flex justify-between items-end pb-stack-lg">
            <h2 className="text-headline-md font-headline-sm text-on-surface">Case Details: {appId}</h2>
            <div className="flex gap-stack-sm">
              <button className="px-stack-md h-9 border border-outline text-on-surface-variant rounded-lg text-label-md font-label-md hover:bg-surface-container transition-colors flex items-center gap-2" type="button">
                <span className="material-symbols-outlined text-[18px]">warning</span>Escalate
              </button>
              <button className="px-stack-md h-9 border border-outline text-on-surface text-label-md font-label-md hover:bg-surface-container transition-colors" type="button">Request Documents</button>
              <button className="px-stack-md h-9 border border-error text-error text-label-md font-label-md hover:bg-error-container transition-colors" type="button">Reject</button>
              <button className="px-stack-md h-9 bg-primary-container text-on-primary-container text-label-md font-label-md rounded-lg hover:opacity-90 transition-opacity" type="button">Approve</button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-outline-variant bg-background px-margin-desktop overflow-x-auto scrollbar-hide shrink-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-stack-lg py-stack-md text-label-md font-label-md whitespace-nowrap transition-colors ${
                i === activeTab
                  ? 'text-on-surface border-b-2 border-primary -mb-px'
                  : 'text-on-surface-variant hover:text-on-surface'
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
            <OverviewContent appId={appId} />
            <div className="pb-12" />
          </main>
        )}

        {activeTab === 1 && (
          <section className="flex flex-1 overflow-hidden">
            {/* Left: document viewer */}
            <div className="w-[60%] flex flex-col border-r border-outline-variant bg-surface-container-lowest relative">
              {/* Doc sub-tabs */}
              <div className="flex border-b border-outline-variant bg-surface-container-low px-4 scrollbar-hide overflow-x-auto shrink-0">
                {DOC_SUBTABS.map((d, i) => (
                  <button
                    key={d.label}
                    onClick={() => setActiveDoc(i)}
                    className={`flex items-center gap-2 px-4 py-3 text-label-md whitespace-nowrap transition-colors ${
                      i === activeDoc
                        ? 'border-b-2 border-secondary bg-surface-container-lowest text-secondary font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container-high font-medium'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">{d.icon}</span>
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Viewer */}
              <div className="flex-1 relative document-overlay overflow-auto p-12 flex justify-center items-start doc-panel">
                <div
                  className="relative w-[600px] min-h-[840px] bg-white shadow-xl border border-outline-variant p-16 origin-top transition-transform duration-300"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-secondary opacity-20" />
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-surface-container-high rounded animate-pulse" />
                      <div className="h-3 w-32 bg-surface-container rounded animate-pulse" />
                    </div>
                    <div className="w-16 h-16 border-4 border-outline-variant rounded-full flex items-center justify-center opacity-30">
                      <span className="material-symbols-outlined text-[32px]">shield</span>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="h-8 w-64 bg-surface-container-highest rounded-sm" />
                    <div className="space-y-4">
                      <div className="h-4 w-full bg-surface-container rounded-sm" />
                      <div className="h-4 w-full bg-surface-container rounded-sm" />
                      <div className="h-4 w-3/4 bg-surface-container rounded-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-8 mt-12">
                      <div className="space-y-3">
                        <div className="h-3 w-20 bg-surface-container-high rounded" />
                        <div className="h-6 w-full border border-dashed border-outline-variant rounded" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-3 w-20 bg-surface-container-high rounded" />
                        <div className="h-6 w-full border border-dashed border-outline-variant rounded" />
                      </div>
                    </div>
                    <div className="mt-24 pt-12 border-t border-outline-variant opacity-40">
                      <div className="flex justify-between">
                        <div className="h-10 w-32 bg-surface-container rounded" />
                        <div className="h-10 w-32 bg-surface-container rounded" />
                      </div>
                    </div>
                  </div>
                  {/* OCR highlight */}
                  <div className="absolute top-[184px] left-[60px] w-[264px] h-[36px] bg-secondary/10 border-2 border-secondary rounded ring-4 ring-secondary/5 cursor-pointer group/highlight">
                    <div className="absolute -top-8 left-0 px-2 py-1 bg-secondary text-white text-[10px] font-bold rounded opacity-0 group-hover/highlight:opacity-100 transition-opacity whitespace-nowrap">
                      EXTRACTED: Legal Entity Name
                    </div>
                  </div>
                </div>
              </div>

              {/* Zoom controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-on-primary p-2 rounded-full shadow-2xl z-10">
                <button className="p-2 hover:bg-white/10 rounded-full" onClick={() => changeZoom(-0.1)} type="button">
                  <span className="material-symbols-outlined">zoom_out</span>
                </button>
                <span className="px-3 text-label-md font-bold min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                <button className="p-2 hover:bg-white/10 rounded-full" onClick={() => changeZoom(0.1)} type="button">
                  <span className="material-symbols-outlined">zoom_in</span>
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button className="p-2 hover:bg-white/10 rounded-full" type="button">
                  <span className="material-symbols-outlined">download</span>
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full" type="button">
                  <span className="material-symbols-outlined">print</span>
                </button>
              </div>
            </div>

            {/* Right: Verification panel */}
            <div className="w-[40%] flex flex-col bg-surface overflow-hidden">
              <div className="p-6 border-b border-outline-variant bg-surface-container-high flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-headline-sm font-headline-sm text-primary">Verification Panel</h3>
                  <p className="text-body-sm text-on-surface-variant">Extracted Data &amp; Validation</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span className="text-label-md">AI Pre-verified</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 doc-panel">
                {/* Legal Entity Name */}
                <VerifyField label="LEGAL ENTITY NAME" confidence={98} status="ok">
                  <div className="relative">
                    <input className="w-full bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" value={fields.legalEntityName} onChange={(e) => setFields((f) => ({ ...f, legalEntityName: e.target.value }))} />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors" type="button">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </div>
                </VerifyField>

                {/* Registration Number */}
                <VerifyField label="REGISTRATION NUMBER" confidence={99} status="ok">
                  <input className="w-full bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" value={fields.registrationNumber} onChange={(e) => setFields((f) => ({ ...f, registrationNumber: e.target.value }))} />
                </VerifyField>

                {/* Date of Incorporation */}
                <VerifyField label="DATE OF INCORPORATION" confidence={72} status="warn">
                  <div className="relative">
                    <input className="w-full bg-white border border-amber-300 rounded-lg px-4 py-3 text-body-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all" value={fields.dateOfIncorporation} onChange={(e) => setFields((f) => ({ ...f, dateOfIncorporation: e.target.value }))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 text-xs font-bold">Needs Review</span>
                  </div>
                </VerifyField>

                {/* Registered Address */}
                <VerifyField label="REGISTERED ADDRESS" confidence={95} status="ok">
                  <textarea className="w-full bg-white border border-outline-variant rounded-lg px-4 py-3 text-body-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all resize-none" rows={3} value={fields.registeredAddress} onChange={(e) => setFields((f) => ({ ...f, registeredAddress: e.target.value }))} />
                </VerifyField>

                <div className="h-px bg-outline-variant" />

                {/* Integrity checks */}
                <div className="space-y-4">
                  <h4 className="text-label-md font-bold text-on-surface">DOCUMENT INTEGRITY CHECKS</h4>
                  <IntegrityRow icon="verified_user" label="Digital Signature Valid" status="pass" />
                  <IntegrityRow icon="domain_verification" label="Registry Lookup Match" status="pass" />
                  <IntegrityRow icon="history" label="Expiration Check" status="skip" />
                </div>
              </div>

              <div className="p-6 bg-surface-container-high border-t border-outline-variant flex gap-3 shrink-0">
                <button className="flex-1 px-4 py-3 border border-outline-variant bg-white rounded-lg text-label-md font-bold hover:bg-surface-container transition-colors" type="button">Discard Draft</button>
                <button className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:shadow-lg transition-all" type="button">Submit Verification</button>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

function VerifyField({ label, confidence, status, children }) {
  const isWarn = status === 'warn'
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-label-md font-label-md text-on-surface-variant">{label}</label>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[11px] font-bold border rounded ${isWarn ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {confidence}% CONFIDENCE
          </span>
          {isWarn
            ? <span className="material-symbols-outlined text-amber-500 text-[18px]">warning</span>
            : <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
          }
        </div>
      </div>
      {children}
    </div>
  )
}

function IntegrityRow({ icon, label, status }) {
  const skip = status === 'skip'
  return (
    <div className={`flex items-center justify-between p-3 bg-surface-container rounded-lg border border-outline-variant ${skip ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined ${skip ? 'text-outline' : 'text-green-600'}`}>{icon}</span>
        <span className="text-body-sm font-medium">{label}</span>
      </div>
      {skip
        ? <span className="text-[10px] font-bold text-outline">AUTO-SKIPPED</span>
        : <span className="material-symbols-outlined text-green-600 text-[18px]">done</span>
      }
    </div>
  )
}

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

function OverviewContent({ appId }) {
  return (
    <div className="space-y-stack-lg">
      {/* Summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
        <section className="lg:col-span-2 bg-white rounded-lg border border-outline-variant overflow-hidden">
          <SectionHeader>Case Summary</SectionHeader>
          <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 gap-y-stack-lg gap-x-stack-md">
            <Field label="Application ID"><span className="font-bold">{appId}</span></Field>
            <Field label="Customer Name"><span className="font-bold">John Michael Doe</span></Field>
            <Field label="Product Name">Business Loan</Field>
            <Field label="Status">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container-highest text-on-secondary-container">In Review</span>
            </Field>
            <Field label="Risk Score">
              <span className="font-bold">32 / 100</span>
              <span className="text-green-600 font-normal ml-1 text-sm">(Low)</span>
            </Field>
            <Field label="Assigned Analyst">
              <div className="flex items-center gap-2 mt-1">
                <img alt={currentUser.name} className="w-5 h-5 rounded-full" src={currentUser.avatar} />
                <span>{currentUser.name}</span>
              </div>
            </Field>
          </div>
        </section>
        <section className="bg-white rounded-lg border border-outline-variant overflow-hidden h-fit">
          <SectionHeader>Application Details</SectionHeader>
          <div className="p-stack-lg space-y-stack-lg">
            <Field label="Product Type">Commercial Lending</Field>
            <Field label="Product Variant">SME Growth Loan</Field>
            <Field label="Priority Level">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-container text-error">
                <span className="material-symbols-outlined text-[14px] mr-1">priority_high</span>High
              </span>
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
        <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
          <SectionHeader>Personal Information</SectionHeader>
          <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-lg">
            <Field label="First Name"><span className="font-bold">John</span></Field>
            <Field label="Middle Name">Michael</Field>
            <Field label="Last Name"><span className="font-bold">Doe</span></Field>
            <Field label="Gender">Male</Field>
            <Field label="Date of Birth">15 May 1985</Field>
            <Field label="Marital Status">Married</Field>
            <Field label="Nationality">British</Field>
            <Field label="Country of Residence">United Kingdom</Field>
            <Field label="National ID Number"><span className="text-mono-md font-mono-md">GB-123456789</span></Field>
          </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">
          <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
            <SectionHeader>Contact Information</SectionHeader>
            <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
              <Field label="Mobile Number">+44 7700 900000</Field>
              <Field label="Email Address">john.doe@acmecorp.com</Field>
            </div>
          </section>
          <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
            <SectionHeader>Employment Information</SectionHeader>
            <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
              <Field label="Employer Name"><span className="font-bold">Acme Corp Ltd.</span></Field>
              <Field label="Job Title">Managing Director</Field>
              <Field label="Employment Status">Full-time</Field>
            </div>
          </section>
        </div>
        <section className="bg-white rounded-lg border border-outline-variant overflow-hidden">
          <SectionHeader>Address Information</SectionHeader>
          <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg">
            <Field label="Address">221B Baker Street</Field>
            <Field label="City">London</Field>
            <Field label="Postal Code">NW1 6XE</Field>
            <Field label="Country">United Kingdom</Field>
          </div>
        </section>
      </div>
    </div>
  )
}
