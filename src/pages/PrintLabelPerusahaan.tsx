import { useEffect, useMemo, useState } from 'react'
import { requestLabelOptions, requestLabelPerusahaan } from '../services/printLabel'
import { provinceOptions } from '../constants/provinces'

// TODO: integrate additional report/label endpoints here when backend is ready.

type SelectFilter = { key: string; activeKey: string; label: string; placeholder?: string }
type TextFilter = { key: string; activeKey: string; label: string; placeholder?: string }
type CheckboxItem = { key: string; label: string }
type CheckboxGroup = { title: string; items: CheckboxItem[] }

type LabelOptions = {
  code1: string[]
  code2: string[]
  code3: string[]
  source: string[]
  nonSource: string[]
  forum: string[]
  exhthn: string[]
  province: string[]
  updatedBy: string[]
  business: string[]
  nonBusiness: string[]
}

const selectFilters: SelectFilter[] = [
  { key: 'cmbcode1', activeKey: 'ckcode1', label: 'Code 1' },
  { key: 'cmbcode2', activeKey: 'ckcode2', label: 'Code 2' },
  { key: 'cmbcode3', activeKey: 'ckcode3', label: 'Code 3' },
  { key: 'cmbsource', activeKey: 'cksource', label: 'Source' },
  { key: 'cmbnonsource', activeKey: 'cknonsource', label: 'Non Source' },
  { key: 'cmbforum', activeKey: 'ckforum', label: 'Forum' },
  { key: 'cmbexhthn', activeKey: 'ckexhthn', label: 'EXH Tahun' },
  { key: 'cmbprov', activeKey: 'ckprov', label: 'Province' },
  { key: 'cmbupdate', activeKey: 'ckupdate', label: 'Updated By' },
]

// Memetakan nama kontrol UI ke key opsi hasil API
const optionKeyMap: Record<string, keyof LabelOptions> = {
  cmbcode1: 'code1',
  cmbcode2: 'code2',
  cmbcode3: 'code3',
  cmbsource: 'source',
  cmbnonsource: 'nonSource',
  cmbforum: 'forum',
  cmbexhthn: 'exhthn',
  cmbprov: 'province',
  cmbupdate: 'updatedBy',
}

const textFilters: TextFilter[] = [
  { key: 'tbusiness', activeKey: 'cbusiness', label: 'Business', placeholder: 'Pilih business' },
  { key: 'tnonbusiness', activeKey: 'cnonbusiness', label: 'Non Business', placeholder: 'Pilih non business' },
]

const visitorGroup: CheckboxGroup = {
  title: 'Visitor',
  items: [
    { key: 'cvisdefence', label: 'Defence' },
    { key: 'cvisaerospace', label: 'Aerospace' },
    { key: 'cvismarine', label: 'Marine' },
    { key: 'cviswater', label: 'Water' },
    { key: 'cviswaste', label: 'Waste' },
    { key: 'cvissmart', label: 'Smart City' },
    { key: 'cvisrenergy', label: 'Renergy' },
    { key: 'cvissecurity', label: 'Security' },
    { key: 'cvisfirex', label: 'Firex' },
    { key: 'cvislivestock', label: 'Livestock' },
    { key: 'cvisagrotech', label: 'Agrotech' },
    { key: 'cvisfisheries', label: 'Fisheries' },
    { key: 'cvisvet', label: 'Vet' },
    { key: 'cvisfeed', label: 'Feed' },
    { key: 'cvisdairy', label: 'Dairy' },
    { key: 'cvishorticulture', label: 'Horticulture' },
    { key: 'cdemo1', label: 'Demo 1' },
    { key: 'cdemo2', label: 'Demo 2' },
    { key: 'cdemo3', label: 'Demo 3' },
    { key: 'cseminar1', label: 'Seminar 1' },
    { key: 'cseminar2', label: 'Seminar 2' },
    { key: 'cseminar3', label: 'Seminar 3' },
    { key: 'cseminar4', label: 'Seminar 4' },
    { key: 'ctpp1', label: 'TPP 1' },
    { key: 'ctpp2', label: 'TPP 2' },
    { key: 'ctpp3', label: 'TPP 3' },
    { key: 'ctpp4', label: 'TPP 4' },
    { key: 'cwelcome', label: 'Welcome' },
    { key: 'cofflunch', label: 'Lunch' },
    { key: 'ccall', label: 'Call' },
    { key: 'cvisit', label: 'Visit' },
    { key: 'csociety', label: 'Society' },
    { key: 'cnonemail', label: 'Non Email' },
    { key: 'cnonhp', label: 'Non Hp' },
  ],
}

