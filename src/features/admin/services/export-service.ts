import { supabase } from '@/lib/supabase'

type ExportableData = Record<string, unknown>[]

function convertToCSV(data: ExportableData, columns: { key: string; label: string }[]): string {
  if (data.length === 0) return ''
  
  const headers = columns.map(c => c.label).join(',')
  
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key]
      if (value === null || value === undefined) return ''
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  })
  
  return [headers, ...rows].join('\n')
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportSovereignMembers(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        points,
        created_at,
        user:users(id, email, display_name, created_at)
      `)
      .eq('tier', 'sovereign')
      .order('created_at', { ascending: false })

    if (error) throw error

    const exportData = (data || []).map(m => ({
      id: (m.user as any)?.id || '',
      email: (m.user as any)?.email || '',
      display_name: (m.user as any)?.display_name || '',
      points: m.points,
      member_since: (m.user as any)?.created_at || '',
      upgraded_at: m.created_at
    }))

    const csv = convertToCSV(exportData, [
      { key: 'id', label: 'User ID' },
      { key: 'email', label: 'Email' },
      { key: 'display_name', label: 'Display Name' },
      { key: 'points', label: 'Points' },
      { key: 'member_since', label: 'Member Since' },
      { key: 'upgraded_at', label: 'Sovereign Since' }
    ])

    downloadCSV(csv, 'sovereign-members')
    return true
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}

export async function exportCofounderRequests(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('cofounder_requests')
      .select(`
        id,
        status,
        vision,
        experience,
        created_at,
        reviewed_at,
        user:users(id, email, display_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const exportData = (data || []).map(r => ({
      id: r.id,
      user_id: (r.user as any)?.id || '',
      email: (r.user as any)?.email || '',
      display_name: (r.user as any)?.display_name || '',
      status: r.status,
      vision: r.vision,
      experience: r.experience,
      submitted_at: r.created_at,
      reviewed_at: r.reviewed_at || ''
    }))

    const csv = convertToCSV(exportData, [
      { key: 'id', label: 'Request ID' },
      { key: 'user_id', label: 'User ID' },
      { key: 'email', label: 'Email' },
      { key: 'display_name', label: 'Display Name' },
      { key: 'status', label: 'Status' },
      { key: 'vision', label: 'Vision' },
      { key: 'experience', label: 'Experience' },
      { key: 'submitted_at', label: 'Submitted At' },
      { key: 'reviewed_at', label: 'Reviewed At' }
    ])

    downloadCSV(csv, 'cofounder-requests')
    return true
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}

export async function exportAllUsers(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        display_name,
        created_at,
        memberships(tier, points, is_verified)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const exportData = (data || []).map(u => ({
      id: u.id,
      email: u.email,
      display_name: u.display_name || '',
      tier: (u.memberships as any)?.[0]?.tier || 'citizen',
      points: (u.memberships as any)?.[0]?.points || 0,
      verified: (u.memberships as any)?.[0]?.is_verified ? 'Yes' : 'No',
      created_at: u.created_at
    }))

    const csv = convertToCSV(exportData, [
      { key: 'id', label: 'User ID' },
      { key: 'email', label: 'Email' },
      { key: 'display_name', label: 'Display Name' },
      { key: 'tier', label: 'Tier' },
      { key: 'points', label: 'Points' },
      { key: 'verified', label: 'Verified' },
      { key: 'created_at', label: 'Created At' }
    ])

    downloadCSV(csv, 'all-users')
    return true
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}

export async function exportAllListings(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        price,
        category,
        status,
        is_featured,
        created_at,
        seller:users(id, email, display_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const exportData = (data || []).map(l => ({
      id: l.id,
      title: l.title,
      description: l.description || '',
      price: l.price,
      category: l.category,
      status: l.status,
      featured: l.is_featured ? 'Yes' : 'No',
      seller_id: (l.seller as any)?.id || '',
      seller_email: (l.seller as any)?.email || '',
      seller_name: (l.seller as any)?.display_name || '',
      created_at: l.created_at
    }))

    const csv = convertToCSV(exportData, [
      { key: 'id', label: 'Listing ID' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'price', label: 'Price' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'featured', label: 'Featured' },
      { key: 'seller_id', label: 'Seller ID' },
      { key: 'seller_email', label: 'Seller Email' },
      { key: 'seller_name', label: 'Seller Name' },
      { key: 'created_at', label: 'Created At' }
    ])

    downloadCSV(csv, 'all-listings')
    return true
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}

export async function exportAnnouncements(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('community_announcements')
      .select(`
        id,
        title,
        content,
        is_pinned,
        published_at,
        created_at,
        author:users(id, email, display_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const exportData = (data || []).map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      pinned: a.is_pinned ? 'Yes' : 'No',
      status: a.published_at ? 'Published' : 'Draft',
      published_at: a.published_at || '',
      author_id: (a.author as any)?.id || '',
      author_email: (a.author as any)?.email || '',
      created_at: a.created_at
    }))

    const csv = convertToCSV(exportData, [
      { key: 'id', label: 'Announcement ID' },
      { key: 'title', label: 'Title' },
      { key: 'content', label: 'Content' },
      { key: 'pinned', label: 'Pinned' },
      { key: 'status', label: 'Status' },
      { key: 'published_at', label: 'Published At' },
      { key: 'author_id', label: 'Author ID' },
      { key: 'author_email', label: 'Author Email' },
      { key: 'created_at', label: 'Created At' }
    ])

    downloadCSV(csv, 'announcements')
    return true
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}

export async function exportActivityLog(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select(`
        id,
        action,
        target_type,
        target_id,
        details,
        created_at,
        admin:users(id, email, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) throw error

    const exportData = (data || []).map(a => ({
      id: a.id,
      action: a.action,
      target_type: a.target_type,
      target_id: a.target_id || '',
      details: JSON.stringify(a.details),
      admin_id: (a.admin as any)?.id || '',
      admin_email: (a.admin as any)?.email || '',
      created_at: a.created_at
    }))

    const csv = convertToCSV(exportData, [
      { key: 'id', label: 'Log ID' },
      { key: 'action', label: 'Action' },
      { key: 'target_type', label: 'Target Type' },
      { key: 'target_id', label: 'Target ID' },
      { key: 'details', label: 'Details' },
      { key: 'admin_id', label: 'Admin ID' },
      { key: 'admin_email', label: 'Admin Email' },
      { key: 'created_at', label: 'Created At' }
    ])

    downloadCSV(csv, 'activity-log')
    return true
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}
