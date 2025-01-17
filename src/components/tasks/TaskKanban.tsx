import React, { useState } from 'react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { User, Calendar, Building2 } from 'lucide-react';
import type { Task } from '../../types/database';

interface TaskKanbanProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

const columns: { id: Task['status']; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'completed', title: 'Completed' },
];

export function TaskKanban({ tasks, onTaskClick, onStatusChange }: TaskKanbanProps) {
  const [draggedOver, setDraggedOver] = useState<Task['status'] | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    // Add a subtle transition effect to the dragged item
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '0.5';
    element.style.transform = 'scale(0.98)';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset the dragged item's appearance
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '';
    element.style.transform = '';
    setDraggedOver(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const column = e.currentTarget.getAttribute('data-status') as Task['status'];
    setDraggedOver(column);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    // If dropping into completed status, trigger confetti
    if (status === 'completed') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    onStatusChange(taskId, status);
    setDraggedOver(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          data-status={column.id}
          className={`
            flex-1 min-w-[300px] rounded-lg p-4 transition-colors duration-200
            ${draggedOver === column.id 
              ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-50' 
              : 'bg-gray-50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <h3 className="font-medium text-gray-900 mb-4">
            {column.title}{' '}
            <span className="text-gray-500 text-sm">
              ({tasks.filter((task) => task.status === column.id).length})
            </span>
          </h3>
          <div className="space-y-3">
            {tasks
              .filter((task) => task.status === column.id)
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onTaskClick(task)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move 
                    hover:shadow-md transition-all duration-200 hover:border-indigo-300
                    active:cursor-grabbing"
                  style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}
                >
                  <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                  {task.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {task.description.slice(0, 100)}
                      {task.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  <div className="flex flex-col space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      {(task.project as any)?.company?.name || 'No Company'}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {(task.assigned_user as any)?.full_name || 'Unassigned'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No due date'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}