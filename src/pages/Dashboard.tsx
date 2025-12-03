import { useMemo } from 'react'

import { Sidebar } from '../components/Sidebar'
import type { PageKey } from '../types/navigation'
import type { AuthenticatedUser } from './Login'
import { useAppStore } from '../store/appStore'

import Home from './Home'
import ExhibitorPage from './Exhibitor'
import VisitorPage from './Visitor'
import AddUserPage from './AddUser'
import ChangePasswordPage from './ChangePassword'
import PrintLabelPerusahaan from './PrintLabelPerusahaan'
import PrintLabelGovernment from './PrintLabelGovernment'

type DashboardProps = {
  user?: AuthenticatedUser | null
  onLogout?: () => void
}

const PlaceholderPanel = ({ title }: { title: string }) => (
  <div className="flex flex-col gap-4 items-start">
    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900">{title}</h1>
    <p className="text-slate-600">Halaman ini akan segera tersedia.</p>
  </div>
)

const DashboardPage = ({ user, onLogout }: DashboardProps) => {
  const displayName = useMemo(() => {
    if (!user) return 'User'
    return user.name?.trim() || user.username
  }, [user])

  const { activePage } = useAppStore()

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Home displayName={displayName} />
      case 'exhibitor':
        return <ExhibitorPage />
      case 'visitor':
        return <VisitorPage />
      case 'importData':
        return <PlaceholderPanel title="Import Data" />
      case 'printPerusahaan':
        return <PrintLabelPerusahaan />
      case 'printGovernment':
        return <PrintLabelGovernment />
      case 'reportPerusahaan':
        return <PlaceholderPanel title="Report - Perusahaan" />
      case 'reportGovernment':
        return <PlaceholderPanel title="Report - Government" />
      case 'reportJumlahPerusahaan':
        return <PlaceholderPanel title="Report - Jumlah Perusahaan" />
      case 'reportJumlahGovernment':
        return <PlaceholderPanel title="Report - Jumlah Government" />
      case 'addUser':
        return <AddUserPage currentUser={user} />
      case 'changePassword':
        return <ChangePasswordPage currentUser={user} />
      default:
        return <Home displayName={displayName} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex relative overflow-hidden">
      <div className="gradient-blob gradient-blob--one" />
      <div className="gradient-blob gradient-blob--two" />

      <Sidebar onLogout={onLogout} />

      <main className="flex-1 relative z-10 px-6 lg:px-8 py-6 lg:py-8">
        <div className="bg-white/90 backdrop-blur-xl border border-white shadow-card rounded-3xl p-6 lg:p-10 dashboard-shell min-h-[calc(100vh-140px)]">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
