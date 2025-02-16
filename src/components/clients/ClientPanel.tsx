import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Building2, Mail, Phone, MapPin, Users, Send, Key, Eye, EyeOff, ChevronDown, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { createClient, updateClient, deleteClient, getClientUsers } from '../../lib/clients';
import { inviteClient, resetUserPassword } from '../../lib/auth';
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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
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

  const handlePasswordReset = async () => {
    if (!clientUsers[0]?.id) return;
    
    // Clear any existing messages
    setError(undefined);
    setInviteSuccess(undefined);
    setResetting(true);
    setResetSuccess(false);

    // Validate password
    if (!newPassword) {
      setError('Password is required');
      setResetting(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setResetting(false);
      return;
    }

    try {
      await resetUserPassword(clientUsers[0].id, newPassword);
      setResetSuccess(true);
      setNewPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
      setError(message);
    } finally {
      setResetting(false);
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
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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

            {!isCreating && user?.isAdmin && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <Key className="h-5 w-5 mr-2 text-gray-400" />
                    Reset Password
                  </div>
                  {showPasswordReset ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {showPasswordReset && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1 relative group">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!resetting && !resetSuccess && newPassword) {
                                handlePasswordReset();
                              }
                            }
                          }}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          placeholder="Enter new password"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={resetting || !newPassword || resetSuccess}
                      className={`w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                        resetSuccess
                          ? 'text-white bg-green-500 hover:bg-green-600 focus:ring-green-500'
                          : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                      } disabled:opacity-50`}
                    >
                      {resetting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Resetting...
                        </div>
                      ) : resetSuccess ? (
                        <div className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Password Updated
                        </div>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>
                )}
                {resetSuccess && (
                  <div className="mt-4 flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    Password has been updated successfully
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {inviteSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
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