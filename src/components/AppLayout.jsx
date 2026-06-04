import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { currentUser } from '../data/mockData'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', path: '/dashboard', match: p => p === '/dashboard' },
  { label: 'Cases',     icon: 'folder_open', path: '/cases',   match: p => p === '/cases' },
]

export default function AppLayout({ children, contentClassName }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <div className="app-layout bg-background text-on-background font-body-md min-h-screen">
      <style>{`.app-layout .material-symbols-outlined { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>

      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant flex flex-col py-stack-lg z-20">
        <div className="px-stack-lg mb-stack-lg">
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary leading-tight">
            Bank ABC<br />Onboarding Platform
          </h1>
        </div>
        <nav className="flex-1 px-stack-sm flex flex-col gap-unit">
          {NAV_ITEMS.map(item => {
            const active = item.match(pathname)
            return (
              <button
                key={item.label}
                onClick={() => item.path && navigate(item.path)}
                className={`px-stack-md py-stack-sm rounded-lg flex items-center gap-stack-sm w-full text-left transition-colors ${active ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-body-md text-body-md">{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="mt-auto px-stack-sm py-stack-md border-t border-outline-variant relative">
          {showUserMenu && (
            <div className="absolute bottom-full left-stack-sm right-stack-sm mb-unit bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center gap-stack-sm px-stack-md py-stack-sm text-error hover:bg-error-container/20 transition-colors text-body-md"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Log Out
              </button>
            </div>
          )}
          <div
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-stack-sm px-stack-md py-stack-sm hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant flex-shrink-0">
              <img alt={currentUser.name} className="w-full h-full object-cover" src={currentUser.avatar} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-md font-semibold text-on-surface truncate">{currentUser.name}</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">{currentUser.role}</span>
            </div>
            <span className="material-symbols-outlined ml-auto text-on-surface-variant text-[18px]">expand_less</span>
          </div>
        </div>
      </aside>

      {/* Top Header */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-margin-desktop z-10">
        <h2 className="font-headline-md text-headline-md font-extrabold text-primary">Bank ABC Onboarding Platform</h2>
        <div className="flex items-center gap-stack-md">
          <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[24px]">help_outline</span>
          </button>
        </div>
      </header>

      {/* Page Content */}
      <div className={contentClassName ?? 'ml-64 pt-[88px] px-gutter pb-gutter max-w-container-max mx-auto'}>
        {children}
      </div>
    </div>
  )
}
