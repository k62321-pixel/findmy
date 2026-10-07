const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82

/**
 * Re-encodes a photo as a ≤1600px JPEG before upload: a 4MB phone photo becomes
 * ~300KB, which keeps the free database tier from filling up, and re-encoding
 * drops EXIF metadata such as GPS location. GIFs pass through (would lose animation).
 * Falls back to the original file if the browser can't decode it.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file

  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()

    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.round(img.naturalWidth * scale)
    const height = Math.round(img.naturalHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // JPEG has no alpha — paint transparent PNG areas white instead of black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) return file
    const name = file.name.replace(/\.[^.]*$/, '') || 'photo'
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}
