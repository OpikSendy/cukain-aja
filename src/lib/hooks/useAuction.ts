/**
 * lib/hooks/useAuction.ts
 *
 * Custom hook untuk realtime auction state menggunakan Supabase Realtime.
 * Digunakan di halaman detail auction untuk live bid updates.
 *
 * PENTING: File ini hanya boleh di-import di Client Components ('use client').
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Auction, BidWithBidder } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseAuctionState {
  auction: Auction | null
  bids: BidWithBidder[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
}

export interface UseAuctionReturn extends UseAuctionState {
  refetch: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Realtime auction hook.
 *
 * @param auctionId - UUID auction yang sedang diikuti
 * @param initialAuction - Data auction dari SSR (opsional, untuk optimistic UI)
 * @param initialBids - Data bids dari SSR (opsional)
 *
 * @example
 * // Di client component halaman auction:
 * const { auction, bids, isConnected } = useAuction(auctionId, initialAuction, initialBids)
 */
export function useAuction(
  auctionId: string,
  initialAuction?: Auction | null,
  initialBids?: BidWithBidder[]
): UseAuctionReturn {
  const [state, setState] = useState<UseAuctionState>({
    auction: initialAuction ?? null,
    bids: initialBids ?? [],
    isLoading: !initialAuction,
    error: null,
    isConnected: false,
  })

  const supabase = createClient()

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchAuction = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .single()

    if (auctionError) {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Gagal memuat data lelang' }))
      return
    }

    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('*, profiles(id, name)')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })
      .limit(50)

    if (bidsError) {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Gagal memuat riwayat bid' }))
      return
    }

    setState((prev) => ({
      ...prev,
      auction,
      bids: (bids as BidWithBidder[]) ?? [],
      isLoading: false,
    }))
  }, [auctionId, supabase])

  // ─── Realtime Subscription ───────────────────────────────────────────────────

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtime = async () => {
      if (!initialAuction) {
        await fetchAuction()
      }

      // Subscribe ke perubahan auction (current_price, status)
      channel = supabase
        .channel(`auction:${auctionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'auctions',
            filter: `id=eq.${auctionId}`,
          },
          (payload) => {
            setState((prev) => ({
              ...prev,
              auction: { ...prev.auction!, ...(payload.new as Auction) },
            }))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bids',
            filter: `auction_id=eq.${auctionId}`,
          },
          async (payload) => {
            // Ambil data bidder untuk bid baru
            const { data: newBid } = await supabase
              .from('bids')
              .select('*, profiles(id, name)')
              .eq('id', (payload.new as { id: string }).id)
              .single()

            if (newBid) {
              setState((prev) => ({
                ...prev,
                bids: [newBid as BidWithBidder, ...prev.bids].slice(0, 50),
              }))
            }
          }
        )
        .subscribe((status) => {
          setState((prev) => ({
            ...prev,
            isConnected: status === 'SUBSCRIBED',
          }))
        })
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [auctionId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    refetch: fetchAuction,
  }
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────

import { getTimeRemaining, type TimeRemaining } from '@/lib/utils/format'

/**
 * Hook untuk countdown timer auction.
 * Update setiap detik.
 *
 * @example
 * const { hours, minutes, seconds, isExpired } = useAuctionCountdown(auction.end_time)
 */
export function useAuctionCountdown(endTime: string | null): TimeRemaining {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    getTimeRemaining(endTime)
  )

  useEffect(() => {
    if (!endTime) return

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(endTime)
      setTimeRemaining(remaining)

      if (remaining.isExpired) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  return timeRemaining
}