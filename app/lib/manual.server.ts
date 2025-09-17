import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

export interface ManualEntry {
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  publishDate: string
  category: string
  readingTime?: string
  published?: boolean
  featured?: boolean
  order?: number
}

export interface ManualEntryMeta {
  slug: string
  title: string
  excerpt: string
  author: string
  publishDate: string
  category: string
  readingTime?: string
  published?: boolean
  featured?: boolean
  order?: number
}

const MANUAL_PATH = path.join(process.cwd(), 'app', 'content', 'manual')

function ensureManualDirectory() {
  if (!fs.existsSync(MANUAL_PATH)) {
    fs.mkdirSync(MANUAL_PATH, { recursive: true })
  }
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

export async function getAllManualEntries(): Promise<ManualEntryMeta[]> {
  ensureManualDirectory()
  
  try {
    const files = fs.readdirSync(MANUAL_PATH)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    const entries = markdownFiles.map(filename => {
      const filePath = path.join(MANUAL_PATH, filename)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data, content } = matter(fileContent)
      
      const slug = filename.replace('.md', '')
      const readingTime = calculateReadingTime(content)
      
      return {
        slug,
        title: data.title || 'Untitled',
        excerpt: data.excerpt || '',
        author: data.author || 'Spot Canvas Team',
        publishDate: data.publishDate || new Date().toISOString(),
        category: data.category || 'General',
        readingTime,
        published: data.published !== undefined ? data.published : true,
        featured: data.featured || false,
        order: data.order || 999
      }
    })
    
    // Filter only published entries and sort by order, then by publish date
    return entries
      .filter(entry => entry.published === true)
      .sort((a, b) => {
        // First sort by order if defined
        if (a.order !== b.order) {
          return (a.order || 999) - (b.order || 999)
        }
        // Then by publish date, newest first
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      })
  } catch (error) {
    return []
  }
}

export async function getManualEntry(slug: string): Promise<ManualEntry | null> {
  ensureManualDirectory()
  
  try {
    const filePath = path.join(MANUAL_PATH, `${slug}.md`)
    
    if (!fs.existsSync(filePath)) {
      return null
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)
    
    // Check if the entry is published, default to true if not specified
    const isPublished = data.published !== undefined ? data.published : true
    
    // Return null if the entry is not published
    if (!isPublished) {
      return null
    }
    
    // Configure marked for better rendering
    marked.setOptions({
      gfm: true,
      breaks: true,
      pedantic: false,
      headerIds: true,
      mangle: false,
      smartLists: true,
      smartypants: true
    })
    
    const htmlContent = marked(content)
    const readingTime = calculateReadingTime(content)
    
    return {
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      content: htmlContent,
      author: data.author || 'Spot Canvas Team',
      publishDate: data.publishDate || new Date().toISOString(),
      category: data.category || 'General',
      readingTime,
      published: isPublished,
      featured: data.featured || false,
      order: data.order || 999
    }
  } catch (error) {
    return null
  }
}

export async function getFeaturedManualEntry(): Promise<ManualEntryMeta | null> {
  const entries = await getAllManualEntries()
  return entries.find(entry => entry.featured === true) || null
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}