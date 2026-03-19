export type Category = 'webapp' | 'website' | 'extension' | 'desktop' | 'mobile' | 'game' | 'api' | 'os' | 'other'
export type ListingStatus = 'active' | 'sold' | 'draft'
export type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'completion'

export interface User {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Listing {
  id: string
  title: string
  description: string
  category: Category
  tech_stack: string[]
  price: number
  completion_percent: number
  repo_url: string | null
  demo_url: string | null
  images: string[]
  status: ListingStatus
  seller_id: string
  seller?: User
  created_at: string
  updated_at: string
}

export interface ListingFilters {
  category?: Category
  minPrice?: number
  maxPrice?: number
  minCompletion?: number
  maxCompletion?: number
  search?: string
  sort?: SortOption
  page?: number
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      listings: {
        Row: Listing
        Insert: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'seller'>
        Update: Partial<Omit<Listing, 'id' | 'created_at' | 'seller_id' | 'seller'>>
      }
    }
  }
}
