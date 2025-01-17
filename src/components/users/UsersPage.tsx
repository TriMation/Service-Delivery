import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { listUsers, updateUserProfile } from '../../lib/auth';
import { useQueryClient } from '@tanstack/react-query';
import { UsersList } from './UsersList';
import { UserPanel } from './UserPanel';
import type { User } from '../../types/database';

export function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
  });
  const [error, setError] = useState<string>();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await updateUserProfile(userId, updates);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(null);
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());
    const matchesRole = !filters.role || user.role === filters.role;
    return matchesSearch && matchesRole;
  });

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
          <Users className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        </div>
        <button
          onClick={() => setShowCreatePanel(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add User
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
              placeholder="Search users by name or email..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="client">Client</option>
          </select>
        </div>
      </div>

      <UsersList
        users={filteredUsers}
        onUserClick={(clickedUser) => {
          // Only update if clicking a different user
          if (selectedUser?.id !== clickedUser.id) {
            setSelectedUser(clickedUser);
          }
        }}
        canEdit={user?.isAdmin}
      />

      {(selectedUser || showCreatePanel) && (
        <UserPanel
          user={selectedUser}
          isCreating={showCreatePanel}
          onClose={() => {
            setSelectedUser(null);
            setShowCreatePanel(false);
          }}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
}