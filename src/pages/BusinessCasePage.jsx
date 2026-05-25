import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

function Field({ label, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-stack-sm ${className}`} data-error={error ? 'true' : undefined}>
      <label className="text-label-md font-label-md text-on-surface">{label}</label>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-body-sm font-body-sm text-error">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </span>
      )}
    </div>
  )
}

const inputCls =
  'h-11 px-3 border rounded bg-surface-bright text-on-surface font-body-md focus:ring-1 outline-none transition-colors'

function inputClass(error) {
  return error
    ? `${inputCls} border-error focus:border-error focus:ring-error`
    : `${inputCls} border-outline-variant focus:border-secondary focus:ring-secondary`
}

const REQUIRED = 'This field is required.'

const INITIAL = {
  legalEntityName: '',
  tradeName: '',
  companyRegistrationNumber: '',
  taxId: '',
  dateOfIncorporation: '',
  businessType: '',
  industryType: '',
  annualRevenue: '',
  numberOfEmployees: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: '',
  signatoryName: '',
  designation: '',
  signatoryNationality: '',
  idPassportNumber: '',
}

function validate(values) {
  const e = {}
  if (!values.legalEntityName.trim())              e.legalEntityName = REQUIRED
  if (!values.companyRegistrationNumber.trim())    e.companyRegistrationNumber = REQUIRED
  if (!values.dateOfIncorporation)                 e.dateOfIncorporation = REQUIRED
  if (!values.businessType)                        e.businessType = REQUIRED
  if (!values.industryType)                        e.industryType = REQUIRED
  if (!values.addressLine1.trim())                 e.addressLine1 = REQUIRED
  if (!values.city.trim())                         e.city = REQUIRED
  if (!values.country)                             e.country = REQUIRED
  if (!values.signatoryName.trim())                e.signatoryName = REQUIRED
  if (!values.designation.trim())                  e.designation = REQUIRED
  if (!values.signatoryNationality)                e.signatoryNationality = REQUIRED
  if (!values.idPassportNumber.trim())             e.idPassportNumber = REQUIRED
  return e
}

export default function BusinessCasePage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const appId = state?.appId
  const product = state?.product
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})

  function set(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }))
    }
  }

  function handleSubmit() {
    const e = validate(values)
    if (Object.keys(e).length > 0) {
      setErrors(e)
      setTimeout(() => {
        document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    navigate('/cases/upload-documents', { state: { appId, product } })
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
              alt="Jane Cooper"
              className="w-10 h-10 rounded-full object-cover mr-3 border border-outline-variant"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCenD7J3wM1gaVshn31ClBKWMkHv5UKlW7jmVrBL0RqM8K8BXIM4HwSwvLciVPJhFUWfezxIaMSvRa9VDb7J8NWs9bRsaH30c0XG5_omnRShWmjL2ZUdy7TUz_rLMYQbdzV9TMQSMpy9NyP1jV3qCJXvFG-kIR4q7TdxtBk_K5VqisAogcnfQAMPHNFJXGUYKCDG__4xVplPKm0-h1BXBaMAixdICZH4hZ0506oRBJDPJjy9eg2iFfPxhIHGdTr69JR8BEfnSNbjw"
            />
            <div className="overflow-hidden">
              <p className="text-label-md font-bold text-on-surface truncate">Jane Cooper</p>
              <p className="text-body-sm text-on-surface-variant truncate">Senior Risk Analyst</p>
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
              <Link to="/cases/new" className="flex items-center space-x-2 text-secondary hover:underline w-fit">
                <span className="material-symbols-outlined text-body-sm">arrow_back</span>
                <span className="text-label-md font-label-md">Back to Case Selection</span>
              </Link>
              <div className="flex items-center gap-stack-md mt-2">
                <h2 className="text-display-lg font-display-lg text-primary">Business Information</h2>
                {appId && (
                  <div className="px-3 py-1 bg-surface-container-high rounded text-mono-md font-mono-md text-on-surface-variant border border-outline-variant self-end mb-1">
                    <span className="opacity-50 mr-1">ID:</span>{appId}
                  </div>
                )}
              </div>
              <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
                Step 2 of 4: Collect legal entity details and authorized signatory information for corporate onboarding.
              </p>
            </div>

            <form className="space-y-stack-lg" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
              {/* Company Information */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-secondary">corporate_fare</span>
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <Field label="Legal Entity Name" error={errors.legalEntityName}>
                    <input className={inputClass(errors.legalEntityName)} placeholder="e.g. Acme Corp Industries Ltd." type="text" value={values.legalEntityName} onChange={set('legalEntityName')} />
                  </Field>
                  <Field label="Trade Name">
                    <input className={inputClass()} placeholder="e.g. Acme Global" type="text" value={values.tradeName} onChange={set('tradeName')} />
                  </Field>
                  <Field label="Company Registration Number" error={errors.companyRegistrationNumber}>
                    <input className={inputClass(errors.companyRegistrationNumber)} placeholder="REG-12345678" type="text" value={values.companyRegistrationNumber} onChange={set('companyRegistrationNumber')} />
                  </Field>
                  <Field label="Tax ID / VAT Number">
                    <input className={inputClass()} placeholder="VAT-987654321" type="text" value={values.taxId} onChange={set('taxId')} />
                  </Field>
                  <Field label="Date of Incorporation" error={errors.dateOfIncorporation}>
                    <input className={inputClass(errors.dateOfIncorporation)} type="date" value={values.dateOfIncorporation} onChange={set('dateOfIncorporation')} />
                  </Field>
                  <Field label="Business Type" error={errors.businessType}>
                    <select className={inputClass(errors.businessType)} value={values.businessType} onChange={set('businessType')}>
                      <option value="">Select Type</option>
                      <option value="llc">LLC</option>
                      <option value="sole">Sole Proprietorship</option>
                      <option value="partnership">Partnership</option>
                      <option value="corporation">Corporation</option>
                    </select>
                  </Field>
                  <Field label="Industry Type" error={errors.industryType}>
                    <select className={inputClass(errors.industryType)} value={values.industryType} onChange={set('industryType')}>
                      <option value="">Select Industry</option>
                      <option value="fintech">Fintech</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="retail">Retail</option>
                      <option value="healthcare">Healthcare</option>
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-gutter">
                    <Field label="Annual Revenue (USD)">
                      <input className={inputClass()} placeholder="5,000,000" type="text" value={values.annualRevenue} onChange={set('annualRevenue')} />
                    </Field>
                    <Field label="Number of Employees">
                      <input className={inputClass()} placeholder="250" type="number" value={values.numberOfEmployees} onChange={set('numberOfEmployees')} />
                    </Field>
                  </div>
                </div>
              </section>

              {/* Business Address */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-secondary">location_on</span>
                  Business Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <Field label="Address Line 1" error={errors.addressLine1} className="md:col-span-2">
                    <input className={inputClass(errors.addressLine1)} placeholder="Street name and building number" type="text" value={values.addressLine1} onChange={set('addressLine1')} />
                  </Field>
                  <Field label="Address Line 2 (Optional)" className="md:col-span-2">
                    <input className={inputClass()} placeholder="Suite, floor, or additional details" type="text" value={values.addressLine2} onChange={set('addressLine2')} />
                  </Field>
                  <Field label="City" error={errors.city}>
                    <input className={inputClass(errors.city)} placeholder="e.g. New York" type="text" value={values.city} onChange={set('city')} />
                  </Field>
                  <Field label="Country" error={errors.country}>
                    <select className={inputClass(errors.country)} value={values.country} onChange={set('country')}>
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="SG">Singapore</option>
                      <option value="DE">Germany</option>
                    </select>
                  </Field>
                </div>
              </section>

              {/* Authorized Signatory */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="material-symbols-outlined mr-2 text-secondary">badge</span>
                    Authorized Signatory
                  </span>
                  <button
                    type="button"
                    className="text-secondary text-label-md font-label-md flex items-center hover:bg-surface-variant px-2 py-1 rounded transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm mr-1">add</span> Add Another
                  </button>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <Field label="Signatory Name" error={errors.signatoryName}>
                    <input className={inputClass(errors.signatoryName)} placeholder="Full legal name" type="text" value={values.signatoryName} onChange={set('signatoryName')} />
                  </Field>
                  <Field label="Designation" error={errors.designation}>
                    <input className={inputClass(errors.designation)} placeholder="e.g. Managing Director" type="text" value={values.designation} onChange={set('designation')} />
                  </Field>
                  <Field label="Nationality" error={errors.signatoryNationality}>
                    <select className={inputClass(errors.signatoryNationality)} value={values.signatoryNationality} onChange={set('signatoryNationality')}>
                      <option value="">Select Nationality</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                    </select>
                  </Field>
                  <Field label="ID / Passport Number" error={errors.idPassportNumber}>
                    <input className={inputClass(errors.idPassportNumber)} placeholder="Enter ID number" type="text" value={values.idPassportNumber} onChange={set('idPassportNumber')} />
                  </Field>
                </div>
              </section>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-4 pb-12">
                <button
                  className="px-6 py-2.5 text-label-md font-label-md text-on-surface hover:bg-surface-variant rounded border border-outline-variant transition-all active:scale-95"
                  onClick={() => navigate('/cases/new')}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="px-8 py-2.5 bg-primary text-white text-label-md font-label-md rounded hover:bg-primary/90 shadow-md transition-all active:scale-95 flex items-center"
                  type="submit"
                >
                  <span className="material-symbols-outlined mr-2">check_circle</span>
                  Save &amp; Continue
                </button>
              </div>
            </form>
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
