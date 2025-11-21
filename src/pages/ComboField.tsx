import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'

type ComboProps = {
  label: string
  name: 'username' | 'division'
  value: string
  placeholder: string
  options: string[]
  onChange: (field: 'username' | 'division') => (event: ChangeEvent<HTMLInputElement>) => void
}

const ComboField = ({ label, name, value, placeholder, options, onChange }: ComboProps) => {
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const term = value.trim().toLowerCase()
    if (!term) return options.slice(0, 8)
    return options.filter((opt) => opt.toLowerCase().includes(term)).slice(0, 8)
  }, [options, value])

  return (
    <div className="space-y-2 relative">
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange(name)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-52 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filtered.map((option) => (
            <li
              key={option}
              className="px-4 py-2.5 text-slate-800 hover:bg-rose-50 cursor-pointer"
              onMouseDown={(event) => {
                event.preventDefault()
                onChange(name)({
                  target: { value: option },
                } as ChangeEvent<HTMLInputElement>)
                setOpen(false)
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ComboField
