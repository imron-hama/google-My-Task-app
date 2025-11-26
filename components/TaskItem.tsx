import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string, newDueDate?: number) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  
  // Helper to get YYYY-MM-DD string from timestamp for input value
  const getInputValue = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [editDate, setEditDate] = useState(getInputValue(task.dueDate));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim()) {
      let newDueDate: number | undefined = undefined;
      if (editDate) {
        const [y, m, d] = editDate.split('-').map(Number);
        newDueDate = new Date(y, m - 1, d).getTime();
      }
      onEdit(task.id, editText.trim(), newDueDate);
    } else {
      setEditText(task.text); // Revert if empty
      setEditDate(getInputValue(task.dueDate));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditText(task.text);
      setEditDate(getInputValue(task.dueDate));
      setIsEditing(false);
    }
  };

  // Date display logic
  const getDateBadgeStyle = (ts: number, completed: boolean) => {
    if (completed) return 'text-gray-400 bg-transparent';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(ts);
    
    if (ts < today.getTime()) return 'text-google-red bg-red-50'; // Overdue
    if (ts === today.getTime()) return 'text-google-blue bg-blue-100 font-medium'; // Today (Changed to Blue)
    return 'text-google-blue bg-blue-50'; // Future
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <div className={`group flex flex-col sm:flex-row sm:items-center p-3 mb-2 bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200 ${task.completed ? 'opacity-75 bg-gray-50' : ''}`}>
      
      <div className="flex items-center flex-grow min-w-0 w-full">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-google-blue/30 ${
            task.completed 
              ? 'bg-google-blue border-google-blue' 
              : 'border-gray-400 hover:border-google-blue'
          }`}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-grow min-w-0 mr-2">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow text-base text-google-text bg-gray-100 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-google-blue/50"
              />
              <input 
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-google-blue/50"
              />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span
                onClick={() => !task.completed && setIsEditing(true)}
                className={`block truncate text-base cursor-pointer select-none ${
                  task.completed ? 'text-google-secondary line-through' : 'text-google-text'
                }`}
              >
                {task.text}
              </span>
              {task.dueDate && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${getDateBadgeStyle(task.dueDate, task.completed)}`}>
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex-shrink-0 flex items-center justify-end sm:ml-2 mt-2 sm:mt-0 ${isEditing ? 'w-full sm:w-auto' : ''}`}>
        {isEditing ? (
           <button
             onClick={handleSave}
             className="px-3 py-1 bg-google-blue text-white text-sm rounded hover:bg-blue-600 transition-colors mr-2"
           >
             บันทึก
           </button>
        ) : (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-google-blue focus:outline-none rounded-full hover:bg-blue-50 transition-colors"
              title="แก้ไข"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-gray-400 hover:text-google-red focus:outline-none rounded-full hover:bg-red-50 transition-colors"
              title="ลบ"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};