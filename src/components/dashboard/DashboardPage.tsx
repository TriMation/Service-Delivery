import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { getTasks, getProjectTasks } from '../../lib/tasks';
import { getTimeEntries } from '../../lib/time';
import { getRequests } from '../../lib/requests';
import { getProjects } from '../../lib/projects';
import { format, startOfWeek, endOfWeek, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  AlertCircle,
  BarChart3,
  Briefcase,
  Plus,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectUtilization {
  projectName: string;
  hoursUsed: number;
  hoursAllocated: number;
  percentageUsed: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const sixMonthsAgo = subMonths(now, 6);

  // Fetch data based on user role
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks(user!.id, user!.isAdmin),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries', { dateRange: 'week' }],
    queryFn: () => getTimeEntries(user!.id, user!.isAdmin, {
      search: '', 
      dateRange: 'all', // Changed to 'all' to get all time entries for utilization
      project: '', 
      user: '', 
    }),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['requests'],
    queryFn: () => getRequests(user!.id, user!.isAdmin),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(user!.id, user!.isAdmin),
  });

  // Calculate project utilization
  const projectUtilization: ProjectUtilization[] = projects.map(project => {
    const projectTimeEntries = timeEntries.filter(entry => entry.project_id === project.id);
    const hoursUsed = projectTimeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
    const hoursAllocated = project.allocated_hours || 0;
    const percentageUsed = hoursAllocated > 0 ? (hoursUsed / hoursAllocated) * 100 : 0;

    return {
      projectName: project.name,
      hoursUsed,
      hoursAllocated,
      percentageUsed
    };
  });

  // Find projects nearing or exceeding allocation
  const criticalProjects = projectUtilization
    .filter(p => p.percentageUsed >= 80)
    .sort((a, b) => b.percentageUsed - a.percentageUsed)
    .filter(p => p.hoursAllocated > 0); // Only show projects with allocated hours

  // Calculate monthly hours trend
  const monthlyHours = eachMonthOfInterval({
    start: sixMonthsAgo,
    end: now
  }).map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });
    const totalHours = monthEntries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);

    return {
      month: format(month, 'MMM yyyy'),
      hours: totalHours
    };
  });


  // Calculate metrics
  const totalHoursThisWeek = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.due_date);
    return task.status !== 'completed' && dueDate < now;
  });

  // Role-specific quick actions
  const quickActions = [
    ...(user?.isAdmin ? [
      { label: 'New Project', icon: Plus, href: '/projects', color: 'bg-blue-500' },
      { label: 'Manage Users', icon: Plus, href: '/users', color: 'bg-purple-500' },
    ] : []),
    ...(user?.role === 'user' ? [
      { label: 'Log Time', icon: Plus, href: '/time', color: 'bg-green-500' },
      { label: 'View Tasks', icon: CheckSquare, href: '/tasks', color: 'bg-orange-500' },
    ] : []),
    ...(user?.role === 'client' ? [
      { label: 'New Request', icon: Plus, href: '/requests', color: 'bg-indigo-500' },
      { label: 'View Projects', icon: Briefcase, href: '/projects', color: 'bg-teal-500' },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <LayoutDashboard className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {user?.full_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Here's what's happening in your workspace
            </p>
          </div>
        </div>
      </div>

      {/* Project Utilization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Project Utilization</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {criticalProjects.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No projects are nearing their allocated hours.
              </div>
            ) : criticalProjects.map(project => (
              <div key={project.projectName} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    {project.percentageUsed >= 100 ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    )}
                    <span className="font-medium text-gray-900">{project.projectName}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {project.hoursUsed.toFixed(1)} / {project.hoursAllocated} hrs
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      project.percentageUsed >= 100
                        ? 'bg-red-500'
                        : project.percentageUsed >= 90
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(project.percentageUsed, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={`${action.color} p-4 rounded-lg text-white hover:opacity-90 transition-opacity`}
          >
            <action.icon className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/time"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hours This Week</p>
              <p className="text-2xl font-semibold text-gray-900">{totalHoursThisWeek.toFixed(1)}</p>
              <p className="text-xs text-gray-500">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/tasks"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <CheckSquare className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{overdueTasks.length}</p>
              <p className="text-xs text-gray-500">Require attention</p>
            </div>
          </div>
        </Link>

        <Link
          to="/requests"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingRequests}</p>
              <p className="text-xs text-gray-500">Awaiting response</p>
            </div>
          </div>
        </Link>

        <Link
          to="/projects"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{activeProjects}</p>
              <p className="text-xs text-gray-500">In progress</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Monthly Hours Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Monthly Hours Trend</h2>
        </div>
        <div className="p-6 pl-16 pr-8 pb-12">
          <div className="relative h-64">
            {(() => {
              const maxHours = Math.max(...monthlyHours.map(m => m.hours));
              const tickCount = 5;
              // Dynamic scale calculation
              const getAppropriateScale = (max: number): number => {
                if (max === 0) return 10; // Default scale when no data
                const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
                const normalized = max / magnitude;
                let scale = Math.ceil(normalized) * magnitude;
                
                // Add some padding to the scale
                scale += magnitude * 0.2;
                
                return scale;
              };
              const roundedMax = getAppropriateScale(maxHours);

              return (
                <>
                  {/* Y-axis ticks */}
                  {Array.from({ length: tickCount }, (_, i) => {
                    const value = (roundedMax * i) / (tickCount - 1);
                    return (
                      <div
                        key={`tick-${i}`}
                        className="absolute w-full"
                        style={{
                          bottom: `${(value / roundedMax) * 100}%`,
                          height: '1px'
                        }}
                      >
                        <div className="absolute -left-12 text-xs text-gray-500 w-10 text-right pr-2">
                          {Math.round(value)}
                        </div>
                        <div className="w-full border-t border-dotted border-gray-200" />
                      </div>
                    );
                  })}

                  {/* Base line and month labels container */}
                  <div className="absolute -bottom-6 w-full">
                    <div className="border-t border-gray-300 -mb-px" />
                    <div className="flex px-2 pt-2">
                      {monthlyHours.map((month) => (
                        <div key={`label-${month.month}`} className="flex-1 text-center text-xs text-gray-600">
                          {month.month}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end px-2">
                    {monthlyHours.map((month, index) => {
                      const heightPercentage = roundedMax > 0 ? (month.hours / roundedMax) * 100 : 0;
                      return (
                        <div
                          key={`bar-${month.month}`}
                          className="relative flex-1 mx-1 group h-full flex items-end"
                        >
                          <div 
                            className={`w-full rounded-t transition-all duration-300 group-hover:opacity-80 ${
                              index === monthlyHours.length - 1 ? 'bg-indigo-600' : 'bg-blue-500'
                            }`}
                            style={{ 
                              height: `${heightPercentage}%`,
                              minHeight: heightPercentage > 0 ? '2px' : '0',
                              maxHeight: '100%'
                            }}
                          >
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2">
                              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                {month.hours.toFixed(1)} hours
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {([...tasks, ...requests, ...timeEntries] as any[])
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map((item) => {
              const getItemDetails = (item: any) => {
                if ('title' in item) {
                  return {
                    link: '/requests',
                    Icon: MessageSquare,
                    title: item.title
                  };
                } else if ('description' in item && !('hours' in item)) {
                  return {
                    link: '/tasks',
                    Icon: CheckSquare,
                    title: item.description || 'No description'
                  };
                } else {
                  return {
                    link: '/time',
                    Icon: Clock,
                    title: `${item.hours} hours logged`
                  };
                }
              };

              const { link, Icon, title } = getItemDetails(item);

              return (
              <Link
                key={item.id}
                to={link}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(item.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}