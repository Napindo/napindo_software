import type { AppUser } from '../store/appStore'
import type { PageKey } from '../types/navigation'

type UserRole = 'admin' | 'rnd' | 'limited'

export type UserAccess = {
  role: UserRole
  allowedPages: PageKey[]
  defaultPage: PageKey
  canDelete: boolean
  canImport: boolean
  canViewLog: boolean
  canAddUser: boolean
}

const fullAccessUsers = new Set(['anton', 'sandi', 'zidan', 'fajrin'])

const allPages: PageKey[] = [
  'dashboard',
  'auditLog',
  'addData',
  'exhibitor',
  'visitor',
  'importData',
  'printPerusahaan',
  'printGovernment',
  'reportPerusahaan',
  'reportGovernment',
  'reportJumlahPerusahaan',
  'reportJumlahGovernment',
  'addUser',
  'changePassword',
]

const normalize = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const normalizeDivision = (value?: string | null) =>
  normalize(value).replace(/[^a-z0-9]/g, '')

export const getUserAccess = (user?: AppUser | null): UserAccess => {
  const username = normalize(user?.username)
  const division = normalizeDivision(user?.division)

  if (fullAccessUsers.has(username)) {
    return {
      role: 'admin',
      allowedPages: allPages,
      defaultPage: 'dashboard',
      canDelete: true,
      canImport: true,
      canViewLog: true,
      canAddUser: true,
    }
  }

  if (division === 'rnd') {
    const allowed = allPages.filter((page) => !['importData', 'auditLog', 'addUser'].includes(page))
    return {
      role: 'rnd',
      allowedPages: allowed,
      defaultPage: 'dashboard',
      canDelete: false,
      canImport: false,
      canViewLog: false,
      canAddUser: false,
    }
  }

  return {
    role: 'limited',
    allowedPages: ['addData', 'exhibitor', 'visitor', 'changePassword'],
    defaultPage: 'addData',
    canDelete: false,
    canImport: false,
    canViewLog: false,
    canAddUser: false,
  }
}
