import React from 'react';
import { format } from 'date-fns';
import { MessageSquare, ThumbsUp, Building2, Briefcase, MessageCircle } from 'lucide-react';
import type { Request } from '../../types/database';

interface RequestsListProps {
  requests: Request[];
  onRequestClick: (request: Request) => void;
  currentUserId: string;
}

export function RequestsList({ requests, onRequestClick, currentUserId }: RequestsListProps) {
  const getStatusColor = (status: Request['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Request
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Upvotes
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requests.map((request) => (
            <tr
              key={request.id}
              onClick={() => onRequestClick(request)}
              className={`hover:bg-gray-50 cursor-pointer ${
                request.status === 'rejected' ? 'line-through text-gray-500' : ''
              }`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {request.title}
                      {(request.comments as any[])?.length > 0 && (
                        <div className="flex items-center text-indigo-600 no-underline">
                          <MessageCircle className="h-4 w-4" />
                          <span className="ml-1 text-xs">
                            {(request.comments as any[]).length}
                          </span>
                        </div>
                      )}
                    </div>
                    {request.description && (
                      <div className="text-sm text-gray-500">
                        {request.description.slice(0, 100)}
                        {request.description.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                  {(request.project as any)?.company?.name || 'No Client'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm text-gray-900">
                  <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                  {(request.project as any)?.name || 'No Project'}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                  {request.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <div>
                  {format(new Date(request.created_at), 'MMM d, yyyy')}
                </div>
                <div className="text-xs">
                  by {(request.submitter as any)?.full_name}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center text-sm">
                  <ThumbsUp className={`h-4 w-4 mr-1 ${
                    (request.upvotes as any[])?.some(u => u.user_id === currentUserId)
                      ? 'text-indigo-600'
                      : 'text-gray-400'
                  }`} />
                  <span className="text-gray-900">
                    {(request.upvotes as any[])?.length || 0}
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