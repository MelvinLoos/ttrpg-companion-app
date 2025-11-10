// Quick test script to create a session for testing player join flow
import { createClient } from '@supabase/supabase-js'

// Use correct environment variables
const supabaseUrl = 'https://lbjqrhfbgcugwiqxxgkk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianFyaGZiZ2N1Z3dpcXh4Z2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjYzNjgsImV4cCI6MjA3Njc0MjM2OH0.6nZtqT4iLX3IczncV0VXkE4-aMtPTsbkfxKMXgfwOCM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestSession() {
  try {
    console.log('Creating test session...')
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        name: 'Test Session for Player Join Flow',
        teaser_text: 'A test session to validate the player join functionality',
        active_image_url: null,
        gm_id: '00000000-0000-0000-0000-000000000000', // Dummy GM ID
        showing: 'lobby'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return
    }

    console.log('✅ Test session created successfully!')
    console.log('Session ID:', data.id)
    console.log('Session Name:', data.name)
    console.log(`Test join URL: http://localhost:5173/join/${data.id}`)
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

createTestSession()