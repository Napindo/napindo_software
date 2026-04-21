export const publicAssetUrl = (filename: string) => {
  const cleanName = filename.replace(/^\/+/, '')
  if (import.meta.env.DEV) return `/assets/${cleanName}`

  return `./assets/${cleanName}`
}
