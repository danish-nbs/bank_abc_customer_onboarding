import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'
import AppLayout from '../components/AppLayout'

const STATUS_CONFIG = {
  draft:        { label: 'Draft',        cls: 'bg-gray-100 text-gray-600' },
  in_review:    { label: 'In Review',    cls: 'bg-blue-100 text-blue-700' },
  approved:     { label: 'Approved',     cls: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',     cls: 'bg-red-100 text-red-700' },
  pending_docs: { label: 'Pending Docs', cls: 'bg-orange-100 text-orange-700' },
  processing:   { label: 'Processing',   cls: 'bg-purple-100 text-purple-700' },
  completed:    { label: 'Completed',    cls: 'bg-green-100 text-green-700' },
}

function str(val) {
  if (!val) return null
  if (typeof val === 'object') return val.value ?? null
  return String(val)
}

function getCustomerName(item) {
  if (item.customerType === 'business') {
    return (
      str(item.profileData?.companyName) ||
      str(item.aiResults?.find(r => r.extractedFields?.companyName)?.extractedFields?.companyName) ||
      null
    )
  }
  return (
    str(item.profileData?.fullName) ||
    str(item.aiResults?.find(r => r.extractedFields?.fullName)?.extractedFields?.fullName) ||
    null
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  )
}

export default function CasesListPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(state?.statusFilter ?? 'all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    async function fetchCases() {
      setLoading(true)
      setError(null)
      try {
        const items = []
        let lastKey
        do {
          const res = await dynamoClient.send(new ScanCommand({
            TableName: awsConfig.dynamoTableName,
            ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
          }))
          items.push(...(res.Items ?? []))
          lastKey = res.LastEvaluatedKey
        } while (lastKey)
        items.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        setCases(items)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCases()
  }, [])

  const filtered = cases.filter(item => {
    if (statusFilter === 'today') {
      const today = new Date().toISOString().slice(0, 10)
      if (!(item.createdAt ?? '').startsWith(today)) return false
    } else if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (typeFilter !== 'all' && item.customerType !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (getCustomerName(item) ?? '').toLowerCase()
      const id = (item.appId ?? '').toLowerCase()
      if (!name.includes(q) && !id.includes(q)) return false
    }
    return true
  })

  return (
    <AppLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Page Header */}
      <div className="mb-stack-lg">
        <h3 className="font-headline-md text-headline-md text-primary">Case Management</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
          Review and process active onboarding requests.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-low p-stack-md rounded-xl border border-outline-variant flex flex-wrap items-center gap-stack-md mb-stack-lg">
        <div className="w-[360px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            className="w-full pl-10 pr-4 h-10 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-secondary outline-none"
            placeholder="Search by customer name or Case ID..."
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-stack-sm ml-auto">
          <select
            className="h-10 pl-stack-md pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-medium focus:ring-2 focus:ring-secondary outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="today">Incoming Today</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending_docs">Pending Docs</option>
            <option value="processing">Processing</option>
          </select>
          <select
            className="h-10 pl-stack-md pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-medium focus:ring-2 focus:ring-secondary outline-none"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">Customer Type</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-on-surface-variant gap-stack-sm">
            <span className="material-symbols-outlined text-[32px]" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
            <span className="font-body-md">Loading cases...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-error gap-stack-sm">
            <span className="material-symbols-outlined">error</span>
            <span className="font-body-md">{error}</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {['Case ID', 'Customer / Business', 'Type', 'Product', 'Variant', 'Status', 'Date Created'].map(h => (
                      <th key={h} className="py-stack-md px-stack-lg font-label-md text-label-md text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-on-surface-variant font-body-md">
                        No cases found.
                      </td>
                    </tr>
                  ) : filtered.map(item => {
                    const name = getCustomerName(item)
                    const statusCfg = STATUS_CONFIG[item.status] ?? { label: item.status ?? '—', cls: 'bg-gray-100 text-gray-600' }
                    const isBusiness = item.customerType === 'business'
                    return (
                      <tr
                        key={item.appId}
                        className="hover:bg-surface-container-low transition-colors cursor-pointer"
                        onClick={() => navigate('/cases/overview', { state: { appId: item.appId } })}
                      >
                        <td className="py-stack-md px-stack-lg">
                          <span className="font-mono-md text-mono-md text-secondary font-bold">{item.appId}</span>
                        </td>
                        <td className="py-stack-md px-stack-lg">
                          <span className="text-on-surface-variant text-body-sm">{name ?? '—'}</span>
                        </td>
                        <td className="py-stack-md px-stack-lg">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight ${isBusiness ? 'bg-surface-container-high text-secondary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                            {item.customerType ?? '—'}
                          </span>
                        </td>
                        <td className="py-stack-md px-stack-lg text-on-surface-variant text-body-sm whitespace-nowrap">{item.product || '—'}</td>
                        <td className="py-stack-md px-stack-lg text-on-surface-variant text-body-sm whitespace-nowrap">{item.productVariant || '—'}</td>
                        <td className="py-stack-md px-stack-lg">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase whitespace-nowrap ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-stack-md px-stack-lg text-body-sm text-on-surface-variant whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-stack-lg py-stack-md flex justify-between items-center border-t border-outline-variant">
              <p className="text-body-sm text-on-surface-variant">
                Showing <span className="font-bold">{filtered.length}</span> of <span className="font-bold">{cases.length}</span> cases
              </p>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
