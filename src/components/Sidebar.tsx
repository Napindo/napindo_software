import { useMemo, useState } from 'react'
import type { PageKey } from '../types/navigation'
import { useAppStore } from '../store/appStore'

type IconName =
  | 'grid'
  | 'pencil'
  | 'tag'
  | 'building'
  | 'shield'
  | 'chart'
  | 'userPlus'
  | 'lock'
  | 'search'
  | 'chevron'
  | 'logout'
  

type NavLeaf = { label: string; icon: IconName; page: PageKey }
type NavParent = {
  label: string
  icon: IconName
  items: NavLeaf[]
  muted?: boolean
}
type NavItem = NavLeaf | NavParent

export type SidebarProps = {
  onLogout?: () => void
}

const NavIcon = ({ name }: { name: IconName }) => {
  const base = 'w-4 h-4 text-slate-500'
  switch (name) {
    case 'grid':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 4h7v7H4zM13 4h7v10h-7zM4 13h7v7H4zM13 17h7v3h-7z" />
        </svg>
      )
    case 'pencil':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="m5 16.5 2.5 2.5L19.5 7l-2.5-2.5Z" />
          <path d="M4 20h4" />
        </svg>
      )
    case 'tag':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 12V5h7l9 9-7 7-9-9Z" />
          <circle cx="9" cy="9" r="1.3" />
        </svg>
      )
    case 'building':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M6 20V7.5L12 4l6 3.5V20" />
          <path d="M4 20h16M9.5 10h1m3 0h1M9.5 13h1m3 0h1M12 20v-5" />
        </svg>
      )
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3 5 6v6c0 3.9 2.5 7.4 7 9 4.5-1.6 7-5.1 7-9V6Z" />
          <path d="M9.5 12.5 11 14l3.5-3.5" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 5v14h14" />
          <path d="M9 14v-5M13 16V9m4 7v-3" />
        </svg>
      )
    case 'userPlus':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="8" r="3" />
          <path d="M5 20c0-3 2.5-5 6-5 3.4 0 6 2 6 5" />
          <path d="M18 8v4m2-2h-4" />
        </svg>
      )
    case 'lock':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M9 11V8a3 3 0 0 1 6 0v3" />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 3 3" />
        </svg>
      )
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" className={`${base} transition-transform`} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6" />
          <path d="m17 16 4-4-4-4" />
          <path d="M9 12h12" />
        </svg>
      )
    default:
      return null
  }
}

const NapindoMark = ({ className }: { className?: string }) => (
  <svg className={`napindo-icon ${className ?? ''}`} viewBox="0 0 160 150" role="presentation" aria-hidden="true">
    <defs>
      <linearGradient id="napindoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e63946" />
        <stop offset="100%" stopColor="#9f0f0f" />
      </linearGradient>
    </defs>
    <path
      d="M10 20c0-6.6 5.4-12 12-12h16c4.4 0 8.3 2.4 10.4 6.3L80 90 51 142.5c-2.2 3.8-6.1 6.1-10.5 6.1H22c-6.6 0-12-5.4-12-12V20Z"
      fill="url(#napindoGradient)"
    />
    <path
      d="M60 20c0-6.6 5.4-12 12-12h16c4.4 0 8.3 2.4 10.4 6.3L130 90l-29 52.5c-2.2 3.8-6.1 6.1-10.5 6.1H72c-6.6 0-12-5.4-12-12V20Z"
      fill="url(#napindoGradient)"
    />
    <path
      d="M110 20c0-6.6 5.4-12 12-12h16c6.6 0 12 5.4 12 12v116.5c0 10.8-12.9 15.8-20.2 8.1l-19.3-19.6c-2.4-2.5-3.8-5.9-3.8-9.4V20Z"
      fill="url(#napindoGradient)"
    />
  </svg>
)

