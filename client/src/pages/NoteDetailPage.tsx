import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useNotes } from '../contexts/NotesContext';
import { noteApi } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  SparklesIcon, 
  ChatBubbleOvalLeftEllipsisIcon,
  PaperAirplaneIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isChatMode = searchParams.get('chat') === 'true';
  
  const { updateNote, deleteNote, summarizeNote, chatWithNote } = useNotes();
  const [note, setNote] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const loadNoteAndMessages = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [noteData, messagesData] = await Promise.all([
        noteApi.getNote(id),
        noteApi.getChatMessages(id)
      ]);
      setNote(noteData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load note:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadNoteAndMessages();
    }
  }, [id, loadNoteAndMessages]);

  const handleSave = async () => {
    if (!note || !id) return;

    try {
      setIsSaving(true);
      const updatedNote = await updateNote(id, {
        title: note.title,
        content: note.content
      });
      setNote(updatedNote);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // 重新加载原始数据
    loadNoteAndMessages();
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setIsDeleting(true);
        await deleteNote(id);
        // 重定向到笔记列表
        window.location.href = '/notes';
      } catch (error) {
        console.error('Failed to delete note:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSummarize = async () => {
    if (!id) return;

    try {
      setIsSummarizing(true);
      const summarizedNote = await summarizeNote(id);
      setNote(summarizedNote);
    } catch (error) {
      console.error('Failed to summarize note:', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !id) return;

    try {
      setIsSendingMessage(true);
      const newMessages = await chatWithNote({
        noteId: id,
        message: chatMessage
      });
      setMessages(newMessages);
      setChatMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Note not found</h3>
          <p className="text-gray-600 mb-6">The note you're looking for doesn't exist.</p>
          <Link
            to="/notes"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              to="/notes"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Note Details</h1>
              <p className="mt-2 text-gray-600">
                Created {format(new Date(note.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit
                </button>
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  {isSummarizing ? 'Summarizing...' : 'Summarize'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={note.title}
                        onChange={(e) => setNote({ ...note, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter note title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <RichTextEditor
                        value={note.content}
                        onChange={(content) => setNote({ ...note, content })}
                        placeholder="Start writing your note..."
                        height={400}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">{note.title}</h2>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Summary Section */}
            {(note.summary || note.oneLineSummary || note.keyPoints) && (
              <div className="mt-8 bg-white rounded-lg shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Summary</h3>
                  
                  {note.oneLineSummary && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">One-line Summary</h4>
                      <p className="text-gray-600 italic">{note.oneLineSummary}</p>
                    </div>
                  )}

                  {note.summary && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                      <p className="text-gray-600">{note.summary}</p>
                    </div>
                  )}

                  {note.keyPoints && note.keyPoints.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points</h4>
                      <ul className="space-y-2">
                        {note.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span className="text-gray-600">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
                  <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-gray-400" />
                </div>

                {/* Messages */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-100 text-blue-900 ml-8'
                          : 'bg-gray-100 text-gray-900 mr-8'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about this note..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || isSendingMessage}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;
