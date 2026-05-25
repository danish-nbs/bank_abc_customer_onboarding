import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function ChevronDown() {
  return (
    <svg
      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const PRODUCTS_BY_TYPE = {
  individual: ['Credit Card', 'Personal Loan'],
  business: ['SME Account', 'Corporate Account'],
}

const PRODUCT_VARIANTS = {
  'Credit Card': ['Standard Tier', 'Premier Global', 'Elite Cashback', 'Corporate Rewards'],
  'Personal Loan': ['Fixed Rate', 'Variable Rate', 'Secured Loan'],
  'SME Account': ['Basic SME', 'SME Plus', 'SME Premium'],
  'Corporate Account': ['Standard Corporate', 'Multi-Currency', 'Treasury Account'],
}

const DEFAULT_VARIANTS = ['Standard Variant', 'Custom Configuration']

export default function CreateNewCasePage() {
  const navigate = useNavigate()
  const [customerType, setCustomerType] = useState('individual')
  const [selectedProduct, setSelectedProduct] = useState('')

  function handleCustomerTypeChange(type) {
    setCustomerType(type)
    setSelectedProduct('')
  }
  const [appId] = useState(() => `APP-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`)

  const variants = PRODUCT_VARIANTS[selectedProduct] ?? DEFAULT_VARIANTS

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
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
          <div>
            <h1 className="text-label-md font-label-md font-bold text-on-surface">Bank ABC</h1>
            <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant opacity-70 leading-none">
              Onboarding Platform
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all group"
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            <span className="text-label-md font-label-md">Dashboard</span>
          </Link>
          <a className="flex items-center px-3 py-2 bg-secondary-container text-on-secondary-container rounded-lg transition-all group" href="#">
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              folder_shared
            </span>
            <span className="text-label-md font-label-md">Cases</span>
          </a>
          <a className="flex items-center px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all group" href="#">
            <span className="material-symbols-outlined mr-3">corporate_fare</span>
            <span className="text-label-md font-label-md">Entities</span>
          </a>
          <a className="flex items-center px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all group" href="#">
            <span className="material-symbols-outlined mr-3">description</span>
            <span className="text-label-md font-label-md">Documents</span>
          </a>
          <a className="flex items-center px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all group" href="#">
            <span className="material-symbols-outlined mr-3">settings</span>
            <span className="text-label-md font-label-md">Settings</span>
          </a>
        </nav>
        <div className="pt-4 border-t border-outline-variant">
          <div className="flex items-center p-2 rounded-lg hover:bg-surface-variant transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border border-outline-variant shrink-0">
              <img
                alt="Jane Cooper"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCenD7J3wM1gaVshn31ClBKWMkHv5UKlW7jmVrBL0RqM8K8BXIM4HwSwvLciVPJhFUWfezxIaMSvRa9VDb7J8NWs9bRsaH30c0XG5_omnRShWmjL2ZUdy7TUz_rLMYQbdzV9TMQSMpy9NyP1jV3qCJXvFG-kIR4q7TdxtBk_K5VqisAogcnfQAMPHNFJXGUYKCDG__4xVplPKm0-h1BXBaMAixdICZH4hZ0506oRBJDPJjy9eg2iFfPxhIHGdTr69JR8BEfnSNbjw"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-label-md font-label-md text-on-surface truncate">Jane Cooper</p>
              <p className="text-body-sm font-body-sm text-on-surface-variant truncate">Senior Risk Analyst</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
              unfold_more
            </span>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="flex justify-between items-center w-full px-6 h-16 bg-surface border-b border-outline-variant shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-headline-sm font-headline-sm font-bold text-primary">
              Bank ABC Onboarding Platform
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative mr-4 hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-md">
                search
              </span>
              <input
                className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-body-sm focus:ring-2 focus:ring-secondary w-64 transition-all"
                placeholder="Search applications..."
                type="text"
              />
            </div>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all">
              <span className="material-symbols-outlined">history</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border border-surface" />
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-gutter custom-scrollbar">
          <div className="max-w-[1000px] mx-auto space-y-stack-lg">
            {/* Page Header */}
            <div className="flex flex-col space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-secondary hover:underline w-fit"
              >
                <span className="material-symbols-outlined text-body-sm">arrow_back</span>
                <span className="text-label-md font-label-md">Back to Cases</span>
              </Link>
              <h2 className="text-display-lg font-display-lg text-primary mt-2">Create New Case</h2>
              <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
                Initialize a new customer onboarding journey and due diligence process. Ensure all
                required compliance markers are identified for the selected product.
              </p>
            </div>

            {/* Form */}
            <div className="max-w-3xl mx-auto">
              <div className="space-y-stack-lg">
                {/* Customer Intent */}
                <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-headline-sm font-headline-sm text-primary flex items-center">
                      <span className="material-symbols-outlined mr-2 text-secondary">person_add</span>
                      Customer Intent
                    </h3>
                    <div className="px-3 py-1 bg-surface-container-high rounded text-mono-md font-mono-md text-on-surface-variant border border-outline-variant">
                      <span className="opacity-50 mr-1">ID:</span> {appId}
                    </div>
                  </div>

                  {/* Customer Type */}
                  <div className="space-y-stack-md">
                    <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
                      Customer Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                      <label className="relative flex p-4 border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-all has-[:checked]:border-secondary has-[:checked]:bg-secondary-container/10">
                        <input
                          className="mt-1 text-secondary focus:ring-secondary"
                          checked={customerType === 'individual'}
                          onChange={() => handleCustomerTypeChange('individual')}
                          name="customer_type"
                          type="radio"
                          value="individual"
                        />
                        <div className="ml-4">
                          <span className="block text-body-md font-bold text-on-surface">Individual</span>
                          <span className="block text-body-sm text-on-surface-variant mt-1">
                            Personal banking, retail customers, and sole proprietors.
                          </span>
                        </div>
                      </label>
                      <label className="relative flex p-4 border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-all has-[:checked]:border-secondary has-[:checked]:bg-secondary-container/10">
                        <input
                          className="mt-1 text-secondary focus:ring-secondary"
                          checked={customerType === 'business'}
                          onChange={() => handleCustomerTypeChange('business')}
                          name="customer_type"
                          type="radio"
                          value="business"
                        />
                        <div className="ml-4">
                          <span className="block text-body-md font-bold text-on-surface">Business</span>
                          <span className="block text-body-sm text-on-surface-variant mt-1">
                            Corporate entities, SMEs, and institutional partners.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mt-stack-lg">
                    <div className="space-y-stack-sm">
                      <label className="text-label-md font-label-md text-on-surface-variant" htmlFor="product-type">
                        Product Type
                      </label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded p-3 text-body-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none"
                          id="product-type"
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                          <option value="" disabled>Select a product...</option>
                          {PRODUCTS_BY_TYPE[customerType].map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                        <ChevronDown />
                      </div>
                    </div>
                    <div className="space-y-stack-sm">
                      <label className="text-label-md font-label-md text-on-surface-variant" htmlFor="product-variant">
                        Product Variant
                      </label>
                      <div className="relative">
                        <select
                          className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded p-3 text-body-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none"
                          id="product-variant"
                        >
                          <option value="" disabled>Choose variant...</option>
                          {variants.map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                        <ChevronDown />
                      </div>
                      <p className="text-[11px] text-on-primary-container font-medium italic">
                        Variants update based on selected product type
                      </p>
                    </div>
                  </div>
                </section>

                {/* Case Management */}
                <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm">
                  <h3 className="text-headline-sm font-headline-sm text-primary mb-6 flex items-center">
                    <span className="material-symbols-outlined mr-2 text-secondary">flag</span>
                    Case Management
                  </h3>
                  <div className="max-w-xs space-y-stack-sm">
                    <label className="text-label-md font-label-md text-on-surface-variant" htmlFor="priority">
                      Priority Level
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded p-3 text-body-md focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none"
                        id="priority"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="vip">VIP (Fast Track)</option>
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    className="px-6 py-2.5 text-label-md font-label-md text-on-surface hover:bg-surface-variant rounded border border-outline-variant transition-all active:scale-95"
                    onClick={() => navigate('/dashboard')}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-8 py-2.5 bg-primary text-white text-label-md font-label-md rounded hover:bg-primary/90 shadow-md transition-all active:scale-95 flex items-center"
                    type="button"
                    onClick={() => navigate(customerType === 'individual' ? '/cases/individual' : '/cases/business', { state: { appId, product: selectedProduct } })}
                  >
                    <span className="material-symbols-outlined mr-2">check_circle</span>
                    Create Case
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
