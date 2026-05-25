import { useNavigate } from 'react-router-dom'
import {
  currentUser,
  dashboardStats,
  applicationsPerDayChart,
  approvalFunnel,
  funnelMetrics,
  cases,
  stageStyles,
} from '../data/mockData'

export default function DashboardPage() {
  const navigate = useNavigate()
  const queueRows = cases.slice(0, 4)

  return (
    <div className="dashboard-page bg-background text-on-background font-body-md min-h-screen">
      <style>{`.dashboard-page .material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>

      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col py-stack-lg z-20">
        <div className="px-stack-lg mb-stack-lg flex items-center gap-stack-sm">
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary leading-tight">
            Bank ABC<br />Onboarding Platform
          </h1>
        </div>
        <nav className="flex-1 px-stack-sm flex flex-col gap-unit">
          <a className="bg-secondary-container text-on-secondary-container font-bold px-stack-md py-stack-sm rounded-lg flex items-center gap-stack-sm scale-[0.98] transition-transform duration-150" href="#">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="font-body-md text-body-md">Dashboard</span>
          </a>
          <a className="text-on-surface-variant hover:bg-surface-container-low px-stack-md py-stack-sm rounded-lg flex items-center gap-stack-sm transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">folder_open</span>
            <span className="font-body-md text-body-md text-secondary">Cases</span>
          </a>
          <a className="text-on-surface-variant hover:bg-surface-container-low px-stack-md py-stack-sm rounded-lg flex items-center gap-stack-sm transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
            <span className="font-body-md text-body-md text-secondary">Entities</span>
          </a>
          <a className="text-on-surface-variant hover:bg-surface-container-low px-stack-md py-stack-sm rounded-lg flex items-center gap-stack-sm transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span className="font-body-md text-body-md text-secondary">Documents</span>
          </a>
          <a className="text-on-surface-variant hover:bg-surface-container-low px-stack-md py-stack-sm rounded-lg flex items-center gap-stack-sm transition-colors mt-auto md:mt-0" href="#">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="font-body-md text-body-md text-secondary">Settings</span>
          </a>
        </nav>
        <div className="mt-auto px-stack-sm py-stack-md border-t border-outline-variant">
          <div className="flex items-center gap-stack-sm px-stack-md py-stack-sm hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant flex-shrink-0">
              <img alt={currentUser.name} className="w-full h-full object-cover" src={currentUser.avatar} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-md font-semibold text-on-surface truncate">{currentUser.name}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">{currentUser.role}</span>
            </div>
            <span className="material-symbols-outlined ml-auto text-on-surface-variant text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">more_vert</span>
          </div>
        </div>
      </aside>

      {/* Top Header */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-margin-desktop z-10">
        <div className="flex items-center gap-stack-lg">
          <h2 className="font-headline-md text-headline-md font-extrabold text-primary">Bank ABC Onboarding Platform</h2>
          <div className="relative flex items-center focus-within:ring-1 focus-within:ring-secondary rounded">
            <span className="material-symbols-outlined absolute left-stack-sm text-on-surface-variant text-[18px]">search</span>
            <input
              className="pl-10 pr-stack-sm py-[8px] bg-surface-container-low border-none rounded text-body-sm text-on-surface placeholder:text-on-surface-variant w-64 focus:outline-none focus:ring-0"
              placeholder="Search applications..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-stack-md">
          <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[24px]">help_outline</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-[88px] px-gutter pb-gutter max-w-container-max mx-auto">
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
          {dashboardStats.map((stat) => (
            <div
              key={stat.id}
              className={`${stat.colSpan} ${stat.cardCls} rounded-lg p-stack-md flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(0,33,71,0.05)] transition-shadow`}
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
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-gutter mb-stack-lg">
          {/* Bar Chart */}
          <div className="col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col">
            <div className="flex items-center justify-between mb-stack-lg">
              <div className="flex items-center gap-unit text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">stacked_line_chart</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wider">Applications per Day</h4>
              </div>
              <div className="flex gap-stack-sm">
                <button className="px-2 py-1 bg-surface-container-low rounded font-label-md text-[10px]">7D</button>
                <button className="px-2 py-1 bg-primary text-on-primary rounded font-label-md text-[10px]">{applicationsPerDayChart.period}</button>
              </div>
            </div>
            <div className="flex-1 flex items-end gap-stack-sm h-48 relative border-b border-l border-outline-variant/30 px-2 pb-2">
              {applicationsPerDayChart.bars.map((h, i) => (
                <div
                  key={i}
                  className="w-full bg-secondary/20 hover:bg-secondary transition-colors rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-on-surface-variant font-mono-md">
                <span>{applicationsPerDayChart.dateRange.start}</span>
                <span>{applicationsPerDayChart.dateRange.mid}</span>
                <span>{applicationsPerDayChart.dateRange.end}</span>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-stack-md flex flex-col">
            <div className="flex items-center gap-unit text-on-surface-variant mb-stack-lg">
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
              <h4 className="font-label-md text-label-md uppercase tracking-wider">Approval Funnel</h4>
            </div>
            <div className="flex-1 flex flex-col gap-unit">
              {approvalFunnel.map((item) => (
                <div key={item.stage} style={{ paddingLeft: item.indent, paddingRight: item.indent }}>
                  <div className={`h-10 ${item.bgCls} ${item.textCls} rounded flex items-center justify-between px-stack-md`}>
                    <span className="font-label-md text-[10px]">{item.stage}</span>
                    <span className="font-mono-md font-bold">{item.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-stack-md pt-stack-md border-t border-outline-variant flex justify-around">
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant uppercase">Conversion</p>
                <p className="font-headline-sm text-primary">{funnelMetrics.conversion}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant uppercase">Drop-off</p>
                <p className="font-headline-sm text-error">{funnelMetrics.dropOff}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Queue Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
          <div className="bg-surface-bright px-stack-md py-stack-sm border-b border-outline-variant flex justify-between items-center">
            <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Live Application Queue</h4>
            <div className="flex items-center gap-stack-md">
              <span className="text-body-sm text-on-surface-variant">Showing {queueRows.length} of {cases.length} review tasks</span>
              <button className="font-label-md text-label-md text-secondary hover:underline">View All</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['ID', 'Applicant Name', 'Product', 'Stage', ''].map((h) => (
                    <th
                      key={h}
                      className={`font-label-md text-label-md text-on-surface-variant bg-surface-container-low px-stack-md py-[10px] border-b border-outline-variant${h === '' ? ' text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface">
                {queueRows.map((row, i) => (
                  <tr key={row.id} className={`hover:bg-surface-container-low/50 transition-colors${i < queueRows.length - 1 ? ' border-b border-surface-variant' : ''}`}>
                    <td className="px-stack-md py-[12px] font-mono-md">{row.id}</td>
                    <td className="px-stack-md py-[12px] font-semibold text-primary">{row.applicantName}</td>
                    <td className="px-stack-md py-[12px]">{row.product}</td>
                    <td className="px-stack-md py-[12px]">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full font-label-md text-[10px] ${stageStyles[row.stage]}`}>
                        {row.stage}
                      </span>
                    </td>
                    <td className="px-stack-md py-[12px] text-right">
                      <button className="bg-secondary-container/50 hover:bg-secondary-container px-3 py-1 rounded transition-colors font-label-md text-[10px] text-on-secondary-container">
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
