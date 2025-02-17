import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/auth/AuthProvider';
import { LoginForm } from './components/auth/LoginForm';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { ProjectDetailPage } from './components/projects/ProjectDetailPage';
import { ProjectDetailFilters } from './components/projects/ProjectDetailFilters';
import { ClientsPage } from './components/clients/ClientsPage';
import { TemplatesPage } from './components/templates/TemplatesPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { CostingsPage } from './components/users/CostingsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { TimeTrackingPage } from './components/time/TimeTrackingPage';
import { UsersPage } from './components/users/UsersPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { SkillsPage } from './components/users/SkillsPage';
import { TasksPage } from './components/tasks/TasksPage';
import { RequestsPage } from './components/requests/RequestsPage';
import { useAuth } from './components/auth/AuthProvider';
import { GanttChartPage } from './components/projects/GanttChartPage';
import { BarChart2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginForm />}
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TasksPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/time"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TimeTrackingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProjectsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <ProjectDetailPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gantt"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <GanttChartPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ClientsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RequestsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReportsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <UsersPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/costings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CostingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SkillsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <TemplatesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;