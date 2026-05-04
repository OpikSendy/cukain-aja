import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const supabase = createAdminClient()

  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select('id, current_price, status')
    .eq('status', 'active')
    .limit(1)
    .single()

  // Tangani jika query error atau data tidak ada
  if (auctionError || !auction) {
    return NextResponse.json(
      { error: auctionError?.message || 'No active auction found' },
      { status: 404 }
    )
  }

  // 2. Ambil data user
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'user')
    .limit(1)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'No user found' }, { status: 404 })
  }

  /**
   * SOLUSI TYPE SAFETY:
   * Paksa nilai ke number dengan fallback 0 untuk menghindari error 'null'
   */
  const currentPrice = auction.current_price ?? 0;

  // 3. Jalankan operasi secara paralel untuk performa maksimal
  const [insertResult, rpcResult] = await Promise.all([
    supabase
      .from('bids')
      .insert({
        auction_id: auction.id,
        user_id: user.id,
        amount: currentPrice + 50000,
      })
      .select()
      .single(),

    supabase.rpc('place_bid', {
      p_auction_id: auction.id,
      p_amount: currentPrice + 100000,
    })
  ]);

  return NextResponse.json({
    auction_info: {
      id: auction.id,
      last_price: currentPrice,
    },
    insertTest: {
      success: !insertResult.error,
      data: insertResult.data,
      error: insertResult.error?.message
    },
    rpcTest: {
      success: !rpcResult.error,
      data: rpcResult.data,
      error: rpcResult.error?.message
    },
  })
}