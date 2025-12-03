import { useEffect, useMemo, useState } from 'react'
import AddDataPage from './AddData'
import type { ExhibitorRow, ExhibitorSegment } from '../services/exhibitors'
import { fetchExhibitors } from '../services/exhibitors'
import { deleteAddData } from '../services/addData'
import { useAppStore } from '../store/appStore'

const eventCards = [
  {
    id: 'defence',
    title: 'Indo Defence, Aerospace, Marine',
    logo: '/assets/LOGO IDD 2026.png',
  },
  {
    id: 'water',
    title: 'Indo Water, Waste, IISMEX, Renergy, Firex, Security',
    logo: '/assets/Logo Water 2026 series.png',
  },
  {
    id: 'livestock',
    title: 'Indo Livestock, Agrotech, Vet, Fisheries, Feed, Dairy, Horticulture',
    logo: '/assets/Logo IDL Lengkap.png',
  },
]

const defenceGroup: ExhibitorSegment[] = ['defence', 'aerospace', 'marine']
const waterGroup: ExhibitorSegment[] = ['water', 'waste', 'iismex', 'renergy', 'security', 'firex']
const livestockGroup: ExhibitorSegment[] = ['livestock', 'agrotech', 'vet', 'fisheries', 'feed', 'dairy', 'horticulture']

const segmentTabs: Record<ExhibitorSegment, ExhibitorSegment[]> = {
  defence: defenceGroup,
  aerospace: defenceGroup,
  marine: defenceGroup,
  water: waterGroup,
  waste: waterGroup,
  iismex: waterGroup,
  renergy: waterGroup,
  security: waterGroup,
  firex: waterGroup,
  livestock: livestockGroup,
  agrotech: livestockGroup,
  vet: livestockGroup,
  fisheries: livestockGroup,
  feed: livestockGroup,
  dairy: livestockGroup,
  horticulture: livestockGroup,
}

const segmentLabels: Record<ExhibitorSegment, string> = {
  defence: 'Defence',
  aerospace: 'Aerospace',
  marine: 'Marine',
  water: 'Water',
  waste: 'Waste',
  iismex: 'IISMEX',
  renergy: 'Renergy',
  security: 'Security',
  firex: 'Firex',
  livestock: 'Livestock',
  agrotech: 'Agrotech',
  vet: 'Vet',
  fisheries: 'Fisheries',
  feed: 'Feed',
  dairy: 'Dairy',
  horticulture: 'Horticulture',
}

const segmentFlagKey: Record<ExhibitorSegment, string> = {
  defence: 'exhdefence',
  aerospace: 'exhaero',
  marine: 'exhmarine',
  water: 'exhwater',
  waste: 'exhwaste',
  iismex: 'exhsmart',
  renergy: 'exhenergy',
  security: 'exhsecure',
  firex: 'exhfire',
  livestock: 'exhlives',
  agrotech: 'exhagritech',
  vet: 'exhindovet',
  fisheries: 'exhfish',
  feed: 'exhfeed',
  dairy: 'exhdairy',
  horticulture: 'exhhorti',
}

