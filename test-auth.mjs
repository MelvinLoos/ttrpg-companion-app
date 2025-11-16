// Test authenticated monster creation
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔐 Testing authenticated combat operations...')

// Test 1: Try to authenticate
console.log('\n1. Testing authentication...')
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'gm@test.com',
    password: 'password123'
  })

  if (error) {
    console.error('❌ Auth error:', error)
  } else {
    console.log('✅ Authenticated successfully:', data.user.email)
    console.log('   User ID:', data.user.id)
    
    // Test 2: Try monster creation as authenticated user
    console.log('\n2. Testing monster creation as authenticated user...')
    
    const { data: monster, error: createError } = await supabase
      .from('monster_templates')
      .insert([{
        name: 'Auth Test Dragon',
        hit_points: 200,
        armor_class: 18,
        challenge_rating: '10',
        description: 'A dragon created by authenticated user'
      }])
      .select()
      .single()

    if (createError) {
      console.error('❌ Monster creation error:', createError)
    } else {
      console.log('✅ Monster created as authenticated user:', monster.name)
      
      // Test 3: Try to fetch monsters
      console.log('\n3. Testing monster fetching...')
      const { data: monsters, error: fetchError } = await supabase
        .from('monster_templates')
        .select('*')
        .order('name')

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError)
      } else {
        console.log(`✅ Fetched ${monsters.length} monsters:`)
        monsters.forEach(m => {
          console.log(`   - ${m.name} (HP: ${m.hit_points}, AC: ${m.armor_class})`)
        })
      }

      // Test 4: Try encounter creation
      console.log('\n4. Testing encounter creation...')
      const { data: encounter, error: encounterError } = await supabase
        .from('combat_encounters')
        .insert([{
          name: 'Auth Test Encounter',
          description: 'An encounter created by authenticated user'
        }])
        .select()
        .single()

      if (encounterError) {
        console.error('❌ Encounter creation error:', encounterError)
      } else {
        console.log('✅ Encounter created:', encounter.name)
      }

      // Clean up
      console.log('\n5. Cleaning up...')
      await supabase.from('monster_templates').delete().ilike('name', '%test%')
      await supabase.from('combat_encounters').delete().ilike('name', '%test%')
      console.log('✅ Cleanup complete')
    }
  }
} catch (err) {
  console.error('❌ Exception:', err)
}

console.log('\n🏁 Authenticated test complete!')