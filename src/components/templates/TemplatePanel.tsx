import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, BookTemplate as FileTemplate, Plus, Star, Clock } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { createTemplate, updateTemplate, deleteTemplate, createTemplateTask, updateTemplateTask, deleteTemplateTask } from '../../lib/templates';
import { getSkills } from '../../lib/skills';
import type { Template, TemplateTask } from '../../types/database';

interface TemplatePanelProps {
  template?: Template;
  isCreating?: boolean;
  onClose: () => void;
}

export function TemplatePanel({
  template,
  isCreating = false,
  onClose,
}: TemplatePanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
  });
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    estimated_hours: 0,
    required_skill: '',
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
  });

  const { data: templateTasks = [] } = useQuery({
    queryKey: ['template-tasks', template?.id],
    queryFn: () => getTemplateTasks(template!.id),
    enabled: !!template,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAdmin) return;

    setSaveSuccess(false);
    setLoading(true);
    setError(undefined);

    try {
      if (isCreating) {
        await createTemplate({
          ...formData,
          created_by: user.id,
        });
      } else if (template) {
        await updateTemplate(template.id, formData);
      }
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSaveSuccess(true);
      // Reset success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError('Failed to save template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!template || !user?.isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this template?')) {
      setLoading(true);
      try {
        await deleteTemplate(template.id);
        queryClient.invalidateQueries({ queryKey: ['templates'] });
        onClose();
      } catch (err) {
        setError('Failed to delete template');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !user?.isAdmin) return;

    setLoading(true);
    setError(undefined);

    try {
      await createTemplateTask({
        ...taskFormData,
        template_id: template.id,
      });
      queryClient.invalidateQueries({ queryKey: ['template-tasks'] });
      setShowAddTask(false);
      setTaskFormData({
        title: '',
        description: '',
        estimated_hours: 0,
        required_skill: '',
      });
    } catch (err) {
      setError('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0 z-50"
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FileTemplate className="h-6 w-6 text-indigo-600 mr-2" />
            {isCreating ? 'Create Template' : 'Template Details'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
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
              />
            </div>

            {!isCreating && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Tasks</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddTask(true)}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Task
                  </button>
                </div>

                {showAddTask && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={taskFormData.title}
                        onChange={(e) =>
                          setTaskFormData({ ...taskFormData, title: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={taskFormData.description}
                        onChange={(e) =>
                          setTaskFormData({ ...taskFormData, description: e.target.value })
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Estimated Hours
                      </label>
                      <div className="mt-1 relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={taskFormData.estimated_hours}
                          onChange={(e) =>
                            setTaskFormData({ ...taskFormData, estimated_hours: parseFloat(e.target.value) || 0 })
                          }
                          className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                        <Star className="h-4 w-4 text-indigo-500" />
                        <span>Required Skill</span>
                      </label>
                      <select
                        value={taskFormData.required_skill}
                        onChange={(e) =>
                          setTaskFormData({ ...taskFormData, required_skill: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">No skill required</option>
                        {skills.map((skill) => (
                          <option key={skill.id} value={skill.id}>
                            {skill.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddTask(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTask}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {templateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-4 rounded-lg border border-gray-200"
                    >
                      <div className="font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {task.estimated_hours || 0}h
                        {task.required_skill && (
                          <>
                            <span className="mx-2">•</span>
                            <Star className="h-4 w-4 mr-1 text-indigo-500" />
                            {(task as any).skill?.name}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-end space-x-3">
              {!isCreating && (
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
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 transition-colors duration-200 ${
                  saveSuccess 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Saving...' : saveSuccess ? 'Saved!' : isCreating ? 'Create Template' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}