const isFlagSet = (raw: Record<string, unknown>, key: string) => {
  const value = raw[key.toLowerCase()]
  if (value === undefined || value === null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === 'x' || normalized === '1' || normalized === 'true' || normalized === 'yes'
}

const rowMatchesSegment = (raw: Record<string, unknown>, segment: ExhibitorSegment) => {
  const lower = Object.keys(raw).reduce<Record<string, unknown>>((acc, key) => {
    acc[key.toLowerCase()] = raw[key]
    return acc
  }, {})

  const flagKey = segmentFlagKey[segment]
  if (!flagKey) return true
  return isFlagSet(lower, flagKey)
}

export const InputDeck = ({ variant, onInput }: { variant: 'exhibitor' | 'visitor'; onInput?: (segment: ExhibitorSegment) => void }) => {
  const heading = variant === 'exhibitor' ? 'EXHIBITOR' : 'VISITOR'
  const segmentByCard: Record<string, ExhibitorSegment> = {
    defence: 'defence',
    water: 'water',
    livestock: 'livestock',
  }

  return (
    <div className="w-full space-y-10 lg:space-y-12 pt-4 pb-8">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-slate-500">Input Data</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900">{heading}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
        {eventCards.map((card) => (
          <article
            key={card.id}
            className="rounded-[28px] overflow-hidden bg-gradient-to-br from-rose-500 via-rose-500 to-slate-700 text-white shadow-[0_16px_36px_rgba(0,0,0,0.16)] ring-1 ring-rose-100/40 flex flex-col min-h-[420px]"
          >
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-200 border border-slate-200/70 rounded-2xl p-4 min-h-[160px] flex items-center justify-center shadow-inner">
                <img src={card.logo} alt={card.title} className="max-h-28 w-full object-contain" />
              </div>
            </div>

            <div className="flex-1 flex flex-col px-8 pb-8">
              <p className="text-center text-lg font-semibold leading-7 mt-9">{card.title}</p>
              <button
                type="button"
                onClick={() => onInput?.(segmentByCard[card.id] ?? 'defence')}
                className="mt-auto mx-auto px-10 py-3 rounded-xl bg-white text-slate-700 font-bold tracking-wide shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                INPUT
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

type ExhibitorTableProps = {
  segment: ExhibitorSegment
  rows: ExhibitorRow[]
  loading?: boolean
  error?: string | null
  onReload: () => void
  onSegmentChange: (next: ExhibitorSegment) => void
  onBack: () => void
  onForm: (row: Record<string, unknown> | null, id: string | number | null) => void
  onConfirmDelete: (ids: (string | number)[]) => void
}

const ExhibitorTable = ({ segment, rows, loading, error, onReload, onSegmentChange, onBack, onForm, onConfirmDelete }: ExhibitorTableProps) => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])
  const [tableError, setTableError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedIds([])
    setPage(1)
  }, [segment, rows.length])

  const filteredRows = useMemo(() => {
    const lower = search.trim().toLowerCase()
    const bySegment = rows.filter((row) => rowMatchesSegment(row.raw, segment))

    if (!lower) return bySegment

    return bySegment.filter((row) =>
      [row.company, row.pic, row.position, row.type, row.email, row.phone, row.city]
        .filter(Boolean)
        .some((value) => typeof value === 'string' && value.toLowerCase().includes(lower)),
    )
  }, [rows, search, segment])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage)
  const allSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedIds.includes(row.id))
  const tabOptions = segmentTabs[segment] ?? [segment]

  const toggleRow = (id: string | number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedRows.some((row) => row.id === id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...paginatedRows.map((row) => row.id)])))
    }
  }

  const handleRowsChange = (value: number) => {
    setRowsPerPage(value)
    setPage(1)
  }

  const handleEdit = () => {
    if (selectedIds.length === 0) {
      setTableError('Pilih satu data untuk diedit.')
      return
    }
    if (selectedIds.length > 1) {
      setTableError('Hanya bisa memilih satu data untuk diedit.')
      return
    }
    const targetId = selectedIds[0]
    const row = rows.find((item) => item.id === targetId)
    if (!row) {
      setTableError('Data tidak ditemukan.')
      return
    }
    setTableError(null)
    onForm(row.raw, row.id)
  }

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      setTableError('Pilih data yang akan dihapus.')
      return
    }
    setTableError(null)
    onConfirmDelete(selectedIds)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Back"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Input Data - Exhibitor</h1>
          </div>
          <div className="flex items-center gap-4 mt-2">
            {tabOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSegmentChange(item)}
                className={`pb-2 px-1 text-base font-semibold border-b-2 transition ${
                  item === segment ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-600 hover:text-rose-600'
                }`}
              >
                {segmentLabels[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {error || tableError ? <span className="text-sm text-rose-600 font-semibold">{error ?? tableError}</span> : null}
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v6h6M20 20v-6h-6" />
              <path d="M20 9A9 9 0 0 0 5 5.3L4 10M4 15a9 9 0 0 0 15 3.7L20 14" />
            </svg>
            Reload
          </button>
          <button
            type="button"
            onClick={() => onForm(null, null)}
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Add Exhibitor
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <select
              value={rowsPerPage}
              onChange={(e) => handleRowsChange(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white"
            >
              {[10, 25, 50].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            per page
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-rose-600" />
            Select All
          </label>

          <div className="flex items-center gap-2 ml-2">
            <button
              type="button"
              onClick={handleEdit}
              className="w-9 h-9 inline-flex items-center justify-center rounded-md bg-slate-200 text-slate-600"
              aria-label="Edit selected"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 17.25 2.5.25L17.81 5.19a1.5 1.5 0 0 0-2.12-2.12L3.38 15.38Z" />
                <path d="M18 13v6" />
                <path d="M12 19h6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-9 h-9 inline-flex items-center justify-center rounded-md bg-rose-500 text-white"
              aria-label="Delete selected"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M8 6v14h8V6" />
                <path d="M10 10v6m4-6v6M9 6l1-2h4l1 2" />
              </svg>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <input
                type="search"
                placeholder="Search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-64 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16.5 16.5 3 3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700 font-semibold">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200 w-20">Select</th>
                <th className="px-4 py-3 border-b border-slate-200 w-12">No</th>
                <th className="px-4 py-3 border-b border-slate-200">Company</th>
                <th className="px-4 py-3 border-b border-slate-200">PIC</th>
                <th className="px-4 py-3 border-b border-slate-200">Position</th>
                <th className="px-4 py-3 border-b border-slate-200">Type</th>
                <th className="px-4 py-3 border-b border-slate-200">Email</th>
                <th className="px-4 py-3 border-b border-slate-200">Phone</th>
                <th className="px-4 py-3 border-b border-slate-200">City</th>
                <th className="px-4 py-3 border-b border-slate-200 whitespace-nowrap">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={10}>
                    Loading data...
                  </td>
                </tr>
              ) : null}

              {!loading && paginatedRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={10}>
                    Tidak ada data untuk segmen ini.
                  </td>
                </tr>
              ) : null}

              {!loading
                ? paginatedRows.map((row, index) => (
                    <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="px-4 py-3 border-b border-slate-200">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleRow(row.id)}
                          className="w-4 h-4 accent-rose-600"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-slate-200">{startIndex + index + 1}</td>
                      <td className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-800">{row.company}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.pic}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.position}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.type ?? ''}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.email}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.phone}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.city}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.updatedAt ?? ''}</td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm font-semibold text-slate-700">
          <div>
            {filteredRows.length > 0
              ? `${startIndex + 1}-${Math.min(startIndex + paginatedRows.length, filteredRows.length)} dari ${filteredRows.length}`
              : '0 data'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 rounded-md border border-slate-300 flex items-center justify-center ${
                currentPage === 1 ? 'text-slate-400 bg-slate-100' : 'hover:bg-slate-100'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m14 18-6-6 6-6" />
              </svg>
            </button>
            <span className="px-2">Prev</span>
            <span className="px-2">Next</span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 rounded-md border border-slate-300 flex items-center justify-center ${
                currentPage === totalPages ? 'text-slate-400 bg-slate-100' : 'hover:bg-slate-100'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m10 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ExhibitorPage = () => {
  const { setGlobalMessage } = useAppStore()
  const [mode, setMode] = useState<'cards' | 'table' | 'form'>('cards')
  const [segment, setSegment] = useState<ExhibitorSegment>('defence')
  const [rows, setRows] = useState<ExhibitorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [deleteIds, setDeleteIds] = useState<(string | number)[] | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [tableNonce, setTableNonce] = useState(0)

  const loadData = async (targetSegment: ExhibitorSegment) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchExhibitors(targetSegment, 200)
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data exhibitor')
      setGlobalMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal memuat data exhibitor' })
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'table') {
      loadData(segment)
    }
  }, [segment, mode])

  if (mode === 'cards') {
    return (
      <InputDeck
        variant="exhibitor"
        onInput={(targetSegment) => {
          setSegment(targetSegment)
          setMode('table')
        }}
      />
    )
  }

  if (mode === 'form') {
    return (
      <AddDataPage
        variant="exhibitor"
        initialRow={editingRow}
        initialId={editingId}
        onBack={() => {
          setMode('table')
          setEditingRow(null)
          setEditingId(null)
          loadData(segment)
        }}
      />
    )
  }

  return (
    <>
      <ExhibitorTable
        key={tableNonce}
        segment={segment}
        rows={rows}
        loading={loading}
        error={error ?? deleteError}
        onReload={() => loadData(segment)}
        onSegmentChange={(next) => {
          setSegment(next)
        }}
        onBack={() => setMode('cards')}
        onForm={(row, id) => {
          setEditingRow(row)
          setEditingId(id)
          setMode('form')
        }}
        onConfirmDelete={(ids) => setDeleteIds(ids)}
      />

      {deleteIds ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Hapus data</h3>
              <p className="text-sm text-slate-600 mt-1">Anda akan menghapus {deleteIds.length} data terpilih. Lanjutkan?</p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteIds(null)
                  setDeleteError(null)
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setDeleteError(null)
                    await deleteAddData(deleteIds)
                    setDeleteIds(null)
                    loadData(segment)
                    setTableNonce((n) => n + 1)
                    setGlobalMessage({ type: 'success', text: 'Data berhasil dihapus' })
                  } catch (err) {
                    setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus data')
                    setDeleteIds(null)
                    setGlobalMessage({
                      type: 'error',
                      text: err instanceof Error ? err.message : 'Gagal menghapus data',
                    })
                  }
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold shadow-sm hover:bg-rose-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default ExhibitorPage
