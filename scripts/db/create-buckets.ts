import { createClient } from '@supabase/supabase-js'

// You'll need to get these from your Supabase project settings
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables:')
  console.error('- VITE_SUPABASE_URL (from your project settings)')
  console.error('- SUPABASE_SERVICE_ROLE_KEY (from your project API settings)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createStorageBuckets() {
  const buckets = [
    { id: 'portraits', name: 'portraits', public: true },
    { id: 'scenes', name: 'scenes', public: true },
    { id: 'maps', name: 'maps', public: true }
  ]

  console.log('Creating storage buckets...')

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      })

      if (error && error.message !== 'Bucket already exists') {
        console.error(`❌ Failed to create bucket '${bucket.id}':`, error.message)
      } else {
        console.log(`✅ Bucket '${bucket.id}' created successfully`)
      }
    } catch (err) {
      console.error(`❌ Error creating bucket '${bucket.id}':`, err)
    }
  }

  console.log('\nDone! You should now be able to upload images.')
}

createStorageBuckets()