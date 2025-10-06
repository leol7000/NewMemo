import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../contexts/NotesContext';
import RichTextEditor from '../components/RichTextEditor';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const NewNotePage: React.FC = () => {
  const navigate = useNavigate();
  const { createNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      const newNote = await createNote({
        title: title.trim(),
        content: content.trim()
      });
      navigate(`/notes/${newNote.id}`);
    } catch (err) {
      console.error('Failed to create note:', err);
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    navigate('/notes');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={handleCancel}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Note</h1>
              <p className="mt-2 text-gray-600">Start writing your personal note</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || !content.trim() || isCreating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              {isCreating ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter note title..."
                  disabled={isCreating}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Start writing your note..."
                  height={500}
                />
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Tips for better notes</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use headings to organize your content</li>
                      <li>• Add images to make your notes more visual</li>
                      <li>• Use bullet points for key information</li>
                      <li>• You can summarize your note with AI after creating it</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewNotePage;
