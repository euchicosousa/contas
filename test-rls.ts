import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Testing anon key insertion...')
  const { data, error } = await supabase
    .from('transaction_groups')
    .insert({ name: 'Test', user_id: 'some-uuid' })
    .select()

  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('Success:', data)
  }
}

test()
