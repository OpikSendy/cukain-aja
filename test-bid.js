require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data: auction } = await supabase
    .from('auctions')
    .select('id, current_price, status')
    .eq('status', 'active')
    .limit(1)
    .single()

  console.log('Auction:', auction)

  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'user')
    .limit(1)
    .single()

  console.log('User:', user)

  console.log('Trying standard insert...')
  const { data: insertData, error: insertError } = await supabase
    .from('bids')
    .insert({
      auction_id: auction.id,
      user_id: user.id,
      amount: auction.current_price + 50000
    })
    .select()

  console.log('Insert Result:', insertData, insertError)

  console.log('Trying RPC place_bid...')
  const { data: rpcData, error: rpcError } = await supabase.rpc('place_bid', {
    p_auction_id: auction.id,
    p_amount: auction.current_price + 100000,
  })

  console.log('RPC Result:', rpcData, rpcError)
}

test().catch(console.error)
