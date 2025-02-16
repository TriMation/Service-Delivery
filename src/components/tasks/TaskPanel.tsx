import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Building, Briefcase, FileText, Clock, Calendar, User, Star } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { createTask, updateTask, deleteTask } from '../../lib/tasks';
import { getCompanies, getCompanyProjects } from '../../lib/companies';
import { getSkills } from '../../lib/skills';
import { getTimeEntries } from '../../lib/time';
import type { Task } from '../../types/database';

interface TaskPanelProps {
  task?: Task;
  isCreating?: boolean;
  hasUnsavedChanges?: boolean;
  projectId: string;
  onClose: () => void;
  onUpdate?: (updates: Partial<Task>) => void;
  onCreate?: () => void;
}

function TaskPanel({
  task,
  isCreating = false,
  hasUnsavedChanges = false,
  projectId,
  onClose,
  onUpdate,
  onCreate,
}: TaskPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    project_id: task?.project_id || '',
    assigned_to: task?.assigned_to || '',
    estimated_hours: task?.estimated_hours || 0,
    required_skill: '',
    start_date: task?.start_date || '',
    due_date: task?.due_date
      ? new Date(task.due_date).toISOString().split('T')[0]
      : '',
  });
  const [isDirty, setIsDirty] = useState(false);

  // Get task details including hours used
  const { data: taskDetails } = useQuery({
    queryKey: ['task-details', task?.id],
    queryFn: async () => {
      if (!task?.project_id) return null;
      const projectTasks = await getProjectTasks(task.project_id);
      return projectTasks.find(t => t.id === task.id) || null;
    },
    enabled: !!task
  });

  // Calculate hours used from time entries
  const hoursUsed = taskDetails?.hours_used ?? 0;
  const estimatedHours = taskDetails?.estimated_hours ?? 0;
  const progress = taskDetails?.progress ?? 0;

  // Fetch skills
  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
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

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        project_id: task.project_id || '',
        assigned_to: task.assigned_to || '',
        start_date: task.start_date || '',
        due_date: task.due_date
          ? new Date(task.due_date).toISOString().split('T')[0]
          : '',
        estimated_hours: task.estimated_hours || 0,
        required_skill: '',
      });
      setIsDirty(false);
    }
  }, [task]);

  const canEdit = user?.isAdmin || task?.assigned_to === user?.id;

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Handle close with unsaved changes
  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      if (isCreating) {
        await createTask({
          ...formData,
          created_by: user!.id,
          assigned_to: user!.id,
        });
        onCreate?.();
      } else if (task && onUpdate) {
        onUpdate(formData);
      }
      onClose();
    } catch (err) {
      setError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !user?.isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      try {
        await deleteTask(task.id);
        onClose();
      } catch (err) {
        setError('Failed to delete task');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        true ? 'translate-x-0' : 'translate-x-full'
      } z-50`}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {isCreating ? 'Create Task' : `Task Details ${isDirty ? '*' : ''}`}
          </h3>
          <button
            onClick={handleClose}
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
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        setFormData(prev => ({ ...prev, project_id: '' }));
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
                      onChange={(e) =>
                        handleFormChange('project_id', e.target.value)
                      }
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
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                disabled={!canEdit && !isCreating}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                disabled={!canEdit && !isCreating}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estimated Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {task && (
                <div className="mt-2">
                  <div className="text-sm text-gray-500">Hours Used: {Number(hoursUsed).toFixed(2)}</div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    {formData.estimated_hours > 0 && (
                    <div
                      className={`h-full ${
                        hoursUsed > formData.estimated_hours
                          ? 'bg-red-500'
                          : hoursUsed / formData.estimated_hours > 0.8
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (hoursUsed / (formData.estimated_hours || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                    )}
                  </div>
                  {formData.estimated_hours > 0 && (
                    <div className="mt-1 text-sm">
                      <span className={hoursUsed > formData.estimated_hours ? 'text-red-600 font-medium' : ''}>
                        {Math.round((hoursUsed / formData.estimated_hours) * 100)}% complete
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Star className="h-4 w-4 text-indigo-500" />
                <span>Required Skill</span>
              </label>
              <div className="mt-1 relative">
                <select
                  value={formData.required_skill}
                  onChange={(e) => {
                    setFormData({ ...formData, required_skill: e.target.value });
                }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">No skill required</option>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select the primary skill required for this task
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
                disabled={!canEdit && !isCreating}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleFormChange('due_date', e.target.value)}
                disabled={!canEdit && !isCreating}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
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
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              {(canEdit || isCreating) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export { TaskPanel }