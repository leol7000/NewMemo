import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, TrashIcon, ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Collection, CollectionMemo, MemoCard, ChatMessage } from '../shared/types';
import { collectionApi, memoApi } from '../services/api';
import { format } from 'date-fns';

const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [memos, setMemos] = useState<CollectionMemo[]>([]);
  const [allMemos, setAllMemos] = useState<MemoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemoModal, setShowAddMemoModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadCollectionData();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCollectionData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [collectionData, memosData, allMemosData, messagesData] = await Promise.all([
        collectionApi.getCollection(id),
        collectionApi.getCollectionMemos(id),
        memoApi.getAllMemos(),
        collectionApi.getChatMessages(id)
      ]);
      
      setCollection(collectionData);
      setMemos(memosData);
      setAllMemos(allMemosData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load collection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemoToCollection = async (memoId: string) => {
    if (!id) return;
    
    try {
      await collectionApi.addMemoToCollection({ collection_id: id, memo_id: memoId });
      await loadCollectionData(); // Reload data
      setShowAddMemoModal(false);
    } catch (error) {
      console.error('Failed to add memo to collection:', error);
    }
  };

  const handleRemoveMemoFromCollection = async (memoId: string) => {
    if (!id) return;
    
    try {
      await collectionApi.removeMemoFromCollection(id, memoId);
      await loadCollectionData(); // Reload data
    } catch (error) {
      console.error('Failed to remove memo from collection:', error);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    setIsSending(true);
    const userMessage = newMessage.trim();
    setNewMessage('');

    // 立即显示用户消息
    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      memoId: id,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // 显示AI思考中状态
    const thinkingMessage: ChatMessage = {
      id: `temp-thinking-${Date.now()}`,
      memoId: id,
      role: 'assistant',
      content: '🤔 Thinking...',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const messages = await collectionApi.sendChatMessage({
        memoId: id,
        message: userMessage
      });
      
      // 移除临时消息，添加真实回复
      setMessages(prev => {
        const filtered = prev.filter(msg => 
          msg.id !== tempUserMessage.id && msg.id !== thinkingMessage.id
        );
        return [...filtered, ...messages];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // 移除思考中消息，显示错误
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== thinkingMessage.id);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          memoId: id,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatChatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  // Get memos that are not already in this collection
  const availableMemos = allMemos.filter(memo => 
    !memos.some(collectionMemo => collectionMemo.memo_id === memo.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Collection not found</h2>
          <button
            onClick={() => navigate('/collections')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Collection Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/collections')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Collections</span>
            </button>
          </div>

        {/* Collection Info */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: collection.color || '#3B82F6' }}
            ></div>
            <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
          </div>
          
          {collection.description && (
            <p className="text-gray-600 mb-4">{collection.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {collection.memo_count} {collection.memo_count === 1 ? 'memo' : 'memos'}
            </span>
            <button
              onClick={() => setShowAddMemoModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Memo
            </button>
          </div>
        </div>

        {/* Memos List */}
        {memos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No memos in this collection</h3>
            <p className="text-gray-600 mb-6">Add your first memo to get started</p>
            <button
              onClick={() => setShowAddMemoModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Add Memo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memos.map((collectionMemo) => (
              <div key={collectionMemo.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {collectionMemo.memo.title}
                  </h3>
                  <button
                    onClick={() => handleRemoveMemoFromCollection(collectionMemo.memo_id)}
                    className="text-red-500 hover:text-red-700 transition-colors ml-2"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {collectionMemo.memo.summary}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    collectionMemo.memo.type === 'youtube' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {collectionMemo.memo.type === 'youtube' ? 'YouTube' : 'Website'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(collectionMemo.memo.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/memo/${collectionMemo.memo_id}`)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate(`/memo/${collectionMemo.memo_id}`)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors"
                  >
                    <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Memo Modal */}
        {showAddMemoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Memo to Collection</h3>
                <button
                  onClick={() => setShowAddMemoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {availableMemos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No available memos to add</p>
                  <button
                    onClick={() => {
                      setShowAddMemoModal(false);
                      navigate('/memos');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Create New Memo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableMemos.map((memo) => (
                    <div key={memo.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{memo.title}</h4>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{memo.summary}</p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              memo.type === 'youtube' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {memo.type === 'youtube' ? 'YouTube' : 'Website'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(memo.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMemoToCollection(memo.id)}
                          className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Right Column - Chat */}
        <div className="lg:col-span-1 sticky top-8 h-[calc(100vh-64px)] flex flex-col">
          <div className="bg-white rounded-lg shadow-md p-6 flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chat about Collection</h2>
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm mt-1">Ask questions about this collection!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isThinking = message.content === '🤔 Thinking...';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : isThinking
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className={`text-sm whitespace-pre-wrap ${isThinking ? 'italic' : ''}`}>
                          {message.content}
                        </p>
                        {!isThinking && (
                          <p className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatChatTime(message.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask about this collection..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailPage;
