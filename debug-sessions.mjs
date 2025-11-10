// Debug script to test session fetching
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lbjqrhfbgcugwiqxxgkk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianFyaGZiZ2N1Z3dpcXh4Z2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjYzNjgsImV4cCI6MjA3Njc0MjM2OH0.6nZtqT4iLX3IczncV0VXkE4-aMtPTsbkfxKMXgfwOCM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSession() {
  try {
    console.log('🔍 Debugging Supabase connection...')
    
    // First, check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('sessions')
      .select('id, name')
      .limit(5)

    if (testError) {
      console.error('❌ Supabase connection error:', testError)
      return
    }

    console.log('✅ Supabase connection working!')
    console.log('📋 Available sessions:')
    
    if (testData && testData.length > 0) {
      testData.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.name} (ID: ${session.id})`)
        console.log(`     Test URL: http://localhost:5173/join/${session.id}`)
      })
    } else {
      console.log('  No sessions found in database')
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

debugSession()