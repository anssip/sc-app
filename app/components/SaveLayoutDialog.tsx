import React, { useState } from 'react';

interface SaveLayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  loading?: boolean;
}

export const SaveLayoutDialog: React.FC<SaveLayoutDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  loading = false,
}) => {
  const [layoutName, setLayoutName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!layoutName.trim()) {
      setError('Please enter a layout name');
      return;
    }

    if (layoutName.trim().length < 2) {
      setError('Layout name must be at least 2 characters');
      return;
    }

    if (layoutName.trim().length > 50) {
      setError('Layout name must be less than 50 characters');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(layoutName.trim());
      setLayoutName('');
      onClose();
    } catch (err) {
      console.error('Failed to save layout:', err);
      setError(err instanceof Error ? err.message : 'Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setLayoutName('');
      setError(null);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleSave();
    } else if (e.key === 'Escape' && !isSaving) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Save Layout
          </h3>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Layout Name
            </label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter layout name..."
              autoFocus
              disabled={isSaving}
              maxLength={50}
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {layoutName.length}/50 characters
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This will save your current chart layout including:
            <ul className="mt-2 ml-4 list-disc">
              <li>Panel arrangement and sizes</li>
              <li>Chart symbols and timeframes</li>
              <li>Active indicators (if any)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !layoutName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSaving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveLayoutDialog;
