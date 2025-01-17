import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileText, Download, Clock, CheckSquare, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getCompanies, getCompanyProjects } from '../../lib/companies';
import { getSystemSettings } from '../../lib/settings';
import { generateProjectReport, generatePDF, type ReportFilters } from '../../lib/reports';
import { format } from 'date-fns';

export function ReportsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSystemSettings,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', selectedCompanyId],
    queryFn: () => selectedCompanyId ? getCompanyProjects(selectedCompanyId) : [],
    enabled: !!selectedCompanyId,
  });

  const { data: report, isLoading: isGenerating } = useQuery({
    queryKey: ['report', filters],
    queryFn: () => generateProjectReport(filters),
    enabled: !!filters.projectId, // Generate report when project is selected
  });

  const handleGenerateReport = async () => {
    if (!filters.projectId) {
      alert('Please select a project');
      return;
    }
    
    setIsGeneratingPDF(true);
    try {
      // Ensure we have fresh report data
      const reportData = await generateProjectReport(filters);
      if (!reportData) {
        throw new Error('No report data available');
      }
      
      // Generate and download PDF
      const pdfDoc = await generatePDF(reportData, settings);
      const projectName = reportData.project.name.replace(/[^a-zA-Z0-9]/g, '_');
      pdfDoc.download(`${projectName}_Report.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate report. Please ensure all data is loaded and try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Generate Report</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setFilters(prev => ({ ...prev, projectId: '' }));
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a client</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project
            </label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={!selectedCompanyId}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={handleGenerateReport}
            disabled={!filters.projectId || isGeneratingPDF}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Download size={20} className="mr-2" />
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {isGenerating ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : report && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                <Clock className="h-4 w-4 mr-1" />
                Total Hours
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {report.totalHours.toFixed(1)}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                <CheckSquare className="h-4 w-4 mr-1" />
                Tasks Progress
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {report.completedTasks} / {report.totalTasks}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                Start Date
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {format(new Date(report.project.start_date), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                <Clock className="h-4 w-4 mr-1" />
                Allocated Hours
              </div>
              <span className="text-2xl font-semibold text-gray-900">
                {report.project.allocated_hours}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Time Entries</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.timeEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(entry.user as any)?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.hours.toFixed(1)} hrs
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}