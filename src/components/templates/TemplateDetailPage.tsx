import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  BookTemplate as FileTemplate, 
  ChevronLeft, 
  Plus,
  X,
  Star, 
  Clock, 
  CheckSquare,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { 
  getTemplate, 
  updateTemplate, 
  createTemplateRequirement,
  updateTemplateRequirement,
  deleteTemplateRequirement,
  createTemplateBenefit
} from '../../lib/templates';
import type { Template, TemplateRequirement, TemplateBenefit } from '../../types/database';

export function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch template data
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => getTemplate(templateId!),
    enabled: !!templateId,
  });

  // Initialize form data after template is loaded
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    project_overview: '',
    measure_improvements: '',
    sign_off_criteria: '',
    project_buffer: 0,
    requirements: [] as TemplateRequirement[],
    benefits: [] as TemplateBenefit[]
  });

  // Update form data when template changes
  React.useEffect(() => {
    if (template) {
      setFormData({
        project_overview: template.project_overview || '',
        measure_improvements: template.measure_improvements || '',
        sign_off_criteria: template.sign_off_criteria || '',
        project_buffer: template.project_buffer || 0,
        requirements: template.requirements || [],
        benefits: template.benefits || []
      });
      setIsDirty(false);
    }
  }, [template]);

  // Calculate total hours and cost
  const totalHours = template?.tasks?.reduce((sum, task) => sum + (task.estimated_hours || 0), 0) || 0;
  const baselineCost = totalHours * 150; // Example hourly rate
  const bufferAmount = baselineCost * ((template?.project_buffer || 0) / 100);
  const totalCost = baselineCost + bufferAmount;

  // Update form data without saving
  const handleFormChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Save all changes
  const handleSave = async () => {
    if (!template || !user?.isAdmin) return;

    setSaveSuccess(false);
    setLoading(true);
    setError(undefined);

    try {
      // Update template and its requirements
      await updateTemplate(template.id, {
        ...formData,
        requirements: formData.requirements,
        benefits: formData.benefits
      });
      
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      setSaveSuccess(true);
      setIsDirty(false);

      // Reset success state after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update template:', err);
      setError('Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = async (requirement: Partial<TemplateRequirement>) => {
    setFormData(prev => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        {
          id: `temp-${Date.now()}`,
          template_id: template!.id,
          requirement_text: requirement.requirement_text || '',
          is_met: requirement.is_met || false,
          deliverables_rich_text: requirement.deliverables_rich_text || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as TemplateRequirement
      ]
    }));
    setIsDirty(true);
  };

  const handleUpdateRequirement = async (id: string, updates: Partial<TemplateRequirement>) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map(req => 
        req.id === id ? { ...req, ...updates } : req
      )
    }));
    setIsDirty(true);
  };

  const handleDeleteRequirement = async (id: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req.id !== id)
    }));
    setIsDirty(true);
  };

  const handleAddBenefit = async (benefit: Partial<TemplateBenefit>) => {
    setFormData(prev => ({
      ...prev,
      benefits: [
        ...prev.benefits,
        {
          id: `temp-${Date.now()}`,
          template_id: template!.id,
          anticipated_benefit: benefit.anticipated_benefit || '',
          example: benefit.example || '',
          measurement: benefit.measurement || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as TemplateBenefit
      ]
    }));
    setIsDirty(true);
  };

  const handleUpdateBenefit = (id: string, updates: Partial<TemplateBenefit>) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map(benefit => 
        benefit.id === id ? { ...benefit, ...updates } : benefit
      )
    }));
    setIsDirty(true);
  };

  const handleDeleteBenefit = (id: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(benefit => benefit.id !== id)
    }));
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h2>
          <p className="text-gray-600">The requested template could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/templates')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <FileTemplate className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{template.name}</h1>
            {template.description && (
              <p className="text-sm text-gray-500">{template.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || !isDirty}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
            saveSuccess
              ? 'bg-green-500 text-white hover:bg-green-600'
              : loading 
                ? 'bg-indigo-600 text-white cursor-wait opacity-75'
                : isDirty
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'requirements'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Requirements
          </button>
          <button
            onClick={() => setActiveTab('benefits')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'benefits'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Benefits
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'tasks'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks & Costing
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Overview</h3>
              <textarea
                value={formData.project_overview}
                onChange={(e) => handleFormChange('project_overview', e.target.value)}
                rows={10}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="Enter a detailed project overview..."
                style={{ minHeight: '200px', resize: 'vertical' }}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Measure Improvements</h3>
              <textarea
                value={formData.measure_improvements}
                onChange={(e) => handleFormChange('measure_improvements', e.target.value)}
                rows={8}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="Describe how improvements will be measured..."
                style={{ minHeight: '160px', resize: 'vertical' }}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sign-off Criteria</h3>
              <textarea
                value={formData.sign_off_criteria}
                onChange={(e) => handleFormChange('sign_off_criteria', e.target.value)}
                rows={8}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="Define the criteria for project sign-off..."
                style={{ minHeight: '160px', resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
              <button
                onClick={() => {
                  handleAddRequirement({
                    requirement_text: 'New Requirement',
                    is_met: false,
                  });
                }}
                className="flex items-center px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Plus size={16} className="mr-1" />
                Add Requirement
              </button>
            </div>

            <div className="space-y-4">
              {formData.requirements.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={req.requirement_text}
                        onChange={(e) => {
                          handleUpdateRequirement(req.id, {
                            requirement_text: e.target.value
                          });
                        }}
                        className="w-full text-sm font-medium text-gray-900 bg-transparent border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter requirement..."
                      />
                      <textarea
                        value={req.deliverables_rich_text || ''}
                        onChange={(e) => {
                          handleUpdateRequirement(req.id, {
                            deliverables_rich_text: e.target.value
                          });
                        }}
                        placeholder="Describe deliverables..."
                        rows={3}
                        className="w-full text-sm text-gray-600 bg-transparent border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteRequirement(req.id)}
                      className="ml-4 p-1 text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Anticipated Benefits</h3>
              <button
                onClick={() => {
                  handleAddBenefit({
                    anticipated_benefit: 'New Benefit',
                  });
                }}
                className="flex items-center px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Plus size={16} className="mr-1" />
                Add Benefit
              </button>
            </div>

            <div className="space-y-4">
              {formData.benefits.map((benefit) => (
                <div
                  key={benefit.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={benefit.anticipated_benefit}
                      onChange={(e) => handleUpdateBenefit(benefit.id, {
                        anticipated_benefit: e.target.value
                      })}
                      className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 focus:ring-0"
                    />
                    <input
                      type="text"
                      value={benefit.example || ''}
                      onChange={(e) => handleUpdateBenefit(benefit.id, {
                        example: e.target.value
                      })}
                      placeholder="Provide an example..."
                      className="w-full text-sm text-gray-600 bg-transparent border-0 focus:ring-0"
                    />
                    <input
                      type="text"
                      value={benefit.measurement || ''}
                      onChange={(e) => handleUpdateBenefit(benefit.id, {
                        measurement: e.target.value
                      })}
                      placeholder="How will this be measured?"
                      className="w-full text-sm text-gray-600 bg-transparent border-0 focus:ring-0"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteBenefit(benefit.id)}
                    className="ml-4 p-1 text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Total Tasks
                </div>
                <span className="text-2xl font-semibold text-gray-900">
                  {template.tasks?.length || 0}
                </span>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                  <Clock className="h-4 w-4 mr-1" />
                  Total Hours
                </div>
                <span className="text-2xl font-semibold text-gray-900">
                  {totalHours.toFixed(1)}
                </span>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Base Cost
                </div>
                <span className="text-2xl font-semibold text-gray-900">
                  ${baselineCost.toLocaleString()}
                </span>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Total Cost
                </div>
                <span className="text-2xl font-semibold text-gray-900">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Project Buffer</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.project_buffer}
                    onChange={(e) => handleFormChange('project_buffer',
                      Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                    )}
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600"
                  style={{ width: `${template.project_buffer || 0}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Buffer amount: ${bufferAmount.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {template.tasks?.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        {task.required_skill && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Star className="h-4 w-4 mr-1 text-indigo-500" />
                            {(task as any).skill?.name}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {task.estimated_hours || 0}h
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-lg shadow-lg border border-red-200">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
    </div>
  );
}