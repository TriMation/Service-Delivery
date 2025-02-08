import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';
import {
  Briefcase,
  Calendar,
  ChevronRight,
  ChevronDown,
  Plus,
  Building2,
  Clock,
  CheckSquare,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getProject } from '../../lib/projects';
import { getProjectTasks, updateTask, updateTaskDependency } from '../../lib/tasks';
import { getTimeEntries } from '../../lib/time';
import { ProjectDetailFilters } from './ProjectDetailFilters';
import { GanttChart } from './GanttChart';
import { TaskPanel } from '../tasks/TaskPanel';
import type { Project, Task, TimeEntry } from '../../types/database';

interface GanttTask extends Task {
  children?: GanttTask[];
  level: number;
  totalHours: number;
  progress: number;
}

function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month'>('week');
  const [taskPanelVisible, setTaskPanelVisible] = useState(false);
  
  // Fetch project data first
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  });

  const [filters, setFilters] = useState({
    search: '', 
    companyId: '',
    projectId: projectId || '',
  });

  // Update filters when project data loads
  useEffect(() => {
    if (project) {
      setFilters(prev => ({
        ...prev,
        companyId: project.company_id,
        projectId: project.id
      }));
    }
  }, [project]);

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => getProjectTasks(projectId!),
    enabled: !!projectId
  });

  // Fetch time entries
  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery({
    queryKey: ['project-time-entries', projectId],
    queryFn: () => getTimeEntries(user!.id, user!.isAdmin, { project: projectId! }),
    enabled: !!projectId,
  });

  // Build task hierarchy
  const buildTaskHierarchy = (tasks: Task[]): GanttTask[] => {
    const taskMap = new Map<string, GanttTask>();
    const rootTasks: GanttTask[] = [];

    // First pass: Create GanttTask objects
    tasks.forEach(task => {
      const taskHours = timeEntries
        .filter(entry => entry.task_id === task.id)
        .reduce((sum, entry) => sum + entry.hours, 0);

      const progress = task.estimated_hours 
        ? Math.min(100, (taskHours / task.estimated_hours) * 100)
        : 0;

      taskMap.set(task.id, {
        ...task,
        level: 0,
        totalHours: taskHours,
        progress,
        children: [],
      });
    });

    // Second pass: Build hierarchy
    tasks.forEach(task => {
      const ganttTask = taskMap.get(task.id)!;
      if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
        const parent = taskMap.get(task.parent_task_id)!;
        ganttTask.level = parent.level + 1;
        parent.children?.push(ganttTask);
      } else {
        rootTasks.push(ganttTask);
      }
    });

    return rootTasks;
  };

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  const hierarchicalTasks = buildTaskHierarchy(filteredTasks);

  // Calculate project timeline
  const projectStart = project?.start_date ? new Date(project.start_date) : new Date();
  const projectEnd = project?.end_date ? new Date(project.end_date) : addDays(projectStart, 30);
  const totalDays = differenceInDays(projectEnd, projectStart) + 1;

  const handleTaskMove = async (taskId: string, newStartDate: Date) => {
    try {
      await updateTask(taskId, {
        start_date: format(newStartDate, 'yyyy-MM-dd'),
        due_date: format(addDays(newStartDate, 1), 'yyyy-MM-dd')
      });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const handleTaskResize = async (taskId: string, newStartDate: Date, newEndDate: Date) => {
    try {
      await updateTask(taskId, {
        start_date: format(newStartDate, 'yyyy-MM-dd'),
        due_date: format(newEndDate, 'yyyy-MM-dd')
      });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    } catch (err) {
      console.error('Failed to resize task:', err);
    }
  };

  const handleDependencyCreate = async (fromTaskId: string, toTaskId: string) => {
    try {
      await updateTaskDependency(toTaskId, fromTaskId);
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    } catch (err) {
      console.error('Failed to create dependency:', err);
    }
  };

  const handleTaskReorder = async (taskId: string, parentId: string | null, newOrder: number) => {
    try {
      await updateTaskParent(taskId, parentId, newOrder);
      // Invalidate and refetch to get updated task numbers and details
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      ]);
    } catch (err) {
      console.error('Failed to reorder task:', err);
    }
  };

  // Calculate time scale divisions
  const timeScaleDivisions = (() => {
    const divisions = [];
    let currentDate = projectStart;
    
    while (isBefore(currentDate, projectEnd) || currentDate.getTime() === projectEnd.getTime()) {
      divisions.push(currentDate);
      switch (timeScale) {
        case 'day':
          currentDate = addDays(currentDate, 1);
          break;
        case 'week':
          currentDate = addDays(currentDate, 7);
          break;
        case 'month':
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
          break;
      }
    }
    return divisions;
  })();

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getTaskWidth = (task: Task) => {
    const start = new Date(task.start_date || projectStart);
    const end = task.due_date ? new Date(task.due_date) : addDays(start, 1);
    return `${(differenceInDays(end, start) + 1) / totalDays * 100}%`;
  };

  const getTaskOffset = (task: Task) => {
    const start = new Date(task.start_date || projectStart);
    return `${differenceInDays(start, projectStart) / totalDays * 100}%`;
  };

  const getTaskColor = (task: Task) => {
    const taskHours = timeEntries
      .filter(entry => entry.task_id === task.id)
      .reduce((sum, entry) => sum + entry.hours, 0);
    
    const progress = task.estimated_hours 
      ? Math.min(100, (taskHours / task.estimated_hours) * 100)
      : 0;

    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const renderTask = (task: GanttTask, index: number) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children && task.children.length > 0;

    return (
      <React.Fragment key={task.id}>
        <tr
          className={`hover:bg-gray-50 ${task.level > 0 ? 'text-sm' : ''} ${
            selectedTask?.id === task.id ? 'bg-blue-50' : ''
          }`}
          onClick={() => user?.isAdmin && setSelectedTask(task)}
        >
          <td className="px-6 py-3 whitespace-nowrap" style={{ paddingLeft: `${task.level * 2 + 1.5}rem` }}>
            <div className="flex items-center">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}
                  className="mr-2 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
              )}
              <div>
                <div className="font-medium text-gray-900">{task.title}</div>
                {task.description && (
                  <div className="text-gray-500 text-sm truncate max-w-md">{task.description}</div>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-900">
              <Clock className="h-4 w-4 text-gray-400 mr-1" />
              {task.totalHours} / {task.estimated_hours || 0} hrs
            </div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-900">
              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
              {task.start_date ? format(new Date(task.start_date), 'MMM d') : '-'}
            </div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-900">
              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
              {task.due_date ? format(new Date(task.due_date), 'MMM d') : '-'}
            </div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${getTaskColor(task)}`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {Math.round(task.progress)}%
              </span>
            </div>
          </td>
        </tr>
        {isExpanded && task.children?.map((child, childIndex) => 
          renderTask(child, childIndex)
        )}
      </React.Fragment>
    );
  };

  if (projectLoading || tasksLoading || timeEntriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  // Handle task selection
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setTaskPanelVisible(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <Briefcase className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <Building2 className="h-4 w-4 mr-1" />
              {(project.company as any)?.name}
            </div>
          </div>
        </div>
        {user?.isAdmin && (
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Task
          </button>
        )}
      </div>

      <ProjectDetailFilters filters={filters} setFilters={setFilters} />
      
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Calendar className="h-4 w-4 mr-1" />
            Timeline
          </div>
          <div className="text-sm">
            <div>{format(projectStart, 'MMM d, yyyy')}</div>
            <div className="text-gray-500">to</div>
            <div>{format(projectEnd, 'MMM d, yyyy')}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <Clock className="h-4 w-4 mr-1" />
            Hours
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {timeEntries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} / {project.allocated_hours}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <CheckSquare className="h-4 w-4 mr-1" />
            Tasks
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Status
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {project.status}
          </div>
        </div>
      </div>

      <GanttChart
        tasks={filteredTasks}
        timeEntries={timeEntries}
        projectStart={projectStart}
        projectEnd={projectEnd}
        onTaskClick={handleTaskSelect}
        selectedTaskId={selectedTask?.id}
      />

      {(taskPanelVisible || showCreateTask) && (
        <TaskPanel
          task={selectedTask}
          isCreating={showCreateTask}
          projectId={project.id}
          onClose={() => {
            setSelectedTask(null);
            setTaskPanelVisible(false);
            setShowCreateTask(false);
            // Ensure we refetch both tasks and time entries
            Promise.all([
              queryClient.invalidateQueries({ queryKey: ['project-tasks'] }),
              queryClient.invalidateQueries({ queryKey: ['project-time-entries'] })
            ]);
          }}
          onUpdate={(updates) => {
            // Ensure we refetch both tasks and time entries
            Promise.all([
              queryClient.invalidateQueries({ queryKey: ['project-tasks'] }),
              queryClient.invalidateQueries({ queryKey: ['project-time-entries'] })
            ]);
          }}
        />
      )}
    </div>
  );
}

export { ProjectDetailPage };