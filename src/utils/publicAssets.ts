export const publicAssetUrl = (filename: string) => {
  const cleanName = filename.replace(/^\/+/, '')
  if (import.meta.env.DEV) return `/assets/${cleanName}`

  return new URL(`./${cleanName}`, import.meta.url).href
}
