import React, { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your note...',
  height = 300
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 简单的格式化快捷键
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          wrapText('**', '**');
          break;
        case 'i':
          e.preventDefault();
          wrapText('*', '*');
          break;
        case 'u':
          e.preventDefault();
          wrapText('<u>', '</u>');
          break;
      }
    }
  };

  const wrapText = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    
    onChange(newText);
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    wrapText(prefix, suffix);
  };

  return (
    <div className="rich-text-editor border border-gray-300 rounded-lg">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => insertMarkdown('**', '**')}
          className="px-2 py-1 text-sm font-bold hover:bg-gray-200 rounded"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('*', '*')}
          className="px-2 py-1 text-sm italic hover:bg-gray-200 rounded"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('<u>', '</u>')}
          className="px-2 py-1 text-sm underline hover:bg-gray-200 rounded"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => insertMarkdown('# ')}
          className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
          title="Heading"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('## ')}
          className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
          title="Subheading"
        >
          H2
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => insertMarkdown('- ')}
          className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('1. ')}
          className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          1.
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => insertMarkdown('> ')}
          className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
          title="Quote"
        >
          "
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('`', '`')}
          className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
          title="Code"
        >
          &lt;/&gt;
        </button>
      </div>

      {/* 文本区域 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full p-3 resize-none focus:outline-none"
        style={{ height: height - 42 }}
      />

      {/* 预览区域 */}
      {value && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">Preview:</div>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: value
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/^1\. (.*$)/gm, '<li>$1</li>')
                .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>')
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
