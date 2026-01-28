import { lazy, Suspense, useEffect, useMemo } from 'react'

import { Sidebar } from '../components/Sidebar'
import type { AuthenticatedUser } from './Login'
import { useAppStore } from '../store/appStore'
import { getUserAccess } from '../utils/access'
import type { PageKey } from '../types/navigation'

const Home = lazy(() => import('./Home'))
const ExhibitorPage = lazy(() => import('./Exhibitor'))
const VisitorPage = lazy(() => import('./Visitor'))
const AddUserPage = lazy(() => import('./AddUser'))
const ChangePasswordPage = lazy(() => import('./ChangePassword'))
const AuditLogPage = lazy(() => import('./AuditLog'))
const PrintLabelPerusahaan = lazy(() => import('./PrintLabelPerusahaan'))
const PrintLabelGovernment = lazy(() => import('./PrintLabelGovernment'))
const ReportPerusahaan = lazy(() => import('./ReportPerusahaan'))
const ReportGovernment = lazy(() => import('./ReportGovernment'))
const ReportJumlahPerusahaan = lazy(() => import('./ReportJumlahPerusahaan'))
const ReportJumlahGovernment = lazy(() => import('./ReportJumlahGovernment'))
const ImportDataPage = lazy(() => import('./ImportData'))
const AddDataHub = lazy(() => import('./AddDataHub'))

type DashboardProps = {
  user?: AuthenticatedUser | null
  onLogout?: () => void
}

const DashboardPage = ({ user, onLogout }: DashboardProps) => {
  const displayName = useMemo(() => {
    if (!user) return 'User'
    return user.name?.trim() || user.username
  }, [user])

  const { activePage, setActivePage } = useAppStore()
  const access = useMemo(() => getUserAccess(user), [user])

  useEffect(() => {
    const page = activePage as PageKey | null
    if (!page || !access.allowedPages.includes(page)) {
      setActivePage(access.defaultPage)
    }
  }, [activePage, access.allowedPages, access.defaultPage, setActivePage])

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
      case 'auditLog':
        return <AuditLogPage />
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

      <main className="flex-1 min-w-0 relative z-10 px-4 sm:px-6 lg:px-8 2xl:px-10 py-4 sm:py-6 lg:py-8">
        <div className="bg-white/90 backdrop-blur-xl border border-white shadow-card rounded-3xl p-5 sm:p-6 lg:p-10 2xl:p-12 dashboard-shell min-h-[calc(100vh-120px)] w-full max-w-[1600px] mx-auto">
          <Suspense fallback={<div className="text-sm text-slate-500">Memuat halaman...</div>}>
            {renderContent()}
          </Suspense>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
