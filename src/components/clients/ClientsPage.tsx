import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Building2, Building } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getClients } from '../../lib/clients';
import { ClientsTable } from './ClientsTable';
import { ClientPanel } from './ClientPanel';
import { CompanyPanel } from './CompanyPanel';
import type { Client } from '../../lib/clients';

export function ClientsPage() {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showCompanyPanel, setShowCompanyPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Building2 className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        </div>
        {user?.isAdmin && <div className="flex space-x-4">
          <button
            onClick={() => setShowCompanyPanel(true)}
            className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building size={20} className="mr-2" />
            New Company
          </button>
          <button
            onClick={() => setShowCreatePanel(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            New Client
          </button>
        </div>}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name or company..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <ClientsTable
        clients={filteredClients}
        onClientClick={setSelectedClient}
        canEdit={user?.isAdmin}
      />

      {(selectedClient || showCreatePanel) && (
        <ClientPanel
          client={selectedClient}
          isCreating={showCreatePanel}
          onClose={() => {
            setSelectedClient(null);
            setShowCreatePanel(false);
          }}
        />
      )}
      {showCompanyPanel && (
        <CompanyPanel
          onClose={() => setShowCompanyPanel(false)}
        />
      )}
    </div>
  );
}