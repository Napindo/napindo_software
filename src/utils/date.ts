export const formatDateOnly = (value?: string) => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const isoIndex = trimmed.indexOf('T')
  if (isoIndex > 0) return trimmed.slice(0, isoIndex)
  const spaceIndex = trimmed.indexOf(' ')
  if (spaceIndex > 0) return trimmed.slice(0, spaceIndex)
  return trimmed
}
