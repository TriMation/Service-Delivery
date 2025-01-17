import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Building2, Calendar, Clock, CheckSquare, Trash2, Briefcase, FileUp, Download } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { createProject, updateProject, deleteProject, uploadProjectPDF } from '../../lib/projects';
import { getCompanies } from '../../lib/companies';
import type { Project } from '../../types/database';

interface ProjectPanelProps {
  project?: Project;
  isCreating?: boolean;
  onClose: () => void;
}

export function ProjectPanel({
  project,
  isCreating = false,
  onClose,
}: ProjectPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    statement_of_work: '',
    pdf_url: '',
    company_id: '',
    status: 'active',
    start_date: '',
    end_date: '',
    allocated_hours: 0
  });

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        statement_of_work: project.statement_of_work || '',
        pdf_url: project.pdf_url || '',
        company_id: project.company_id,
        status: project.status,
        start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
        end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
        allocated_hours: project.allocated_hours || 0
      });
    }
  }, [project]);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAdmin) return;

    setLoading(true);
    setError(undefined);

    try {
      if (isCreating) {
        await createProject({
          ...formData,
          created_by: user.id,
        });
      } else if (project) {
        await updateProject(project.id, formData);
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    } catch (err) {
      setError('Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !user?.isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks and time entries.')) {
      setLoading(true);
      try {
        await deleteProject(project.id);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        onClose();
      } catch (err) {
        setError('Failed to delete project');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(undefined);

    try {
      const url = await uploadProjectPDF(file);
      setFormData(prev => ({ ...prev, pdf_url: url }));
    } catch (err) {
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const calculateProgress = () => {
    const totalHours = calculateTotalHours();
    if (project?.allocated_hours === 0) return 0;
    return Math.round((totalHours / project?.allocated_hours) * 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress <= 33) return 'bg-red-500';
    if (progress <= 66) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const calculateTotalHours = () => {
    if (!project?.time_entries) return 0;
    const timeEntries = project.time_entries as any[];
    return timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0 z-50">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Briefcase className="h-6 w-6 text-indigo-600 mr-2" />
            {isCreating ? 'Create Project' : 'Project Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!isCreating && project && (
            <div className="p-6 bg-gray-50 border-b space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Hours Used
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl font-semibold text-gray-900">
                      {calculateTotalHours().toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      / {project.allocated_hours} hrs
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Progress
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {calculateProgress()}%
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getProgressColor(calculateProgress())}`}
                    style={{ width: `${Math.min(calculateProgress(), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <div className="mt-1 relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.company_id}
                  onChange={(e) =>
                    setFormData({ ...formData, company_id: e.target.value })
                  }
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
                Project Name
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Statement of Work
              </label>
              <textarea
                value={formData.statement_of_work}
                onChange={(e) =>
                  setFormData({ ...formData, statement_of_work: e.target.value })
                }
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter the detailed statement of work..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project Documentation (PDF)
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <label className={`
                  flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium
                  ${uploading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 cursor-pointer'}
                `}>
                  <FileUp className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">
                    {uploading ? 'Uploading...' : 'Upload PDF'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>
                {formData.pdf_url && (
                  <a
                    href={formData.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    View PDF
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allocated Hours
              </label>
              <div className="mt-1 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.allocated_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, allocated_hours: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  placeholder="Enter allocated hours"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between">
            {!isCreating && user?.isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 size={20} className="mr-2" />
                Delete Project
              </button>
            )}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              {user?.isAdmin && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Saving...' : isCreating ? 'Create Project' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}