const exhibitorGroup: CheckboxGroup = {
  title: 'Exhibitor',
  items: [
    { key: 'cexhdefence', label: 'Defence' },
    { key: 'cexhaerospace', label: 'Aerospace' },
    { key: 'cexhmarine', label: 'Marine' },
    { key: 'cexhwater', label: 'Water' },
    { key: 'cexhwaste', label: 'Waste' },
    { key: 'cexhsmart', label: 'Smart City' },
    { key: 'cexhrenergy', label: 'Renergy' },
    { key: 'cexhsecurity', label: 'Security' },
    { key: 'cexhfirex', label: 'Firex' },
    { key: 'cexhlivestock', label: 'Livestock' },
    { key: 'cexhagrotech', label: 'Agrotech' },
    { key: 'cexhfisheries', label: 'Fisheries' },
    { key: 'cexhvet', label: 'Vet' },
    { key: 'cexhfeed', label: 'Feed' },
    { key: 'cexhdairy', label: 'Dairy' },
    { key: 'cexhhorticulture', label: 'Horticulture' },
  ],
}

const nonVisitorGroup: CheckboxGroup = {
  title: 'Non Visitor',
  items: [
    { key: 'cnonvisdefence', label: 'Defence' },
    { key: 'cnonvisaerospace', label: 'Aerospace' },
    { key: 'cnonvismarine', label: 'Marine' },
    { key: 'cnonviswater', label: 'Water' },
    { key: 'cnonviswaste', label: 'Waste' },
    { key: 'cnonvissmart', label: 'Smart City' },
    { key: 'cnonvisrenergy', label: 'Renergy' },
    { key: 'cnonvissecurity', label: 'Security' },
    { key: 'cnonvisfirex', label: 'Firex' },
    { key: 'cnonvislivestock', label: 'Livestock' },
    { key: 'cnonvisagrotech', label: 'Agrotech' },
    { key: 'cnonvisfisheries', label: 'Fisheries' },
    { key: 'cnonvisvet', label: 'Vet' },
    { key: 'cnonvisfeed', label: 'Feed' },
    { key: 'cnonvisdairy', label: 'Dairy' },
    { key: 'cnonvishorticulture', label: 'Horticulture' },
    { key: 'cnondemo1', label: 'Demo 1' },
    { key: 'cnondemo2', label: 'Demo 2' },
    { key: 'cnondemo3', label: 'Demo 3' },
    { key: 'cnonseminar1', label: 'Seminar 1' },
    { key: 'cnonseminar2', label: 'Seminar 2' },
    { key: 'cnonseminar3', label: 'Seminar 3' },
    { key: 'cnonseminar4', label: 'Seminar 4' },
    { key: 'cnontpp1', label: 'TPP 1' },
    { key: 'cnontpp2', label: 'TPP 2' },
    { key: 'cnontpp3', label: 'TPP 3' },
    { key: 'cnontpp4', label: 'TPP 4' },
    { key: 'cnonwelcome', label: 'Welcome' },
    { key: 'cnonlunch', label: 'Off Lunch' },
    { key: 'cnoncall', label: 'Call' },
    { key: 'cnonvisit', label: 'Visit' },
    { key: 'cnonsociety', label: 'Society' },
  ],
}

