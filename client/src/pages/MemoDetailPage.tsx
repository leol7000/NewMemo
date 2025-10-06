import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PaperAirplaneIcon, LinkIcon, PencilIcon, CheckIcon, XMarkIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { MemoCard, ChatMessage, Language } from '../shared/types';
import { memoApi } from '../services/api';

type TabType = 'keyPoints' | 'sourceText';

const MemoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [memo, setMemo] = useState<MemoCard | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('keyPoints');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isEditingKeyPoints, setIsEditingKeyPoints] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editOneLine, setEditOneLine] = useState('');
  const [editKeyPoints, setEditKeyPoints] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isGeneratingLanguage, setIsGeneratingLanguage] = useState(false);
  const [generatingLanguage, setGeneratingLanguage] = useState<Language | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 语言配置
  const languageConfig = {
    'en': { name: 'English', flag: '🇺🇸', generatingText: 'Generating English summary...' },
    'zh': { name: '中文', flag: '🇨🇳', generatingText: '正在生成中文总结...' },
    'es-eu': { name: 'Español (EU)', flag: '🇪🇸', generatingText: 'Generando resumen en español europeo...' },
    'pt-eu': { name: 'Português (EU)', flag: '🇵🇹', generatingText: 'Gerando resumo em português europeu...' },
    'es-latam': { name: 'Español (LatAm)', flag: '🇲🇽', generatingText: 'Generando resumen en español latinoamericano...' },
    'pt-latam': { name: 'Português (LatAm)', flag: '🇧🇷', generatingText: 'Gerando resumo em português latinoamericano...' },
    'de': { name: 'Deutsch', flag: '🇩🇪', generatingText: 'Deutsche Zusammenfassung wird generiert...' },
    'fr': { name: 'Français', flag: '🇫🇷', generatingText: 'Génération du résumé en français...' },
    'ja': { name: '日本語', flag: '🇯🇵', generatingText: '日本語の要約を生成中...' },
    'th': { name: 'ไทย', flag: '🇹🇭', generatingText: 'กำลังสร้างสรุปภาษาไทย...' }
  };

  const loadMemoAndMessages = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [memoData, messagesData] = await Promise.all([
        memoApi.getMemo(id),
        memoApi.getChatMessages(id)
      ]);
      setMemo(memoData);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load memo:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadMemoAndMessages();
    }
  }, [id, loadMemoAndMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      console.log('Sending chat message:', { memoId: id, message: userMessage });
      const messages = await memoApi.sendChatMessage({
        memoId: id,
        message: userMessage
      });
      console.log('Received messages:', messages);
      
      // 移除临时消息，添加真实回复
      setMessages(prev => {
        const filtered = prev.filter(msg => 
          msg.id !== tempUserMessage.id && msg.id !== thinkingMessage.id
        );
        return [...filtered, ...messages];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      console.error('Error details:', error);
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatChatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const startEditingSummary = () => {
    setEditSummary(getCurrentContent().summary);
    setEditOneLine(getCurrentContent().oneLineSummary || '');
    setIsEditingSummary(true);
  };

  const startEditingKeyPoints = () => {
    setEditKeyPoints(getCurrentContent().keyPoints || []);
    setIsEditingKeyPoints(true);
  };

  const cancelEditing = () => {
    setIsEditingSummary(false);
    setIsEditingKeyPoints(false);
  };

  const saveSummary = async () => {
    if (!id) return;
    try {
      const updates: any = {};
      const fieldMappings = {
        'en': { summary: 'summary', oneLineSummary: 'oneLineSummary' },
        'zh': { summary: 'summaryZh', oneLineSummary: 'oneLineSummaryZh' },
        'es-eu': { summary: 'summaryEsEu', oneLineSummary: 'oneLineSummaryEsEu' },
        'pt-eu': { summary: 'summaryPtEu', oneLineSummary: 'oneLineSummaryPtEu' },
        'es-latam': { summary: 'summaryEsLatam', oneLineSummary: 'oneLineSummaryEsLatam' },
        'pt-latam': { summary: 'summaryPtLatam', oneLineSummary: 'oneLineSummaryPtLatam' },
        'de': { summary: 'summaryDe', oneLineSummary: 'oneLineSummaryDe' },
        'fr': { summary: 'summaryFr', oneLineSummary: 'oneLineSummaryFr' },
        'ja': { summary: 'summaryJa', oneLineSummary: 'oneLineSummaryJa' },
        'th': { summary: 'summaryTh', oneLineSummary: 'oneLineSummaryTh' }
      };
      
      updates[fieldMappings[currentLanguage].summary] = editSummary;
      updates[fieldMappings[currentLanguage].oneLineSummary] = editOneLine;
      const updatedMemo = await memoApi.updateMemo(id, updates);
      setMemo(updatedMemo);
      setIsEditingSummary(false);
    } catch (error) {
      console.error('Failed to update summary:', error);
    }
  };


  const saveKeyPoints = async () => {
    if (!id) return;
    try {
      const updates: any = {};
      const fieldMappings = {
        'en': { keyPoints: 'keyPoints' },
        'zh': { keyPoints: 'keyPointsZh' },
        'es-eu': { keyPoints: 'keyPointsEsEu' },
        'pt-eu': { keyPoints: 'keyPointsPtEu' },
        'es-latam': { keyPoints: 'keyPointsEsLatam' },
        'pt-latam': { keyPoints: 'keyPointsPtLatam' },
        'de': { keyPoints: 'keyPointsDe' },
        'fr': { keyPoints: 'keyPointsFr' },
        'ja': { keyPoints: 'keyPointsJa' },
        'th': { keyPoints: 'keyPointsTh' }
      };
      
      updates[fieldMappings[currentLanguage].keyPoints] = editKeyPoints;
      const updatedMemo = await memoApi.updateMemo(id, updates);
      setMemo(updatedMemo);
      setIsEditingKeyPoints(false);
    } catch (error) {
      console.error('Failed to update key points:', error);
    }
  };

  const addKeyPoint = () => {
    setEditKeyPoints([...editKeyPoints, '']);
  };

  const updateKeyPoint = (index: number, value: string) => {
    const newKeyPoints = [...editKeyPoints];
    newKeyPoints[index] = value;
    setEditKeyPoints(newKeyPoints);
  };

  const removeKeyPoint = (index: number) => {
    const newKeyPoints = editKeyPoints.filter((_, i) => i !== index);
    setEditKeyPoints(newKeyPoints);
  };

  const handleLanguageSwitch = async (language: Language) => {
    if (!id || !memo || language === currentLanguage) return;
    
    // 检查是否已有该语言的总结
    const fieldMappings = {
      'en': { summary: memo.summary, oneLineSummary: memo.oneLineSummary, keyPoints: memo.keyPoints },
      'zh': { summary: memo.summaryZh, oneLineSummary: memo.oneLineSummaryZh, keyPoints: memo.keyPointsZh },
      'es-eu': { summary: memo.summaryEsEu, oneLineSummary: memo.oneLineSummaryEsEu, keyPoints: memo.keyPointsEsEu },
      'pt-eu': { summary: memo.summaryPtEu, oneLineSummary: memo.oneLineSummaryPtEu, keyPoints: memo.keyPointsPtEu },
      'es-latam': { summary: memo.summaryEsLatam, oneLineSummary: memo.oneLineSummaryEsLatam, keyPoints: memo.keyPointsEsLatam },
      'pt-latam': { summary: memo.summaryPtLatam, oneLineSummary: memo.oneLineSummaryPtLatam, keyPoints: memo.keyPointsPtLatam },
      'de': { summary: memo.summaryDe, oneLineSummary: memo.oneLineSummaryDe, keyPoints: memo.keyPointsDe },
      'fr': { summary: memo.summaryFr, oneLineSummary: memo.oneLineSummaryFr, keyPoints: memo.keyPointsFr },
      'ja': { summary: memo.summaryJa, oneLineSummary: memo.oneLineSummaryJa, keyPoints: memo.keyPointsJa },
      'th': { summary: memo.summaryTh, oneLineSummary: memo.oneLineSummaryTh, keyPoints: memo.keyPointsTh }
    };
    
    const fields = fieldMappings[language];
    const hasLanguageContent = fields.summary && fields.oneLineSummary && fields.keyPoints;
    
    if (hasLanguageContent) {
      setCurrentLanguage(language);
      return;
    }
    
    // 生成新语言的总结
    try {
      setIsGeneratingLanguage(true);
      setGeneratingLanguage(language);
      const response = await memoApi.generateLanguageSummary(id, language);
      
      if (response.success && response.data) {
        const updates: any = {};
        const updateFieldMappings = {
          'en': { summary: 'summary', oneLineSummary: 'oneLineSummary', keyPoints: 'keyPoints' },
          'zh': { summary: 'summaryZh', oneLineSummary: 'oneLineSummaryZh', keyPoints: 'keyPointsZh' },
          'es-eu': { summary: 'summaryEsEu', oneLineSummary: 'oneLineSummaryEsEu', keyPoints: 'keyPointsEsEu' },
          'pt-eu': { summary: 'summaryPtEu', oneLineSummary: 'oneLineSummaryPtEu', keyPoints: 'keyPointsPtEu' },
          'es-latam': { summary: 'summaryEsLatam', oneLineSummary: 'oneLineSummaryEsLatam', keyPoints: 'keyPointsEsLatam' },
          'pt-latam': { summary: 'summaryPtLatam', oneLineSummary: 'oneLineSummaryPtLatam', keyPoints: 'keyPointsPtLatam' },
          'de': { summary: 'summaryDe', oneLineSummary: 'oneLineSummaryDe', keyPoints: 'keyPointsDe' },
          'fr': { summary: 'summaryFr', oneLineSummary: 'oneLineSummaryFr', keyPoints: 'keyPointsFr' },
          'ja': { summary: 'summaryJa', oneLineSummary: 'oneLineSummaryJa', keyPoints: 'keyPointsJa' },
          'th': { summary: 'summaryTh', oneLineSummary: 'oneLineSummaryTh', keyPoints: 'keyPointsTh' }
        };
        
        const updateFields = updateFieldMappings[language];
        updates[updateFields.summary] = response.data.summary;
        updates[updateFields.oneLineSummary] = response.data.oneLineSummary;
        updates[updateFields.keyPoints] = response.data.keyPoints;
        
        const updatedMemo = await memoApi.updateMemo(id, updates);
        setMemo(updatedMemo);
        setCurrentLanguage(language);
      }
    } catch (error) {
      console.error('Failed to generate language summary:', error);
    } finally {
      setIsGeneratingLanguage(false);
      setGeneratingLanguage(null);
    }
  };

  // 获取当前语言的内容
  const getCurrentContent = () => {
    if (!memo) return { summary: '', oneLineSummary: '', keyPoints: [] };
    
    const fieldMappings = {
      'en': { summary: memo.summary, oneLineSummary: memo.oneLineSummary, keyPoints: memo.keyPoints },
      'zh': { summary: memo.summaryZh, oneLineSummary: memo.oneLineSummaryZh, keyPoints: memo.keyPointsZh },
      'es-eu': { summary: memo.summaryEsEu, oneLineSummary: memo.oneLineSummaryEsEu, keyPoints: memo.keyPointsEsEu },
      'pt-eu': { summary: memo.summaryPtEu, oneLineSummary: memo.oneLineSummaryPtEu, keyPoints: memo.keyPointsPtEu },
      'es-latam': { summary: memo.summaryEsLatam, oneLineSummary: memo.oneLineSummaryEsLatam, keyPoints: memo.keyPointsEsLatam },
      'pt-latam': { summary: memo.summaryPtLatam, oneLineSummary: memo.oneLineSummaryPtLatam, keyPoints: memo.keyPointsPtLatam },
      'de': { summary: memo.summaryDe, oneLineSummary: memo.oneLineSummaryDe, keyPoints: memo.keyPointsDe },
      'fr': { summary: memo.summaryFr, oneLineSummary: memo.oneLineSummaryFr, keyPoints: memo.keyPointsFr },
      'ja': { summary: memo.summaryJa, oneLineSummary: memo.oneLineSummaryJa, keyPoints: memo.keyPointsJa },
      'th': { summary: memo.summaryTh, oneLineSummary: memo.oneLineSummaryTh, keyPoints: memo.keyPointsTh }
    };
    
    const fields = fieldMappings[currentLanguage];
    return {
      summary: fields.summary || memo.summary,
      oneLineSummary: fields.oneLineSummary || memo.oneLineSummary,
      keyPoints: fields.keyPoints || memo.keyPoints || []
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Memo not found</h1>
          <Link to="/memos" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            Back to Memos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Link
          to="/memos"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Memos
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            {memo.coverImage && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <img 
                  src={memo.coverImage} 
                  alt={memo.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.parentElement?.style.setProperty('display', 'none');
                  }}
                />
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{memo.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(memo.createdAt)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  memo.type === 'youtube' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {memo.type === 'youtube' ? 'YouTube' : 'Website'}
                </span>
              </div>

              <a
                href={memo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="truncate max-w-md">{memo.url}</span>
              </a>
            </div>

            {/* AI Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">AI Summary</h2>
                <div className="flex items-center gap-2">
                  {/* Language Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                      disabled={isGeneratingLanguage}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <LanguageIcon className="h-4 w-4" />
                      <span>{languageConfig[currentLanguage].flag} {languageConfig[currentLanguage].name}</span>
                    </button>
                    
                    {showLanguageSelector && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                        <div className="p-2">
                          <div className="text-xs text-gray-500 mb-2 px-2">Select Language</div>
                          {Object.entries(languageConfig).map(([code, config]) => (
                            <button
                              key={code}
                              onClick={() => {
                                handleLanguageSwitch(code as Language);
                                setShowLanguageSelector(false);
                              }}
                              disabled={isGeneratingLanguage}
                              className={`w-full text-left px-2 py-2 rounded text-sm transition-colors ${
                                currentLanguage === code
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'hover:bg-gray-50'
                              } ${isGeneratingLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span className="mr-2">{config.flag}</span>
                              {config.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={startEditingSummary}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Summary"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Generating Language Indicator */}
              {isGeneratingLanguage && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <span className="text-yellow-800 text-sm font-medium">
                      {generatingLanguage ? languageConfig[generatingLanguage].generatingText : languageConfig[currentLanguage].generatingText}
                    </span>
                  </div>
                </div>
              )}
              
                {/* One Line Summary - 移到开头 */}
                {getCurrentContent().oneLineSummary && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">One-Line Summary</h3>
                    <p className="text-blue-700 font-medium">{getCurrentContent().oneLineSummary}</p>
                  </div>
                )}
              
              {/* 详细总结 */}
              {isEditingSummary ? (
                <div className="space-y-4">
                  {/* One-Line Summary 输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">One-Line Summary</label>
                    <textarea
                      value={editOneLine}
                      onChange={(e) => setEditOneLine(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      placeholder="Enter one-line summary..."
                    />
                  </div>
                  
                  {/* 详细总结输入框 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Summary</label>
                    <textarea
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={saveSummary}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">{getCurrentContent().summary}</p>
              )}
            </div>

            {/* Tabs for Key Points and Source Text */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('keyPoints')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'keyPoints'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Key Points
                </button>
                <button
                  onClick={() => setActiveTab('sourceText')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'sourceText'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Source Text
                </button>
                {activeTab === 'keyPoints' && (
                  <button
                    onClick={startEditingKeyPoints}
                    className="px-4 py-4 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Key Points"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'keyPoints' ? (
                  <div className="space-y-4">
                    {isEditingKeyPoints ? (
                      <div className="space-y-4">
                        {editKeyPoints.map((point, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => updateKeyPoint(index, e.target.value)}
                              className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter key point..."
                            />
                            <button
                              onClick={() => removeKeyPoint(index)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              title="Remove Key Point"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <button
                            onClick={addKeyPoint}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Add Key Point
                          </button>
                          <button
                            onClick={saveKeyPoints}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <CheckIcon className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                      ) : getCurrentContent().keyPoints && getCurrentContent().keyPoints.length > 0 ? (
                        getCurrentContent().keyPoints.map((point, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <p className="text-gray-700 leading-relaxed flex-1">{point}</p>
                          </div>
                        ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <p className="font-medium">No key points available</p>
                        <p className="text-sm mt-1">Key points will be generated for new memos</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {memo.summary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md flex flex-col h-[calc(100vh-8rem)] sticky top-8">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">AI Chat</h2>
                <p className="text-sm text-gray-600 mt-1">Ask questions about this content</p>
              </div>

              {/* Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Start a conversation!</p>
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
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoDetailPage;