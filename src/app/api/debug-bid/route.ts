import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const supabase = createAdminClient()

  const { data: auction } = await supabase
    .from('auctions')
    .select('id, current_price, status')
    .eq('status', 'active')
    .limit(1)
    .single()

  if (!auction) {
    return NextResponse.json({ error: 'No active auction found' })
  }

  // Get a user
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'user')
    .limit(1)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'No user found' })
  }

  // Try standard insert without RPC
  const { data: insertData, error: insertError } = await supabase
    .from('bids')
    .insert({
      auction_id: auction.id,
      user_id: user.id,
      amount: auction.current_price + 50000
    })
    .select()

  // Try RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('place_bid', {
    p_auction_id: auction.id,
    p_amount: auction.current_price + 100000,
  })

  return NextResponse.json({
    auction,
    insertTest: { data: insertData, error: insertError },
    rpcTest: { data: rpcData, error: rpcError },
  })
}
