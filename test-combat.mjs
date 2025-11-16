// Test script to check if combat system database operations work
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Testing combat system database operations...')

// Test 1: Check if monster_templates table exists
console.log('\n1. Testing monster_templates table...')
try {
  const { data, error } = await supabase
    .from('monster_templates')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error fetching from monster_templates:', error)
  } else {
    console.log('✅ monster_templates table accessible')
    console.log('Current monsters count:', data?.length || 0)
  }
} catch (err) {
  console.error('❌ Exception fetching monsters:', err)
}

// Test 2: Try to create a test monster
console.log('\n2. Testing monster creation...')
try {
  const { data, error } = await supabase
    .from('monster_templates')
    .insert([{
      name: 'Test Goblin',
      hit_points: 7,
      armor_class: 15,
      challenge_rating: '1/4',
      description: 'A test goblin for debugging'
    }])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating monster:', error)
  } else {
    console.log('✅ Monster created successfully:', data)
    
    // Clean up - delete the test monster
    const { error: deleteError } = await supabase
      .from('monster_templates')
      .delete()
      .eq('id', data.id)
    
    if (deleteError) {
      console.error('⚠️  Could not clean up test monster:', deleteError)
    } else {
      console.log('✅ Test monster cleaned up')
    }
  }
} catch (err) {
  console.error('❌ Exception creating monster:', err)
}

// Test 3: Check all combat tables
console.log('\n3. Testing all combat tables...')
const tables = ['monster_templates', 'combat_encounters', 'combat_encounter_monsters', 'active_combats', 'combat_participants']

for (const table of tables) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)

    if (error) {
      console.error(`❌ Error accessing ${table}:`, error)
    } else {
      console.log(`✅ ${table} accessible (${data?.length || 0} records)`)
    }
  } catch (err) {
    console.error(`❌ Exception accessing ${table}:`, err)
  }
}

console.log('\n✅ Database test complete!')