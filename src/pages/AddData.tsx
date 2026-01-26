import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
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
import {
  saveAddData,
  updateAddData,
  findCompanyRecords,
  exportPersonalDatabasePdf,
  listGabungRecords,
  listSourceOptions,
  listCode1Options,
  type AddDataPayload,
} from '../services/addData'
import { useAppStore } from '../store/appStore'
import { getUserAccess } from '../utils/access'
import { normalizeSpaces, toTitleCaseLoose } from '../utils/text'
import { createAuditLog } from '../services/audit'

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
  headerTitleOverride?: string
}

type FieldName = keyof AddDataForm

const maxLengths: Record<Exclude<FieldName, 'verify' | 'lastUpdate'>, number> = {
  typeOfBusiness: 2,
  company: 40,
  address1: 40,
  address2: 50,
  province: 20,
  city: 20,
  zip: 10,
  codePhone: 5,
  phoneNumber: 20,
  facsimile: 20,
  handphone: 16,
  sex: 4,
  name: 35,
  position: 40,
  email: 40,
  website: 50,
  mainActive: 255,
  business: 255,
  source: 30,
  updateBy: 50,
  forum: 50,
  exhibitorTahun: 10,
  code1: 50,
  code2: 10,
  code3: 10,
  exhibitor: 255,
  visitor: 255,
  typeOfVisitor: 255,
  specialInvitationIndoDefence: 255,
  openingCeremony: 255,
  kartuUcapan: 255,
  poster: 255,
  tidakDikirim: 255,
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
  typeOfVisitor: 'Type of VIP',
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

const AddDataPage = ({ variant, onBack, initialRow = null, initialId = null, headerTitleOverride }: AddDataProps) => {
  const { user, setGlobalMessage } = useAppStore()
  const access = useMemo(() => getUserAccess(user), [user])
  const canOpenSearch = access.canSearchData
  const isEditingFromSearch = Boolean(initialRow)
  const [form, setForm] = useState<AddDataForm>(defaultForm)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const highlightIndexRef = useRef(0)
  const rowsRef = useRef<Record<string, unknown>[]>([])
  const popupRef = useRef<HTMLDivElement | null>(null)
  const singleSelectListRefs = useRef<Record<FieldName, HTMLDivElement | null>>({} as Record<FieldName, HTMLDivElement | null>)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [openCombo, setOpenCombo] = useState<FieldName | null>(null)
  const [openSingleSelect, setOpenSingleSelect] = useState<FieldName | null>(null)
  const [singleSelectIndex, setSingleSelectIndex] = useState(0)
  const [provinceQuery, setProvinceQuery] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [sourceOptions, setSourceOptions] = useState<string[]>([])
  const [sourceOptionsLoading, setSourceOptionsLoading] = useState(false)
  const [sourceOptionsError, setSourceOptionsError] = useState<string | null>(null)
  const [code1Options, setCode1Options] = useState<string[]>([])
  const [code1OptionsLoading, setCode1OptionsLoading] = useState(false)
  const [code1OptionsError, setCode1OptionsError] = useState<string | null>(null)
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
  const [dataSearchOpen, setDataSearchOpen] = useState(false)
  const [dataSearchLoading, setDataSearchLoading] = useState(false)
  const [dataSearchRows, setDataSearchRows] = useState<Record<string, unknown>[]>([])
  const [dataSearchError, setDataSearchError] = useState<string | null>(null)
  const [dataSearchNotice, setDataSearchNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [dataSearchPage, setDataSearchPage] = useState(1)
  const [dataSearchPageSize, setDataSearchPageSize] = useState(100)
  const [dataSearchTotal, setDataSearchTotal] = useState(0)
  const [dataSearchFilters, setDataSearchFilters] = useState({
    hp: '',
    company: '',
    email: '',
    name: '',
    business: '',
    userName: '',
  })
  const [dataSearchEdits, setDataSearchEdits] = useState<Record<string, Record<string, string>>>({})
  const [dataSearchSavingId, setDataSearchSavingId] = useState<string | number | null>(null)
  const deferredDataSearchFilters = useDeferredValue(dataSearchFilters)
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
    'Viswtr',
    'Visren',
    'Vislives',
    'Visfish',
    'Visagro',
    'Visvet',
    'Visdfn',
    'Visaero',
    'Vismarine',
    'Visisf',
    'Visisc',
    'Regwtr',
    'Regren',
    'Regidl',
    'Regfish',
    'Regdfn',
    'Regaero',
    'Regmarine',
    'Regisf',
    'Regisc',
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

  useEffect(() => {
    let active = true
    setSourceOptionsLoading(true)
    setSourceOptionsError(null)
    listSourceOptions()
      .then((options) => {
        if (!active) return
        setSourceOptions(options)
      })
      .catch((error) => {
        if (!active) return
        setSourceOptionsError(error instanceof Error ? error.message : 'Gagal memuat source options')
      })
      .finally(() => {
        if (!active) return
        setSourceOptionsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setCode1OptionsLoading(true)
    setCode1OptionsError(null)
    listCode1Options()
      .then((options) => {
        if (!active) return
        setCode1Options(options)
      })
      .catch((error) => {
        if (!active) return
        setCode1OptionsError(error instanceof Error ? error.message : 'Gagal memuat code1 options')
      })
      .finally(() => {
        if (!active) return
        setCode1OptionsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

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
      const result = isAllCaps ? text : toTitleCaseLoose(text)
      return result
    }

    const text = normalizeSpaces(value)
    if (!text) return ''
    return toTitleCaseLoose(text)
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

      if (field === 'code1') {
        setForm((prev) => ({ ...prev, code1: String(rawValue).toUpperCase() }))
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

  const handleProvinceSelect = (name: string) => {
    const sanitized = sanitizeText(name, 'province')
    setProvinceQuery(sanitized)
    setCityQuery('')
    setForm((prev) => ({ ...prev, province: sanitized, city: '' }))
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

  const filteredSourceOptions = useMemo(() => {
    const term = form.source.trim().toLowerCase()
    if (!term) return sourceOptions
    return sourceOptions.filter((opt) => opt.toLowerCase().includes(term))
  }, [form.source, sourceOptions])

  const filteredCode1Options = useMemo(() => {
    const term = form.code1.trim().toLowerCase()
    if (!term) return code1Options
    return code1Options.filter((opt) => opt.toLowerCase().includes(term))
  }, [form.code1, code1Options])

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

  const dataSearchColumns = useMemo(() => {
    const preferred = [
      'nourut',
      'ptCv',
      'company',
      'address1',
      'address2',
      'city',
      'zip',
      'propince',
      'code',
      'phone',
      'handphone',
      'email',
      'name',
      'position',
      'business',
      'source',
      'namauser',
      'lastupdate',
      'tglJamEdit',
    ]
    const seen = new Set<string>()
    const columns: string[] = []
    const push = (key: string) => {
      const normalized = key.toLowerCase()
      if (seen.has(normalized)) return
      seen.add(normalized)
      columns.push(key)
    }

    preferred.forEach(push)
    dataSearchRows.forEach((row) => {
      Object.keys(row || {}).forEach(push)
    })
    return columns
  }, [dataSearchRows])

  const normalizedFilter = (value: string) => value.trim().toLowerCase()

  const dataSearchIndex = useMemo(
    () =>
      dataSearchRows.map((row) => ({
        row,
        hpText: `${row.phone ?? ''} ${row.handphone ?? ''}`.toLowerCase(),
        companyText: String(row.company ?? '').toLowerCase(),
        emailText: String(row.email ?? '').toLowerCase(),
        nameText: String(row.name ?? '').toLowerCase(),
        businessText: String(row.business ?? '').toLowerCase(),
        userNameText: String(row.namauser ?? row.source ?? '').toLowerCase(),
      })),
    [dataSearchRows],
  )

  const filteredDataSearchRows = useMemo(() => {
    const filters = {
      hp: normalizedFilter(deferredDataSearchFilters.hp),
      company: normalizedFilter(deferredDataSearchFilters.company),
      email: normalizedFilter(deferredDataSearchFilters.email),
      name: normalizedFilter(deferredDataSearchFilters.name),
      business: normalizedFilter(deferredDataSearchFilters.business),
      userName: normalizedFilter(deferredDataSearchFilters.userName),
    }

    if (Object.values(filters).every((value) => value === '')) {
      return dataSearchRows
    }

    return dataSearchIndex
      .filter((entry) => {
        if (filters.hp && !entry.hpText.includes(filters.hp)) return false
        if (filters.company && !entry.companyText.includes(filters.company)) return false
        if (filters.email && !entry.emailText.includes(filters.email)) return false
        if (filters.name && !entry.nameText.includes(filters.name)) return false
        if (filters.business && !entry.businessText.includes(filters.business)) return false
        if (filters.userName && !entry.userNameText.includes(filters.userName)) return false
        return true
      })
      .map((entry) => entry.row)
  }, [dataSearchIndex, dataSearchRows, deferredDataSearchFilters])

  const dataSearchTotalPages = useMemo(() => {
    const total = Math.ceil(dataSearchTotal / dataSearchPageSize)
    return total > 0 ? total : 1
  }, [dataSearchPageSize, dataSearchTotal])

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

  const closeSingleSelect = (field: FieldName) => {
    if (openSingleSelect === field) {
      setOpenSingleSelect(null)
    }
  }

  const setSingleSelectListRef =
    (field: FieldName) =>
    (node: HTMLDivElement | null) => {
      singleSelectListRefs.current[field] = node
    }

  const getSingleSelectOptions = (field: FieldName) => {
    if (field === 'province') return filteredProvinceOptions
    if (field === 'city') return filteredCityOptions
    if (field === 'source') return filteredSourceOptions
    if (field === 'updateBy') return filteredUpdateByOptions
    if (field === 'code1') return filteredCode1Options
    if (field === 'exhibitorTahun') return exhibitorYearSuggestions
    return []
  }

  const getSingleSelectValue = (field: FieldName) => {
    if (field === 'province') return form.province
    if (field === 'city') return form.city
    if (field === 'source') return form.source
    if (field === 'updateBy') return form.updateBy
    if (field === 'code1') return form.code1
    if (field === 'exhibitorTahun') return form.exhibitorTahun
    return ''
  }

  const applySingleSelectValue = (field: FieldName, value: string) => {
    if (field === 'province') {
      handleProvinceSelect(value)
      return
    }
    if (field === 'city') {
      handleCitySelect(value)
      return
    }
    if (field === 'source') {
      setForm((prev) => ({ ...prev, source: value }))
      return
    }
    if (field === 'updateBy') {
      setForm((prev) => ({ ...prev, updateBy: value }))
      return
    }
    if (field === 'code1') {
      setForm((prev) => ({ ...prev, code1: value.toUpperCase() }))
      return
    }
    if (field === 'exhibitorTahun') {
      setForm((prev) => ({ ...prev, exhibitorTahun: value }))
    }
  }

  const openSingleSelectFor = (field: FieldName) => {
    setOpenSingleSelect(field)
    const options = getSingleSelectOptions(field)
    const current = getSingleSelectValue(field).trim().toLowerCase()
    const nextIndex = current
      ? options.findIndex((option) => option.toLowerCase() === current)
      : 0
    setSingleSelectIndex(nextIndex >= 0 ? nextIndex : 0)
  }

  const handleSingleSelectKeyDown =
    (field: FieldName) =>
    (event: KeyboardEvent<HTMLInputElement>) => {
      const options = getSingleSelectOptions(field)
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (openSingleSelect !== field) {
          openSingleSelectFor(field)
          return
        }
        setSingleSelectIndex((prev) => (options.length === 0 ? 0 : Math.min(prev + 1, options.length - 1)))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (openSingleSelect !== field) {
          openSingleSelectFor(field)
          return
        }
        setSingleSelectIndex((prev) => (options.length === 0 ? 0 : Math.max(prev - 1, 0)))
        return
      }
      if (event.key === 'Enter') {
        if (openSingleSelect === field) {
          event.preventDefault()
          const option = options[singleSelectIndex]
          if (option) {
            applySingleSelectValue(field, option)
            setOpenSingleSelect(null)
          }
        }
        return
      }
      if (event.key === 'Escape' && openSingleSelect === field) {
        event.preventDefault()
        setOpenSingleSelect(null)
      }
    }

  useEffect(() => {
    if (!openSingleSelect) return
    const options = getSingleSelectOptions(openSingleSelect)
    if (options.length === 0) {
      setSingleSelectIndex(0)
      return
    }
    if (singleSelectIndex >= options.length) {
      setSingleSelectIndex(0)
    }
  }, [
    openSingleSelect,
    filteredProvinceOptions,
    filteredCityOptions,
    filteredSourceOptions,
    filteredUpdateByOptions,
    filteredCode1Options,
    exhibitorYearSuggestions,
    singleSelectIndex,
  ])

  useEffect(() => {
    if (!openSingleSelect) return
    const field = openSingleSelect
    const container = singleSelectListRefs.current[field]
    if (!container) return
    const handle = requestAnimationFrame(() => {
      const target = container.querySelector<HTMLButtonElement>(`[data-index="${singleSelectIndex}"]`)
      target?.scrollIntoView({ block: 'nearest' })
    })
    return () => cancelAnimationFrame(handle)
  }, [
    openSingleSelect,
    singleSelectIndex,
    filteredProvinceOptions,
    filteredCityOptions,
    filteredSourceOptions,
    filteredUpdateByOptions,
    filteredCode1Options,
    exhibitorYearSuggestions,
  ])

  const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) return '-'
    if (Array.isArray(value)) return value.join(', ')
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object') return JSON.stringify(value)
    const text = String(value)
    return text.trim() === '' ? '-' : text
  }

  const getRowId = (row: Record<string, unknown>) => {
    const rawId = row.nourut ?? row.NOURUT ?? row.id ?? row.ID ?? row.pk ?? row.PK
    if (rawId === undefined || rawId === null) return null
    if (typeof rawId === 'number') return rawId
    const text = String(rawId).trim()
    return text === '' ? null : text
  }

  const toDateValue = (value: unknown) => {
    if (!value) return ''
    const parsed = new Date(String(value))
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toISOString().slice(0, 10)
  }

  const toEditableValue = (value: unknown, column: string) => {
    if (column.toLowerCase() === 'lastupdate') {
      return toDateValue(value)
    }
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const loadDataSearch = async (
    nextPage?: number,
    options?: { resetEdits?: boolean; pageSize?: number; filters?: typeof dataSearchFilters },
  ) => {
    const page = nextPage ?? dataSearchPage
    const pageSize = options?.pageSize ?? dataSearchPageSize
    const filters = options?.filters ?? dataSearchFilters
    const query = filters.company || filters.name || ''
    setDataSearchLoading(true)
    setDataSearchError(null)
    if (options?.resetEdits) {
      setDataSearchEdits({})
    }
    try {
      const result = await listGabungRecords({
        page,
        pageSize,
        q: query,
        fields: 'search',
        filters: {
          hp: filters.hp,
          company: filters.company,
          email: filters.email,
          name: filters.name,
          business: filters.business,
          userName: filters.userName,
        },
      })
      setDataSearchRows(result.items)
      setDataSearchPage(result.pagination.page)
      setDataSearchTotal(result.pagination.total)
      setDataSearchPageSize(pageSize)
      setDataSearchNotice(null)
    } catch (error) {
      setDataSearchError(error instanceof Error ? error.message : 'Gagal memuat data gabung')
    } finally {
      setDataSearchLoading(false)
    }
  }

  const openDataSearch = async () => {
    if (!canOpenSearch) return
    const nextFilters = {
      hp: '',
      company: '',
      email: '',
      name: '',
      business: '',
      userName: '',
    }
    setDataSearchFilters(nextFilters)
    setDataSearchOpen(true)
    setDataSearchNotice(null)
    await loadDataSearch(1, { resetEdits: true, filters: nextFilters })
    try {
      await createAuditLog({
        username: user?.username ?? null,
        action: 'search',
        page: 'Add Data',
        summary: 'Open search data (F3)',
        data: { feature: 'search-data' },
      })
    } catch {
      // ignore logging failures
    }
  }

  const closeDataSearch = () => {
    setDataSearchOpen(false)
    setDataSearchNotice(null)
    setDataSearchError(null)
  }

  const updateDataSearchEdit = (rowId: string | number, column: string, value: string) => {
    const rowKey = String(rowId)
    setDataSearchEdits((prev) => ({
      ...prev,
      [rowKey]: {
        ...(prev[rowKey] ?? {}),
        [column]: value,
      },
    }))
  }

  const clearDataSearchEdit = (rowId: string | number) => {
    const rowKey = String(rowId)
    setDataSearchEdits((prev) => {
      if (!prev[rowKey]) return prev
      const next = { ...prev }
      delete next[rowKey]
      return next
    })
  }

  const saveDataSearchRow = async (row: Record<string, unknown>) => {
    const rowId = getRowId(row)
    if (rowId === null) {
      setDataSearchNotice({ type: 'error', message: 'NOURUT tidak ditemukan untuk baris ini.' })
      return
    }

    const rowKey = String(rowId)
    const edits = dataSearchEdits[rowKey]
    if (!edits || Object.keys(edits).length === 0) {
      setDataSearchNotice({ type: 'error', message: 'Tidak ada perubahan untuk disimpan.' })
      return
    }

    const payload: AddDataPayload = {}
    Object.entries(edits).forEach(([key, value]) => {
      const original = toEditableValue(row[key], key)
      if (original === value) return
      payload[key] = value === '' ? null : value
    })

    if (Object.keys(payload).length === 0) {
      setDataSearchNotice({ type: 'error', message: 'Tidak ada perubahan untuk disimpan.' })
      clearDataSearchEdit(rowId)
      return
    }

    setDataSearchSavingId(rowId)
    setDataSearchNotice(null)
    try {
      const response = await updateAddData(rowId, payload)
      const updated =
        response && typeof response === 'object' && !Array.isArray(response)
          ? (response as Record<string, unknown>)
          : payload
      const mergedRow = { ...row, ...updated }
      setDataSearchRows((prev) =>
        prev.map((item) => (getRowId(item) === rowId ? mergedRow : item)),
      )
      if (String(selectedId ?? '') === rowKey) {
        applyCompanyRow(mergedRow, { keepPopup: true, silent: true })
      }
      clearDataSearchEdit(rowId)
      setDataSearchNotice({ type: 'success', message: `Data NOURUT ${rowId} berhasil diperbarui.` })
    } catch (error) {
      setDataSearchNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Gagal menyimpan perubahan.',
      })
    } finally {
      setDataSearchSavingId(null)
    }
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

  const exportPdf = async () => {
    const payload = {
      typeOfBusiness: form.typeOfBusiness,
      company: form.company,
      address1: form.address1,
      address2: form.address2,
      city: form.city,
      zip: form.zip,
      sex: form.sex,
      name: form.name,
      position: form.position,
      codePhone: form.codePhone,
      phoneNumber: form.phoneNumber,
      handphone: form.handphone,
      email: form.email,
      currentUser: user?.username || user?.name || undefined,
    }

    setFeedback(null)
    try {
      const { blob, filename } = await exportPersonalDatabasePdf(payload)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename || 'database-personal.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setFeedback({ type: 'success', message: `PDF tersimpan: ${anchor.download}` })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Gagal mengunduh PDF.',
      })
    }
  }

  const applyCompanyRow = (row: Record<string, unknown>, options?: { keepPopup?: boolean; silent?: boolean }) => {
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
      code1: String(lower['code1'] ?? '').toUpperCase(),
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
    if (!options?.silent) {
      setFeedback({ type: 'success', message: 'Data company berhasil dimuat ke form.' })
    }
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
    const requiredFieldsList: FieldName[] = [
      'company',
      'address1',
      'province',
      'city',
      'name',
      'mainActive',
      'business',
      'source',
      'lastUpdate',
    ]
    requiredFieldsList.forEach((key) => {
      const rawValue = form[key]
      const hasValue = Array.isArray(rawValue) ? rawValue.length > 0 : String(rawValue).trim() !== ''
      if (!hasValue) errors.push(`${labelMap[key]} wajib diisi.`)
    })

    if (errors.length > 0) return errors

    ;(Object.keys(maxLengths) as Array<Exclude<FieldName, 'verify' | 'lastUpdate'>>).forEach((key) => {
      const max = maxLengths[key]
      const rawValue = form[key]
      if (Array.isArray(rawValue)) {
        return
      }
      const text = String(rawValue ?? '').trim()
      if (text && text.length > max) {
        errors.push(`${labelMap[key]} maksimal ${max} karakter.`)
      }
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
          try {
            const responseId =
              response && typeof response === 'object'
                ? (response as Record<string, unknown>).nourut ?? (response as Record<string, unknown>).id
                : undefined
            const auditId =
              action === 'update'
                ? selectedId
                : responseId ?? (payload as Record<string, unknown>).nourut ?? undefined
            await createAuditLog({
              username: user?.username ?? null,
              action,
              page: 'Add Data',
              summary: `${action === 'add' ? 'Add' : 'Update'} data`,
              data: {
                id: auditId ?? null,
                company: payload.company,
                name: payload.name,
              },
            })
          } catch {
            // ignore logging failures
          }
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
      if (companyLookup.open || dataSearchOpen) {
        if (dataSearchOpen && event.key === 'Escape') {
          event.preventDefault()
          closeDataSearch()
        }
        return
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return

      if (event.key === 'F5') {
        event.preventDefault()
        if (!isEditingFromSearch) {
          submitAdd(event as any)
        }
      } else if (event.key === 'F2') {
        event.preventDefault()
        submitUpdate(event as any)
      } else if (event.key === 'F3') {
        event.preventDefault()
        if (canOpenSearch) {
          openDataSearch()
        }
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    companyLookup.open,
    dataSearchOpen,
    submitAdd,
    submitUpdate,
    handleCancel,
    openDataSearch,
    closeDataSearch,
    canOpenSearch,
    isEditingFromSearch,
  ])

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
    const maxLength = maxLengths[name as Exclude<FieldName, 'verify' | 'lastUpdate'>]
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
              onFocus={() => openSingleSelectFor(name)}
              onKeyDown={handleSingleSelectKeyDown(name)}
              onBlur={() => {
                setForm((prev) => ({ ...prev, province: sanitizeText(prev.province, 'province') }))
                closeSingleSelect(name)
              }}
              maxLength={maxLength}
              required
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Pilih province"
            />
            {openSingleSelect === name ? (
              <div
                ref={setSingleSelectListRef(name)}
                className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2 max-h-60 overflow-auto"
              >
                {filteredProvinceOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Tidak ada hasil.</p>
                ) : (
                  filteredProvinceOptions.map((option, index) => (
                    <button
                      key={option}
                      data-index={index}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        handleProvinceSelect(option)
                        setOpenSingleSelect(null)
                      }}
                      onMouseEnter={() => setSingleSelectIndex(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm text-slate-800 ${
                        index === singleSelectIndex ? 'bg-rose-50' : 'hover:bg-rose-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>
            ) : null}
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
              onFocus={() => openSingleSelectFor(name)}
              onKeyDown={handleSingleSelectKeyDown(name)}
              onBlur={() => {
                handleCitySelect(form.city)
                closeSingleSelect(name)
              }}
              maxLength={maxLength}
              required
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Pilih city"
            />
            {openSingleSelect === name ? (
              <div
                ref={setSingleSelectListRef(name)}
                className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2 max-h-60 overflow-auto"
              >
                {filteredCityOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Tidak ada hasil.</p>
                ) : (
                  filteredCityOptions.map((option, index) => (
                    <button
                      key={option}
                      data-index={index}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        handleCitySelect(option)
                        setOpenSingleSelect(null)
                      }}
                      onMouseEnter={() => setSingleSelectIndex(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm text-slate-800 ${
                        index === singleSelectIndex ? 'bg-rose-50' : 'hover:bg-rose-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>
            ) : null}
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

    if (name === 'source') {
      return (
        <div className="space-y-2" key={name}>
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
            {labelMap[name]}
            {requiredFields.has(name) ? <span className="text-rose-600">*</span> : null}
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.source}
              onChange={handleChange('source')}
              onFocus={() => openSingleSelectFor(name)}
              onKeyDown={handleSingleSelectKeyDown(name)}
              onBlur={() => closeSingleSelect(name)}
              maxLength={maxLength}
              required={requiredFields.has(name)}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Pilih atau ketik"
            />
            {openSingleSelect === name ? (
              <div
                ref={setSingleSelectListRef(name)}
                className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2 max-h-60 overflow-auto"
              >
                {sourceOptionsLoading ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Memuat data...</p>
                ) : sourceOptionsError ? (
                  <p className="px-3 py-2 text-xs text-rose-600">{sourceOptionsError}</p>
                ) : filteredSourceOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Tidak ada hasil.</p>
                ) : (
                  filteredSourceOptions.map((option, index) => (
                    <button
                      key={option}
                      data-index={index}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, source: option }))
                        setOpenSingleSelect(null)
                      }}
                      onMouseEnter={() => setSingleSelectIndex(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm text-slate-800 ${
                        index === singleSelectIndex ? 'bg-rose-50' : 'hover:bg-rose-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">Daftar source mengikuti data yang ada di database.</p>
        </div>
      )
    }

    if (name === 'code1') {
      return (
        <div className="space-y-2" key={name}>
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
            {labelMap[name]}
            {requiredFields.has(name) ? <span className="text-rose-600">*</span> : null}
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.code1}
              onChange={handleChange('code1')}
              onFocus={() => openSingleSelectFor(name)}
              onKeyDown={handleSingleSelectKeyDown(name)}
              onBlur={() => closeSingleSelect(name)}
              maxLength={maxLength}
              required={requiredFields.has(name)}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Pilih atau ketik"
            />
            {openSingleSelect === name ? (
              <div
                ref={setSingleSelectListRef(name)}
                className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2 max-h-60 overflow-auto"
              >
                {code1OptionsLoading ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Memuat data...</p>
                ) : code1OptionsError ? (
                  <p className="px-3 py-2 text-xs text-rose-600">{code1OptionsError}</p>
                ) : filteredCode1Options.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Tidak ada hasil.</p>
                ) : (
                  filteredCode1Options.map((option, index) => (
                    <button
                      key={option}
                      data-index={index}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, code1: option.toUpperCase() }))
                        setOpenSingleSelect(null)
                      }}
                      onMouseEnter={() => setSingleSelectIndex(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm text-slate-800 ${
                        index === singleSelectIndex ? 'bg-rose-50' : 'hover:bg-rose-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">Daftar Code 1 mengikuti data yang ada di database.</p>
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
              onFocus={() => openSingleSelectFor(name)}
              onKeyDown={handleSingleSelectKeyDown(name)}
              onBlur={() => closeSingleSelect(name)}
              maxLength={maxLength}
              required={requiredFields.has(name)}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="Pilih atau ketik"
            />
            {openSingleSelect === name ? (
              <div
                ref={setSingleSelectListRef(name)}
                className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2 max-h-60 overflow-auto"
              >
                {filteredUpdateByOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Tidak ada hasil.</p>
                ) : (
                  filteredUpdateByOptions.map((option, index) => (
                    <button
                      key={option}
                      data-index={index}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, updateBy: option }))
                        setOpenSingleSelect(null)
                      }}
                      onMouseEnter={() => setSingleSelectIndex(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm text-slate-800 ${
                        index === singleSelectIndex ? 'bg-rose-50' : 'hover:bg-rose-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>
            ) : null}
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
              onFocus={() => openSingleSelectFor(name)}
              onKeyDown={handleSingleSelectKeyDown(name)}
              onBlur={() => closeSingleSelect(name)}
              maxLength={maxLength}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              placeholder="EXH"
            />
            {openSingleSelect === name ? (
              <div
                ref={setSingleSelectListRef(name)}
                className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-2 max-h-60 overflow-auto"
              >
                {exhibitorYearSuggestions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Tidak ada saran.</p>
                ) : (
                  exhibitorYearSuggestions.map((option, index) => (
                    <button
                      key={option}
                      data-index={index}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, exhibitorTahun: option }))
                        setOpenSingleSelect(null)
                      }}
                      onMouseEnter={() => setSingleSelectIndex(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm text-slate-800 ${
                        index === singleSelectIndex ? 'bg-rose-50' : 'hover:bg-rose-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))
                )}
              </div>
            ) : null}
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
              maxLength={maxLength}
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
        {name === 'business' ? (
          <p className="text-xs text-slate-500">Jika ada bisnis yang tidak ada, silahkan hubungi Admin.</p>
        ) : null}
      </div>
    )
  }

  const headerTitle = useMemo(() => {
    if (headerTitleOverride) return headerTitleOverride
    return variant === 'exhibitor' ? 'Add Data - Exhibitor' : 'Add Data - Visitor'
  }, [headerTitleOverride, variant])

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex items-start justify-between gap-4">
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
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          aria-label="Export PDF"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9V4h12v5" />
            <path d="M6 18h12" />
            <path d="M6 14h12v7H6z" />
            <path d="M6 13H5a3 3 0 0 1 0-6h14a3 3 0 0 1 0 6h-1" />
          </svg>
        </button>
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

      <form
        className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6"
        onSubmit={isEditingFromSearch ? submitUpdate : submitAdd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">{leftFields.map((field) => renderField(field))}</div>
          <div className="space-y-4">{rightFields.map((field) => renderField(field))}</div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {!isEditingFromSearch ? (
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold shadow-md hover:shadow-lg"
            >
              {saving ? 'Saving...' : 'Add/Save (F5)'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={submitUpdate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white font-semibold shadow-sm hover:bg-slate-900"
          >
            {saving ? 'Saving...' : 'Update/Edit (F2)'}
          </button>
          {canOpenSearch ? (
            <button
              type="button"
              onClick={openDataSearch}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
            >
              Search (F3)
            </button>
          ) : null}
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

      {dataSearchOpen ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 pt-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Search Data (F3)</p>
                <h3 className="text-lg font-bold text-slate-900">Data Visitor &amp; Exhibitor</h3>
                <p className="text-xs text-slate-500">Edit langsung di tabel. Tekan ESC atau Close untuk menutup.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadDataSearch(dataSearchPage, { resetEdits: false })}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
                  disabled={dataSearchLoading}
                >
                  {dataSearchLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  type="button"
                  onClick={closeDataSearch}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-slate-200 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Search By HP</label>
                  <input
                    type="text"
                    value={dataSearchFilters.hp}
                    onChange={(event) =>
                      setDataSearchFilters((prev) => ({ ...prev, hp: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    placeholder="Handphone / Phone"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Search By Company</label>
                  <input
                    type="text"
                    value={dataSearchFilters.company}
                    onChange={(event) =>
                      setDataSearchFilters((prev) => ({ ...prev, company: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    placeholder="Company"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Search By Email</label>
                  <input
                    type="text"
                    value={dataSearchFilters.email}
                    onChange={(event) =>
                      setDataSearchFilters((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    placeholder="Email"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Search By Name</label>
                  <input
                    type="text"
                    value={dataSearchFilters.name}
                    onChange={(event) =>
                      setDataSearchFilters((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    placeholder="Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Search By Business</label>
                  <input
                    type="text"
                    value={dataSearchFilters.business}
                    onChange={(event) =>
                      setDataSearchFilters((prev) => ({ ...prev, business: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    placeholder="Business"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Search By User Name</label>
                  <input
                    type="text"
                    value={dataSearchFilters.userName}
                    onChange={(event) =>
                      setDataSearchFilters((prev) => ({ ...prev, userName: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    placeholder="Update By"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadDataSearch(1, { resetEdits: true })}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold shadow-sm hover:bg-rose-700"
                  disabled={dataSearchLoading}
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextFilters = {
                      hp: '',
                      company: '',
                      email: '',
                      name: '',
                      business: '',
                      userName: '',
                    }
                    setDataSearchFilters(nextFilters)
                    loadDataSearch(1, { resetEdits: true, filters: nextFilters })
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Reset Filter
                </button>
                <span className="text-xs text-slate-500">
                  Menampilkan {filteredDataSearchRows.length} dari {dataSearchRows.length} baris (page {dataSearchPage}).
                </span>
              </div>
            </div>

            {dataSearchError ? (
              <div className="px-6 py-3 text-sm font-semibold text-rose-700 bg-rose-50 border-b border-rose-100">
                {dataSearchError}
              </div>
            ) : null}

            {dataSearchNotice ? (
              <div
                className={`px-6 py-3 text-sm font-semibold border-b ${
                  dataSearchNotice.type === 'success'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : 'text-rose-700 bg-rose-50 border-rose-100'
                }`}
              >
                {dataSearchNotice.message}
              </div>
            ) : null}

            <div className="px-3 sm:px-6 py-4 overflow-auto max-h-[55vh]">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[900px] sm:min-w-[1100px]">
                <table className="min-w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      {dataSearchColumns.map((column) => (
                        <th key={column} className="px-2 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">
                          {column}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredDataSearchRows.map((row, index) => {
                      const rowId = getRowId(row)
                      const rowKey = rowId === null ? `row-${index}` : String(rowId)
                      const rowEdits = rowId !== null ? dataSearchEdits[rowKey] : undefined
                      const rowDirty =
                        rowId !== null &&
                        rowEdits &&
                        Object.entries(rowEdits).some(
                          ([key, value]) => toEditableValue(row[key], key) !== value,
                        )
                      return (
                        <tr key={rowKey} className="hover:bg-rose-50/50">
                          {dataSearchColumns.map((column) => {
                            const lower = column.toLowerCase()
                            const readOnly = lower === 'nourut' || lower === 'id'
                            const value =
                              rowId !== null && rowEdits && rowEdits[column] !== undefined
                                ? rowEdits[column]
                                : toEditableValue(row[column], column)
                            return (
                              <td key={column} className="px-2 py-1 align-top text-slate-800">
                                {readOnly ? (
                                  <span className="inline-block min-w-[60px]">{value || '-'}</span>
                                ) : (
                                  <input
                                    type={lower === 'lastupdate' ? 'date' : 'text'}
                                    value={value}
                                    onChange={(event) =>
                                      rowId !== null && updateDataSearchEdit(rowId, column, event.target.value)
                                    }
                                    className="w-full min-w-[120px] rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
                                  />
                                )}
                              </td>
                            )
                          })}
                          <td className="px-2 py-1 align-top">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => saveDataSearchRow(row)}
                                disabled={!rowDirty || String(dataSearchSavingId ?? '') === rowKey}
                                className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold disabled:opacity-50"
                              >
                                {String(dataSearchSavingId ?? '') === rowKey ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => applyCompanyRow(row, { keepPopup: true })}
                                className="inline-flex items-center justify-center px-3 py-1 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold"
                              >
                                Load
                              </button>
                              <button
                                type="button"
                                onClick={() => rowId !== null && clearDataSearchEdit(rowId)}
                                disabled={!rowEdits}
                                className="inline-flex items-center justify-center px-3 py-1 rounded-md border border-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-50"
                              >
                                Reset
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredDataSearchRows.length === 0 ? (
                      <tr>
                        <td colSpan={dataSearchColumns.length + 1} className="px-3 py-6 text-center text-slate-500">
                          Tidak ada data yang cocok.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Total {dataSearchTotal} data &middot; Page {dataSearchPage} / {dataSearchTotalPages}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-slate-600">
                  Page size
                  <select
                    value={dataSearchPageSize}
                    onChange={(event) => {
                      const nextSize = Number(event.target.value) || 200
                      loadDataSearch(1, { resetEdits: true, pageSize: nextSize })
                    }}
                    className="ml-2 rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    {[50, 100, 200, 500].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => loadDataSearch(Math.max(1, dataSearchPage - 1), { resetEdits: true })}
                  disabled={dataSearchPage <= 1 || dataSearchLoading}
                  className="inline-flex items-center justify-center px-3 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    loadDataSearch(Math.min(dataSearchTotalPages, dataSearchPage + 1), { resetEdits: true })
                  }
                  disabled={dataSearchPage >= dataSearchTotalPages || dataSearchLoading}
                  className="inline-flex items-center justify-center px-3 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AddDataPage
