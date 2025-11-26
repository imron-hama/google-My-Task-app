import React, { useState, useEffect, useMemo } from 'react';
import { Task, FilterType } from './types';
import { TaskItem } from './components/TaskItem';
import { suggestSubtasks } from './services/geminiService';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const getTodayDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(getTodayDate());
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (text: string, dateStr?: string) => {
    if (!text.trim()) return;
    
    let dueDate: number | undefined = undefined;
    if (dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      dueDate = new Date(y, m - 1, d).getTime();
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
      dueDate: dueDate
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleAddTask = () => {
    addTask(newTaskText, newTaskDate);
    setNewTaskText('');
    setNewTaskDate(getTodayDate());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTask();
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const editTask = (id: string, newText: string, newDueDate?: number) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, text: newText, dueDate: newDueDate } : t
    ));
  };

  const handleAiBreakdown = async () => {
    if (!newTaskText.trim()) return;
    setIsAiLoading(true);
    try {
      // Add the main task first with its date
      addTask(newTaskText, newTaskDate);
      
      // Get suggestions
      const suggestions = await suggestSubtasks(newTaskText);
      
      // Add suggestions as tasks
      suggestions.forEach(sub => {
        addTask(`↳ ${sub}`);
      });
      
      setNewTaskText('');
      setNewTaskDate(getTodayDate());
    } catch (error) {
      console.error("AI breakdown failed", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    // 1. Filter by Status
    switch (filter) {
      case 'ACTIVE': result = tasks.filter(t => !t.completed); break;
      case 'COMPLETED': result = tasks.filter(t => t.completed); break;
      default: result = tasks;
    }

    // 2. Filter by Date
    if (filterDate) {
      result = result.filter(t => {
        if (!t.dueDate) return false;
        const tDate = new Date(t.dueDate);
        const y = tDate.getFullYear();
        const m = String(tDate.getMonth() + 1).padStart(2, '0');
        const d = String(tDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === filterDate;
      });
    }

    // 3. Sort
    return result.sort((a, b) => {
      // Always put completed items at the bottom if showing all
      if (filter === 'ALL' && a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // If filtering by a specific date, sort by creation time (LIFO)
      if (filterDate) {
        return b.createdAt - a.createdAt;
      }

      // Default Sort: Tasks with due dates (ascending) first, then tasks without due dates (LIFO)
      if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
      if (a.dueDate) return -1; // Has date -> Top
      if (b.dueDate) return 1;  // No date -> Bottom
      return b.createdAt - a.createdAt; // Fallback to created
    });
  }, [tasks, filter, filterDate]);

  // Statistics
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-google-text pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-google-blue flex items-center justify-center text-white font-bold text-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          </div>
          <div className="text-sm text-gray-500 font-medium">
             เสร็จแล้ว {completedCount} / {totalCount}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 w-full bg-gray-100">
          <div 
            className="h-1 bg-google-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8">
        
        {/* Input Area */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-google-blue transition-shadow">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="เพิ่มงานใหม่ที่นี่..."
                className="flex-grow text-lg bg-transparent border-none focus:ring-0 placeholder-gray-400 text-gray-800 min-w-0"
                disabled={isAiLoading}
              />
            </div>
            
            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center">
                 <input 
                   type="date" 
                   value={newTaskDate}
                   onChange={(e) => setNewTaskDate(e.target.value)}
                   className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-google-blue/30 hover:bg-gray-100 transition-colors [color-scheme:light]"
                   placeholder="กำหนดวัน"
                 />
              </div>

              <div className="flex items-center gap-2">
                 {/* AI Magic Button */}
                 <button
                  onClick={handleAiBreakdown}
                  disabled={!newTaskText.trim() || isAiLoading}
                  className="flex items-center justify-center px-4 py-2 rounded-lg text-google-blue bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors gap-2"
                  title="ใช้ AI ช่วยแจกแจงงาน (Gemini)"
                >
                  {isAiLoading ? (
                     <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  )}
                  <span className="font-medium text-sm">AI ช่วยคิด</span>
                </button>
                
                {/* Add Button */}
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskText.trim() || isAiLoading}
                  className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-100 disabled:shadow-none"
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          {/* Filters */}
          <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-lg w-max">
            {(['ALL', 'ACTIVE', 'COMPLETED'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  filter === f 
                    ? 'bg-white text-google-blue shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'ALL' ? 'ทั้งหมด' : f === 'ACTIVE' ? 'ที่ต้องทำ' : 'เสร็จแล้ว'}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className={`text-sm hidden sm:inline transition-colors ${filterDate ? 'text-google-blue font-medium' : 'text-gray-500'}`}>
              ดูรายการวันที่:
            </span>
            <div className="relative">
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={`text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-google-blue/50 transition-colors cursor-pointer bg-white shadow-sm [color-scheme:light] ${
                  filterDate ? 'border-google-blue text-google-blue' : 'border-gray-200 text-gray-600'
                }`}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute -right-2 -top-2 bg-google-red text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                  title="ล้างตัวกรอง"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-1">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 mb-4">
                <svg className="w-12 h-12 text-google-blue opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">ไม่มีรายการงาน{filterDate ? 'ในวันที่เลือก' : ''}</p>
              <p className="text-gray-400 text-sm mt-1">{filterDate ? 'ลองเลือกวันอื่นหรือล้างตัวกรอง' : 'เริ่มเพิ่มงานใหม่ของคุณได้เลย'}</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={editTask}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default App;