import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Building2, Mail, Phone, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCompanies } from '../../lib/companies';
import type { Client } from '../../lib/clients';

interface ClientsTableProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
  canEdit: boolean;
}

interface GroupedClients {
  [companyName: string]: Client[];
}

export function ClientsTable({ clients, onClientClick, canEdit }: ClientsTableProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const groupedClients = useMemo(() => {
    // Create initial groups for all companies
    const groups: GroupedClients = companies.reduce((acc, company) => {
      acc[company.name] = [];
      return acc;
    }, {} as GroupedClients);

    // Add clients to their respective company groups
    clients.forEach(client => {
      const companyName = client.company?.name;
      if (companyName && groups[companyName]) {
        groups[companyName].push(client);
      }
    });

    return groups;
  }, [clients, companies]);

  const toggleCompany = (companyName: string) => {
    setExpandedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(companyName)) {
        next.delete(companyName);
      } else {
        next.add(companyName);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="divide-y divide-gray-200">
        {Object.entries(groupedClients).map(([companyName, companyClients]) => {
          const isExpanded = expandedCompanies.has(companyName);
          return (
            <div key={companyName} className="bg-white">
              <button
                onClick={() => toggleCompany(companyName)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <span className="text-lg font-medium text-gray-900">
                    {companyName}
                  </span>
                  <span className={`text-sm ${companyClients.length === 0 ? 'text-gray-400' : 'text-gray-500'}`}>
                    {companyClients.length === 0 ? '(No clients)' : 
                     `(${companyClients.length} ${companyClients.length === 1 ? 'client' : 'clients'})`}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {isExpanded && (
                companyClients.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companyClients.map((client) => (
                      <tr
                        key={client.id}
                        onClick={() => canEdit && onClientClick(client)}
                        className={canEdit ? 'hover:bg-gray-50 cursor-pointer' : ''}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {client.name}
                              </div>
                              {client.address && (
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {client.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {client.email && (
                              <div className="text-sm text-gray-900 flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="text-sm text-gray-900 flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            client.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {client.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(new Date(client.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No clients have been added for this company yet.</p>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}