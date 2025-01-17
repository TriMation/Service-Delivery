import React from 'react';
import { format } from 'date-fns';
import { Clock, CheckSquare, Calendar, User, FileText } from 'lucide-react';
import { ProjectReport } from '../../lib/reports';

interface ReportViewerProps {
  report: ProjectReport;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const { project, timeEntries, totalHours, completedTasks, totalTasks } = report;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="border-b pb-4 mb-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
              <Clock className="h-4 w-4 mr-1" />
              Total Hours
            </div>
            <span className="text-2xl font-semibold text-gray-900">
              {totalHours.toFixed(1)}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
              <CheckSquare className="h-4 w-4 mr-1" />
              Tasks Progress
            </div>
            <span className="text-2xl font-semibold text-gray-900">
              {completedTasks} / {totalTasks}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
              <Calendar className="h-4 w-4 mr-1" />
              Start Date
            </div>
            <span className="text-2xl font-semibold text-gray-900">
              {format(new Date(project.start_date), 'MMM d, yyyy')}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
              <Clock className="h-4 w-4 mr-1" />
              Allocated Hours
            </div>
            <span className="text-2xl font-semibold text-gray-900">
              {project.allocated_hours}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Time Entries</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      {(entry.user as any)?.full_name || 'Unknown User'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      {(entry.task as any)?.title || 'No Task'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      {entry.hours.toFixed(1)} hrs
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {entry.description || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}