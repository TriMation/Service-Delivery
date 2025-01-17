import React from 'react';
import { Search, Calendar } from 'lucide-react';

interface TimeFiltersProps {
  filters: {
    search: string;
    dateRange: string;
    project: string;
    user: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      search: string;
      dateRange: string;
      project: string;
      user: string;
    }>
  >;
}

export function TimeFilters({ filters, setFilters }: TimeFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search time entries..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <select
          value={filters.dateRange}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
          }
          className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>
  );
}