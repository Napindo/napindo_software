export const extractCount = (payload: any): number => {
  if (!payload) return 0
  if (typeof payload === 'number') return payload
  if (typeof payload.total === 'number') return payload.total
  if (typeof payload.totalCount === 'number') return payload.totalCount
  if (typeof payload.count === 'number') return payload.count
  if (Array.isArray(payload)) return payload.length
  return 0
}
