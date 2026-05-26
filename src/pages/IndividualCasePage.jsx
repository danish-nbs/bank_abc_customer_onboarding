import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'

function Field({ label, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-stack-sm ${className}`}>
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
  firstName: '', middleName: '', lastName: '',
  gender: '', dateOfBirth: '', maritalStatus: '',
  nationality: '', countryOfResidence: '', nationalIdNumber: '',
  mobileNumber: '', alternateMobileNumber: '', emailAddress: '',
  employmentStatus: '', employerName: '', jobTitle: '', monthlySalary: '',
  addressLine1: '', addressLine2: '', city: '', stateProvince: '', postalCode: '', country: '',
}

function validate(values) {
  const e = {}
  if (!values.firstName.trim())         e.firstName = REQUIRED
  if (!values.lastName.trim())          e.lastName = REQUIRED
  if (!values.gender)                   e.gender = REQUIRED
  if (!values.dateOfBirth)              e.dateOfBirth = REQUIRED
  if (!values.maritalStatus)            e.maritalStatus = REQUIRED
  if (!values.nationality)              e.nationality = REQUIRED
  if (!values.countryOfResidence)       e.countryOfResidence = REQUIRED
  if (!values.nationalIdNumber.trim())  e.nationalIdNumber = REQUIRED
  if (!values.mobileNumber.trim())      e.mobileNumber = REQUIRED
  if (!values.emailAddress.trim())      e.emailAddress = REQUIRED
  if (!values.addressLine1.trim())      e.addressLine1 = REQUIRED
  if (!values.city.trim())              e.city = REQUIRED
  if (!values.postalCode.trim())        e.postalCode = REQUIRED
  if (!values.country)                  e.country = REQUIRED
  if (!values.employmentStatus)         e.employmentStatus = REQUIRED
  if (!values.employerName.trim())      e.employerName = REQUIRED
  if (!values.jobTitle.trim())          e.jobTitle = REQUIRED
  if (!values.monthlySalary.trim())     e.monthlySalary = REQUIRED
  return e
}

export default function IndividualCasePage() {
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

  async function handleSubmit() {
    const e = validate(values)
    if (Object.keys(e).length > 0) {
      setErrors(e)
      // Scroll to first error
      setTimeout(() => {
        document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    try {
      await dynamoClient.send(new UpdateCommand({
        TableName: awsConfig.dynamoTableName,
        Key: { appId },
        UpdateExpression: 'SET formData = :fd, #st = :st, updatedAt = :ts',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':fd': values,
          ':st': 'form_complete',
          ':ts': new Date().toISOString(),
        },
      }))
    } catch (err) {
      console.error('Failed to save form data:', err)
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
                <span className="text-label-md font-label-md">Back to Case List</span>
              </Link>
              <div className="flex items-center gap-stack-md mt-2">
                <h2 className="text-display-lg font-display-lg text-primary">Personal Information</h2>
                {appId && (
                  <div className="px-3 py-1 bg-surface-container-high rounded text-mono-md font-mono-md text-on-surface-variant border border-outline-variant self-end mb-1">
                    <span className="opacity-50 mr-1">ID:</span>{appId}
                  </div>
                )}
              </div>
              <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
                Step 2 of 4: Provide legal personal details and contact information for the customer onboarding record.
              </p>
            </div>

            <form className="space-y-stack-lg" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
              {/* Personal Details */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-secondary">person</span>
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                  <Field label="First Name *" error={errors.firstName}>
                    <input data-error={!!errors.firstName} className={inputClass(errors.firstName)} placeholder="John" type="text" value={values.firstName} onChange={set('firstName')} />
                  </Field>
                  <Field label="Middle Name">
                    <input className={inputClass()} placeholder="Quincy" type="text" value={values.middleName} onChange={set('middleName')} />
                  </Field>
                  <Field label="Last Name *" error={errors.lastName}>
                    <input data-error={!!errors.lastName} className={inputClass(errors.lastName)} placeholder="Doe" type="text" value={values.lastName} onChange={set('lastName')} />
                  </Field>
                  <Field label="Gender *" error={errors.gender}>
                    <select data-error={!!errors.gender} className={inputClass(errors.gender)} value={values.gender} onChange={set('gender')}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </Field>
                  <Field label="Date of Birth *" error={errors.dateOfBirth}>
                    <input data-error={!!errors.dateOfBirth} className={inputClass(errors.dateOfBirth)} type="date" value={values.dateOfBirth} onChange={set('dateOfBirth')} />
                  </Field>
                  <Field label="Marital Status *" error={errors.maritalStatus}>
                    <select data-error={!!errors.maritalStatus} className={inputClass(errors.maritalStatus)} value={values.maritalStatus} onChange={set('maritalStatus')}>
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </Field>
                  <Field label="Nationality *" error={errors.nationality}>
                    <select data-error={!!errors.nationality} className={inputClass(errors.nationality)} value={values.nationality} onChange={set('nationality')}>
                      <option value="">Select Nationality</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
                  </Field>
                  <Field label="Country of Residence *" error={errors.countryOfResidence}>
                    <select data-error={!!errors.countryOfResidence} className={inputClass(errors.countryOfResidence)} value={values.countryOfResidence} onChange={set('countryOfResidence')}>
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
                  </Field>
                  <Field label="National ID Number *" error={errors.nationalIdNumber}>
                    <input data-error={!!errors.nationalIdNumber} className={inputClass(errors.nationalIdNumber)} placeholder="SSN or National ID" type="text" value={values.nationalIdNumber} onChange={set('nationalIdNumber')} />
                  </Field>
                </div>
              </section>

              {/* Contact Information */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-secondary">contact_mail</span>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                  <Field label="Mobile Number *" error={errors.mobileNumber}>
                    <input data-error={!!errors.mobileNumber} className={inputClass(errors.mobileNumber)} placeholder="+1 (555) 000-0000" type="tel" value={values.mobileNumber} onChange={set('mobileNumber')} />
                  </Field>
                  <Field label="Alternate Mobile Number">
                    <input className={inputClass()} placeholder="+1 (555) 000-0000" type="tel" value={values.alternateMobileNumber} onChange={set('alternateMobileNumber')} />
                  </Field>
                  <Field label="Email Address *" error={errors.emailAddress}>
                    <input data-error={!!errors.emailAddress} className={inputClass(errors.emailAddress)} placeholder="jane.doe@example.com" type="email" value={values.emailAddress} onChange={set('emailAddress')} />
                  </Field>
                </div>
              </section>

              {/* Employment Information */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-secondary">work</span>
                  Employment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                  <Field label="Employment Status *" error={errors.employmentStatus}>
                    <select data-error={!!errors.employmentStatus} className={inputClass(errors.employmentStatus)} value={values.employmentStatus} onChange={set('employmentStatus')}>
                      <option value="">Select Status</option>
                      <option value="salaried">Salaried</option>
                      <option value="self_employed">Self-employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="business_owner">Business owner</option>
                      <option value="retired">Retired</option>
                    </select>
                  </Field>
                  <Field label="Employer Name *" error={errors.employerName}>
                    <input data-error={!!errors.employerName} className={inputClass(errors.employerName)} placeholder="Company Name" type="text" value={values.employerName} onChange={set('employerName')} />
                  </Field>
                  <Field label="Job Title *" error={errors.jobTitle}>
                    <input data-error={!!errors.jobTitle} className={inputClass(errors.jobTitle)} placeholder="e.g. Software Engineer" type="text" value={values.jobTitle} onChange={set('jobTitle')} />
                  </Field>
                  <Field label="Monthly Salary *" error={errors.monthlySalary}>
                    <input data-error={!!errors.monthlySalary} className={inputClass(errors.monthlySalary)} placeholder="Enter amount" type="text" value={values.monthlySalary} onChange={set('monthlySalary')} />
                  </Field>
                </div>
              </section>

              {/* Address Information */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-secondary">location_on</span>
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                  <Field label="Address Line 1 *" error={errors.addressLine1} className="md:col-span-2">
                    <input data-error={!!errors.addressLine1} className={inputClass(errors.addressLine1)} placeholder="Street address, P.O. box" type="text" value={values.addressLine1} onChange={set('addressLine1')} />
                  </Field>
                  <Field label="Address Line 2">
                    <input className={inputClass()} placeholder="Apartment, suite, unit, building, floor" type="text" value={values.addressLine2} onChange={set('addressLine2')} />
                  </Field>
                  <Field label="City *" error={errors.city}>
                    <input data-error={!!errors.city} className={inputClass(errors.city)} placeholder="City" type="text" value={values.city} onChange={set('city')} />
                  </Field>
                  <Field label="State/Province">
                    <input className={inputClass()} placeholder="State / Province / Region" type="text" value={values.stateProvince} onChange={set('stateProvince')} />
                  </Field>
                  <Field label="Postal Code *" error={errors.postalCode}>
                    <input data-error={!!errors.postalCode} className={inputClass(errors.postalCode)} placeholder="ZIP / Postal Code" type="text" value={values.postalCode} onChange={set('postalCode')} />
                  </Field>
                  <Field label="Country *" error={errors.country}>
                    <select data-error={!!errors.country} className={inputClass(errors.country)} value={values.country} onChange={set('country')}>
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
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