const navStructure: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: 'Dashboard', icon: 'grid', page: 'dashboard' },
      {
        label: 'Input Data',
        icon: 'pencil',
        items: [
          { label: 'Add Data', icon: 'userPlus', page: 'addData' },
          { label: 'Import Data', icon: 'tag', page: 'importData' },
        ],
      },
      {
        label: 'Search',
        icon: 'search',
        items: [
          { label: 'Exhibitor', icon: 'tag', page: 'exhibitor' },
          { label: 'Visitor', icon: 'chart', page: 'visitor' },
        ],
      },
      {
        label: 'Print Label',
        icon: 'tag',
        items: [
          { label: 'Perusahaan', icon: 'building', page: 'printPerusahaan' },
          { label: 'Government', icon: 'shield', page: 'printGovernment' },
        ],
      },
    ],
  },
  {
    items: [
      {
        label: 'Report',
        icon: 'chart',
        items: [
          { label: 'Perusahaan', icon: 'building', page: 'reportPerusahaan' },
          { label: 'Government', icon: 'shield', page: 'reportGovernment' },
          { label: 'Jumlah Perusahaan', icon: 'chart', page: 'reportJumlahPerusahaan' },
          { label: 'Jumlah Government', icon: 'chart', page: 'reportJumlahGovernment' },
        ],
      },
    ],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      { label: 'Log', icon: 'chart', page: 'auditLog' },
      { label: 'Add User', icon: 'userPlus', page: 'addUser' },
      { label: 'Change Password', icon: 'lock', page: 'changePassword' },
    ],
  },
]

export const Sidebar = ({ onLogout }: SidebarProps) => {
  const { activePage, setActivePage } = useAppStore()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Input Data': true,
    'Print Label': true,
    Report: true,
  })

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const resolvedActiveParent = useMemo(
    () =>
      navStructure
        .flatMap((group) => group.items)
        .find((item): item is NavParent => 'items' in item && item.items.some((child) => child.page === activePage)),
    [activePage],
  )

  return (
    <aside className="relative z-10 w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-lg">
      <div className="px-6 pt-6 pb-5 flex items-center gap-3">
        <NapindoMark className="w-10 h-10 shrink-0" />
        <div className="leading-tight">
          <span className="block text-xs font-semibold text-rose-600">Showing The Way !</span>
          <span className="block text-lg font-bold tracking-tight text-slate-900">Napindo</span>
        </div>
      </div>

      <nav className="mt-4 h-[calc(100vh-170px)] overflow-y-auto px-3 pb-4">
        {navStructure.map((group, index) => (
          <div key={index} className="mb-4">
            {group.title ? (
              <p className="px-3 text-[11px] font-bold text-slate-500 tracking-wide uppercase mb-2">{group.title}</p>
            ) : null}
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const isParent = 'items' in item
                if (isParent) {
                  const parent = item as NavParent
                  const isOpen = openGroups[parent.label]
                  const activeChild = parent.items.some((child) => child.page === activePage)
                  return (
                    <div key={parent.label} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(parent.label)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition relative overflow-hidden ${
                          activeChild
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md active-nav'
                            : 'text-slate-700 hover:bg-rose-50/80'
                        } ${parent.muted ? 'font-semibold text-slate-500' : 'font-semibold'}`}
                      >
                        <span className="inline-flex items-center justify-center rounded-lg bg-white/70 text-rose-600 p-1.5 shadow-inner">
                          <NavIcon name={parent.icon} />
                        </span>
                        <span className="flex-1 text-left">{parent.label}</span>
                        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          <NavIcon name="chevron" />
                        </span>
                      </button>
                      <div
                        className={`pl-4 border-l border-slate-200 ml-3 space-y-1.5 overflow-hidden transition-all duration-200 ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        {parent.items.map((child) => (
                          <button
                            key={child.label}
                            type="button"
                            onClick={() => setActivePage(child.page)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
                              child.page === activePage
                                ? 'bg-rose-500 text-white shadow-md ring-1 ring-rose-200'
                                : 'text-slate-700 hover:bg-rose-50'
                            }`}
                          >
                            <span className="inline-flex items-center justify-center rounded-md bg-white text-rose-600 p-1 shadow-inner">
                              <NavIcon name={child.icon} />
                            </span>
                            <span className="flex-1 text-left">{child.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }

                const leaf = item as NavLeaf
                return (
                  <button
                    key={leaf.label}
                    onClick={() => setActivePage(leaf.page)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition relative overflow-hidden ${
                      leaf.page === activePage
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md active-nav'
                        : 'text-slate-700 hover:bg-rose-50/80'
                    } font-semibold`}
                    type="button"
                  >
                    <span className="inline-flex items-center justify-center rounded-lg bg-white/70 text-rose-600 p-1.5 shadow-inner">
                      <NavIcon name={leaf.icon} />
                    </span>
                    <span className="flex-1 text-left">{leaf.label}</span>
                    {leaf.page === activePage ? <span className="w-1 h-8 rounded-full bg-white/80" aria-hidden /> : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 pb-6">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition shadow-sm"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-rose-600 shadow-inner">
            <NavIcon name="logout" />
          </span>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
