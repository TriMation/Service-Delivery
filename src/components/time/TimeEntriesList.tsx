import React from 'react';
import { format } from 'date-fns';
import { Clock, Briefcase, User, FileText, Calendar } from 'lucide-react';
import type { TimeEntry } from '../../types/database';

interface TimeEntriesListProps {
  entries: TimeEntry[];
  onEntryClick: (entry: TimeEntry) => void;
  canEdit: boolean;
}

export function TimeEntriesList({ entries, onEntryClick, canEdit }: TimeEntriesListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
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
          {entries.map((entry) => (
            <tr
              key={entry.id}
              onClick={() => canEdit && onEntryClick(entry)}
              className={canEdit ? 'hover:bg-gray-50 cursor-pointer' : ''}
            >
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                  {(entry.project as any)?.name || 'No Project'}
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
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  {(entry.user as any)?.full_name || 'Unknown User'}
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
  );
}