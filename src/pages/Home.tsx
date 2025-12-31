import { useEffect, useMemo, useState } from 'react'
import { fetchExhibitorCountByExpo, fetchExpoChartData } from '../services/exhibitors'
import { listPengguna, type PenggunaRow } from '../services/pengguna'
import { useAppStore } from '../store/appStore'

type HomeProps = {
  displayName?: string
}

const Home = ({ displayName }: HomeProps) => {
  const { user } = useAppStore()
  const resolvedName = displayName ?? user?.name ?? user?.username ?? 'User'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    defence: 0,
    water: 0,
    livestock: 0,
  })
  const [chartYears, setChartYears] = useState<number[]>([])
  const [chartSeries, setChartSeries] = useState<
    Array<{ label: string; color: string; values: Record<number, number> }>
  >([])
  const [users, setUsers] = useState<PenggunaRow[]>([])

  const MIN_YEAR = 2023
  const MAX_Y = 250000

  useEffect(() => {
    let active = true
    const loadDashboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const [penggunaRows, counts, chartData] = await Promise.all([
          listPengguna(),
          fetchExhibitorCountByExpo(),
          fetchExpoChartData(),
        ])

        if (!active) return

        const series = [
          { label: 'Indo Defence', color: '#e11d48', values: chartData?.indoDefence ?? {} },
          { label: 'Indo Water', color: '#0ea5e9', values: chartData?.indoWater ?? {} },
          { label: 'Indo Livestock', color: '#16a34a', values: chartData?.indoLivestock ?? {} },
        ]

        const years = series
          .flatMap((item) => Object.keys(item.values).map((year) => Number(year)))
          .filter((year) => Number.isFinite(year) && year >= MIN_YEAR)
        const maxYear = Math.max(MIN_YEAR, ...years, new Date().getFullYear())
        const yearList = []
        for (let year = MIN_YEAR; year <= maxYear; year += 1) {
          yearList.push(year)
        }

        setStats({
          defence: counts?.indoDefence ?? 0,
          water: counts?.indoWater ?? 0,
          livestock: counts?.indoLivestock ?? 0,
        })
        setChartSeries(series)
        setChartYears(yearList)
        setUsers(penggunaRows)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [])

  const chartLayout = useMemo(() => {
    const width = 640
    const height = 260
    const padding = { top: 24, right: 18, bottom: 40, left: 52 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const years = chartYears.length > 0 ? chartYears : [MIN_YEAR]
    const getX = (index: number) => {
      if (years.length === 1) return padding.left + chartWidth / 2
      return padding.left + (chartWidth * index) / (years.length - 1)
    }
    const getY = (value: number) => {
      const safe = Math.max(0, Math.min(value, MAX_Y))
      return padding.top + chartHeight - (chartHeight * safe) / MAX_Y
    }

    const paths = chartSeries.map((series) => {
      const points = years.map((year, index) => {
        const value = series.values[year] ?? 0
        return [getX(index), getY(value)]
      })
      const path = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0].toFixed(1)} ${point[1].toFixed(1)}`)
        .join(' ')
      return { ...series, points, path }
    })

    return { width, height, padding, chartWidth, chartHeight, years, getX, getY, paths }
  }, [chartSeries, chartYears])

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aOnline = String(a.status ?? '').toUpperCase() === 'ON'
      const bOnline = String(b.status ?? '').toUpperCase() === 'ON'
      if (aOnline === bOnline) return String(a.username ?? '').localeCompare(String(b.username ?? ''))
      return aOnline ? -1 : 1
    })
  }, [users])

  return (
    <div className="w-full space-y-8 lg:space-y-10 pt-2">
      <header className="flex flex-col gap-1">
        <p className="text-lg font-bold text-slate-500">Hi, {resolvedName}</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900">Welcome to Napindo Software</h1>
      </header>

      <div className="grid gap-6">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-semibold">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {[
            {
              label: 'Indo Defence',
              segments: 'Defence, Aerospace, Marine',
              value: stats.defence,
              tint: 'from-rose-500/15 to-rose-50',
            },
            {
              label: 'Indo Water',
              segments: 'Water, Waste, Renergy, Smart City, Security, Firex',
              value: stats.water,
              tint: 'from-sky-500/15 to-sky-50',
            },
            {
              label: 'Indo Livestock',
              segments: 'Livestock, Agrotech, Fisheries, Vet, Feed, Dairy, Horticulture',
              value: stats.livestock,
              tint: 'from-emerald-500/15 to-emerald-50',
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${card.tint} p-5 shadow-sm`}
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{loading ? '...' : card.value.toLocaleString('id-ID')}</p>
              <p className="text-xs text-slate-500 mt-2">{card.segments}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Exhibitor + Visitor</p>
                <h2 className="text-lg font-bold text-slate-900">Pergerakan Pameran (2023+)</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                {chartSeries.map((series) => (
                  <div key={series.label} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: series.color }} />
                    {series.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <svg
                viewBox={`0 0 ${chartLayout.width} ${chartLayout.height}`}
                className="w-full h-[300px]"
                role="img"
                aria-label="Grafik exhibitor dan visitor"
              >
                <rect x="0" y="0" width={chartLayout.width} height={chartLayout.height} fill="white" />
                <line
                  x1={chartLayout.padding.left}
                  x2={chartLayout.width - chartLayout.padding.right}
                  y1={chartLayout.height - chartLayout.padding.bottom}
                  y2={chartLayout.height - chartLayout.padding.bottom}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <line
                  x1={chartLayout.padding.left}
                  x2={chartLayout.padding.left}
                  y1={chartLayout.padding.top}
                  y2={chartLayout.height - chartLayout.padding.bottom}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />

                {[0, 50000, 100000, 150000, 200000, 250000].map((value) => {
                  const y = chartLayout.getY(value)
                  return (
                    <g key={value}>
                      <line
                        x1={chartLayout.padding.left}
                        x2={chartLayout.width - chartLayout.padding.right}
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartLayout.padding.left - 10}
                        y={y + 4}
                        fontSize="10"
                        textAnchor="end"
                        fill="#64748b"
                      >
                        {value.toLocaleString('id-ID')}
                      </text>
                    </g>
                  )
                })}

                {chartLayout.years.map((year, index) => (
                  <text
                    key={year}
                    x={chartLayout.getX(index)}
                    y={chartLayout.height - 12}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#64748b"
                  >
                    {year}
                  </text>
                ))}

                {chartLayout.paths.map((series) => (
                  <g key={series.label}>
                    <path
                      d={series.path}
                      fill="none"
                      stroke={series.color}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {series.points.map((point, index) => (
                      <circle key={`${series.label}-${index}`} cx={point[0]} cy={point[1]} r="3" fill={series.color} />
                    ))}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User Online</p>
                <h2 className="text-lg font-bold text-slate-900">Status Pengguna</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">{users.length} pengguna</span>
            </div>

            <div className="mt-4 space-y-3 max-h-[320px] overflow-auto pr-1">
              {users.length === 0 && !loading ? (
                <p className="text-sm text-slate-500">Belum ada data pengguna.</p>
              ) : null}
              {sortedUsers.map((person) => {
                const statusText = (person.status ?? 'OFF').toString().toUpperCase()
                const isOnline = statusText === 'ON'
                return (
                  <div
                    key={`${person.username ?? 'user'}-${person.division ?? ''}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{person.username ?? '-'}</p>
                      <p className="text-xs text-slate-500">{person.division ?? '-'}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {isOnline ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )
              })}
              {loading ? <p className="text-sm text-slate-500">Memuat pengguna...</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