const nonExhibitorGroup: CheckboxGroup = {
  title: 'Non Exhibitor',
  items: [
    { key: 'cnonexhdefence', label: 'Defence' },
    { key: 'cnonexhaerospace', label: 'Aerospace' },
    { key: 'cnonexhmarine', label: 'Marine' },
    { key: 'cnonexhwater', label: 'Water' },
    { key: 'cnonexhwaste', label: 'Waste' },
    { key: 'cnonexhsmart', label: 'Smart City' },
    { key: 'cnonexhrenergy', label: 'Renergy' },
    { key: 'cnonexhsecurity', label: 'Security' },
    { key: 'cnonexhfirex', label: 'Firex' },
    { key: 'cnonexhlivestock', label: 'Livestock' },
    { key: 'cnonexhagrotech', label: 'Agrotech' },
    { key: 'cnonexhfisheries', label: 'Fisheries' },
    { key: 'cnonexhvet', label: 'Vet' },
    { key: 'cnonexhfeed', label: 'Feed' },
    { key: 'cnonexhdairy', label: 'Dairy' },
    { key: 'cnonexhhorticulture', label: 'Horticulture' },
  ],
}

const openingCeremonyGroup: CheckboxGroup = {
  title: 'Opening Ceremony',
  items: [
    { key: 'cocdefence', label: 'OC Defence' },
    { key: 'cocaerospace', label: 'OC Aerospace' },
    { key: 'cocmarine', label: 'OC Marine' },
    { key: 'cocwaterjkt', label: 'OC Water JKT' },
    { key: 'cocwatersby', label: 'OC Water SBY' },
    { key: 'cocwaste', label: 'OC Waste' },
    { key: 'cocsmart', label: 'OC Smart City' },
    { key: 'cocrenergy', label: 'OC Renergy' },
    { key: 'cocsecurity', label: 'OC Security' },
    { key: 'cocfirex', label: 'OC Firex' },
    { key: 'coclivestockjkt', label: 'OC Livestock JKT' },
    { key: 'coclivestocksby', label: 'OC Livestock SBY' },
    { key: 'cocagrotech', label: 'OC Agrotech' },
    { key: 'cocfisheries', label: 'OC Fisheries' },
    { key: 'cocvet', label: 'OC Vet' },
    { key: 'cocfeed', label: 'OC Feed' },
    { key: 'cocdairy', label: 'OC Dairy' },
    { key: 'cochorticulture', label: 'OC Horticulture' },
    { key: 'cnonocdefence', label: 'Non OC Defence' },
    { key: 'cnonocaerospace', label: 'Non OC Aerospace' },
    { key: 'cnonocmarine', label: 'Non OC Marine' },
    { key: 'cnonocwaterjkt', label: 'Non OC Water JKT' },
    { key: 'cnonocwatersby', label: 'Non OC Water SBY' },
    { key: 'cnonocwaste', label: 'Non OC Waste' },
    { key: 'cnonocsmart', label: 'Non OC Smart City' },
    { key: 'cnonocrenergy', label: 'Non OC Renergy' },
    { key: 'cnonocsecurity', label: 'Non OC Security' },
    { key: 'cnonocfirex', label: 'Non OC Firex' },
    { key: 'cnonoclivestockjkt', label: 'Non OC Livestock JKT' },
    { key: 'cnonoclivestocksby', label: 'Non OC Livestock SBY' },
    { key: 'cnonocagrotech', label: 'Non OC Agrotech' },
    { key: 'cnonocfisheries', label: 'Non OC Fisheries' },
    { key: 'cnonocvet', label: 'Non OC Vet' },
    { key: 'cnonocfeed', label: 'Non OC Feed' },
    { key: 'cnonocdairy', label: 'Non OC Dairy' },
    { key: 'cnonochorticulture', label: 'Non OC Horticulture' },
  ],
}

const vipGroup: CheckboxGroup = {
  title: 'Type of Visitor (VIP)',
  items: [
    { key: 'cvvip', label: 'VVIP' },
    { key: 'cvipdefence', label: 'VIP Defence' },
    { key: 'cvipaerospace', label: 'VIP Aerospace' },
    { key: 'cvipmarine', label: 'VIP Marine' },
    { key: 'cvipwater', label: 'VIP Water' },
    { key: 'cvipwaste', label: 'VIP Waste' },
    { key: 'cvipsmart', label: 'VIP Smart City' },
    { key: 'cviprenergy', label: 'VIP Renergy' },
    { key: 'cvipsecurity', label: 'VIP Security' },
    { key: 'cvipfirex', label: 'VIP Firex' },
    { key: 'cviplivestock', label: 'VIP Livestock' },
    { key: 'cvipagrotech', label: 'VIP Agrotech' },
    { key: 'cvipfisheries', label: 'VIP Fisheries' },
    { key: 'cvipvet', label: 'VIP Vet' },
    { key: 'cvipfeed', label: 'VIP Feed' },
    { key: 'cvipdairy', label: 'VIP Dairy' },
    { key: 'cviphorticulture', label: 'VIP Horticulture' },
    { key: 'cnonvvip', label: 'Non VVIP' },
    { key: 'cnonvipdefence', label: 'Non VIP Defence' },
    { key: 'cnonvipaerospace', label: 'Non VIP Aerospace' },
    { key: 'cnonvipmarine', label: 'Non VIP Marine' },
    { key: 'cnonvipwater', label: 'Non VIP Water' },
    { key: 'cnonvipwaste', label: 'Non VIP Waste' },
    { key: 'cnonvipsmart', label: 'Non VIP Smart City' },
    { key: 'cnonviprenergy', label: 'Non VIP Renergy' },
    { key: 'cnonvipsecurity', label: 'Non VIP Security' },
    { key: 'cnonvipfirex', label: 'Non VIP Firex' },
    { key: 'cnonviplivestock', label: 'Non VIP Livestock' },
    { key: 'cnonvipagrotech', label: 'Non VIP Agrotech' },
    { key: 'cnonvipfisheries', label: 'Non VIP Fisheries' },
    { key: 'cnonvipvet', label: 'Non VIP Vet' },
    { key: 'cnonvipfeed', label: 'Non VIP Feed' },
    { key: 'cnonvipdairy', label: 'Non VIP Dairy' },
    { key: 'cnonviphorticulture', label: 'Non VIP Horticulture' },
    { key: 'cnonoverseas', label: 'Non Overseas' },
    { key: 'cnonerror', label: 'Non Error' },
    { key: 'cnonresign', label: 'Non Resign' },
    { key: 'cnontdkwater', label: 'Non Tdk Water' },
    { key: 'cnonblmlivestock', label: 'Non Blm Livestock' },
    { key: 'ctdkkrmidd', label: 'Tdk Krm IDD' },
    { key: 'ctdkkrmidwjkt', label: 'Tdk Krm IDW Jkt' },
    { key: 'ctdkkrmidwsby', label: 'Tdk Krm IDW Sby' },
    { key: 'ctdkkrmidljkt', label: 'Tdk Krm IDL Jkt' },
    { key: 'ctdkkrmidlsby', label: 'Tdk Krm IDL Sby' },
  ],
}

const greetingCardGroup: CheckboxGroup = {
  title: 'Kartu Ucapan',
  items: [
    { key: 'ckalender', label: 'Kalender' },
    { key: 'clebaran', label: 'Lebaran' },
    { key: 'cparcel', label: 'Parcel' },
    { key: 'ctahunbaru', label: 'Tahun Baru' },
    { key: 'cnonkalender', label: 'Non Kalender' },
    { key: 'cnonlebaran', label: 'Non Lebaran' },
    { key: 'cnonparcel', label: 'Non Parcel' },
    { key: 'cnontahunbaru', label: 'Non Tahun Baru' },
  ],
}

const posterGroup: CheckboxGroup = {
  title: 'Poster',
  items: [
    { key: 'cpstrdefence', label: 'IDD' },
    { key: 'cpstraerospace', label: 'IDA' },
    { key: 'cpstrmarine', label: 'IDM' },
    { key: 'cpstrwater', label: 'IDW' },
    { key: 'cpstrsecurity', label: 'ISC' },
    { key: 'cpstrlivestock', label: 'IDL' },
  ],
}

