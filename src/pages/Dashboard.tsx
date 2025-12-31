import { useMemo } from 'react'

import { Sidebar } from '../components/Sidebar'
import type { AuthenticatedUser } from './Login'
import { useAppStore } from '../store/appStore'

import Home from './Home'
import ExhibitorPage from './Exhibitor'
import VisitorPage from './Visitor'
import AddUserPage from './AddUser'
import ChangePasswordPage from './ChangePassword'
import PrintLabelPerusahaan from './PrintLabelPerusahaan'
import PrintLabelGovernment from './PrintLabelGovernment'
import ReportPerusahaan from './ReportPerusahaan'
import ReportGovernment from './ReportGovernment'
import ReportJumlahPerusahaan from './ReportJumlahPerusahaan'
import ReportJumlahGovernment from './ReportJumlahGovernment'
import ImportDataPage from './ImportData'
import AddDataHub from './AddDataHub'

type DashboardProps = {
  user?: AuthenticatedUser | null
  onLogout?: () => void
}

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
      case 'addData':
        return <AddDataHub />
      case 'exhibitor':
        return <ExhibitorPage />
      case 'visitor':
        return <VisitorPage />
      case 'importData':
        return <ImportDataPage />
      case 'printPerusahaan':
        return <PrintLabelPerusahaan />
      case 'printGovernment':
        return <PrintLabelGovernment />
      case 'reportPerusahaan':
        return <ReportPerusahaan />
      case 'reportGovernment':
        return <ReportGovernment />
      case 'reportJumlahPerusahaan':
        return <ReportJumlahPerusahaan />
      case 'reportJumlahGovernment':
        return <ReportJumlahGovernment />
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
