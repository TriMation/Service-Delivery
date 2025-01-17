import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { TimeEntriesList } from './TimeEntriesList';
import { TimeEntryPanel } from './TimeEntryPanel';
import { TimeFilters } from './TimeFilters';
import { getTimeEntries } from '../../lib/time';
import type { TimeEntry } from '../../types/database';

export function TimeTrackingPage() {
  const { user } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'week',
    project: '',
    user: '',
  });

  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['time-entries', filters],
    queryFn: () => getTimeEntries(user!.id, user!.isAdmin, filters),
  });

  // Calculate statistics
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  
  const stats = timeEntries.reduce((acc, entry) => {
    const entryDate = new Date(entry.date);
    
    // Total hours this month
    if (entryDate >= monthStart) {
      acc.monthlyHours += entry.hours;
    }
    
    // Total hours this week
    if (entryDate >= weekStart) {
      acc.weeklyHours += entry.hours;
    }
    
    // Today's hours
    if (entryDate.toDateString() === now.toDateString()) {
      acc.todayHours += entry.hours;
    }
    
    return acc;
  }, {
    monthlyHours: 0,
    weeklyHours: 0,
    todayHours: 0
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
          <Clock className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Time Tracking</h1>
        </div>
        <button
          onClick={() => setShowCreatePanel(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Log Time
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Clock className="h-4 w-4 mr-1" />
            Today
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            {stats.todayHours.toFixed(1)} hrs
          </span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Clock className="h-4 w-4 mr-1" />
            This Week
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            {stats.weeklyHours.toFixed(1)} hrs
          </span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Calendar className="h-4 w-4 mr-1" />
            This Month
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            {stats.monthlyHours.toFixed(1)} hrs
          </span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Clock className="h-4 w-4 mr-1" />
            Daily Average
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            {(stats.monthlyHours / (now.getDate())).toFixed(1)} hrs
          </span>
        </div>
      </div>

      <TimeFilters filters={filters} setFilters={setFilters} />

      <TimeEntriesList
        entries={timeEntries}
        onEntryClick={setSelectedEntry}
        canEdit={user?.isAdmin || user?.role === 'user'}
      />

      {(selectedEntry || showCreatePanel) && (
        <TimeEntryPanel
          entry={selectedEntry}
          isCreating={showCreatePanel}
          onClose={() => {
            setSelectedEntry(null);
            setShowCreatePanel(false);
          }}
        />
      )}
    </div>
  );
}