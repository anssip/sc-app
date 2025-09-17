import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

export interface BlogPost {
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
}

export interface BlogPostMeta {
  slug: string
  title: string
  excerpt: string
  author: string
  publishDate: string
  category: string
  readingTime?: string
  published?: boolean
  featured?: boolean
}

const BLOG_PATH = path.join(process.cwd(), 'app', 'content', 'blog')

function ensureBlogDirectory() {
  if (!fs.existsSync(BLOG_PATH)) {
    fs.mkdirSync(BLOG_PATH, { recursive: true })
  }
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  ensureBlogDirectory()
  
  try {
    const files = fs.readdirSync(BLOG_PATH)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    const posts = markdownFiles.map(filename => {
      const filePath = path.join(BLOG_PATH, filename)
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
        category: data.category || 'Uncategorized',
        readingTime,
        published: data.published !== undefined ? data.published : true,
        featured: data.featured || false
      }
    })
    
    // Filter only published posts and sort by publish date, newest first
    return posts
      .filter(post => post.published === true)
      .sort((a, b) => 
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      )
  } catch (error) {
    return []
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  ensureBlogDirectory()
  
  try {
    const filePath = path.join(BLOG_PATH, `${slug}.md`)
    
    if (!fs.existsSync(filePath)) {
      return null
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)
    
    // Check if the post is published, default to true if not specified
    const isPublished = data.published !== undefined ? data.published : true
    
    // Return null if the post is not published
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
      category: data.category || 'Uncategorized',
      readingTime,
      published: isPublished,
      featured: data.featured || false
    }
  } catch (error) {
    return null
  }
}

export async function getFeaturedBlogPost(): Promise<BlogPostMeta | null> {
  const posts = await getAllBlogPosts()
  return posts.find(post => post.featured === true) || null
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}