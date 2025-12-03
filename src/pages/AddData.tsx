import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { comboFields, comboOptions, type ComboFieldName, code2Options, code3Options } from '../constants/addDataOptions'
import { provinceCityMap, provinceOptions } from '../constants/provinces'
import { countryDial } from '../constants/countryDial'
import {
  exhibitorFlagMap,
  visitorFlagMap,
  typeOfVisitorFlagMap,
  invitationFlagMap,
  openingCeremonyFlagMap,
  kartuUcapanFlagMap,
  posterFlagMap,
  tidakKirimFlagMap,
} from '../constants/flagMaps'
import { saveAddData, updateAddData, findCompanyRecords, type AddDataPayload } from '../services/addData'
import { useAppStore } from '../store/appStore'

type AddDataVariant = 'exhibitor' | 'visitor'

type AddDataForm = {
  typeOfBusiness: string
  company: string
  address1: string
  address2: string
  province: string
  city: string
  zip: string
  codePhone: string
  phoneNumber: string
  facsimile: string
  handphone: string
  sex: string
  name: string
  position: string
  email: string
  website: string
  mainActive: string[]
  business: string[]
  source: string
  updateBy: string
  forum: string
  exhibitorTahun: string
  code1: string
  code2: string
  code3: string
  exhibitor: string[]
  visitor: string[]
  typeOfVisitor: string[]
  specialInvitationIndoDefence: string[]
  openingCeremony: string[]
  kartuUcapan: string[]
  poster: string[]
  tidakDikirim: string[]
  lastUpdate: string
  verify: boolean
}

type AddDataProps = {
  variant: AddDataVariant
  onBack?: () => void
  initialRow?: Record<string, unknown> | null
  initialId?: string | number | null
}

type FieldName = keyof AddDataForm

const minLengths: Record<Exclude<FieldName, 'verify' | 'lastUpdate'>, number> = {
  typeOfBusiness: 2,
  company: 40,
  address1: 40,
  address2: 50,
  province: 30,
  city: 30,
  zip: 10,
  codePhone: 5,
  phoneNumber: 20,
  facsimile: 20,
  handphone: 20,
  sex: 4,
  name: 35,
  position: 40,
  email: 40,
  website: 50,
  mainActive: 2,
  business: 2,
  source: 30,
  updateBy: 10,
  forum: 5,
  exhibitorTahun: 10,
  code1: 10,
  code2: 2,
  code3: 2,
  exhibitor: 2,
  visitor: 2,
  typeOfVisitor: 2,
  specialInvitationIndoDefence: 2,
  openingCeremony: 2,
  kartuUcapan: 2,
  poster: 2,
  tidakDikirim: 2,
}
const labelMap: Record<FieldName, string> = {
  typeOfBusiness: 'Type of Business (PT / CV / UD / Etc)',
  company: 'Company',
  address1: 'Address 1',
  address2: 'Address 2',
  province: 'Province (Choose)',
  city: 'City (Choose)',
  zip: 'ZIP',
  codePhone: 'Code Phone',
  phoneNumber: 'Phone Number',
  facsimile: 'Facsimile',
  handphone: 'Handphone',
  sex: 'Sex (Mr. / Mrs / Ms. / Etc)',
  name: 'Name',
  position: 'Position',
  email: 'Email',
  website: 'Website',
  mainActive: 'Main Active (Choose)',
  business: 'Business',
  source: 'Source',
  updateBy: 'Update By',
  forum: 'Forum',
  exhibitorTahun: 'Exhibitor Tahun',
  code1: 'Code 1',
  code2: 'Code 2',
  code3: 'Code 3',
  exhibitor: 'Exhibitor',
  visitor: 'Visitor',
  typeOfVisitor: 'Type of Visitor',
  specialInvitationIndoDefence: 'Special Invitation Indo Defence',
  openingCeremony: 'Opening Ceremony',
  kartuUcapan: 'Kartu Ucapan',
  poster: 'Poster',
  tidakDikirim: 'Tidak Dikirim',
  lastUpdate: 'Last Update',
  verify: 'Verify',
}

const isComboField = (name: FieldName): name is ComboFieldName => comboFields.includes(name as ComboFieldName)


const requiredFields = new Set<FieldName>([
  'address1',
  'province',
  'city',
  'name',
  'mainActive',
  'business',
  'source',
  'lastUpdate',
])

