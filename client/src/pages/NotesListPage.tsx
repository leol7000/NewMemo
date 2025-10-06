import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotes } from '../contexts/NotesContext';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  TrashIcon, 
  ClockIcon,
  SparklesIcon,
  ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const NotesListPage: React.FC = () => {
  const { notes, loading, error, deleteNote, summarizeNote } = useNotes();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setDeletingId(id);
        await deleteNote(id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSummarize = async (id: string) => {
    try {
      setSummarizingId(id);
      await summarizeNote(id);
    } catch (error) {
      console.error('Failed to summarize note:', error);
    } finally {
      setSummarizingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
            <p className="mt-2 text-gray-600">Create and manage your personal notes</p>
          </div>
          <Link
            to="/notes/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Note
          </Link>
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first note</p>
            <Link
              to="/notes/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Note
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                      {note.title}
                    </h3>
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={() => handleSummarize(note.id)}
                        disabled={summarizingId === note.id}
                        className="text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50"
                        title="Summarize with AI"
                      >
                        <SparklesIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={deletingId === note.id}
                        className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Delete note"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {note.summary && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {note.summary}
                    </p>
                  )}

                  {note.oneLineSummary && (
                    <p className="text-gray-500 text-xs mb-4 italic">
                      {note.oneLineSummary}
                    </p>
                  )}

                  {note.keyPoints && note.keyPoints.length > 0 && (
                    <div className="mb-4">
                      <ul className="text-sm text-gray-600 space-y-1">
                        {note.keyPoints.slice(0, 3).map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span className="line-clamp-1">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      note.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {note.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to={`/notes/${note.id}`}
                      className="flex-1 font-medium py-2 px-4 rounded-lg transition-colors text-center bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/notes/${note.id}?chat=true`}
                      className="p-2 rounded-lg transition-colors bg-blue-100 hover:bg-blue-200 text-blue-700 ml-2"
                      title="Chat with note"
                    >
                      <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesListPage;
