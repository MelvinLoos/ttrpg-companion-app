// Test the Vue components' combat store functions
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('Missing env var: SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Simulate the combat store functionality
const useCombatStore = () => {
  const monsters = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchMonsters = async () => {
    try {
      isLoading.value = true
      error.value = null
      const { data, error: fetchError } = await supabase
        .from('monster_templates')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      monsters.value = data || []
      console.log('✅ Fetched monsters:', monsters.value.length)
      return monsters.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch monsters'
      console.error('❌ Fetch monsters error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createMonster = async (monster) => {
    try {
      error.value = null
      const { data, error: createError } = await supabase
        .from('monster_templates')
        .insert([monster])
        .select()
        .single()

      if (createError) throw createError
      monsters.value.push(data)
      console.log('✅ Created monster:', data)
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create monster'
      console.error('❌ Create monster error:', err)
      throw err
    }
  }

  return {
    monsters,
    isLoading,
    error,
    fetchMonsters,
    createMonster
  }
}

// Test the actual functions
console.log('🧪 Testing Vue combat store functionality...')

const store = useCombatStore()

// Test 1: Fetch monsters (should be empty initially)
console.log('\n1. Testing fetchMonsters()...')
try {
  const monsters = await store.fetchMonsters()
  console.log(`✅ fetchMonsters() successful. Found ${monsters.length} monsters.`)
} catch (error) {
  console.error('❌ fetchMonsters() failed:', error)
}

// Test 2: Create a monster
console.log('\n2. Testing createMonster()...')
try {
  const newMonster = await store.createMonster({
    name: 'Test Kobold',
    hit_points: 5,
    armor_class: 12,
    challenge_rating: '1/8',
    description: 'A test kobold created by the Vue store test'
  })
  console.log('✅ createMonster() successful:', newMonster.name)
} catch (error) {
  console.error('❌ createMonster() failed:', error)
}

// Test 3: Fetch monsters again (should have 1 now)
console.log('\n3. Testing fetchMonsters() again...')
try {
  const monsters = await store.fetchMonsters()
  console.log(`✅ fetchMonsters() successful. Found ${monsters.length} monsters.`)
  monsters.forEach(monster => {
    console.log(`   - ${monster.name} (HP: ${monster.hit_points}, AC: ${monster.armor_class})`)
  })
} catch (error) {
  console.error('❌ fetchMonsters() failed:', error)
}

// Test 4: Clean up
console.log('\n4. Cleaning up test data...')
try {
  const { error } = await supabase
    .from('monster_templates')
    .delete()
    .ilike('name', '%test%')
  
  if (error) {
    console.error('❌ Cleanup failed:', error)
  } else {
    console.log('✅ Cleanup successful')
  }
} catch (error) {
  console.error('❌ Cleanup exception:', error)
}

console.log('\n🏁 Vue store test complete!')