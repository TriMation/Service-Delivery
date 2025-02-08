import React from 'react';
import { format } from 'date-fns';
import { DollarSign, Star, Clock, Percent, User } from 'lucide-react';
import type { ResourceMatrix, User as UserType } from '../../types/database';

interface CostingsTableProps {
  resources: (Partial<ResourceMatrix> & { user: UserType })[];
  onResourceClick: (resource: Partial<ResourceMatrix> & { user: UserType }) => void;
}

export function CostingsTable({ resources, onResourceClick }: CostingsTableProps) {
  const getCompetencyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-green-100 text-green-800';
      case 5: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time Loading
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost Loading
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {resources.map((resource) => (
            <tr
              key={resource.user.id}
              onClick={() => onResourceClick(resource as ResourceMatrix & { user: UserType })}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {resource.user.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {resource.user.title || 'No Title'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {resource.user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  {resource.cost?.toFixed(2) || 'Not set'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  {resource.time_loading ? `${resource.time_loading}%` : 'Not set'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Percent className="h-5 w-5 text-gray-400 mr-2" />
                  {resource.cost_loading ? `${resource.cost_loading}%` : 'Not set'}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {resource.updated_at ? format(new Date(resource.updated_at), 'MMM d, yyyy') : 'Never'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}