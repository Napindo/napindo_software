export const isFlagSet = (raw: Record<string, unknown>, key: string) => {
  const value = raw[key.toLowerCase()]
  if (value === undefined || value === null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === 'x' || normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export const rowMatchesSegment = <T extends string>(
  raw: Record<string, unknown>,
  segment: T,
  segmentFlagKey: Record<T, string>,
) => {
  const lower = Object.keys(raw).reduce<Record<string, unknown>>((acc, key) => {
    acc[key.toLowerCase()] = raw[key]
    return acc
  }, {})

  const flagKey = segmentFlagKey[segment]
  if (!flagKey) return true
  return isFlagSet(lower, flagKey)
}
