import React, { useState } from 'react';
import { PlusIcon, LinkIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useMemos } from '../contexts/MemoContext';

const AddMemoForm: React.FC = () => {
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'website' | 'youtube'>('website');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addMemo, state } = useMemos();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSubmitting(true);
    try {
      await addMemo(url.trim(), type);
      setUrl('');
    } catch (error) {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Auto-detect YouTube links
    if (isYouTubeUrl(newUrl)) {
      setType('youtube');
    } else {
      setType('website');
    }
  };

  return (
    <div className="card mb-8">
      <div className="flex items-center gap-2 mb-4">
        <PlusIcon className="h-6 w-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">Add New Memo</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Web URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter web URL or YouTube video link..."
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="website"
                checked={type === 'website'}
                onChange={(e) => setType(e.target.value as 'website')}
                className="text-primary-600 focus:ring-primary-500"
              />
              <LinkIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">Website</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="youtube"
                checked={type === 'youtube'}
                onChange={(e) => setType(e.target.value as 'youtube')}
                className="text-primary-600 focus:ring-primary-500"
              />
              <VideoCameraIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">YouTube Video</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Generate Summary'}
        </button>
      </form>

      {state.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{state.error}</p>
        </div>
      )}
    </div>
  );
};

export default AddMemoForm;