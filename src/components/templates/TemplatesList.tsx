import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { BookTemplate as FileTemplate, CheckSquare, Clock, User } from 'lucide-react';
import type { Template } from '../../types/database';

interface TemplatesListProps {
  templates: Template[];
}

export function TemplatesList({ templates }: TemplatesListProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Template
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tasks
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {templates.map((template) => (
            <tr
              key={template.id}
              onClick={() => navigate(`/templates/${template.id}`)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <FileTemplate className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {template.name}
                    </div>
                    {template.description && (
                      <div className="text-sm text-gray-500">
                        {template.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <CheckSquare className="h-5 w-5 text-gray-400 mr-2" />
                  {(template as any).tasks?.length || 0} tasks
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  {(template as any).created_by_user?.full_name || 'Unknown'}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {format(new Date(template.created_at), 'MMM d, yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}