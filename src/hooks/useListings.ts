'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { mockListings, USE_MOCK_DATA } from '@/lib/mockData'
import type { Listing, ListingFilters } from '@/types'

export const ITEMS_PER_PAGE = 9

interface PaginatedResult {
  items: Listing[]
  total: number
}

function filterMockListings(listings: Listing[], filters?: ListingFilters): PaginatedResult {
  let result = listings.filter(l => l.status === 'active')

  if (filters?.category) {
    result = result.filter(l => l.category === filters.category)
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase()
    result = result.filter(l => 
      l.title.toLowerCase().includes(search) || 
      l.description.toLowerCase().includes(search)
    )
  }

  if (filters?.minPrice !== undefined) {
    result = result.filter(l => l.price >= filters.minPrice!)
  }

  if (filters?.maxPrice !== undefined) {
    result = result.filter(l => l.price <= filters.maxPrice!)
  }

  if (filters?.minCompletion !== undefined) {
    result = result.filter(l => l.completion_percent >= filters.minCompletion!)
  }

  if (filters?.maxCompletion !== undefined) {
    result = result.filter(l => l.completion_percent <= filters.maxCompletion!)
  }

  switch (filters?.sort) {
    case 'oldest':
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    case 'price_low':
      result.sort((a, b) => a.price - b.price)
      break
    case 'price_high':
      result.sort((a, b) => b.price - a.price)
      break
    case 'completion':
      result.sort((a, b) => b.completion_percent - a.completion_percent)
      break
    default:
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const total = result.length
  const start = (filters?.page || 0) * ITEMS_PER_PAGE
  const paginatedResult = result.slice(start, start + ITEMS_PER_PAGE)

  return { items: paginatedResult, total }
}

export function useListings(filters?: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (USE_MOCK_DATA) {
      const { items, total } = filterMockListings(mockListings, filters)
      setListings(items)
      setTotalCount(total)
      setLoading(false)
      return
    }

    let query = supabase
      .from('listings')
      .select('*, seller:users(*)', { count: 'exact' })
      .eq('status', 'active')

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }

    if (filters?.minCompletion !== undefined) {
      query = query.gte('completion_percent', filters.minCompletion)
    }

    if (filters?.maxCompletion !== undefined) {
      query = query.lte('completion_percent', filters.maxCompletion)
    }

    switch (filters?.sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'price_low':
        query = query.order('price', { ascending: true })
        break
      case 'price_high':
        query = query.order('price', { ascending: false })
        break
      case 'completion':
        query = query.order('completion_percent', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const start = (filters?.page || 0) * ITEMS_PER_PAGE
    query = query.range(start, start + ITEMS_PER_PAGE - 1)

    const { data, error: fetchError, count } = await query

    if (fetchError) {
      setError(fetchError)
      setListings([])
      setTotalCount(0)
    } else {
      setListings(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  return { listings, loading, error, totalCount, totalPages, refetch: fetchListings }
}

export function useListing(id: string) {
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true)

      if (USE_MOCK_DATA) {
        const found = mockListings.find(l => l.id === id) || null
        setListing(found)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*, seller:users(*)')
        .eq('id', id)
        .single()

      if (fetchError) {
        setError(fetchError)
        setListing(null)
      } else {
        setListing(data)
      }
      setLoading(false)
    }

    if (id) {
      fetchListing()
    }
  }, [id])

  return { listing, loading, error }
}

export function useMyListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMyListings = useCallback(async () => {
    setLoading(true)

    if (USE_MOCK_DATA) {
      setListings(mockListings)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setListings([])
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError)
      setListings([])
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMyListings()
  }, [fetchMyListings])

  return { listings, loading, error, refetch: fetchMyListings }
}

export function useCreateListing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createListing = async (listing: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'seller' | 'seller_id'>) => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = new Error('Not authenticated')
      setError(err)
      setLoading(false)
      throw err
    }

    const { data, error: insertError } = await supabase
      .from('listings')
      .insert({ ...listing, seller_id: user.id })
      .select()
      .single()

    if (insertError) {
      setError(insertError)
      setLoading(false)
      throw insertError
    }

    setLoading(false)
    return data
  }

  return { createListing, loading, error }
}

export function useUpdateListing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateListing = async (id: string, updates: Partial<Omit<Listing, 'id' | 'created_at' | 'seller_id' | 'seller'>>) => {
    setLoading(true)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError)
      setLoading(false)
      throw updateError
    }

    setLoading(false)
    return data
  }

  return { updateListing, loading, error }
}

export function useDeleteListing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteListing = async (id: string) => {
    setLoading(true)
    setError(null)

    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError)
      setLoading(false)
      throw deleteError
    }

    setLoading(false)
  }

  return { deleteListing, loading, error }
}
