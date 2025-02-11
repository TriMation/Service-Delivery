import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getProject } from '../../lib/projects';
import { getProjectTasks } from '../../lib/tasks';
import { getTimeEntries } from '../../lib/time';
import { ProjectDetailFilters } from './ProjectDetailFilters';
import { GanttChart } from './GanttChart';
import { TaskPanel } from '../tasks/TaskPanel';
import type { Task } from '../../types/database';

export function GanttChartPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    companyId: '',
    projectId: ''
  });

  // Fetch project data if selected
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', filters.projectId],
    queryFn: () => getProject(filters.projectId),
    enabled: !!filters.projectId
  });

  // Fetch tasks if project is selected
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', filters.projectId],
    queryFn: () => getProjectTasks(filters.projectId),
    enabled: !!filters.projectId
  });

  // Fetch time entries if project is selected
  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery({
    queryKey: ['project-time-entries', filters.projectId],
    queryFn: () => getTimeEntries(user!.id, user!.isAdmin, { project: filters.projectId }),
    enabled: !!filters.projectId
  });

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  // Show loading state while data is being fetched
  const isLoading = projectLoading || tasksLoading || timeEntriesLoading;

  // Show loading spinner while data is loading and we have a project selected
  if (isLoading && filters.projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Handle task updates
  const handleTaskUpdate = async (updates: Partial<Task>) => {
    try {
      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['project-time-entries'] })
      ]);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart2 className="h-8 w-8 text-indigo-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Gantt Chart</h1>
      </div>

      <ProjectDetailFilters
        filters={filters}
        setFilters={setFilters}
        standalone={true}
      />

      {!filters.projectId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Select a client and project to view the Gantt chart</p>
        </div>
      )}

      {project && filters.projectId && (
        <GanttChart
          tasks={filteredTasks}
          timeEntries={timeEntries}
          projectStart={new Date(project.start_date)}
          projectEnd={project.end_date ? new Date(project.end_date) : new Date(project.start_date)}
          onTaskClick={setSelectedTask}
          selectedTaskId={selectedTask?.id || undefined}
        />
      )}

      {selectedTask && filters.projectId && (
        <TaskPanel
          task={selectedTask}
          projectId={project!.id}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
}