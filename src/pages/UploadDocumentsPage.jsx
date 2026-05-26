import { useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { currentUser } from '../data/mockData'

const REQUIRED_DOCS = {
  'Credit Card': [
    { label: 'Passport or National ID', icon: 'badge' },
    { label: 'Utility Bill', icon: 'receipt_long' },
    { label: 'Bank Statement', icon: 'account_balance' },
    { label: 'Selfie', icon: 'face' },
  ],
  'Personal Loan': [
    { label: 'Passport or National ID', icon: 'badge' },
    { label: 'Salary Certificate', icon: 'workspace_premium' },
    { label: 'Bank Statement', icon: 'account_balance' },
    { label: 'Selfie', icon: 'face' },
  ],
  'SME Account': [
    { label: 'Trade License', icon: 'store' },
    { label: 'Certificate of Incorporation', icon: 'description' },
    { label: 'Passport or National ID of Owner', icon: 'badge' },
    { label: 'Selfie of Owner', icon: 'face' },
  ],
  'Corporate Account': [
    { label: 'Trade License', icon: 'store' },
    { label: 'Memorandum of Association (MOA)', icon: 'article' },
    { label: 'Power of Attorney', icon: 'gavel' },
    { label: 'Passport or National ID of Authorized Signatory', icon: 'badge' },
    { label: 'Selfie', icon: 'face' },
  ],
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'description'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'image'
  return 'insert_drive_file'
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

let nextId = 1

export default function UploadDocumentsPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const appId = state?.appId
  const product = state?.product
  const requiredDocs = product ? (REQUIRED_DOCS[product] ?? []) : []
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)
  const rawFilesRef = useRef([])

  function addFiles(fileList) {
    const incoming = Array.from(fileList).map((f) => ({
      id: nextId++,
      name: f.name,
      size: formatSize(f.size),
      icon: fileIcon(f.name),
      raw: f,
    }))
    rawFilesRef.current = [...rawFilesRef.current, ...incoming]
    setFiles((prev) => [...prev, ...incoming.map(({ raw, ...rest }) => rest)])
  }

  function removeFile(id) {
    rawFilesRef.current = rawFilesRef.current.filter((f) => f.id !== id)
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  function handleStartProcessing() {
    navigate('/processing', { state: { appId, product, files: rawFilesRef.current } })
  }

  return (
    <div className="flex overflow-hidden h-screen bg-background">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* Sidebar */}
      <aside className="flex flex-col h-screen p-4 space-y-2 bg-surface-container-low border-r border-outline-variant w-64 shrink-0">
        <div className="flex items-center px-2 py-4 mb-4">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center mr-3">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: '"FILL" 1' }}>
              account_balance
            </span>
          </div>
          <div>
            <h1 className="text-label-md font-bold text-on-surface leading-tight">Bank ABC</h1>
            <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant opacity-70">
              Onboarding Platform
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <Link to="/dashboard" className="flex items-center px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all">
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span className="text-label-md font-label-md">Dashboard</span>
          </Link>
          <a className="flex items-center px-3 py-2 bg-secondary-container text-on-secondary-container rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: '"FILL" 1' }}>folder_shared</span>
            <span className="text-label-md font-label-md">Cases</span>
          </a>
          <a className="flex items-center px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined mr-3">corporate_fare</span>
            <span className="text-label-md font-label-md">Entities</span>
          </a>
          <a className="flex items-center px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined mr-3">description</span>
            <span className="text-label-md font-label-md">Documents</span>
          </a>
          <a className="flex items-center px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined mr-3">settings</span>
            <span className="text-label-md font-label-md">Settings</span>
          </a>
        </nav>
        <div className="pt-4 border-t border-outline-variant">
          <div className="flex items-center p-2 rounded-lg hover:bg-surface-variant transition-colors cursor-pointer">
            <img
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover mr-3 border border-outline-variant"
              src={currentUser.avatar}
            />
            <div className="overflow-hidden">
              <p className="text-label-md font-bold text-on-surface truncate">{currentUser.name}</p>
              <p className="text-body-sm text-on-surface-variant truncate">{currentUser.role}</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-on-surface-variant">unfold_more</span>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="flex justify-between items-center w-full px-6 h-16 bg-surface border-b border-outline-variant shrink-0">
          <span className="text-headline-sm font-headline-sm font-bold text-primary">
            Bank ABC Onboarding Platform
          </span>
          <div className="flex items-center space-x-2">
            <div className="relative mr-4 hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-md">search</span>
              <input
                className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-body-sm focus:ring-2 focus:ring-secondary w-64 transition-all"
                placeholder="Search applications..."
                type="text"
              />
            </div>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all">
              <span className="material-symbols-outlined">language</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-gutter custom-scrollbar">
          <div className="max-w-[1000px] mx-auto space-y-stack-lg">
            {/* Page Header */}
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-secondary hover:underline w-fit"
                type="button"
              >
                <span className="material-symbols-outlined text-body-sm">arrow_back</span>
                <span className="text-label-md font-label-md">Back</span>
              </button>
              <div className="flex items-center gap-stack-md mt-2">
                <h2 className="text-display-lg font-display-lg text-primary">New KYC Case</h2>
                {appId && (
                  <div className="px-3 py-1 bg-surface-container-high rounded text-mono-md font-mono-md text-on-surface-variant border border-outline-variant self-end mb-1">
                    <span className="opacity-50 mr-1">ID:</span>{appId}
                  </div>
                )}
              </div>
              <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
                Step 3 of 4: Upload primary identity and supporting documents to initiate a verification workflow.
              </p>
            </div>

            {/* Upload Card */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
              <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center">
                <span className="material-symbols-outlined mr-2 text-secondary">upload_file</span>
                Document Upload
              </h3>

              {/* Required Documents Checklist */}
              {requiredDocs.length > 0 && (
                <div className="mb-stack-lg p-4 bg-secondary-container/20 border border-secondary/20 rounded-lg">
                  <p className="text-label-md font-label-md text-secondary uppercase tracking-wider mb-stack-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">checklist</span>
                    Required for {product}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-gutter gap-y-stack-sm">
                    {requiredDocs.map((doc) => (
                      <li key={doc.label} className="flex items-center gap-stack-sm text-body-md font-body-md text-on-surface">
                        <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">{doc.icon}</span>
                        {doc.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.heic"
                className="hidden"
                onChange={(e) => { if (e.target.files.length) { addFiles(e.target.files); e.target.value = '' } }}
              />

              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-12 px-6 text-center cursor-pointer mb-stack-lg transition-colors ${isDragging ? 'border-secondary bg-secondary-container/20' : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'}`}
                onClick={() => inputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-stack-sm transition-colors ${isDragging ? 'bg-secondary-container text-secondary' : 'bg-surface-container-highest text-secondary'}`}>
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>cloud_upload</span>
                </div>
                <p className="text-headline-sm font-headline-sm text-on-surface mb-unit">Drag and drop documents here</p>
                <p className="text-body-md font-body-md text-on-surface-variant mb-stack-md">or click to browse from your computer</p>
                <div className="flex gap-stack-sm justify-center mb-stack-sm">
                  <span className="px-stack-sm py-unit bg-tertiary-fixed text-on-tertiary-fixed rounded font-mono-md text-mono-md">PDF</span>
                  <span className="px-stack-sm py-unit bg-tertiary-fixed text-on-tertiary-fixed rounded font-mono-md text-mono-md">JPG</span>
                  <span className="px-stack-sm py-unit bg-tertiary-fixed text-on-tertiary-fixed rounded font-mono-md text-mono-md">PNG</span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant">Maximum file size: 25MB per document.</p>
              </div>

              {/* Selected Documents List */}
              <div className="mb-stack-lg">
                <h4 className="text-label-md font-label-md text-on-surface uppercase tracking-wider mb-stack-sm">
                  Selected Documents ({files.length})
                </h4>
                <ul className="flex flex-col gap-stack-sm">
                  {files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between p-stack-sm border border-outline-variant rounded bg-surface hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center gap-stack-md">
                        <span className="material-symbols-outlined text-secondary">{file.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-body-md font-body-md text-on-surface font-medium">{file.name}</span>
                          <span className="text-body-sm font-body-sm text-on-surface-variant">{file.size}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-unit rounded focus:ring-1 focus:ring-secondary"
                        type="button"
                        aria-label="Remove file"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </li>
                  ))}
                  {files.length === 0 && (
                    <li className="text-body-md font-body-md text-on-surface-variant text-center py-4">
                      No documents selected.
                    </li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-stack-md border-t border-outline-variant">
                <button
                  className="px-6 py-2.5 text-label-md font-label-md text-on-surface hover:bg-surface-variant rounded border border-outline-variant transition-all active:scale-95"
                  onClick={() => navigate(-1)}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="px-8 py-2.5 bg-primary text-on-primary text-label-md font-label-md rounded hover:bg-primary/90 shadow-md transition-all active:scale-95 flex items-center"
                  type="button"
                  onClick={handleStartProcessing}
                >
                  <span className="material-symbols-outlined mr-2">check_circle</span>
                  Start Processing
                </button>
              </div>
            </section>

            <div className="pb-12" />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-low border-t border-outline-variant shrink-0">
          <div className="w-full py-4 px-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-body-sm font-body-sm text-on-surface-variant">
              © 2024 Bank ABC. Secure Onboarding Platform.
            </div>
            <nav className="flex gap-4">
              <a className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary underline" href="#">Privacy Policy</a>
              <a className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary underline" href="#">Terms of Service</a>
              <a className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary underline" href="#">Support</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  )
}
