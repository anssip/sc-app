import React from 'react'
import { Link } from '@remix-run/react'
import { useSubscription } from '~/contexts/SubscriptionContext'

interface UpgradePromptProps {
  feature: 'layouts' | 'indicators'
  onClose: () => void
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, onClose }) => {
  const { status, plan } = useSubscription()

  const getMessage = () => {
    if (status === 'none' || status === 'canceled') {
      return {
        title: 'Subscription Required',
        message: feature === 'layouts' 
          ? 'Subscribe to save and manage chart layouts'
          : 'Subscribe to add technical indicators to your charts',
        buttonText: 'View Plans',
        buttonLink: '/pricing'
      }
    }
    
    if (status === 'active' && plan === 'starter') {
      return {
        title: 'Upgrade to Pro',
        message: feature === 'layouts'
          ? "You've reached your limit of 2 saved layouts. Upgrade to Pro for unlimited layouts."
          : "You've reached your limit of 2 indicators per chart. Upgrade to Pro for unlimited indicators.",
        buttonText: 'Upgrade to Pro',
        buttonLink: '/billing'
      }
    }

    return null
  }

  const content = getMessage()
  if (!content) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {content.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {content.message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <Link
            to={content.buttonLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {content.buttonText}
          </Link>
        </div>
      </div>
    </div>
  )
}