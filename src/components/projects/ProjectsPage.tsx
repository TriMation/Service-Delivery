import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Briefcase, Filter } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getProjects } from '../../lib/projects';
import { ProjectsTable } from './ProjectsTable';
import { ProjectPanel } from './ProjectPanel';
import type { Project } from '../../types/database';

export function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectPanel, setShowProjectPanel] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    clientId: '',
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(user!.id, user!.isAdmin),
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      project.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || project.status === filters.status;
    const matchesClient = !filters.clientId || project.company_id === filters.clientId;
    return matchesSearch && matchesStatus && matchesClient;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setShowProjectPanel(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Briefcase className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        </div>
        {user?.isAdmin && (
          <button
            onClick={() => setShowCreatePanel(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            New Project
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search projects..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <ProjectsTable
        projects={filteredProjects}
        selectedProjectId={selectedProject?.id}
        onProjectSelect={handleProjectSelect}
      />

      {(showProjectPanel || showCreatePanel) && (
        <ProjectPanel
          project={selectedProject}
          isCreating={showCreatePanel}
          onClose={() => {
            setSelectedProject(null);
            setShowProjectPanel(false);
            setShowCreatePanel(false);
          }}
        />
      )}
    </div>
  );
}