require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data, error } = await supabase.rpc('get_function_def', { func_name: 'place_bid' })
  if (error) {
    // try direct query if rpc doesn't exist
    const { data: queryData, error: queryError } = await supabase.from('pg_proc').select('*')
    console.log(queryError)
  }
}

test().catch(console.error)
