import { Link } from '@remix-run/react'
import type { ManualEntryMeta } from '~/lib/manual.server'

interface ManualCardProps {
  entry: ManualEntryMeta
}

export default function ManualCard({ entry }: ManualCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Link
      to={`/manual/${entry.slug}`}
      className="group block h-full bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500/50 transition-all duration-300 overflow-hidden"
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
            {entry.category}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(entry.publishDate)}
          </span>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors line-clamp-2">
          {entry.title}
        </h2>
        
        <p className="text-gray-400 mb-6 flex-1 line-clamp-3">
          {entry.excerpt}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
              <span className="text-xs font-medium text-green-400">
                {entry.author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-300">{entry.author}</span>
          </div>
          {entry.readingTime && (
            <span className="text-sm text-gray-500">{entry.readingTime}</span>
          )}
        </div>
      </div>
    </Link>
  )
}