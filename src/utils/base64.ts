export const toBase64 = (bytes: Uint8Array) => {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  return toBase64(new Uint8Array(buffer))
}

export const normalizeBase64 = (value: unknown): string | undefined => {
  if (!value) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }
  const bufferLike = value as any
  if (bufferLike?.type === 'Buffer' && Array.isArray(bufferLike.data)) {
    return toBase64(new Uint8Array(bufferLike.data))
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return value.toString('base64')
  }
  if (value instanceof ArrayBuffer) return arrayBufferToBase64(value)
  if (ArrayBuffer.isView(value) && value.buffer) return arrayBufferToBase64(value.buffer)
  return undefined
}
