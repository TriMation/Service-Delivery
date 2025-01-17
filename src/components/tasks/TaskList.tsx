import React from 'react';
import { format } from 'date-fns';
import { CheckSquare, Clock, User } from 'lucide-react';
import type { Task } from '../../types/database';

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export function TaskList({ tasks, onTaskClick, onStatusChange }: TaskListProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <CheckSquare className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500">
                        {task.description.slice(0, 100)}
                        {task.description.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {(task.project as any)?.company?.name || 'No Company'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {(task.project as any)?.name || 'No Project'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <div className="text-sm text-gray-900">
                    {(task.assigned_user as any)?.full_name || 'Unassigned'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <select
                  value={task.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, e.target.value as Task['status']);
                  }}
                  className="text-sm rounded-full px-3 py-1 font-medium"
                  style={{
                    backgroundColor: getStatusColor(task.status),
                    color: task.status === 'completed' ? 'white' : 'inherit',
                  }}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  {task.due_date
                    ? format(new Date(task.due_date), 'MMM d, yyyy')
                    : 'No due date'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getStatusColor(status: Task['status']) {
  switch (status) {
    case 'todo':
      return '#f3f4f6';
    case 'in_progress':
      return '#dbeafe';
    case 'review':
      return '#fef3c7';
    case 'completed':
      return '#34d399';
    default:
      return '#f3f4f6';
  }
}