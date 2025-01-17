import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, MessageSquare, Filter } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getRequests } from '../../lib/requests';
import { RequestsList } from './RequestsList';
import { RequestPanel } from './RequestPanel';
import type { Request } from '../../types/database';

export function RequestsPage() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    project: '',
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: () => getRequests(user!.id, user!.isAdmin),
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      request.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || request.status === filters.status;
    const matchesProject = !filters.project || request.project_id === filters.project;
    return matchesSearch && matchesStatus && matchesProject;
  });

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
          <MessageSquare className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Requests</h1>
        </div>
        <button
          onClick={() => setShowCreatePanel(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          New Request
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search requests..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <RequestsList
        requests={filteredRequests}
        onRequestClick={setSelectedRequest}
        currentUserId={user!.id}
      />

      {(selectedRequest || showCreatePanel) && (
        <RequestPanel
          request={selectedRequest}
          isCreating={showCreatePanel}
          onClose={() => {
            setSelectedRequest(null);
            setShowCreatePanel(false);
          }}
        />
      )}
    </div>
  );
}