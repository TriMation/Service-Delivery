import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Building, Mail, Phone, MapPin, Users, Send } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { createClient, updateClient, deleteClient, getClientUsers } from '../../lib/clients';
import { inviteClient } from '../../lib/auth';
import { getCompanies } from '../../lib/companies';
import type { Client } from '../../lib/clients';

interface ClientPanelProps {
  client?: Client;
  isCreating?: boolean;
  onClose: () => void;
}

export function ClientPanel({
  client,
  isCreating = false,
  onClose,
}: ClientPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [inviteSuccess, setInviteSuccess] = useState<string>();
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    company_id: client?.company_id || '',
    is_active: client?.is_active ?? true,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const { data: clientUsers = [] } = useQuery({
    queryKey: ['client-users', client?.id],
    queryFn: () => client ? getClientUsers(client.id) : [],
    enabled: !!client,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAdmin) return;

    setLoading(true);
    setError(undefined);

    try {
      if (isCreating) {
        await createClient(formData);
      } else if (client) {
        await updateClient(client.id, formData);
      }
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    } catch (err) {
      setError('Failed to save client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!client || !user?.isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this client?')) {
      setLoading(true);
      try {
        await deleteClient(client.id);
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        onClose();
      } catch (err) {
        setError('Failed to delete client');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInvite = async () => {
    if (!formData.email || !formData.name || !formData.company_id) {
      setError('Please fill in the client name, email, and select a company before sending an invite.');
      return;
    }

    setLoading(true);
    setError(undefined);
    setInviteSuccess(undefined);

    try {
      const { password } = await inviteClient(
        formData.email,
        formData.name,
        formData.company_id
      );
      setInviteSuccess(`Invitation sent successfully! Temporary password: ${password}`);
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0 z-50"
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {isCreating ? 'Create Client' : 'Client Details'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <div className="mt-1 relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.company_id}
                  onChange={(e) =>
                    setFormData({ ...formData, company_id: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Client Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="mt-1 relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            {!isCreating && clientUsers.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Associated Users
                </h4>
                <div className="mt-2 space-y-2">
                  {clientUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 text-sm text-gray-600"
                    >
                      <span>{user.full_name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{user.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {inviteSuccess && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                {inviteSuccess}
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-end space-x-3">
              {!isCreating && user?.isAdmin && !clientUsers.length && (
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  <Send size={16} className="mr-2" />
                  Send Invite
                </button>
              )}
              {!isCreating && user?.isAdmin && (
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
              {user?.isAdmin && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}