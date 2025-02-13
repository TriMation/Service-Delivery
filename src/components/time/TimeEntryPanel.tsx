import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Building2, Briefcase, FileText, Clock, Calendar, CheckSquare } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { createTimeEntry, updateTimeEntry, deleteTimeEntry } from '../../lib/time';
import { getCompanies, getCompanyProjects } from '../../lib/companies';
import { getProjectTasks } from '../../lib/tasks';
import type { TimeEntry } from '../../types/database';

interface TimeEntryPanelProps {
  entry?: TimeEntry;
  isCreating?: boolean;
  onClose: () => void;
}

export function TimeEntryPanel({
  entry,
  isCreating = false,
  onClose,
}: TimeEntryPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(entry?.project_id || '');
  const [taskSearch, setTaskSearch] = useState('');
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: entry?.project_id || '',
    task_id: entry?.task_id || '',
    hours: entry?.hours || 0,
    description: entry?.description || '',
    date: entry?.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', selectedCompanyId],
    queryFn: () => selectedCompanyId ? getCompanyProjects(selectedCompanyId) : [],
    enabled: !!selectedCompanyId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', formData.project_id],
    queryFn: async () => {
      setIsTasksLoading(true);
      if (!formData.project_id) return [];
      try {
        const tasks = await getProjectTasks(formData.project_id);
        // Filter out completed tasks
        return tasks.filter(task => task.status !== 'completed');
      } finally {
        setIsTasksLoading(false);
      }
    },
    enabled: !!formData.project_id,
  });

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    const searchLower = taskSearch.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.task_number?.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      // Validate required fields
      if (!formData.project_id || formData.project_id.trim() === '') {
        throw new Error('Project is required');
      }

      if (!formData.hours || isNaN(formData.hours) || formData.hours <= 0) {
        throw new Error('Hours must be greater than 0');
      }

      if (isCreating) {
        const timeEntry = {
          ...formData,
          user_id: user!.id,
          date: new Date(formData.date).toISOString().split('T')[0],
          // Only include task_id if it has a value
          task_id: formData.task_id ? formData.task_id : undefined,
          // Convert hours to number
          hours: Number(formData.hours)
        };
        
        await createTimeEntry(timeEntry);
      } else if (entry) {
        const updates = {
          ...formData,
          task_id: formData.task_id ? formData.task_id : undefined,
          hours: Number(formData.hours)
        };
        await updateTimeEntry(entry.id, updates);
      }
      
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save time entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !user?.isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      setLoading(true);
      try {
        await deleteTimeEntry(entry.id);
        queryClient.invalidateQueries({ queryKey: ['time-entries'] });
        onClose();
      } catch (err) {
        setError('Failed to delete time entry');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0 z-50">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {isCreating ? 'Log Time' : 'Edit Time Entry'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {isCreating && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client
                  </label>
                  <div className="mt-1 relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        setFormData(prev => ({ ...prev, project_id: '', task_id: '' }));
                      }}
                      className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value="">Select a client</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <div className="mt-1 relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={formData.project_id}
                      onChange={(e) => {
                        const projectId = e.target.value || '';
                        setSelectedProjectId(projectId);
                        setFormData(prev => ({ 
                          ...prev,
                          project_id: projectId || '',
                          task_id: '' 
                        }));
                      }}
                      className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      required
                      disabled={!selectedCompanyId}
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Task
                    <span className="text-gray-500 text-xs ml-2">(Optional)</span>
                  </label>
                  <div className="mt-1 relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      placeholder="Search tasks..."
                      className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md mb-2"
                    />
                    <div className="mt-1 border border-gray-200 rounded-md max-h-48 overflow-y-auto relative">
                      {isTasksLoading ? (
                        <div className="p-8 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : filteredTasks.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No tasks found
                        </div>
                      ) : (
                        filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setFormData(prev => ({ ...prev, task_id: task.id }))}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                              formData.task_id === task.id ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  <span className="font-mono text-sm text-gray-500 mr-2">
                                    {task.task_number}
                                  </span>
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {task.description}
                                  </div>
                                )}
                              </div>
                              {formData.task_id === task.id && (
                                <div className="text-indigo-600">
                                  <CheckSquare className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <div className="mt-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hours
              </label>
              <div className="mt-1 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: Math.max(0.25, parseFloat(e.target.value) || 0) })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="What did you work on?"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-end space-x-3">
              {!isCreating && user?.isAdmin && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}