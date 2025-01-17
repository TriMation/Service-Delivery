import React from 'react';
import { format } from 'date-fns';
import { Building2, Calendar, Clock, CheckSquare } from 'lucide-react';
import type { Project } from '../../types/database';

interface ProjectsTableProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  canEdit: boolean;
}

export function ProjectsTable({ projects, onProjectClick, canEdit }: ProjectsTableProps) {
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
    const tasks = (project.tasks as any[]) || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Progress
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timeline
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={2}>
              Hours (Used / Allocated)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.map((project) => (
            <tr
              key={project.id}
              onClick={() => canEdit && onProjectClick(project)}
              className={canEdit ? 'hover:bg-gray-50 cursor-pointer' : ''}
            >
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
                <div className="flex items-center text-sm text-gray-900">
                  <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                  {(project.company as any)?.name || 'No Client'}
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
                    <CheckSquare className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {calculateProgress(project)}%
                    </span>
                  </div>
                  <div className="ml-4 flex-1 h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-indigo-600 rounded-full"
                      style={{ width: `${calculateProgress(project)}%` }}
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
                  <span className={calculateTotalHours(project) > project.allocated_hours ? 'text-red-600 font-medium' : ''}>
                    {calculateTotalHours(project)} / {project.allocated_hours} hrs
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}