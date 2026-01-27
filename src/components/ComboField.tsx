import type { ChangeEvent, KeyboardEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement | null>(null)
  const optionsList = Array.isArray(options) ? options : []

  const filtered = useMemo(() => {
    const term = value.trim().toLowerCase()
    if (!term) return optionsList
    return optionsList.filter((opt) => opt.toLowerCase().includes(term))
  }, [optionsList, value])

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1)
      return
    }
    if (filtered.length === 0) {
      setActiveIndex(-1)
      return
    }
    setActiveIndex((prev) => (prev >= 0 ? Math.min(prev, filtered.length - 1) : 0))
  }, [open, filtered.length])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    const target = listRef.current?.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement | null
    target?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, filtered.length])

  const selectOption = (option: string) => {
    onChange(name)({
      target: { value: option },
    } as ChangeEvent<HTMLInputElement>)
    setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filtered.length)
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1))
      }
      return
    }

    if (event.key === 'Enter') {
      if (open && activeIndex >= 0 && filtered[activeIndex]) {
        event.preventDefault()
        selectOption(filtered[activeIndex])
      }
      return
    }

    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        setOpen(false)
      }
    }
  }

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
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-20 mt-1 w-full max-h-52 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          {(Array.isArray(filtered) ? filtered : []).map((option, index) => (
            <li
              key={option}
              data-index={index}
              className={`px-4 py-2.5 text-slate-800 cursor-pointer ${
                index === activeIndex ? 'bg-rose-100' : 'hover:bg-rose-50'
              }`}
              onMouseDown={(event) => {
                event.preventDefault()
                selectOption(option)
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
