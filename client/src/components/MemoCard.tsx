import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { TrashIcon, ChatBubbleOvalLeftEllipsisIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { MemoCard } from '../shared/types';
import { useMemos } from '../contexts/MemoContext';

interface MemoCardProps {
  memo: MemoCard;
}

const MemoCardComponent: React.FC<MemoCardProps> = ({ memo }) => {
  const { deleteMemo } = useMemos();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this memo?')) {
      setIsDeleting(true);
      try {
        await deleteMemo(memo.id);
      } catch (error) {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200">
      {/* 封面图片 */}
      {memo.coverImage && (
        <div className="mb-4 -mx-6 -mt-6">
          <img 
            src={memo.coverImage} 
            alt={memo.title}
            className="w-full h-48 object-cover rounded-t-lg"
            onError={(e) => {
              // 如果图片加载失败，隐藏图片容器
              e.currentTarget.parentElement?.style.setProperty('display', 'none');
            }}
          />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {memo.title}
          </h3>
          {/* 状态指示器 */}
          {memo.status === 'processing' && (
            <div className="flex items-center mt-2 text-amber-600 text-sm">
              <ClockIcon className="h-4 w-4 mr-1 animate-spin" />
              <span>Summarizing...</span>
            </div>
          )}
          {memo.status === 'failed' && (
            <div className="flex items-center mt-2 text-red-600 text-sm">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              <span>Failed to process</span>
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting || memo.status === 'processing'}
          className="text-red-500 hover:text-red-700 transition-colors ml-2 disabled:opacity-50"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {memo.summary}
      </p>
      
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          memo.type === 'youtube' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {memo.type === 'youtube' ? 'YouTube' : 'Website'}
        </span>
        <span className="text-xs text-gray-400">
          {formatDate(memo.createdAt)}
        </span>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/memo/${memo.id}`}
          className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors text-center ${
            memo.status === 'processing' 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          onClick={(e) => memo.status === 'processing' && e.preventDefault()}
        >
          {memo.status === 'processing' ? 'Processing...' : 'View Details'}
        </Link>
        <Link
          to={`/memo/${memo.id}?chat=true`}
          className={`p-2 rounded-lg transition-colors ${
            memo.status === 'processing' 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
          }`}
          onClick={(e) => memo.status === 'processing' && e.preventDefault()}
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};

export default MemoCardComponent;