const leftFields: FieldName[] = [
  'typeOfBusiness',
  'company',
  'address1',
  'address2',
  'province',
  'city',
  'zip',
  'codePhone',
  'phoneNumber',
  'facsimile',
  'handphone',
  'sex',
  'name',
  'position',
  'email',
  'website',
  'mainActive',
  'business',
]

const rightFields: FieldName[] = [
  'source',
  'updateBy',
  'lastUpdate',
  'forum',
  'exhibitorTahun',
  'code1',
  'code2',
  'code3',
  'exhibitor',
  'visitor',
  'typeOfVisitor',
  'specialInvitationIndoDefence',
  'openingCeremony',
  'kartuUcapan',
  'poster',
  'tidakDikirim',
]

  const defaultForm = (): AddDataForm => ({
  typeOfBusiness: '',
  company: '',
  address1: '',
  address2: '',
  province: '',
  city: '',
  zip: '',
  codePhone: '',
  phoneNumber: '',
  facsimile: '',
  handphone: '',
  sex: '',
  name: '',
  position: '',
  email: '',
  website: '',
  mainActive: [],
  business: [],
  source: '',
  updateBy: '',
  forum: '',
  exhibitorTahun: '',
  code1: '',
  code2: '',
  code3: '',
  exhibitor: [],
  visitor: [],
  typeOfVisitor: [],
  specialInvitationIndoDefence: [],
  openingCeremony: [],
  kartuUcapan: [],
  poster: [],
  tidakDikirim: [],
  lastUpdate: new Date().toISOString().split('T')[0],
  verify: false,
})

const helperText = (name: FieldName) => {
  if (name === 'verify') return ''
  if (name === 'lastUpdate') return 'Pilih tanggal terakhir diperbarui.'
  return ''
}

