// Create sample monsters and encounters to test the interface
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🎲 Creating sample combat data for interface testing...')

// Sample monsters
const sampleMonsters = [
    {
        name: 'Goblin Warrior',
        hit_points: 7,
        armor_class: 15,
        challenge_rating: '1/4',
        description: 'A small, mean-spirited humanoid that delights in chaos and violence.'
    },
    {
        name: 'Orc Berserker', 
        hit_points: 15,
        armor_class: 13,
        challenge_rating: '1/2',
        description: 'A savage humanoid that lives for battle and bloodshed.'
    },
    {
        name: 'Dire Wolf',
        hit_points: 37,
        armor_class: 14,
        challenge_rating: '1',
        description: 'A massive wolf with intelligence and pack tactics.'
    },
    {
        name: 'Young Red Dragon',
        hit_points: 178,
        armor_class: 18,
        challenge_rating: '10',
        description: 'A fearsome dragon with fire breath and powerful claws.'
    }
]

// Create monsters
console.log('\n1. Creating sample monsters...')
const createdMonsters = []

for (const monster of sampleMonsters) {
    try {
        const { data, error } = await supabase
            .from('monster_templates')
            .insert([monster])
            .select()
            .single()

        if (error) {
            console.error(`❌ Failed to create ${monster.name}:`, error)
        } else {
            console.log(`✅ Created ${monster.name} (${monster.challenge_rating})`)
            createdMonsters.push(data)
        }
    } catch (err) {
        console.error(`❌ Exception creating ${monster.name}:`, err)
    }
}

// Create sample encounters
console.log('\n2. Creating sample encounters...')
const sampleEncounters = [
    {
        name: 'Goblin Ambush',
        description: 'A band of goblins attacks from the bushes'
    },
    {
        name: 'Orc Raid',
        description: 'Orcs assault the village'
    },
    {
        name: 'Dragon Lair',
        description: 'Face the mighty dragon in its lair'
    }
]

const createdEncounters = []

for (const encounter of sampleEncounters) {
    try {
        const { data, error } = await supabase
            .from('combat_encounters')
            .insert([encounter])
            .select()
            .single()

        if (error) {
            console.error(`❌ Failed to create ${encounter.name}:`, error)
        } else {
            console.log(`✅ Created encounter: ${encounter.name}`)
            createdEncounters.push(data)
        }
    } catch (err) {
        console.error(`❌ Exception creating ${encounter.name}:`, err)
    }
}

// Add monsters to encounters
console.log('\n3. Adding monsters to encounters...')
if (createdMonsters.length > 0 && createdEncounters.length > 0) {
    // Goblin Ambush - 4 goblins
    const goblin = createdMonsters.find(m => m.name === 'Goblin Warrior')
    const goblinEncounter = createdEncounters.find(e => e.name === 'Goblin Ambush')
    
    if (goblin && goblinEncounter) {
        const { error } = await supabase
            .from('combat_encounter_monsters')
            .insert([{
                encounter_id: goblinEncounter.id,
                monster_template_id: goblin.id,
                quantity: 4
            }])
        
        if (error) {
            console.error('❌ Failed to add goblins to encounter:', error)
        } else {
            console.log('✅ Added 4 goblins to Goblin Ambush')
        }
    }

    // Orc Raid - 2 orcs
    const orc = createdMonsters.find(m => m.name === 'Orc Berserker')
    const orcEncounter = createdEncounters.find(e => e.name === 'Orc Raid')
    
    if (orc && orcEncounter) {
        const { error } = await supabase
            .from('combat_encounter_monsters')
            .insert([{
                encounter_id: orcEncounter.id,
                monster_template_id: orc.id,
                quantity: 2
            }])
        
        if (error) {
            console.error('❌ Failed to add orcs to encounter:', error)
        } else {
            console.log('✅ Added 2 orcs to Orc Raid')
        }
    }

    // Dragon Lair - 1 dragon + 1 dire wolf
    const dragon = createdMonsters.find(m => m.name === 'Young Red Dragon')
    const wolf = createdMonsters.find(m => m.name === 'Dire Wolf')
    const dragonEncounter = createdEncounters.find(e => e.name === 'Dragon Lair')
    
    if (dragon && dragonEncounter) {
        await supabase
            .from('combat_encounter_monsters')
            .insert([
                {
                    encounter_id: dragonEncounter.id,
                    monster_template_id: dragon.id,
                    quantity: 1
                },
                {
                    encounter_id: dragonEncounter.id,
                    monster_template_id: wolf.id,
                    quantity: 1
                }
            ])
        
        console.log('✅ Added dragon + dire wolf to Dragon Lair')
    }
}

// Verify data
console.log('\n4. Verifying created data...')
const { data: finalMonsters } = await supabase.from('monster_templates').select('*').order('name')
const { data: finalEncounters } = await supabase.from('combat_encounters').select('*').order('name')
const { data: encounterMonsters } = await supabase.from('combat_encounter_monsters').select('*')

console.log(`✅ Total monsters created: ${finalMonsters?.length || 0}`)
console.log(`✅ Total encounters created: ${finalEncounters?.length || 0}`)
console.log(`✅ Total encounter-monster links: ${encounterMonsters?.length || 0}`)

finalMonsters?.forEach(m => {
    console.log(`   - ${m.name} (CR ${m.challenge_rating})`)
})

finalEncounters?.forEach(e => {
    console.log(`   - ${e.name}`)
})

console.log('\n🎉 Sample data creation complete!')
console.log('\nNow check the interface at:')
console.log('- Monsters: http://localhost:5173/gm/monsters')
console.log('- Encounters: http://localhost:5173/gm/encounters')