/**
 * Centralized upload utility
 * Uses Cloudinary if configured, falls back to Supabase storage
 * This means storage NEVER fills up as Cloudinary has 25GB free
 */

const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder: string,
  mimeType: string
): Promise<string> {
  if (CLOUDINARY_CLOUD && CLOUDINARY_KEY && CLOUDINARY_SECRET) {
    return uploadToCloudinary(buffer, filename, folder, mimeType)
  }
  // Fallback to Supabase (will work until storage fills up)
  return uploadToSupabase(buffer, filename, folder, mimeType)
}

async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string,
  mimeType: string
): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET,
    secure: true,
  })

  const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`
  const publicId = `topgee/${folder}/${filename.replace(/\.[^.]+$/, '')}_${Date.now()}`

  const result = await cloudinary.uploader.upload(base64, {
    public_id: publicId,
    overwrite: true,
    resource_type: 'auto',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })

  return result.secure_url
}

async function uploadToSupabase(
  buffer: Buffer,
  filename: string,
  folder: string,
  mimeType: string
): Promise<string> {
  const { createAdminClient } = await import('./supabase/server')
  const supabase = await createAdminClient()

  const bucket = folder === 'kyc' ? 'kyc-docs' : 'deposit-proofs'
  const path = `${folder}/${filename}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
