import { useSyncExternalStore } from 'react'

export type AppUser = { username: string; name?: string; division?: string | null }

export type GlobalMessage = { type: 'success' | 'error' | 'info'; text: string }

type AppState = {
  user: AppUser | null
  activePage: string | null
  globalMessage: GlobalMessage | null
  addDataDraft: {
    row: Record<string, unknown> | null
    id: string | number | null
    returnPage: 'exhibitor' | 'visitor'
  } | null
}

type AppActions = {
  setUser: (user: AppUser | null) => void
  clearUser: () => void
  setActivePage: (page: string | null) => void
  setGlobalMessage: (message: GlobalMessage | null) => void
  clearGlobalMessage: () => void
  setAddDataDraft: (draft: AppState['addDataDraft']) => void
  clearAddDataDraft: () => void
}

type Listener = () => void

let state: AppState = {
  user: null,
  activePage: 'dashboard',
  globalMessage: null,
  addDataDraft: null,
}

const listeners = new Set<Listener>()

const actions: AppActions = {
  setUser: (user) => setState({ user }),
  clearUser: () => setState({ user: null }),
  setActivePage: (page) => setState({ activePage: page }),
  setGlobalMessage: (message) => setState({ globalMessage: message }),
  clearGlobalMessage: () => setState({ globalMessage: null }),
  setAddDataDraft: (draft) => setState({ addDataDraft: draft }),
  clearAddDataDraft: () => setState({ addDataDraft: null }),
}

let snapshot: AppState & AppActions = { ...state, ...actions }

function setState(partial: Partial<AppState>) {
  state = { ...state, ...partial }
  snapshot = { ...state, ...actions }
  listeners.forEach((listener) => listener())
}

export function useAppStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => snapshot,
    () => snapshot,
  )
}

export const appStore = { getState: () => ({ ...state }), ...actions }
