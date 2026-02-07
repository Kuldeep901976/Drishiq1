// Blog system types
export interface BlogPost {
  id: string
  title: string
  content: string
  excerpt?: string
  slug: string
  author_id: string
  author_name: string
  status: 'draft' | 'published' | 'archived'
  category: string
  tags: string[]
  featured: boolean
  featured_image?: string
  read_time: number
  views: number
  likes: number
  comments_count: number
  created_at: string
  updated_at: string
  published_at?: string
  seo_title?: string
  seo_description?: string
}

export interface BlogComment {
  id: string
  post_id: string
  author_id: string
  author_name: string
  content: string
  parent_id?: string
  likes: number
  created_at: string
  updated_at: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  post_count: number
}

export interface BlogFilters {
  category?: string
  author?: string
  status?: 'draft' | 'published' | 'archived'
  featured?: boolean
  date_from?: string
  date_to?: string
  search?: string
  tags?: string[]
}