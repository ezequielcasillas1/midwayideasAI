'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Listing, ListingFilters } from '@/types'

export function useListings(filters?: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('listings')
      .select('*, seller:users(*)')
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

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError)
      setListings([])
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  return { listings, loading, error, refetch: fetchListings }
}

export function useListing(id: string) {
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true)
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
