import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dashboardStats, applicationsPerDayChart, funnelMetrics } from '../data/mockData'
import { dynamoClient } from '../lib/awsClients'
import { awsConfig } from '../aws-config'
import AppLayout from '../components/AppLayout'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [liveStats, setLiveStats] = useState(null)
  const [chartPeriod, setChartPeriod] = useState('30D')

  useEffect(() => {
    async function fetchStats() {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const items = []
        let lastKey
        do {
          const res = await dynamoClient.send(new ScanCommand({
            TableName: awsConfig.dynamoTableName,
            ProjectionExpression: 'appId, #s, createdAt',
            ExpressionAttributeNames: { '#s': 'status' },
            ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
          }))
          items.push(...(res.Items ?? []))
          lastKey = res.LastEvaluatedKey
        } while (lastKey)

        setLiveStats({
          total:         items.length,
          incomingToday: items.filter(i => (i.createdAt ?? '').startsWith(today)).length,
          underReview:   items.filter(i => i.status === 'in_review').length,
          rejected:      items.filter(i => i.status === 'rejected').length,
          approved:      items.filter(i => i.status === 'approved' || i.status === 'completed').length,
          chart7D:  buildChartData(items, 7),
          chart30D: buildChartData(items, 30),
        })
      } catch {
        // fall back to mock values
      }
    }
    fetchStats()
  }, [])

  function buildChartData(items, days) {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date(base)
      d.setDate(d.getDate() - (days - 1 - i))
      return d.toISOString().slice(0, 10)
    })
    const counts = Object.fromEntries(dates.map(d => [d, 0]))
    for (const item of items) {
      const d = (item.createdAt ?? '').slice(0, 10)
      if (d in counts) counts[d]++
    }
    const values = dates.map(d => counts[d])
    const max = Math.max(...values, 1)
    const bars = values.map(v => v === 0 ? 0 : Math.max(4, Math.round((v / max) * 100)))
    const fmt = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    return {
      bars,
      counts: values,
      dateRange: { start: fmt(dates[0]), mid: fmt(dates[Math.floor(days / 2)]), end: fmt(dates[days - 1]) },
    }
  }

  const resolvedStats = dashboardStats.map(stat => {
    if (!liveStats) return stat
    const overrides = {
      total_applications: { value: liveStats.total.toLocaleString(), sub: 'Lifetime submissions' },
      incoming_today:     { value: liveStats.incomingToday.toLocaleString() },
      under_review:       { value: liveStats.underReview.toLocaleString() },
      rejected:           { value: liveStats.rejected.toLocaleString() },
      approved:           { value: liveStats.approved.toLocaleString() },
    }
    return overrides[stat.id] ? { ...stat, ...overrides[stat.id] } : stat
  })

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-stack-lg">
        <div>
          <h3 className="font-headline-md text-headline-md text-primary">Onboarding Overview</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
            End-to-end analyst dashboard for monitoring application lifecycles.
          </p>
        </div>
        <button
          className="bg-primary-container text-white hover:bg-primary transition-colors h-[36px] px-stack-md rounded flex items-center gap-unit shadow-sm"
          onClick={() => navigate('/cases/new')}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ color: '#ffffff' }}>add</span>
          <span className="font-label-md text-label-md" style={{ color: '#ffffff' }}>New Onboarding Case</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-gutter mb-stack-lg">
        {resolvedStats.map(stat => {
          const filterMap = {
            total_applications: 'all',
            incoming_today:     'today',
            under_review:       'in_review',
            rejected:           'rejected',
            approved:           'approved',
          }
          const filter = filterMap[stat.id]
          return (
            <div
              key={stat.id}
              onClick={filter ? () => navigate('/cases', { state: { statusFilter: filter } }) : undefined}
              className={`${stat.colSpan} ${stat.cardCls} rounded-lg p-stack-md flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(0,33,71,0.05)] transition-shadow ${filter ? 'cursor-pointer' : ''}`}
            >
              <div className={`flex items-center gap-unit mb-stack-sm ${stat.iconCls}`}>
                <span className="material-symbols-outlined text-[16px]">{stat.icon}</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wider">{stat.label}</h4>
              </div>
              <div className={`font-display-lg text-display-lg font-mono-md ${stat.valueCls}`}>{stat.value}</div>
              <div className={`font-body-sm text-body-sm mt-unit flex items-center gap-[2px] ${stat.subCls}`}>
                {stat.subIcon && <span className="material-symbols-outlined text-[14px]">{stat.subIcon}</span>}
                {stat.sub}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Bar Chart */}
        <div className="col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col">
          {(() => {
            const chart = chartPeriod === '7D' ? liveStats?.chart7D : liveStats?.chart30D
            const bars = chart?.bars ?? applicationsPerDayChart.bars
            const counts = chart?.counts ?? null
            const dateRange = chart?.dateRange ?? applicationsPerDayChart.dateRange
            return (<>
              <div className="flex items-center justify-between mb-stack-lg">
                <div className="flex items-center gap-unit text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">stacked_line_chart</span>
                  <h4 className="font-label-md text-label-md uppercase tracking-wider">Applications per Day</h4>
                </div>
                <div className="flex gap-stack-sm">
                  {['7D', '30D'].map(p => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className={`px-2 py-1 rounded font-label-md text-[10px] ${chartPeriod === p ? 'bg-primary text-on-primary' : 'bg-surface-container-low'}`}
                    >{p}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex items-end gap-[3px] h-48 relative border-b border-l border-outline-variant/30 px-2 pb-2">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="relative w-full bg-secondary/20 hover:bg-secondary transition-colors rounded-t-sm overflow-hidden"
                    style={{ height: `${h}%` }}
                  >
                    {counts && counts[i] > 0 && (
                      <span className="absolute top-1 w-full text-center block text-[9px] font-bold text-secondary/80">
                        {counts[i]}
                      </span>
                    )}
                  </div>
                ))}
                <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-on-surface-variant font-mono-md">
                  <span>{dateRange.start}</span>
                  <span>{dateRange.mid}</span>
                  <span>{dateRange.end}</span>
                </div>
              </div>
            </>)
          })()}
        </div>

        {/* Conversion & Drop-off */}
        <div className="col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col justify-center gap-stack-lg">
          <div className="flex flex-col items-center justify-center flex-1 gap-stack-md">
            <div className="text-center p-stack-lg rounded-lg bg-surface-container-low w-full">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">Conversion Rate</p>
              <p className="font-display-lg text-display-lg text-primary">{funnelMetrics.conversion}</p>
              <p className="text-body-sm text-on-surface-variant mt-unit">Applications approved</p>
            </div>
            <div className="text-center p-stack-lg rounded-lg bg-surface-container-low w-full">
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-stack-sm">Drop-off Rate</p>
              <p className="font-display-lg text-display-lg text-error">{funnelMetrics.dropOff}</p>
              <p className="text-body-sm text-on-surface-variant mt-unit">Applications lost in process</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
