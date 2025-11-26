import { useEffect, useMemo, useState } from 'react'
import { InputDeck } from './Exhibitor'
import type { VisitorRow, VisitorSegment } from '../services/visitors'
import { getVisitorsBySegment } from '../services/visitors'

const visitorDefenceGroup: VisitorSegment[] = ['defence', 'aerospace', 'marine']
const visitorWaterGroup: VisitorSegment[] = ['water', 'waste', 'iismex', 'renergy', 'security', 'firex']
const visitorLivestockGroup: VisitorSegment[] = ['livestock', 'agrotech', 'vet', 'fisheries', 'feed', 'dairy', 'horticulture']

const visitorSegmentTabs: Record<VisitorSegment, VisitorSegment[]> = {
  defence: visitorDefenceGroup,
  aerospace: visitorDefenceGroup,
  marine: visitorDefenceGroup,
  water: visitorWaterGroup,
  waste: visitorWaterGroup,
  iismex: visitorWaterGroup,
  renergy: visitorWaterGroup,
  security: visitorWaterGroup,
  firex: visitorWaterGroup,
  livestock: visitorLivestockGroup,
  agrotech: visitorLivestockGroup,
  vet: visitorLivestockGroup,
  fisheries: visitorLivestockGroup,
  feed: visitorLivestockGroup,
  dairy: visitorLivestockGroup,
  horticulture: visitorLivestockGroup,
}

const visitorSegmentLabels: Record<VisitorSegment, string> = {
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

const visitorFlagKey: Record<VisitorSegment, string> = {
  defence: 'visdefence',
  aerospace: 'visaero',
  marine: 'vismarine',
  water: 'viswater',
  waste: 'viswaste',
  iismex: 'vissmart',
  renergy: 'visenergy',
  security: 'vissecure',
  firex: 'visfire',
  livestock: 'vislives',
  agrotech: 'visagritech',
  vet: 'visindovet',
  fisheries: 'visfish',
  feed: 'visfeed',
  dairy: 'visdairy',
  horticulture: 'vishorti',
}

const isFlagSet = (raw: Record<string, unknown>, key: string) => {
  const value = raw[key.toLowerCase()]
  if (value === undefined || value === null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === 'x' || normalized === '1' || normalized === 'true' || normalized === 'yes'
}

const rowMatchesSegment = (raw: Record<string, unknown>, segment: VisitorSegment) => {
  const lower = Object.keys(raw).reduce<Record<string, unknown>>((acc, key) => {
    acc[key.toLowerCase()] = raw[key]
    return acc
  }, {})

  const flagKey = visitorFlagKey[segment]
  if (!flagKey) return true
  return isFlagSet(lower, flagKey)
}

type VisitorTableProps = {
  segment: VisitorSegment
  rows: VisitorRow[]
  loading?: boolean
  error?: string | null
  onReload: () => void
  onSegmentChange: (next: VisitorSegment) => void
  onBack: () => void
}

const VisitorTable = ({ segment, rows, loading, error, onReload, onSegmentChange, onBack }: VisitorTableProps) => {
  const [search, setSearch] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])

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
        .some((value) => value.toLowerCase().includes(lower)),
    )
  }, [rows, search, segment])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage)
  const allSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedIds.includes(row.id))
  const tabOptions = visitorSegmentTabs[segment] ?? [segment]

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
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">Input Data - Visitor</h1>
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
                {visitorSegmentLabels[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {error ? <span className="text-sm text-rose-600 font-semibold">{error}</span> : null}
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
                      <td className="px-4 py-3 border-b border-slate-200">{row.type}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.email}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.phone}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.city}</td>
                      <td className="px-4 py-3 border-b border-slate-200">{row.updatedAt}</td>
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

const VisitorPage = () => {
  const [mode, setMode] = useState<'cards' | 'table'>('cards')
  const [segment, setSegment] = useState<VisitorSegment>('defence')
  const [rows, setRows] = useState<VisitorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (targetSegment: VisitorSegment) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getVisitorsBySegment(targetSegment, 200)
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data visitor')
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
        variant="visitor"
        onInput={(targetSegment) => {
          setSegment(targetSegment as VisitorSegment)
          setMode('table')
        }}
      />
    )
  }

  return (
    <VisitorTable
      segment={segment}
      rows={rows}
      loading={loading}
      error={error}
      onReload={() => loadData(segment)}
      onSegmentChange={(next) => {
        setSegment(next)
      }}
      onBack={() => setMode('cards')}
    />
  )
}

export default VisitorPage
