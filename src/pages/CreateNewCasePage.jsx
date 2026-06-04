import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'
import { currentUser } from '../data/mockData'
import AppLayout from '../components/AppLayout'
import { logActivity } from '../lib/activityLogger'

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
  const [selectedVariant, setSelectedVariant] = useState('')

  function handleCustomerTypeChange(type) {
    setCustomerType(type)
    setSelectedProduct('')
    setSelectedVariant('')
  }
  const [appIdNum] = useState(() => String(Math.floor(Math.random() * 1000000)).padStart(6, '0'))
  const appId = `APP-${customerType === 'individual' ? 'I' : 'B'}-${appIdNum}`
  const [saving, setSaving] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const variants = PRODUCT_VARIANTS[selectedProduct] ?? DEFAULT_VARIANTS

  async function handleCreateCase() {
    setSaving(true)
    try {
      await dynamoClient.send(new PutCommand({
        TableName: awsConfig.dynamoTableName,
        Item: {
          appId,
          customerType,
          product: selectedProduct,
          productVariant: selectedVariant,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }))
      logActivity(appId, {
        type: 'system',
        category: 'Case Initialized',
        actor: 'System',
        description: `KYC case opened for ${customerType} customer applying for ${selectedProduct}.`,
      })
      navigate('/cases/upload-documents', { state: { appId, product: selectedProduct } })
    } catch (err) {
      console.error('Failed to create case:', err)
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-[1000px] mx-auto space-y-stack-lg">
            {/* Page Header */}
            <div className="flex flex-col space-y-1">
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
                          value={selectedVariant}
                          onChange={(e) => setSelectedVariant(e.target.value)}
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
                    className="px-8 py-2.5 bg-primary text-white text-label-md font-label-md rounded hover:bg-primary/90 shadow-md transition-all active:scale-95 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                    type="button"
                    onClick={handleCreateCase}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating Case...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-2">check_circle</span>
                        Create Case
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
      </div>
    </AppLayout>
  )
}
