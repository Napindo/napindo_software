import { useEffect, useMemo, useState } from 'react'
import type { ExhibitorRow, ExhibitorSegment } from '../services/exhibitors'
import { getExhibitorsBySegment } from '../services/exhibitors'

const createLogoDataUrl = (title: string, subtitles: string[], accent: string, secondary: string) => {
  const startY = 140 - subtitles.length * 18
  const subtitleText = subtitles
    .map(
      (line, index) =>
        `<text x="50%" y="${startY + index * 28}" text-anchor="middle" font-size="22" font-weight="600" fill="${secondary}">${line}</text>`,
    )
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="260" viewBox="0 0 560 260">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accent}" />
        <stop offset="100%" stop-color="${secondary}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="white" />
    <rect x="18" y="18" width="524" height="224" rx="28" fill="url(#bg)" opacity="0.08" />
    <text x="50%" y="86" text-anchor="middle" font-size="28" font-weight="800" fill="${accent}" letter-spacing="0.5">${title}</text>
    ${subtitleText}
  </svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const eventCards = [
  {
    id: 'defence',
    title: 'Indo Defence, Aerospace, Marine',
    logo: createLogoDataUrl('Indo Defence 2026 Expo & Forum', ['Aerospace - Marine'], '#e63946', '#374151'),
  },
  {
    id: 'water',
    title: 'Indo Water, Waste, IISME, Renergy, Firex, Security',
    logo: createLogoDataUrl('Indo Water & Waste 2026', ['IISMEX - Renergy - Firex - Security'], '#b91c1c', '#6b7280'),
  },
  {
    id: 'livestock',
    title: 'Indo Livestock, Agrotech, Vet, Fisheries, Feed, Dairy, Horticulture',
    logo: createLogoDataUrl('Indo Livestock 2026', ['Agrotech - Fisheries - Feed - Dairy - Horticulture'], '#d52547', '#7c3aed'),
  },
]

export const InputDeck = ({ variant, onInput }: { variant: 'exhibitor' | 'visitor'; onInput?: (segment: ExhibitorSegment) => void }) => {
  const heading = variant === 'exhibitor' ? 'EXHIBITOR' : 'VISITOR'
  const segmentByCard: Record<string, ExhibitorSegment> = {
    defence: 'defence',
    water: 'aerospace',
    livestock: 'marine',
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-slate-500">Input Data</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900">{heading}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {eventCards.map((card) => (
          <article
            key={card.id}
            className="rounded-[28px] overflow-hidden bg-gradient-to-br from-rose-500 via-rose-500 to-slate-700 text-white shadow-[0_16px_36px_rgba(0,0,0,0.16)] ring-1 ring-rose-100/40 flex flex-col"
          >
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-200 border border-slate-200/70 rounded-2xl p-4 min-h-[160px] flex items-center justify-center shadow-inner">
                <img src={card.logo} alt={card.title} className="max-h-28 w-full object-contain" />
              </div>
            </div>

            <div className="flex-1 flex flex-col px-8 pb-8">
              <p className="text-center text-lg font-semibold leading-7 mt-4">{card.title}</p>
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
}

const ExhibitorTable = ({ segment, rows, loading, error, onReload, onSegmentChange, onBack }: ExhibitorTableProps) => {
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
    if (!lower) return rows

    return rows.filter((row) =>
      [row.company, row.pic, row.position, row.type, row.email, row.phone, row.city]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(lower)),
    )
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage)
  const allSelected = paginatedRows.length > 0 && paginatedRows.every((row) => selectedIds.includes(row.id))

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
        <div>
          <p className="text-lg font-semibold text-slate-500">Input Data - Exhibitor</p>
          <div className="flex items-baseline gap-4 mt-2">
            {(['defence', 'aerospace', 'marine'] as ExhibitorSegment[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSegmentChange(item)}
                className={`pb-2 px-1 text-base font-semibold border-b-2 transition ${
                  item === segment ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-600 hover:text-rose-600'
                }`}
              >
                {item === 'defence' ? 'Defence' : item === 'aerospace' ? 'Aerospace' : 'Marine'}
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
          <button
            type="button"
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
              className="w-9 h-9 inline-flex items-center justify-center rounded-md bg-slate-200 text-slate-600"
              aria-label="Mark selected"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </button>
            <button
              type="button"
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

const ExhibitorPage = () => {
  const [mode, setMode] = useState<'cards' | 'table'>('cards')
  const [segment, setSegment] = useState<ExhibitorSegment>('defence')
  const [rows, setRows] = useState<ExhibitorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (targetSegment: ExhibitorSegment) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getExhibitorsBySegment(targetSegment, 200)
      setRows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data exhibitor')
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

  return (
    <ExhibitorTable
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

export default ExhibitorPage
