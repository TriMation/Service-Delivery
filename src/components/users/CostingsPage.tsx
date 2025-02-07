import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Search, Users, Star, Clock, Percent } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getResourceMatrix } from '../../lib/resources';
import { listUsers } from '../../lib/auth';
import { CostingsTable } from './CostingsTable';
import { ResourcePanel } from './ResourcePanel';
import type { ResourceMatrix, User } from '../../types/database';

export function CostingsPage() {
  const { user } = useAuth();
  const [selectedResource, setSelectedResource] = useState<ResourceMatrix | null>(null);
  const [filters, setFilters] = useState({
    search: '',
  });

  // Fetch all users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  // Fetch resource matrix data
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resource-matrix'],
    queryFn: getResourceMatrix,
  });

  // Combine users with their resource data
  const combinedData = users.map(user => {
    const resourceData = resources.find(r => r.user_id === user.id);
    return {
      ...resourceData,
      user_id: user.id,
      user
    };
  });

  // Filter combined data
  const filteredData = combinedData.filter(item => 
    item.user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    item.user.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

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
          <DollarSign className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Resource Costings</h1>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search resources by name or email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Users className="h-4 w-4 mr-1" />
            Total Resources
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            {users.length}
          </span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Star className="h-4 w-4 mr-1" />
            Avg Competency
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            {resources.length > 0
              ? (resources.reduce((sum, r) => sum + (r.competency || 0), 0) / resources.length).toFixed(1)
              : '0.0'}
          </span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Clock className="h-4 w-4 mr-1" />
            Avg Time Loading
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            {resources.length > 0
              ? (resources.reduce((sum, r) => sum + (r.time_loading || 0), 0) / resources.length).toFixed(1)
              : '0.0'}%
          </span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Percent className="h-4 w-4 mr-1" />
            Avg Cost Loading
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            {resources.length > 0
              ? (resources.reduce((sum, r) => sum + (r.cost_loading || 0), 0) / resources.length).toFixed(1)
              : '0.0'}%
          </span>
        </div>
      </div>

      <CostingsTable
        resources={filteredData}
        onResourceClick={setSelectedResource}
      />

      {selectedResource && (
        <ResourcePanel
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}