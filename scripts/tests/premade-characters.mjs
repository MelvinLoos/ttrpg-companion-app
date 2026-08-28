// Test script for local development
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.error('Missing env var: SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testPremadeCharacterFeature() {
  console.log('🧪 Testing premade character availability feature...')
  
  try {
    // Test anonymous access to premade characters
    const { data: characters, error } = await supabase
      .from('premade_characters')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('❌ Failed to fetch premade characters:', error.message)
      return
    }
    
    console.log('✅ Anonymous access to premade characters works!')
    console.log(`📋 Found ${characters.length} premade characters:`)
    characters.forEach(char => {
      console.log(`   - ${char.name}`)
    })
    
    // Test sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (sessionsError) {
      console.error('❌ Failed to fetch sessions:', sessionsError.message)
      return
    }
    
    if (sessions.length > 0) {
      const session = sessions[0]
      console.log(`\\n🎯 Test session found: "${session.name}" (${session.id})`)
      console.log(`🔗 Join URL: http://localhost:5173/join/${session.id}`)
      
      // Check current players in session
      const { data: players, error: playersError } = await supabase
        .from('session_characters')
        .select('*')
        .eq('session_id', session.id)
      
      if (playersError) {
        console.error('❌ Failed to fetch session players:', playersError.message)
        return
      }
      
      console.log(`👥 Current players in session: ${players.length}`)
      const usedPremadeCharacters = players.filter(p => p.is_premade)
      console.log(`🎭 Premade characters in use: ${usedPremadeCharacters.length}`)
      usedPremadeCharacters.forEach(char => {
        console.log(`   - ${char.name} (in use)`)
      })
      
      const availablePremadeCharacters = characters.filter(
        char => !usedPremadeCharacters.some(used => used.name === char.name)
      )
      console.log(`\\n✅ Available premade characters: ${availablePremadeCharacters.length}`)
      availablePremadeCharacters.forEach(char => {
        console.log(`   - ${char.name} (available)`)
      })
      
    } else {
      console.log('\\n⚠️  No sessions found. Create a session through the GM panel first.')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testPremadeCharacterFeature()