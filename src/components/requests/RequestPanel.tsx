import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X, Building2, MessageSquare, Send, ThumbsUp, CheckSquare, User, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { createRequest, updateRequest, addComment, toggleUpvote } from '../../lib/requests';
import { createTask } from '../../lib/tasks';
import { getCompanies, getCompanyProjects } from '../../lib/companies';
import { listUsers } from '../../lib/auth';
import type { Request } from '../../types/database';

interface RequestPanelProps {
  request?: Request;
  isCreating?: boolean;
  onClose: () => void;
}

export function RequestPanel({
  request,
  isCreating = false,
  onClose,
}: RequestPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: request?.title || '',
    description: request?.description || '',
    status: 'todo',
    assigned_to: '',
    due_date: '',
    project_id: request?.project_id || '',
  });
  const [formData, setFormData] = useState({
    title: request?.title || '',
    description: request?.description || '',
    project_id: request?.project_id || '',
    status: request?.status || 'pending',
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

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      if (isCreating) {
        await createRequest({
          ...formData,
          submitted_by: user!.id,
        });
      } else if (request) {
        await updateRequest(request.id, formData);
      }
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onClose();
    } catch (err) {
      setError('Failed to save request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!request || !newComment.trim()) return;

    setLoading(true);
    try {
      await addComment(request.id, user!.id, newComment.trim());
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!request || user?.role !== 'client') return;

    setLoading(true);
    try {
      await toggleUpvote(request.id, user.id);
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    } catch (err) {
      setError('Failed to update upvote');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAdmin) return;

    setLoading(true);
    setError(undefined);

    try {
      await createTask({
        ...taskFormData,
        created_by: user.id,
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskForm(false);
      setSuccess('Task created successfully');
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const canChangeStatus = user?.isAdmin || user?.role === 'user';
  const isUpvoted = (request?.upvotes as any[])?.some(u => u.user_id === user?.id);

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0 z-50">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="h-6 w-6 text-indigo-600 mr-2" />
            {isCreating ? 'New Request' : 'Request Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  <select
                    value={formData.project_id}
                    onChange={(e) =>
                      setFormData({ ...formData, project_id: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
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
                required
              />
            </div>

            {!isCreating && canChangeStatus && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="flex items-center space-x-4">
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as Request['status'] })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {user?.isAdmin && formData.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(true)}
                      className="mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Create Task
                    </button>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </form>

          {!isCreating && (
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">Comments</h4>
                {user?.role === 'client' && (
                  <button
                    onClick={handleUpvote}
                    disabled={loading}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                      isUpvoted
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsUp size={16} />
                    <span>{(request?.upvotes as any[])?.length || 0}</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {(request?.comments as any[])?.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user.full_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{comment.content}</p>
                  </div>
                ))}

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Send size={16} className="mr-1" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {showTaskForm && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create Task</h3>
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
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
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assign To
                    </label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={taskFormData.assigned_to}
                        onChange={(e) =>
                          setTaskFormData({ ...taskFormData, assigned_to: e.target.value })
                        }
                        className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select a user</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <div className="mt-1 relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={taskFormData.due_date}
                        onChange={(e) =>
                          setTaskFormData({ ...taskFormData, due_date: e.target.value })
                        }
                        className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : isCreating ? 'Submit Request' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}