const checkboxSections: CheckboxGroup[] = [
  visitorGroup,
  exhibitorGroup,
  nonVisitorGroup,
  nonExhibitorGroup,
  openingCeremonyGroup,
  vipGroup,
  greetingCardGroup,
  posterGroup,
]

type SubmitResult = {
  data?: unknown
  total?: number
  totalCount?: number
  count?: number
  message?: string
}

type SubmitHandler = (payload: Record<string, unknown>) => Promise<SubmitResult>

type TemplateProps = {
  title: string
  onSubmit: SubmitHandler
  labelTitle?: string
  labelPlaceholder?: string
  previewTitle?: string
  printTitle?: string
  noun?: string
  titleKey?: string
}

export function PrintLabelTemplate({
  title,
  onSubmit,
  labelTitle = 'Judul Label',
  labelPlaceholder = 'Label Perusahaan',
  previewTitle = 'Preview Word',
  printTitle = 'Cetak Label',
  noun = 'label',
  titleKey = 'judul_label',
}: TemplateProps) {
  const [judulLabel, setJudulLabel] = useState('')
  const [selectValues, setSelectValues] = useState<Record<string, string>>({})
  const [selectActive, setSelectActive] = useState<Record<string, boolean>>({})
  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const [textActive, setTextActive] = useState<Record<string, boolean>>({})
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const nounText = noun.trim() || 'label'
  const initialMessage = `Gunakan panel filter untuk menyesuaikan ${nounText}. Ringkasan akan ditampilkan di sini.`
  const [message, setMessage] = useState(initialMessage)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewMime, setPreviewMime] = useState('application/pdf')
  const [options, setOptions] = useState<LabelOptions>({
    code1: [],
    code2: [],
    code3: [],
    source: [],
    nonSource: [],
    forum: [],
    exhthn: [],
    province: [],
    updatedBy: [],
    business: [],
    nonBusiness: [],
  })

  useEffect(() => {
    let cancelled = false
    requestLabelOptions()
      .then((data) => {
        if (cancelled || !data) return
        setOptions((prev) => ({
          ...prev,
          ...data,
          nonSource: data?.nonSource ?? data?.source ?? prev.nonSource,
          province: [...new Set([...(data?.province ?? []), ...provinceOptions])],
        }))
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Gagal memuat opsi filter')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const payload = useMemo(() => {
    const base: Record<string, unknown> = {
      [titleKey]: judulLabel.trim(),
    }

    selectFilters.forEach((filter) => {
      if (selectActive[filter.activeKey]) {
        base[filter.activeKey] = true
        base[filter.key] = selectValues[filter.key]?.trim() ?? ''
      }
    })

    textFilters.forEach((filter) => {
      if (textActive[filter.activeKey]) {
        base[filter.activeKey] = true
        base[filter.key] = textValues[filter.key]?.trim() ?? ''
      }
    })

    Object.entries(checks).forEach(([key, value]) => {
      if (value) base[key] = true
    })

    return base
  }, [judulLabel, selectValues, selectActive, textValues, textActive, checks])

  const handleToggleCheck = (key: string) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePreviewWord = async () => {
    setLoading(true)
    setError(null)
    try {
      const countResult = await onSubmit(payload)
      const total = countResult.total ?? countResult.totalCount ?? countResult.count ?? 0
      setCount(total)
      setMessage(`Data dihitung. Total data: ${total}. Memuat preview (PDF agar bisa dilihat)...`)

      // Muat preview PDF (tampilan setara Word, lebih mudah dirender)
      const pdfResult = await onSubmit({ ...payload, action: 'preview-pdf' })
      const base64 = extractBase64(pdfResult?.data)
      if (base64) {
        const mime = (pdfResult?.data as any)?.contentType || 'application/pdf'
        const url = base64ToBlobUrl(base64, mime)
        setPreviewMime(mime)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
        setMessage(`Preview (tampilan setara) siap. Total data: ${total}.`)
      } else {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        setMessage(`Data berhasil dihitung. Total data: ${total}. Pratinjau tidak tersedia.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan')
      setMessage('Gagal memuat laporan, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setJudulLabel('')
    setSelectValues({})
    setSelectActive({})
    setTextValues({})
    setTextActive({})
    setChecks({})
    setCount(0)
    setError(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setPreviewMime('application/pdf')
    setMessage(initialMessage)
  }

  const handleExportSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await onSubmit({ ...payload, action: 'export-save' })
      const meta: any = result?.data ?? {}
      if (meta?.canceled) {
        setMessage('Export dibatalkan.')
      } else {
        setMessage('Export selesai. File disimpan sesuai pilihan Anda.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengekspor file')
      setMessage('Export gagal, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await onSubmit({ ...payload, action: 'export-pdf' })
      const meta: any = result?.data ?? {}
      const base64 = extractBase64(meta)
      const mime = meta?.contentType || 'application/pdf'
      if (!base64) {
        setMessage('Gagal membuat file untuk dicetak.')
        return
      }
      const url = base64ToBlobUrl(base64, mime)
      setPreviewMime(mime)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })

      const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>${printTitle}</title></head><body style="margin:0">
            <iframe src="${url}" style="border:0;width:100%;height:100vh;" id="print-frame"></iframe>
          </body></html>`,
        )
        printWindow.document.close()
        printWindow.onload = () => {
          const iframe = printWindow.document.getElementById('print-frame') as HTMLIFrameElement | null
          iframe?.contentWindow?.focus()
          iframe?.contentWindow?.print()
        }
        setMessage('File siap dicetak.')
      } else {
        // Jika pop-up terblokir, minimal simpan pratinjau di panel kanan
        setMessage('File siap dicetak. Izinkan pop-up untuk mencetak otomatis.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencetak')
      setMessage('Print gagal, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const renderCheckboxGroup = (group: CheckboxGroup) => (
    <section key={group.title} className="border border-slate-200 rounded-2xl bg-slate-50/60">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
        <h3 className="text-base font-semibold text-slate-700">{group.title}</h3>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4">
          {group.items.map((item) => (
            <label key={item.key} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(checks[item.key])}
                onChange={() => handleToggleCheck(item.key)}
                className="w-4 h-4 accent-rose-500"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">Pilih filter sesuai kebutuhan lalu tekan Preview atau Export.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePreviewWord}
          disabled={loading}
          className="px-5 py-2 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? 'Memuat...' : 'Preview'}
        </button>
        <button
          type="button"
          onClick={handleExportSave}
          disabled={loading}
          className="px-5 py-2 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? 'Memuat...' : 'Export'}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          disabled={loading}
          className="px-5 py-2 rounded-lg font-semibold text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Memuat...' : 'Print'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-5 py-2 rounded-lg font-semibold text-white bg-rose-500 hover:bg-rose-600"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 flex flex-col gap-5 max-h-[calc(100vh-230px)] overflow-y-auto">
          <section className="border border-slate-200 rounded-2xl bg-slate-50/60">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
              <h3 className="text-base font-semibold text-slate-700">Filter Data</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">{labelTitle}</label>
                <input
                  type="text"
                  value={judulLabel}
                  onChange={(e) => setJudulLabel(e.target.value)}
                  placeholder={labelPlaceholder}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
                <div />
              </div>

              {selectFilters.map((filter) => (
                <div key={filter.key} className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">{filter.label}</label>
              <select
                value={selectValues[filter.key] ?? ''}
                onChange={(e) => setSelectValues((prev) => ({ ...prev, [filter.key]: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white text-slate-700"
                style={{ color: selectValues[filter.key] ? undefined : '#9ca3af' }}
              >
                <option value="" className="text-slate-400">
                  Pilih {filter.label}
                </option>
                {(options[optionKeyMap[filter.key]] ?? []).map((opt) => (
                  <option key={opt} value={opt} className="text-slate-700">
                    {opt}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 justify-end">
                <input
                  type="checkbox"
                  checked={Boolean(selectActive[filter.activeKey])}
                  onChange={() => setSelectActive((prev) => ({ ...prev, [filter.activeKey]: !prev[filter.activeKey] }))}
                      className="w-4 h-4 accent-rose-500"
                    />
                    Aktif
                  </label>
                </div>
              ))}

              {textFilters.map((filter) => (
                <div key={filter.key} className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">{filter.label}</label>
              <select
                value={textValues[filter.key] ?? ''}
                onChange={(e) => setTextValues((prev) => ({ ...prev, [filter.key]: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white text-slate-700"
                style={{ color: textValues[filter.key] ? undefined : '#9ca3af' }}
              >
                <option value="" className="text-slate-400">
                  Pilih {filter.label}
                </option>
                {(filter.key === 'tbusiness' ? options.business : options.nonBusiness).map((opt) => (
                  <option key={opt} value={opt} className="text-slate-700">
                    {opt}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 justify-end">
                <input
                  type="checkbox"
                  checked={Boolean(textActive[filter.activeKey])}
                  onChange={() => setTextActive((prev) => ({ ...prev, [filter.activeKey]: !prev[filter.activeKey] }))}
                      className="w-4 h-4 accent-rose-500"
                    />
                    Aktif
                  </label>
                </div>
              ))}
            </div>
          </section>

          {checkboxSections.map((group) => renderCheckboxGroup(group))}
        </div>

        <aside className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 flex flex-col gap-4">
          <div className="border border-slate-200 rounded-2xl bg-slate-50">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-700">{previewTitle}</h3>
              <span className="px-3 py-1 text-xs font-semibold text-sky-700 bg-sky-100 rounded-full border border-sky-200">
                {count} data
              </span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                {message}
                <br />
                <span className="text-xs text-slate-500">
                  Pratinjau ditampilkan sebagai PDF agar langsung terlihat, namun layout mengikuti Word utama.
                </span>
              </p>
              {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
              <div className="relative h-[400px] rounded-xl border border-dashed border-slate-300 bg-white overflow-hidden">
                {previewUrl ? (
                  <object data={previewUrl} type={previewMime} className="w-full h-full" aria-label="Preview Word">
                    <p className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                      Preview tidak dapat ditampilkan di viewer ini.
                    </p>
                  </object>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    Preview laporan akan tampil di sini.
                  </div>
                )}
                {loading ? (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-semibold text-slate-600">
                    Memproses...
                  </div>
                ) : null}
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Current Page No.:</span>
                <span>Total Page No.:</span>
                <span>Zoom Factor: 100%</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl bg-slate-50">
            <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700">Jumlah Data</h4>
              <span className="text-2xl font-bold text-slate-900">{count}</span>
            </div>
            <div className="p-4 text-sm text-slate-600">
              <p>Total data sesuai filter dan kondisi aktif.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

const PrintLabelPerusahaan = () => <PrintLabelTemplate title="Cetak Label Perusahaan" onSubmit={requestLabelPerusahaan} />

export default PrintLabelPerusahaan

function extractBase64(data: unknown): string | null {
  const payload: any = data
  if (!payload) return null
  if (typeof payload.base64 === 'string' && payload.base64.trim()) return payload.base64.trim()
  if (typeof payload === 'string' && payload.trim()) return payload.trim()

  const buf = payload?.buffer ?? payload?.data
  if (typeof buf === 'string' && buf.trim()) return buf.trim()

  if (buf?.type === 'Buffer' && Array.isArray(buf.data)) {
    return toBase64(new Uint8Array(buf.data))
  }

  if (buf instanceof ArrayBuffer) return toBase64(new Uint8Array(buf))
  if (ArrayBuffer.isView(buf) && buf.buffer) return toBase64(new Uint8Array(buf.buffer))

  if (payload?.data?.type === 'Buffer' && Array.isArray(payload.data.data)) {
    return toBase64(new Uint8Array(payload.data.data))
  }
  return null
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function base64ToBlobUrl(base64: string, contentType = 'application/pdf') {
  const byteString = atob(base64)
  const len = byteString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) bytes[i] = byteString.charCodeAt(i)
  const blob = new Blob([bytes], { type: contentType })
  return URL.createObjectURL(blob)
}

