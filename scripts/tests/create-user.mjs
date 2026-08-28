// Create user via Supabase admin API
import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabaseUrl = 'http://127.0.0.1:54321'
const serviceRoleKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz' // Service role key from supabase status
const anonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' // Anon key

console.log('👤 Creating test user with admin client...')

// Admin client with service role key
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Regular client with anon key
const userClient = createClient(supabaseUrl, anonKey)

try {
  // Create user with admin client
  const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
    email: 'gm@test.com',
    password: 'password123',
    email_confirm: true, // Skip email confirmation
  })

  if (adminError) {
    console.error('❌ Admin user creation failed:', adminError)
  } else {
    console.log('✅ User created via admin:', adminData.user.email)
    
    // Now test signing in with regular client
    console.log('\n🔑 Testing sign in with regular client...')
    
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: 'gm@test.com',
      password: 'password123'
    })

    if (signInError) {
      console.error('❌ Sign in failed:', signInError)
    } else {
      console.log('✅ Sign in successful:', signInData.user.email)
      
      // Test monster creation with authenticated user
      console.log('\n🐉 Testing monster creation as authenticated user...')
      
      const { data: monster, error: createError } = await userClient
        .from('monster_templates')
        .insert([{
          name: 'Authenticated Test Orc',
          hit_points: 15,
          armor_class: 13,
          challenge_rating: '1',
          description: 'Created by properly authenticated user'
        }])
        .select()
        .single()

      if (createError) {
        console.error('❌ Monster creation failed:', createError)
      } else {
        console.log('✅ Monster created successfully:', monster.name)
        
        // Test fetching
        const { data: monsters, error: fetchError } = await userClient
          .from('monster_templates')
          .select('*')

        if (fetchError) {
          console.error('❌ Fetch failed:', fetchError)
        } else {
          console.log(`✅ Fetched ${monsters.length} monsters`)
        }

        // Clean up
        await userClient.from('monster_templates').delete().eq('id', monster.id)
        console.log('✅ Cleanup complete')
      }
    }
  }
} catch (err) {
  console.error('❌ Exception:', err)
}

console.log('\n🏁 User creation test complete!')