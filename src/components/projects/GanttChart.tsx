import React, { useState } from 'react';
import { format, addDays, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { ChevronRight, ChevronDown, Clock, Calendar, User, GripVertical } from 'lucide-react';
import type { Task, TimeEntry } from '../../types/database';
import { updateTask, updateTaskParent } from '../../lib/tasks';

interface GanttChartProps {
  tasks: Task[];
  timeEntries: TimeEntry[];
  projectStart: Date;
  projectEnd: Date;
  onTaskClick: (task: Task) => void;
  selectedTaskId?: string;
}

export function GanttChart({
  tasks,
  timeEntries,
  projectStart,
  projectEnd,
  onTaskClick,
  selectedTaskId,
}: GanttChartProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{
    task: Task;
    position: 'before' | 'after' | 'child';
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const totalDays = differenceInDays(projectEnd, projectStart) + 1;

  // Sort tasks by task number
  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      if (!a.task_number || !b.task_number) return 0;
      
      const aNum = a.task_number.split('.').map(Number);
      const bNum = b.task_number.split('.').map(Number);
      
      // Compare each level of the task numbers
      for (let i = 0; i < Math.max(aNum.length, bNum.length); i++) {
        const aVal = aNum[i] || 0;
        const bVal = bNum[i] || 0;
        if (aVal !== bVal) {
          return aVal - bVal;
        }
      }
      return 0;
    });
  };

  // Build task hierarchy
  const buildTaskHierarchy = (tasks: Task[]) => {
    const taskMap = new Map<string, Task & { children: Task[], level: number }>();
    const rootTasks: (Task & { children: Task[], level: number })[] = [];

    // Sort tasks first
    const sortedTasks = sortTasks(tasks);

    // First pass: Create task objects with children arrays
    sortedTasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [], level: 0 });
    });

    // Second pass: Build hierarchy
    sortedTasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id)!;
      if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
        const parent = taskMap.get(task.parent_task_id)!;
        taskWithChildren.level = parent.level + 1;
        parent.children.push(taskWithChildren);
      } else {
        rootTasks.push(taskWithChildren);
      }
    });

    return rootTasks;
  };

  const hierarchicalTasks = buildTaskHierarchy(tasks);

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getDragOverPosition = (e: React.DragEvent, targetTask: Task): 'before' | 'after' | 'child' => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Top 25% = before, bottom 25% = after, middle 50% = child
    if (y < rect.height * 0.25) return 'before';
    if (y > rect.height * 0.75) return 'after';
    return 'child';
  };

  const getTaskWidth = (task: Task) => {
    const start = new Date(task.start_date || projectStart);
    const end = task.due_date ? new Date(task.due_date) : addDays(start, 1);
    return `${(differenceInDays(end, start) + 1) / totalDays * 100}%`;
  };

  const getTaskOffset = (task: Task) => {
    const start = new Date(task.start_date || projectStart);
    return `${differenceInDays(start, projectStart) / totalDays * 100}%`;
  };

  const getTaskColor = (task: Task) => {
    const taskHours = timeEntries
      .filter(entry => entry.task_id === task.id)
      .reduce((sum, entry) => sum + entry.hours, 0);
    
    const progress = task.estimated_hours 
      ? Math.min(100, (taskHours / task.estimated_hours) * 100)
      : 0;

    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add ghost image
    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.style.opacity = '0.5';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, task: Task) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedTask?.id === task.id) {
      setDragOverInfo(null);
      return;
    }
    
    const position = getDragOverPosition(e, task);
    setDragOverInfo({ task, position });
  };

  const handleDragLeave = () => {
    setDragOverInfo(null);
  };

  const handleDrop = async (e: React.DragEvent, task: Task) => {
    e.preventDefault();
    if (!draggedTask || !dragOverInfo || draggedTask.id === task.id) return;
    setLoading(true);

    try {
      const { position } = dragOverInfo;
      let newParentId: string | null = null;
      let newOrder: number;

      switch (position) {
        case 'before':
          newParentId = task.parent_task_id;
          newOrder = task.task_order;
          break;
        case 'after':
          newParentId = task.parent_task_id;
          newOrder = task.task_order + 1;
          break;
        case 'child':
          newParentId = task.id;
          newOrder = 0; // Will be first child
          break;
      }

      await updateTaskParent(draggedTask.id, newParentId, newOrder);
      // Immediately update the selected task
      onTaskClick(draggedTask);
    } catch (err) {
      console.error('Failed to reorder task:', err);
    } finally {
      setLoading(false);
      setDraggedTask(null);
      setDragOverInfo(null);
    }
  };

  const getDropIndicatorStyle = (task: Task) => {
    if (!dragOverInfo || dragOverInfo.task.id !== task.id) return null;

    const baseStyle = {
      position: 'absolute',
      left: 0,
      right: 0,
      height: '2px',
      backgroundColor: '#4f46e5',
      zIndex: 10,
    } as const;

    switch (dragOverInfo.position) {
      case 'before':
        return { ...baseStyle, top: 0 };
      case 'after':
        return { ...baseStyle, bottom: 0 };
      case 'child':
        return {
          position: 'absolute',
          inset: 0,
          border: '2px dashed #4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          zIndex: 10,
        } as const;
    }
  };

  const renderTask = (task: Task & { children: Task[], level: number }) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children.length > 0;
    const taskNumber = task.task_number || '0';
    const isDragging = draggedTask?.id === task.id;
    const isDragOver = dragOverInfo?.task.id === task.id;
    const handleTaskClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event bubbling
      onTaskClick(task);
    };

    return (
      <React.Fragment key={task.id}>
        <div 
          className={`flex ${isDragOver ? 'bg-indigo-50' : ''} ${isDragging ? 'opacity-50' : ''} 
            ${selectedTaskId === task.id ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
          draggable
          onDragStart={(e) => handleDragStart(e, task)}
          onDragOver={(e) => handleDragOver(e, task)}
          onDrop={(e) => handleDrop(e, task)}
          onClick={handleTaskClick}
        >
          {/* Task Info (1/4 width) */}
          <div className="w-1/4 flex items-center py-2 pr-4" style={{ paddingLeft: `${task.level * 1.5 + 1}rem` }}>
            <div className="flex items-center">
              <div className="cursor-move mr-2 text-gray-400 hover:text-gray-600">
                <GripVertical size={16} />
              </div>
              {hasChildren && (
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mr-2 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              <span className="font-mono text-sm font-medium text-gray-600 mr-2 min-w-[2rem]">
                {taskNumber}
              </span>
              <div className="truncate hover:text-indigo-600">
                <div className="font-medium text-gray-900">{task.title}</div>
                {task.description && (
                  <div className="text-sm text-gray-500 truncate">{task.description}</div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline (3/4 width) */}
          <div className="w-3/4 relative group">
            <div
              className={`absolute h-6 rounded ${getTaskColor(task)} group-hover:ring-2 group-hover:ring-indigo-400 transition-all duration-150`}
              style={{
                left: getTaskOffset(task),
                width: getTaskWidth(task),
              }}
            >
              <div className="absolute inset-0 flex items-center justify-between px-2 text-white text-xs">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {task.estimated_hours}h
                </div>
                {task.assigned_to && (
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {(task as any).assigned_user?.full_name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && task.children.map(child => renderTask(child))}
      </React.Fragment>
    );
  };

  // Generate time scale divisions
  const timeScaleDivisions = (() => {
    const divisions = [];
    let currentDate = projectStart;
    while (isBefore(currentDate, projectEnd) || currentDate.getTime() === projectEnd.getTime()) {
      divisions.push(currentDate);
      currentDate = addDays(currentDate, 7); // Weekly divisions
    }
    return divisions;
  })();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Timeline Header */}
      <div className="flex border-b border-gray-200">
        <div className="w-1/4" /> {/* Space for task info */}
        <div className="w-3/4 flex">
          {timeScaleDivisions.map((date, index) => (
            <div
              key={date.getTime()}
              className="flex-1 px-2 py-1 text-xs text-gray-500 text-center border-r border-gray-200"
            >
              {format(date, 'MMM d')}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="divide-y divide-gray-200">
        {hierarchicalTasks.map(task => renderTask(task))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
}