import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { getTasks, updateTask } from '../../lib/tasks';
import { TaskList } from './TaskList';
import { TaskKanban } from './TaskKanban';
import { TaskPanel } from './TaskPanel';
import { TaskFilters } from './TaskFilters';
import { List, LayoutGrid, Plus } from 'lucide-react';
import type { Task } from '../../types/database';

export function TasksPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    assignedTo: '',
    companyId: '',
    projectId: '',
  });

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks(user!.id, user!.isAdmin),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesAssignee = !filters.assignedTo || task.assigned_to === filters.assignedTo;
    const matchesCompany = !filters.companyId || (task.project as any)?.company?.id === filters.companyId;
    const matchesProject = !filters.projectId || task.project_id === filters.projectId;
    return matchesSearch && matchesStatus && matchesAssignee && matchesCompany && matchesProject;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded ${
                view === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'
              }`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-2 rounded ${
                view === 'kanban' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'
              }`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          {(user?.isAdmin || user?.role === 'user') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              New Task
            </button>
          )}
        </div>
      </div>

      <TaskFilters filters={filters} setFilters={setFilters} />

      {view === 'kanban' ? (
        <TaskKanban
          tasks={filteredTasks}
          onTaskClick={setSelectedTask}
          onStatusChange={(taskId, status) =>
            updateTaskMutation.mutate({ taskId, updates: { status } })
          }
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          onTaskClick={setSelectedTask}
          onStatusChange={(taskId, status) =>
            updateTaskMutation.mutate({ taskId, updates: { status } })
          }
        />
      )}

      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) =>
            updateTaskMutation.mutate({
              taskId: selectedTask.id,
              updates,
            })
          }
        />
      )}

      {showCreateModal && (
        <TaskPanel
          isCreating
          onClose={() => setShowCreateModal(false)}
          onCreate={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }}
        />
      )}
    </div>
  );
}