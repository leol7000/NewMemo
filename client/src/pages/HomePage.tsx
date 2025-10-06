import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentTextIcon, SparklesIcon, ChatBubbleOvalLeftEllipsisIcon, FolderIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Collection } from '../shared/types';
import { collectionApi } from '../services/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await collectionApi.getAllCollections();
      setCollections(data);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-6 shadow-lg">
              <img 
                src="/mymemo-icon.svg" 
                alt="Mymemo AI 3.0" 
                className="h-16 w-16"
              />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Mymemo AI 3.0
          </h1>
          
          <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform any web content into intelligent summaries with AI-powered insights and interactive chat
          </p>

          <div className="flex justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-gray-600">
              <SparklesIcon className="h-6 w-6 text-yellow-500" />
              <span className="text-lg">AI Summarization</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-green-500" />
              <span className="text-lg">Smart Chat</span>
            </div>
          </div>
        </div>

        {/* Main Action Button */}
        <div className="text-center mb-16">
          <button
            onClick={() => navigate('/memos')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            View My Memos
          </button>
          
          <p className="text-gray-500 mt-4">
            Start managing your AI-powered content summaries
          </p>
        </div>

        {/* Collections Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">My Collections</h2>
            <button
              onClick={() => navigate('/collections')}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              Create Collection
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading collections...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No collections yet</h3>
              <p className="text-gray-600 mb-6">Create your first collection to organize your memos</p>
              <button
                onClick={() => navigate('/collections')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Create Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  onClick={() => navigate(`/collections/${collection.id}`)}
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: collection.color || '#3B82F6' }}
                    ></div>
                    <h3 className="text-lg font-semibold text-gray-900">{collection.name}</h3>
                  </div>
                  
                  {collection.description && (
                    <p className="text-gray-600 text-sm mb-4">{collection.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {collection.memo_count} {collection.memo_count === 1 ? 'memo' : 'memos'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Web Content</h3>
            <p className="text-gray-600">Summarize any webpage with AI-powered analysis</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">YouTube Videos</h3>
            <p className="text-gray-600">Extract and summarize video transcripts automatically</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Chat</h3>
            <p className="text-gray-600">Ask questions and get insights from your summaries</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;