const AddDataPage = ({ variant, onBack, initialRow = null, initialId = null }: AddDataProps) => {
  const { user, setGlobalMessage } = useAppStore()
  const [form, setForm] = useState<AddDataForm>(defaultForm)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const highlightIndexRef = useRef(0)
  const rowsRef = useRef<Record<string, unknown>[]>([])
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [openCombo, setOpenCombo] = useState<FieldName | null>(null)
  const [provinceQuery, setProvinceQuery] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [companyLookup, setCompanyLookup] = useState<{
    open: boolean
    loading: boolean
    rows: Record<string, unknown>[]
    query: string
  }>({
    open: false,
    loading: false,
    rows: [],
    query: '',
  })
  const [comboSearch, setComboSearch] = useState<Record<ComboFieldName, string>>({
    mainActive: '',
    business: '',
    exhibitor: '',
    visitor: '',
    typeOfVisitor: '',
    specialInvitationIndoDefence: '',
    openingCeremony: '',
    kartuUcapan: '',
    poster: '',
    tidakDikirim: '',
  })
  const numericFields = new Set<FieldName>(['zip', 'codePhone', 'phoneNumber', 'facsimile', 'handphone'])
  const uppercaseFields = new Set<FieldName>(['typeOfBusiness', 'company'])
  const staticUpdateBy = ['Catalog', 'Email', 'Fax', 'Form13', 'NameCard', 'Others', 'Tlp', 'Web', 'YPages']
  const updateByPrefixes = [
    'VisWtr',
    'VisRen',
    'VisISF',
    'VisISC',
    'VisLives',
    'VisFish',
    'VisAgro',
    'VisVet',
    'VisDef',
    'VisAero',
    'VisMarine',
    'RegWtr',
    'RegRen',
    'RegISF',
    'RegISC',
    'RegLives',
    'RegFish',
    'RegAgro',
    'RegVet',
    'RegDef',
    'RegAero',
    'RegMarine',
  ]

  useEffect(() => {
    if (!companyLookup.open) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCompanyLookup((prev) => ({ ...prev, open: false }))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [companyLookup.open])

  const normalizeSpaces = (value: string) => value.replace(/\s{2,}/g, ' ')

  const toTitleCase = (value: string) => {
    const text = normalizeSpaces(value)
    if (!text) return ''
    const titled = text
      .toLowerCase()
      .split(' ')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
      .join(' ')
    return titled
  }

  const sanitizeText = (value: string, field?: FieldName) => {
    if (field === 'email' || field === 'website') {
      return normalizeSpaces(value)
    }

    if (uppercaseFields.has(field as FieldName)) {
      const text = normalizeSpaces(value)
      return text.toUpperCase()
    }

    if (field === 'province' || field === 'city') {
      const text = normalizeSpaces(value)
      if (!text) return ''
      const isAllCaps = text === text.toUpperCase()
      const result = isAllCaps ? text : toTitleCase(text)
      return result
    }

    const text = normalizeSpaces(value)
    if (!text) return ''
    const titled = text
      .toLowerCase()
      .split(' ')
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
      .join(' ')
    return titled
  }

  const sanitizeNumeric = (value: string) => value.replace(/\D+/g, '')

  const trimField = (field: FieldName) => {
    setForm((prev) => {
      const value = String(prev[field] ?? '')
      const trimmed = normalizeSpaces(value)
      return { ...prev, [field]: trimmed }
    })
  }

  const handleChange =
    (field: FieldName) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const rawValue = event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value
      if (field === 'verify') {
        const checked = Boolean(rawValue)
        setForm((prev) => {
          const next: AddDataForm = { ...prev, verify: checked }
          if (checked) {
            next.code2 = 'OK'
          } else {
            next.code2 = ''
          }
          return next
        })
        return
      }
      if (field === 'lastUpdate') {
        setForm((prev) => ({ ...prev, lastUpdate: String(rawValue) }))
        return
      }

      if (numericFields.has(field)) {
        setForm((prev) => ({ ...prev, [field]: sanitizeNumeric(String(rawValue)) }))
        return
      }

      const nextValue = sanitizeText(String(rawValue), field)
      setForm((prev) => ({ ...prev, [field]: nextValue }))
    }

  const toggleComboOption = (field: FieldName, option: string) => {
    if (!isComboField(field)) return
    setForm((prev) => {
      const current = Array.isArray(prev[field]) ? (prev[field] as string[]) : []
      const exists = current.includes(option)
      const next = exists ? current.filter((item) => item !== option) : [...current, option]
      return { ...prev, [field]: next }
    })
  }

  const handleProvinceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeText(event.target.value, 'province')
    setProvinceQuery(value)
    setForm((prev) => ({ ...prev, province: value, city: '' }))
  }

  const handleCityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeText(event.target.value, 'city')
    setCityQuery(value)
    const dial = countryDial[value] ?? ''
    setForm((prev) => ({
      ...prev,
      city: value,
      codePhone: dial || prev.codePhone,
    }))
  }

  const filteredProvinceOptions = useMemo(() => {
    const term = provinceQuery.trim().toLowerCase()
    if (!term) return provinceOptions
    return provinceOptions.filter((option) => option.toLowerCase().includes(term))
  }, [provinceQuery])

  const cityOptions = useMemo(() => provinceCityMap[form.province] ?? [], [form.province])

  const filteredCityOptions = useMemo(() => {
    const term = cityQuery.trim().toLowerCase()
    if (!term) return cityOptions
    return cityOptions.filter((option) => option.toLowerCase().includes(term))
  }, [cityOptions, cityQuery])

  const updateByOptions = useMemo(() => {
    const yy = String(new Date().getFullYear() % 100).padStart(2, '0')
    const prefixed = updateByPrefixes.map((pre) => `${pre}${yy}`)
    return Array.from(new Set([...staticUpdateBy, ...prefixed]))
  }, [])

  const filteredUpdateByOptions = useMemo(() => {
    const term = form.updateBy.trim().toLowerCase()
    if (!term) return updateByOptions
    return updateByOptions.filter((opt) => opt.toLowerCase().includes(term))
  }, [form.updateBy, updateByOptions])

  const exhibitorYearSuggestions = useMemo(() => {
    const yy = String(new Date().getFullYear() % 100).padStart(2, '0')
    return [`EXH${yy}`]
  }, [])

  const companyColumns = useMemo(() => {
    const preferred = ['nourut', 'company', 'name', 'position', 'city', 'code', 'phone', 'email', 'zip', 'lastupdate', 'tgljamedit']
    const seen = new Set<string>()
    const columns: string[] = []
    const push = (key: string) => {
      const normalized = key.toLowerCase()
      if (seen.has(normalized)) return
      seen.add(normalized)
      columns.push(key)
    }

    preferred.forEach(push)
    companyLookup.rows.forEach((row) => {
      Object.keys(row || {}).forEach(push)
    })
    return columns
  }, [companyLookup.rows])

  const handleCitySelect = (name: string) => {
    const sanitized = sanitizeText(name, 'city')
    const dial = countryDial[sanitized] ?? ''
    setForm((prev) => ({
      ...prev,
      city: sanitized,
      codePhone: dial || prev.codePhone,
    }))
    setCityQuery(sanitized)
  }

  const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) return '-'
    if (Array.isArray(value)) return value.join(', ')
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object') return JSON.stringify(value)
    const text = String(value)
    return text.trim() === '' ? '-' : text
  }

  const handleCompanyKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const query = form.company.trim()
    if (!query) {
      setFeedback({ type: 'error', message: 'Company wajib diisi sebelum pencarian.' })
      return
    }
    setFeedback(null)
    setCompanyLookup(() => ({ open: false, loading: true, rows: [], query }))
    try {
      const rows = await findCompanyRecords(query)
      if (!rows || rows.length === 0) {
        setCompanyLookup({ open: false, loading: false, rows: [], query })
        setFeedback({ type: 'error', message: 'Company belum ada di database' })
        return
      }
      setCompanyLookup({ open: true, loading: false, rows, query })
      setHighlightIndex(0)
    } catch (error) {
      setCompanyLookup((prev) => ({ ...prev, loading: false }))
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Gagal mencari company' })
    }
  }

  const toDateInput = (value: unknown) => {
    if (!value) return ''
    const parsed = new Date(String(value))
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toISOString().slice(0, 10)
  }

  const isFlagX = (value: unknown) => {
    if (value === undefined || value === null) return false
    const text = String(value).trim().toLowerCase()
    return text === 'x' || text === '1' || text === 'yes' || text === 'true'
  }

  const pickFlagLabels = (row: Record<string, unknown>, map: Record<string, string>) => {
    const lower: Record<string, unknown> = {}
    Object.entries(row || {}).forEach(([key, value]) => {
      lower[key.toLowerCase()] = value
    })

    return Object.entries(map)
      .filter(([, code]) => isFlagX(lower[code.toLowerCase()]))
      .map(([label]) => label)
  }

  const pickFirstFilled = (lower: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const val = lower[key]
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val
      }
    }
    return ''
  }

  const splitList = (value: unknown) =>
    String(value ?? '')
      .split(',')
      .map((item) => sanitizeText(item, 'business'))
      .filter(Boolean)

  const applyCompanyRow = (row: Record<string, unknown>, options?: { keepPopup?: boolean }) => {
    const lower: Record<string, unknown> = {}
    Object.entries(row || {}).forEach(([key, value]) => {
      lower[key.toLowerCase()] = value
    })

    const next: AddDataForm = {
      typeOfBusiness: String(lower['pt_cv'] ?? lower['ptcv'] ?? ''),
      company: String(lower['company'] ?? ''),
      address1: String(lower['address1'] ?? ''),
      address2: String(lower['address2'] ?? ''),
      province: sanitizeText(String(lower['propince'] ?? ''), 'province'),
      city: sanitizeText(String(lower['city'] ?? ''), 'city'),
      zip: String(lower['zip'] ?? ''),
      codePhone: String(lower['code'] ?? ''),
      phoneNumber: String(lower['phone'] ?? ''),
      facsimile: String(lower['facsimile'] ?? ''),
      handphone: String(lower['handphone'] ?? ''),
      sex: String(lower['sex'] ?? ''),
      name: sanitizeText(String(lower['name'] ?? ''), 'name'),
      position: sanitizeText(String(lower['position'] ?? ''), 'position'),
      email: String(lower['email'] ?? ''),
      website: String(lower['website'] ?? ''),
      mainActive: splitList(pickFirstFilled(lower, ['main_activ', 'mainactiv'])),
      business: splitList(pickFirstFilled(lower, ['business'])),
      source: String(lower['code4'] ?? lower['source'] ?? ''),
      updateBy: String(lower['source'] ?? ''),
      forum: String(lower['forum'] ?? ''),
      exhibitorTahun: String(lower['exhthn'] ?? ''),
      code1: String(lower['code1'] ?? ''),
      code2: String(lower['code2'] ?? ''),
      code3: String(lower['code3'] ?? ''),
      exhibitor: pickFlagLabels(lower, exhibitorFlagMap),
      visitor: pickFlagLabels(lower, visitorFlagMap),
      typeOfVisitor: pickFlagLabels(lower, typeOfVisitorFlagMap),
      specialInvitationIndoDefence: pickFlagLabels(lower, invitationFlagMap),
      openingCeremony: pickFlagLabels(lower, openingCeremonyFlagMap),
      kartuUcapan: pickFlagLabels(lower, kartuUcapanFlagMap),
      poster: pickFlagLabels(lower, posterFlagMap),
      tidakDikirim: pickFlagLabels(lower, tidakKirimFlagMap),
      lastUpdate: toDateInput(lower['lastupdate']),
      verify: String(lower['code2'] ?? '').trim().toUpperCase() === 'OK',
    }

    setForm((prev) => ({ ...prev, ...next }))
    const rawId = lower['nourut'] ?? lower['id'] ?? lower['pk']
    const normalizedId =
      rawId == null
        ? null
        : typeof rawId === 'number'
        ? rawId
        : String(rawId).trim() || null
    setSelectedId(normalizedId)
    if (!options?.keepPopup) {
      setCompanyLookup((prev) => ({ ...prev, open: false }))
    }
    setHighlightIndex(0)
    setFeedback({ type: 'success', message: 'Data company berhasil dimuat ke form.' })
  }

  const clampIndex = (value: number, max: number) => {
    if (max <= 0) return 0
    if (value < 0) return 0
    if (value >= max) return max - 1
    return value
  }

  const setHighlight = (next: number, total: number) => {
    const clamped = clampIndex(next, total)
    highlightIndexRef.current = clamped
    setHighlightIndex(clamped)
  }

  const hasAnyInput = () => {
    const baseline = defaultForm()
    return Object.keys(form).some((key) => {
      const current = (form as any)[key]
      const initial = (baseline as any)[key]

      if (Array.isArray(current)) {
        return current.length > 0
      }
      return String(current ?? '') !== String(initial ?? '')
    })
  }

  const applyFlags = (map: Record<string, string>, selected: string[], target: AddDataPayload) => {
    Object.values(map).forEach((code) => {
      target[code.toLowerCase()] = null
    })
    selected.forEach((label) => {
      const code = map[label]
      if (code) target[code.toLowerCase()] = 'X'
    })
  }

  const buildPayload = (overrideDate?: string): AddDataPayload => {
    const userName =
      user?.username ??
      (window.process as unknown as { env?: Record<string, string> })?.env?.USERNAME ??
      'app-user'
    const now = new Date()
    const tglJamEdit = now.toISOString().replace('T', ' ').slice(0, 19)
    const dateValue = overrideDate ?? form.lastUpdate

    const payload: AddDataPayload = {
      ptCv: form.typeOfBusiness.trim(),
      company: form.company.trim(),
      address1: form.address1.trim(),
      address2: form.address2.trim(),
      city: form.city.trim(),
      zip: form.zip,
      propince: form.province.trim(),
      code: form.codePhone,
      phone: form.phoneNumber,
      facsimile: form.facsimile,
      handphone: form.handphone,
      sex: form.sex,
      name: form.name.trim(),
      position: form.position.trim(),
      email: form.email.trim(),
      mainActiv: form.mainActive.join(', '),
      business: form.business.join(', '),
      code4: form.source.trim(),
      source: form.updateBy.trim(),
      forum: form.forum.trim(),
      exhthn: form.exhibitorTahun.trim(),
      code1: form.code1.trim(),
      code2: form.code2.trim(),
      code3: form.code3.trim(),
      lastupdate: new Date(dateValue).toISOString(),
      website: form.website.trim(),
      namauser: userName,
      tglJamEdit: tglJamEdit,
    }

    applyFlags(exhibitorFlagMap, form.exhibitor, payload)
    applyFlags(visitorFlagMap, form.visitor, payload)
    applyFlags(typeOfVisitorFlagMap, form.typeOfVisitor, payload)
    applyFlags(invitationFlagMap, form.specialInvitationIndoDefence, payload)
    applyFlags(openingCeremonyFlagMap, form.openingCeremony, payload)
    applyFlags(kartuUcapanFlagMap, form.kartuUcapan, payload)
    applyFlags(posterFlagMap, form.poster, payload)
    applyFlags(tidakKirimFlagMap, form.tidakDikirim, payload)

    return payload
  }

  const filteredComboOptions = (name: ComboFieldName) => {
    const term = comboSearch[name]?.trim().toLowerCase() || ''
    const options = comboOptions[name] ?? []
    if (!term) return options
    return options.filter((opt) => opt.toLowerCase().includes(term))
  }

  const validate = () => {
    const errors: string[] = []
    const requiredFieldsList: FieldName[] = ['address1', 'province', 'city', 'name', 'mainActive', 'business', 'source', 'lastUpdate']
    requiredFieldsList.forEach((key) => {
      const rawValue = form[key]
      const hasValue = Array.isArray(rawValue) ? rawValue.length > 0 : String(rawValue).trim() !== ''
      if (!hasValue) errors.push(`${labelMap[key]} wajib diisi.`)
    })

    return errors
  }

  const handleSubmit =
    (action: 'add' | 'update') =>
    async (event: FormEvent) => {
      event.preventDefault()
      const errors = validate()
      if (errors.length > 0) {
        setFeedback({ type: 'error', message: errors[0] })
        setGlobalMessage({ type: 'error', text: errors[0] })
        return
      }

      if (action === 'update' && !selectedId) {
        setFeedback({ type: 'error', message: 'Pilih data dari pencarian Company sebelum update.' })
        setGlobalMessage({ type: 'error', text: 'Pilih data dari pencarian Company sebelum update.' })
        return
      }

      const actionLabel = action === 'add' ? 'Add/Save (F5)' : 'Update/Edit (F2)'
      const overrideDate = action === 'update' ? new Date().toISOString().slice(0, 10) : undefined
      if (overrideDate) {
        setForm((prev) => ({ ...prev, lastUpdate: overrideDate }))
      }
      setSaving(true)
      try {
        const payload = buildPayload(overrideDate)
        const response = action === 'add' ? await saveAddData(payload) : await updateAddData(selectedId as string | number, payload)
        const success = response?.success !== false
        if (success) {
          setFeedback({ type: 'success', message: `${actionLabel} berhasil disimpan.` })
          setGlobalMessage({ type: 'success', text: `${actionLabel} berhasil disimpan.` })
          setForm(defaultForm())
          setSelectedId(null)
          setCompanyLookup((prev) => ({ ...prev, open: false, rows: [], query: '' }))
        } else {
          setFeedback({ type: 'error', message: response?.message ?? `${actionLabel} gagal.` })
          setGlobalMessage({ type: 'error', text: response?.message ?? `${actionLabel} gagal.` })
        }
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : `${actionLabel} gagal.` })
        setGlobalMessage({ type: 'error', text: error instanceof Error ? error.message : `${actionLabel} gagal.` })
      } finally {
        setSaving(false)
      }
    }

  const handleCancel = () => {
    const hasInput = hasAnyInput()
    setFeedback(null)
    setCompanyLookup((prev) => ({ ...prev, open: false }))
    setSelectedId(null)

    if (hasInput) {
      setForm(defaultForm())
      return
    }

    if (onBack) {
      onBack()
      setForm(defaultForm())
    } else {
      setForm(defaultForm())
    }
  }

  const submitAdd = handleSubmit('add')
  const submitUpdate = handleSubmit('update')

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (companyLookup.open) return
      if (event.ctrlKey || event.metaKey || event.altKey) return

      if (event.key === 'F5') {
        event.preventDefault()
        submitAdd(event as any)
      } else if (event.key === 'F2') {
        event.preventDefault()
        submitUpdate(event as any)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [companyLookup.open, submitAdd, submitUpdate, handleCancel])

  useEffect(() => {
    rowsRef.current = companyLookup.rows
  }, [companyLookup.rows])

  useEffect(() => {
    if (initialRow) {
      applyCompanyRow(initialRow, { keepPopup: true })
      if (initialId !== undefined && initialId !== null) {
        setSelectedId(initialId)
      }
    } else {
      setSelectedId(null)
      setForm(defaultForm())
    }
  }, [initialRow, initialId])

  useEffect(() => {
    if (companyLookup.open) {
      setHighlight(0, companyLookup.rows.length)
      popupRef.current?.focus()
    }
  }, [companyLookup.open, companyLookup.rows.length])

  const handlePopupKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!companyLookup.open) return
    if (event.ctrlKey || event.metaKey || event.altKey) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      setHighlight(highlightIndexRef.current + 1, companyLookup.rows.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      setHighlight(highlightIndexRef.current - 1, companyLookup.rows.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      const row = companyLookup.rows[clampIndex(highlightIndexRef.current, companyLookup.rows.length)]
      if (row) applyCompanyRow(row)
    }
  }

  const renderField = (name: FieldName) => {
    if (name === 'verify') {
      return null
    }

    const isDate = name === 'lastUpdate'
    const isCombo = isComboField(name)
    const minLength = minLengths[name as Exclude<FieldName, 'verify' | 'lastUpdate'>]
    const selected = (form[name] as string[]) ?? []

    if (name === 'province') {
      return (
        <div className="space-y-2" key={name}>
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
            {labelMap[name]}
            <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.province}
              onChange={handleProvinceChange}
              onBlur={() => setForm((prev) => ({ ...prev, province: sanitizeText(prev.province, 'province') }))}
              list="province-options"
              maxLength={minLength}
              required
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Pilih province"
            />
            <datalist id="province-options">
              {filteredProvinceOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <p className="text-xs text-slate-500">Pilih kode/region provinsi lalu City akan menyesuaikan.</p>
        </div>
      )
    }

    if (name === 'city') {
      return (
        <div className="space-y-2" key={name}>
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
            {labelMap[name]}
            <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.city}
              onChange={handleCityChange}
              onBlur={() => handleCitySelect(form.city)}
              list="city-options"
              maxLength={minLength}
              required
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Pilih city"
            />
            <datalist id="city-options">
              {filteredCityOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <p className="text-xs text-slate-500">
            Daftar City mengikuti province terpilih. Kosongkan atau ubah province bila tidak sesuai.
          </p>
        </div>
      )
    }

    if (name === 'code2' || name === 'code3') {
      const options = name === 'code2' ? code2Options : code3Options
      return (
        <div className="space-y-2" key={name}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
              {labelMap[name]}
              {requiredFields.has(name) ? <span className="text-rose-600">*</span> : null}
            </label>
            {name === 'code2' ? (
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.verify}
                  onChange={handleChange('verify')}
                  className="w-4 h-4 accent-rose-600"
                />
                {labelMap.verify}
              </label>
            ) : null}
          </div>
          <select
            value={form[name] as string}
            onChange={handleChange(name)}
            required={requiredFields.has(name)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
          >
            <option value="" disabled>
              Pilih opsi
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">{helperText(name)}</p>
        </div>
      )
    }

    if (name === 'updateBy') {
      return (
        <div className="space-y-2" key={name}>
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
            {labelMap[name]}
            {requiredFields.has(name) ? <span className="text-rose-600">*</span> : null}
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.updateBy}
              onChange={handleChange('updateBy')}
              list="updateby-options"
              maxLength={minLength}
              required={requiredFields.has(name)}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Pilih atau ketik"
            />
            <datalist id="updateby-options">
              {filteredUpdateByOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <p className="text-xs text-slate-500">Saran mengikuti tahun berjalan.</p>
        </div>
      )
    }

    if (name === 'exhibitorTahun') {
      return (
        <div className="space-y-2" key={name}>
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
            {labelMap[name]}
            {requiredFields.has(name) ? <span className="text-rose-600">*</span> : null}
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.exhibitorTahun}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  exhibitorTahun: event.target.value.toUpperCase(),
                }))
              }
              list="exhibitor-year-options"
              maxLength={minLength}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="EXH25"
            />
            <datalist id="exhibitor-year-options">
              {exhibitorYearSuggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <p className="text-xs text-slate-500">Gunakan format EXHYY, contoh tahun ini: {exhibitorYearSuggestions[0]}.</p>
        </div>
      )
    }

    return (
      <div className="space-y-2" key={name}>
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
          {labelMap[name]}
          {requiredFields.has(name) ? <span className="text-rose-600">*</span> : null}
        </label>
        {name === 'company' ? (
          <p className="text-xs text-slate-500">Tekan Enter untuk cek apakah nama Company sudah ada di database.</p>
        ) : null}
        {isCombo ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenCombo((prev) => (prev === name ? null : name))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 text-left focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition flex items-center justify-between"
            >
              <span className="flex flex-wrap gap-2">
                {selected.length === 0 ? (
                  <span className="text-slate-400">Pilih opsi (bisa lebih dari satu)</span>
                ) : (
                  selected.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-3 py-1 text-xs font-semibold border border-rose-100"
                    >
                      {item}
                      <span
                        role="button"
                        tabIndex={-1}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleComboOption(name, item)
                        }}
                        className="cursor-pointer text-rose-500 hover:text-rose-700"
                      >
                        x
                      </span>
                    </span>
                  ))
                )}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`w-4 h-4 text-slate-500 transition-transform ${openCombo === name ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {openCombo === name ? (
              <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2 max-h-60 overflow-auto">
                <div className="px-2 pb-2">
                  <input
                    type="search"
                    value={comboSearch[name as ComboFieldName]}
                    onChange={(event) =>
                      setComboSearch((prev) => ({
                        ...prev,
                        [name as ComboFieldName]: event.target.value,
                      }))
                    }
                    placeholder="Ketik untuk filter"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
                {filteredComboOptions(name as ComboFieldName).map((option) => {
                  const checked = selected.includes(option)
                  return (
                    <label
                      key={option}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-50 cursor-pointer text-sm text-slate-800"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-rose-600"
                        checked={checked}
                        onChange={() => toggleComboOption(name, option)}
                      />
                      <span className="flex-1">{option}</span>
                    </label>
                  )
                })}
                {selected.length > 0 ? (
                  <button
                    type="button"
                    className="mt-2 ml-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        [name]: [],
                      }))
                    }
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="relative">
            <input
              type={isDate ? 'date' : name === 'email' ? 'email' : 'text'}
              name={name}
              id={name}
              value={form[name] as string}
              onChange={handleChange(name)}
              onBlur={() => trimField(name)}
              onKeyDown={name === 'company' ? handleCompanyKeyDown : undefined}
              required={requiredFields.has(name)}
              maxLength={minLength}
              autoComplete="off"
              className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition ${isDate ? 'pr-10' : ''}`}
              placeholder={requiredFields.has(name) ? 'Wajib diisi' : 'Isi data'}
            />
            {name === 'company' && companyLookup.loading ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-rose-600 animate-pulse">
                Checking...
              </span>
            ) : null}
          </div>
        )}
        <p className="text-xs text-slate-500">
          {helperText(name)}
          {isCombo ? ' Pilih lebih dari satu bila diperlukan.' : ''}
        </p>
      </div>
    )
  }

  const headerTitle = useMemo(() => (variant === 'exhibitor' ? 'Add Data - Exhibitor' : 'Add Data - Visitor'), [variant])

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-600 border border-slate-200"
          aria-label="Back to list"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m14 18-6-6 6-6" />
          </svg>
        </button>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-rose-600">Form Input</p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{headerTitle}</h1>
          <p className="text-sm text-slate-600">Lengkapi seluruh field sesuai kebutuhan minimal karakter.</p>
        </div>
      </div>

      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <form className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6" onSubmit={submitAdd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">{leftFields.map((field) => renderField(field))}</div>
          <div className="space-y-4">{rightFields.map((field) => renderField(field))}</div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-md hover:shadow-lg"
          >
            {saving ? 'Saving...' : 'Add/Save (F5)'}
          </button>
          <button
            type="button"
            onClick={submitUpdate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white font-semibold shadow-sm hover:bg-slate-900"
          >
            {saving ? 'Saving...' : 'Update/Edit (F2)'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300"
          >
            Cancel (ESC)
          </button>
        </div>
      </form>

      {companyLookup.open ? (
        <div
          className="fixed inset-0 z-30 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 pt-10"
          tabIndex={-1}
          ref={popupRef}
          onKeyDown={handlePopupKeyDown}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[80vh] overflow-hidden border border-slate-200">
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Company ditemukan</p>
                <h3 className="text-lg font-bold text-slate-900">
                  {companyLookup.rows.length} data untuk "{companyLookup.query}"
                </h3>
                <p className="text-xs text-slate-500">Tekan Escape atau Close untuk menutup popup.</p>
              </div>
              <button
                type="button"
                onClick={() => setCompanyLookup((prev) => ({ ...prev, open: false }))}
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
              >
                Close
              </button>
            </div>

            <div className="px-6 py-4 overflow-auto max-h-[64vh]">
              <div className="min-w-[720px] overflow-auto">
                <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      {companyColumns.map((column) => (
                        <th key={column} className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {companyLookup.rows.map((row, index) => (
                      <tr
                        key={String((row as Record<string, unknown>)['nourut'] ?? index)}
                        className={`cursor-pointer ${
                          highlightIndex === index ? 'bg-rose-50 ring-1 ring-rose-200' : 'hover:bg-rose-50'
                        }`}
                        onClick={() => applyCompanyRow(row)}
                        onMouseEnter={() => setHighlight(index, companyLookup.rows.length)}
                      >
                        {companyColumns.map((column) => (
                          <td key={column} className="px-3 py-2 align-top text-slate-800">
                            {formatCellValue((row as Record<string, unknown>)[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AddDataPage
