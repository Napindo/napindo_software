import { useEffect, useState } from 'react'
import './App.css'

type TableRow = Record<string, unknown>

type ConnectionState = 'idle' | 'loading' | 'connected' | 'error'

const TABLES = [
  { name: 'dbo.GABUNG', label: 'Tabel dbo.GABUNG' },
  { name: 'dbo.PENGGUNA', label: 'Tabel dbo.PENGGUNA' },
]

function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [loadingTable, setLoadingTable] = useState<string | null>(null)
  const [tableRows, setTableRows] = useState<Record<string, TableRow[]>>({})
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    handleTestConnection()
  }, [])

  const handleTestConnection = async () => {
    setConnectionState('loading')
    setConnectionMessage('')
    setErrorMessage('')

    try {
      const response = await window.database.testConnection()

      if (response.success) {
        const serverTime = response.serverTime ? new Date(response.serverTime as string) : null
        const formattedTime = serverTime ? serverTime.toLocaleString() : 'Tidak tersedia'

        setConnectionState('connected')
        setConnectionMessage(`Koneksi berhasil. Waktu server: ${formattedTime}`)
      } else {
        setConnectionState('error')
        setConnectionMessage(response.message)
      }
    } catch (error) {
      setConnectionState('error')
      setConnectionMessage(error instanceof Error ? error.message : 'Gagal terhubung ke database')
    }
  }

  const handleLoadTable = async (tableName: string) => {
    setLoadingTable(tableName)
    setErrorMessage('')

    try {
      const response = await window.database.fetchTableData<TableRow>(tableName)

      if (!response.success) {
        setErrorMessage(response.message ?? 'Gagal mengambil data tabel')
        return
      }

      setTableRows((current) => ({
        ...current,
        [tableName]: response.rows ?? [],
      }))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal mengambil data tabel')
    } finally {
      setLoadingTable(null)
    }
  }

  const renderTable = (tableName: string) => {
    const rows = tableRows[tableName]

    if (!rows || rows.length === 0) {
      return <p className="muted">Belum ada data yang ditarik dari tabel ini.</p>
    }

    const columns = Object.keys(rows[0] ?? {})

    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={`${tableName}-${column}`}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${tableName}-row-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={`${tableName}-${column}-${rowIndex}`}>
                    {String(row[column] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )
  }

  const statusTitle =
    connectionState === 'connected'
      ? 'Terhubung'
      : connectionState === 'error'
        ? 'Gagal Terhubung'
        : 'Belum Terhubung'

  return (
    <div className="app-container">
      <header>
        <h1>Koneksi Database SQL Server</h1>
        <p className="muted">
          Server: <strong>SERVER-TRIAL\NAPINDOSQL</strong> · Database: <strong>NAPINDO</strong> · User:{' '}
          <strong>TRIAL</strong>
        </p>
      </header>

      <section className="card connection">
        <div className="card-header">
          <div>
            <h2>Status Koneksi</h2>
            <p className="muted">Pastikan aplikasi dapat menjangkau server SQL Server Management Studio.</p>
          </div>
          <button className="primary" onClick={handleTestConnection} disabled={connectionState === 'loading'}>
            {connectionState === 'loading' ? 'Menghubungkan...' : 'Tes Koneksi'}
          </button>
        </div>

        <div className={`status ${connectionState}`}>
          <span className="dot" />
          <div>
            <p className="status-title">{statusTitle}</p>
            <p className="muted">{connectionMessage || 'Tekan "Tes Koneksi" untuk mencoba terhubung.'}</p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Ambil Data</h2>
            <p className="muted">Menarik 10 baris pertama dari tabel yang tersedia.</p>
          </div>
        </div>

        <div className="table-actions">
          {TABLES.map((table) => (
            <button
              key={table.name}
              onClick={() => handleLoadTable(table.name)}
              disabled={loadingTable === table.name}
            >
              {loadingTable === table.name ? 'Memuat...' : `Muat ${table.label}`}
            </button>
          ))}
        </div>

        {errorMessage && <p className="error">{errorMessage}</p>}

        {TABLES.map((table) => (
          <div key={table.name} className="table-section">
            <div className="table-title">
              <h3>{table.label}</h3>
              <p className="muted">Menampilkan 10 baris pertama (jika tersedia).</p>
            </div>
            {renderTable(table.name)}
          </div>
        ))}
      </section>
    </div>
  )
}

export default App
