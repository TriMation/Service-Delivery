import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookTemplate as FileTemplate, Plus, Search } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getTemplates } from '../../lib/templates';
import { TemplatesList } from './TemplatesList';
import { TemplatePanel } from './TemplatePanel';
import type { Template } from '../../types/database';

export function TemplatesPage() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  });

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    template.description?.toLowerCase().includes(filters.search.toLowerCase())
  );

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
        <div className="flex items-center space-x-3">
          <FileTemplate className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
        </div>
        <button
          onClick={() => setShowCreatePanel(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          New Template
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search templates..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <TemplatesList
        templates={filteredTemplates}
        onTemplateClick={setSelectedTemplate}
      />

      {(selectedTemplate || showCreatePanel) && (
        <TemplatePanel
          template={selectedTemplate}
          isCreating={showCreatePanel}
          onClose={() => {
            setSelectedTemplate(null);
            setShowCreatePanel(false);
          }}
        />
      )}
    </div>
  );
}