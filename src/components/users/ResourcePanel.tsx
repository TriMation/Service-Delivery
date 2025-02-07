import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, DollarSign, Star, Clock, Percent } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { createResourceMatrix, updateResourceMatrix, deleteResourceMatrix } from '../../lib/resources';
import type { ResourceMatrix } from '../../types/database';

interface ResourcePanelProps {
  resource?: Partial<ResourceMatrix> & { user: UserType };
  onClose: () => void;
}

export function ResourcePanel({
  resource,
  onClose,
}: ResourcePanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState({
    cost: resource?.cost || 0,
    competency: resource?.competency || 3,
    time_loading: resource?.time_loading || 100,
    cost_loading: resource?.cost_loading || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAdmin) return;

    setLoading(true);
    setError(undefined);

    try {
      if (resource?.id) {
        await updateResourceMatrix(resource.id, formData);
      } else if (resource?.user) {
        await createResourceMatrix({
          ...formData,
          user_id: resource.user.id
        });
      }
      queryClient.invalidateQueries({ queryKey: ['resource-matrix'] });
      onClose();
    } catch (err) {
      setError('Failed to save resource data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!resource || !user?.isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this resource data?')) {
      setLoading(true);
      try {
        await deleteResourceMatrix(resource.id);
        queryClient.invalidateQueries({ queryKey: ['resource-matrix'] });
        onClose();
      } catch (err) {
        setError('Failed to delete resource data');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0 z-50">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Resource Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {resource && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700">User</h4>
                <p className="mt-1 text-sm text-gray-900">{(resource.user as any)?.full_name}</p>
                <p className="text-sm text-gray-500">{(resource.user as any)?.email}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cost Rate (per hour)
              </label>
              <div className="mt-1 relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Competency Level
              </label>
              <div className="mt-1 relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.competency}
                  onChange={(e) =>
                    setFormData({ ...formData, competency: parseInt(e.target.value) })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                >
                  <option value={1}>Level 1 - Junior</option>
                  <option value={2}>Level 2 - Mid-Level</option>
                  <option value={3}>Level 3 - Senior</option>
                  <option value={4}>Level 4 - Lead</option>
                  <option value={5}>Level 5 - Expert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time Loading (%)
              </label>
              <div className="mt-1 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.time_loading}
                  onChange={(e) =>
                    setFormData({ ...formData, time_loading: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cost Loading (%)
              </label>
              <div className="mt-1 relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  value={formData.cost_loading}
                  onChange={(e) =>
                    setFormData({ ...formData, cost_loading: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-end space-x-3">
              {resource && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}