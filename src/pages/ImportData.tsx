import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { importGabungExcel, type ImportResult } from '../services/importData'
import { arrayBufferToBase64 } from '../utils/base64'
import { useAppStore } from '../store/appStore'

const MAX_FILE_MB = 25
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

const sampleColumns = ['COMPANY', 'NAME', 'CITY', 'EMAIL', 'PHONE', 'POSITION', 'LASTUPDATE']
const quickGuide = [
  'Pastikan kolom di Excel sesuai field database GABUNG.',
  'Header boleh berisi spasi/simbol, sistem menormalkan nama kolom.',
  'Untuk tanggal gunakan format yang bisa dibaca Excel (date).',
]

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0 KB'
  const kb = value / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

const parsePositiveInt = (value: string, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

const parseOptionalPositiveInt = (value: string) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return Math.floor(parsed)
}

const ImportDataPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [headerRow, setHeaderRow] = useState('1')
  const [chunkSize, setChunkSize] = useState('500')
  const [maxRows, setMaxRows] = useState('')
  const [dryRun, setDryRun] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const { user } = useAppStore()

  const hasFile = useMemo(() => Boolean(selectedFile), [selectedFile])

  const resetForm = () => {
    setSelectedFile(null)
    setSheetName('')
    setHeaderRow('1')
    setChunkSize('500')
    setMaxRows('')
    setDryRun(false)
    setStatus(null)
    setResult(null)
  }

  const validateFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx') {
      setStatus({ type: 'error', message: 'Format file harus .xlsx.' })
      return false
    }
    if (file.size > MAX_FILE_BYTES) {
      setStatus({ type: 'error', message: `Ukuran file maksimal ${MAX_FILE_MB} MB.` })
      return false
    }
    return true
  }

  const handleFileSelect = (file: File | null) => {
    if (!file) return
    if (!validateFile(file)) return
    setSelectedFile(file)
    setStatus({ type: 'info', message: 'File siap diimpor. Periksa pengaturan sebelum mulai.' })
    setResult(null)
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0] ?? null)
  }

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragActive(true)
  }

  const onDragLeave = () => setDragActive(false)

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragActive(false)
    handleFileSelect(event.dataTransfer.files?.[0] ?? null)
  }

  const startImport = async () => {
    if (!selectedFile) {
      setStatus({ type: 'error', message: 'Pilih file Excel terlebih dahulu.' })
      return
    }
    if (!validateFile(selectedFile)) return

    setIsImporting(true)
    setStatus(null)
    setResult(null)

    try {
      const buffer = await selectedFile.arrayBuffer()
      const payload = {
        fileBase64: arrayBufferToBase64(buffer),
        fileName: selectedFile.name,
        sheetName: sheetName.trim() || undefined,
        headerRow: parsePositiveInt(headerRow, 1),
        chunkSize: parsePositiveInt(chunkSize, 500),
        maxRows: parseOptionalPositiveInt(maxRows),
        dryRun,
        currentUser: user?.username || user?.name || undefined,
      }

      const response = await importGabungExcel(payload)
      setResult(response)
      setStatus({
        type: 'success',
        message: response.dryRun
          ? `Uji selesai. ${response.totalRows} baris terdeteksi (tanpa insert).`
          : `Import selesai. ${response.inserted} baris berhasil masuk ke database.`,
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Gagal mengimpor data.',
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-400 tracking-[0.2em]">INPUT DATA</p>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900">Import Data</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Unggah file Excel untuk menambahkan data langsung ke database. Pastikan header kolom sesuai dengan nama
            field di tabel GABUNG (case-insensitive).
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-600 px-4 py-1 text-sm font-semibold">
          Target: GABUNG
        </span>
      </div>

      {status ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            status.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : status.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">File Excel</h2>
            <p className="text-sm text-slate-500">Format .xlsx, maksimal {MAX_FILE_MB} MB per upload.</p>
          </div>

          <label
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer transition ${
              dragActive
                ? 'border-rose-400 bg-rose-50'
                : 'border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50/40'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <span className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 16V8" />
                <path d="m8 12 4-4 4 4" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-slate-700">Klik untuk pilih file Excel</p>
              <p className="text-xs text-slate-500">atau drag &amp; drop di area ini</p>
            </div>
            {hasFile ? (
              <div className="mt-2 text-sm text-slate-600">
                <span className="font-semibold">{selectedFile?.name}</span> • {formatBytes(selectedFile?.size || 0)}
              </div>
            ) : null}
            <input type="file" accept=".xlsx" className="hidden" onChange={onFileChange} />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Sheet (optional)</label>
              <input
                type="text"
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
                placeholder="Sheet1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Header row</label>
              <input
                type="number"
                min={1}
                value={headerRow}
                onChange={(event) => setHeaderRow(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Chunk size</label>
              <input
                type="number"
                min={1}
                value={chunkSize}
                onChange={(event) => setChunkSize(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Limit baris (optional)</label>
            <input
              type="number"
              min={1}
              value={maxRows}
              onChange={(event) => setMaxRows(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Kosongkan untuk semua baris"
            />
            <p className="text-xs text-slate-500">Batasi jumlah baris yang diimpor. Kosongkan untuk semua baris.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={startImport}
              disabled={isImporting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {isImporting ? 'Mengimpor...' : 'Mulai Import'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          {result ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-800">Ringkasan import</p>
              {result.dryRun ? (
                <>
                  <p>{result.totalRows} baris terdeteksi.</p>
                  <p>{result.skipped} baris dilewati (kosong).</p>
                  <p className="text-slate-500">Mode uji aktif: tidak ada data yang disimpan.</p>
                </>
              ) : (
                <>
                  <p>{result.inserted} baris berhasil diimpor.</p>
                  <p>{result.skipped} baris dilewati (kosong).</p>
                </>
              )}
              {result.unknownHeaders && result.unknownHeaders.length > 0 ? (
                <p className="text-rose-600">
                  Header tidak dikenal: {result.unknownHeaders.slice(0, 6).join(', ')}
                  {result.unknownHeaders.length > 6 ? ' ...' : ''}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Panduan cepat</h3>
            <ol className="space-y-3 text-sm text-slate-600">
              {quickGuide.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-100 text-rose-600 font-semibold">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg">
            <h3 className="text-lg font-bold">Kolom contoh</h3>
            <p className="text-sm text-slate-200 mt-2">Beberapa kolom yang umum digunakan:</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {sampleColumns.map((column) => (
                <span
                  key={column}
                  className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wide"
                >
                  {column}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportDataPage
