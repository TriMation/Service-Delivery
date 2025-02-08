import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, Briefcase } from 'lucide-react';
import { getCompanies, getCompanyProjects } from '../../lib/companies';

interface ProjectDetailFiltersProps {
  filters: {
    search: string;
    companyId: string;
    projectId: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      search: string;
      companyId: string;
      projectId: string;
    }>
  >;
}

export function ProjectDetailFilters({ filters, setFilters }: ProjectDetailFiltersProps) {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', filters.companyId],
    queryFn: () => filters.companyId ? getCompanyProjects(filters.companyId) : [],
    enabled: !!filters.companyId
  });

  // Navigate to selected project
  const handleProjectChange = (projectId: string) => {
    if (projectId) {
      window.location.href = `/projects/${projectId}`;
    }
    setFilters(prev => ({ ...prev, projectId }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search tasks..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={filters.companyId}
            onChange={(e) => {
              setFilters(prev => ({ 
                ...prev, 
                companyId: e.target.value,
                projectId: '' // Reset project when company changes
              }));
            }}
            className="block w-48 pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Clients</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={filters.projectId}
            onChange={(e) =>
              handleProjectChange(e.target.value)
            }
            className="block w-48 pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={!filters.companyId}
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}