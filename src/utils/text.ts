export const normalizeSpaces = (value: string) => value.replace(/\s{2,}/g, ' ')

export const toTitleCase = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .trimStart()
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ')

export const toTitleCaseLoose = (value: string) => {
  const text = normalizeSpaces(value)
  if (!text) return ''
  const titled = text
    .toLowerCase()
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ')
  return titled
}
