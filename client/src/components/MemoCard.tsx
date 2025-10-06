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
  const [processingTime, setProcessingTime] = React.useState<number | null>(null);

  // 计算处理时间
  React.useEffect(() => {
    if (memo.status === 'processing') {
      const startTime = new Date(memo.createdAt).getTime();
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - startTime) / 1000);
        setProcessingTime(elapsed);
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setProcessingTime(null);
    }
  }, [memo.status, memo.createdAt]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this memo?')) {
      console.log('Starting delete for memo:', memo.id);
      setIsDeleting(true);
      try {
        await deleteMemo(memo.id);
        console.log('Delete completed for memo:', memo.id);
        // 删除成功后，组件会被从列表中移除，所以不需要手动设置 isDeleting
      } catch (error) {
        console.error('Failed to delete memo:', error);
        setIsDeleting(false);
        alert('Failed to delete memo. Please try again.');
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
              <span>Summarizing... {processingTime !== null && `(${processingTime}s)`}</span>
            </div>
          )}
          {memo.status === 'failed' && (
            <div className="flex items-center mt-2 text-red-600 text-sm">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              <span>{memo.summary.includes('No subtitles available') ? 'No subtitles available' : 'Failed to process'}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
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
          className="flex-1 font-medium py-2 px-4 rounded-lg transition-colors text-center bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          {memo.status === 'processing' ? 'View Details (Processing...)' : 'View Details'}
        </Link>
        <Link
          to={`/memo/${memo.id}?chat=true`}
          className="p-2 rounded-lg transition-colors bg-blue-100 hover:bg-blue-200 text-blue-700"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};

export default MemoCardComponent;