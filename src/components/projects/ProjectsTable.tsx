import React from 'react';
import { format } from 'date-fns';
import { Building2, Calendar, Clock, CheckSquare, Search, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project } from '../../types/database';

interface ProjectsTableProps {
  projects: Project[];
  selectedProjectId?: string;
  onProjectSelect: (project: Project) => void;
}

export function ProjectsTable({ projects, selectedProjectId, onProjectSelect }: ProjectsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalHours = (project: Project) => {
    const timeEntries = (project.time_entries as any[]) || [];
    return timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  };

  const calculateProgress = (project: Project) => {
    const totalHours = calculateTotalHours(project);
    if (project.allocated_hours === 0) return 0;
    return Math.round((totalHours / project.allocated_hours) * 100);
  };

  const getProgressColor = (hoursUsed: number, hoursAllocated: number) => {
    const percentage = hoursAllocated > 0 ? (hoursUsed / hoursAllocated) * 100 : 0;
    return percentage >= 100 ? 'bg-red-600' : percentage >= 80 ? 'bg-yellow-600' : 'bg-indigo-600';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Progress
            </th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timeline
            </th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hours (Used / Allocated)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.map((project) => (
            <tr
              key={project.id}
              className={`hover:bg-gray-50 group ${selectedProjectId === project.id ? 'bg-blue-50' : ''}`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Link
                      to="#"
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="View Details"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onProjectSelect(project);
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/projects/${project.id}`}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Gantt Chart"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Link>
                  </div>
                  <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                  {(project.company as any)?.name || 'No Client'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {project.name}
                    </div>
                    {project.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {project.description.slice(0, 100)}
                        {project.description.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="flex items-center">
                    <CheckSquare className="h-5 w-5 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-900">
                      {calculateProgress(project)}%
                    </span>
                  </div>
                  <div className="ml-4 flex-1 h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(calculateTotalHours(project), project.allocated_hours)}`}
                      style={{ width: `${Math.min((calculateTotalHours(project) / project.allocated_hours) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div>{format(new Date(project.start_date), 'MMM d, yyyy')}</div>
                    {project.end_date && (
                      <div className="text-gray-500">
                        to {format(new Date(project.end_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div className="flex-1">
                    <div className={`${
                      calculateTotalHours(project) > project.allocated_hours ? 'text-red-600 font-medium' : ''
                    }`}>
                      {calculateTotalHours(project).toFixed(1)} / {project.allocated_hours} hrs
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                      <div
                        className={`h-1.5 rounded-full ${getProgressColor(calculateTotalHours(project), project.allocated_hours)}`}
                        style={{ width: `${Math.min((calculateTotalHours(project) / project.allocated_hours) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}