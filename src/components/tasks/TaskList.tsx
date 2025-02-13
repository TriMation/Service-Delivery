import React from 'react';
import { format } from 'date-fns';
import { CheckSquare, Clock, User } from 'lucide-react';
import type { Task } from '../../types/database';
import { getTaskHoursUsed, getProgressColorClass, getProgressWidth } from '../../lib/taskUtils';

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export function TaskList({ tasks, onTaskClick, onStatusChange }: TaskListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Build task hierarchy
  const buildTaskHierarchy = (tasks: Task[]) => {
    const taskMap = new Map<string, Task & { children: Task[] }>();
    const rootTasks: (Task & { children: Task[] })[] = [];

    tasks.forEach((task) => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    tasks.forEach((task) => {
      const withChildren = taskMap.get(task.id)!;
      if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
        taskMap.get(task.parent_task_id)!.children.push(withChildren);
      } else {
        rootTasks.push(withChildren);
      }
    });

    return rootTasks;
  };

  const hierarchicalTasks = buildTaskHierarchy(tasks);

  const renderTask = (task: Task & { children: Task[] }) => {
    const taskNumber = task.task_number || '';
    const hoursUsed = getTaskHoursUsed(task);
    const isOverEstimate = task.estimated_hours > 0 && hoursUsed > task.estimated_hours;

    return (
      <React.Fragment key={task.id}>
        <tr
          className="hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onTaskClick(task)}
        >
          <td className="px-6 py-4">
            <div className="flex items-center">
              <span className="font-mono text-sm text-gray-500 mr-2">
                {taskNumber}
              </span>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {task.title}
                </div>
                {task.description && (
                  <div className="text-sm text-gray-500">
                    {task.description}
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center text-sm text-gray-900">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <div className="flex flex-col space-y-1">
                <span className={`font-medium ${isOverEstimate ? 'text-red-600' : ''}`}>
                  {hoursUsed.toFixed(1)} / {task.estimated_hours || 0}h
                </span>
                {task.estimated_hours > 0 && (
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColorClass(task)}`}
                      style={{ width: getProgressWidth(task) }}
                    />
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center text-sm text-gray-900">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              {(task.assigned_user as any)?.full_name || 'Unassigned'}
            </div>
          </td>
          <td className="px-6 py-4">
            <select
              value={task.status}
              onChange={(e) =>
                onStatusChange(task.id, e.target.value as Task['status'])
              }
              className={`text-sm rounded-full px-3 py-1 font-medium ${getStatusColor(
                task.status
              )}`}
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
        {task.children.map((child) => renderTask(child))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hours (Used/Est)
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
          {hierarchicalTasks.map((task) => renderTask(task))}
        </tbody>
      </table>
    </div>
  );
}