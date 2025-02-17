import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { LayoutDashboard, Briefcase, BookTemplate as FileTemplate, BarChart2, Building2, CheckSquare, Clock, DollarSign, BarChart3, Star, Users, UserCog, Settings, LogOut, ChevronLeft, ChevronRight, MessageSquare, MessagesSquare } from 'lucide-react';
import { signOut } from '../../lib/auth';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  roles: Array<'admin' | 'user' | 'client'>;
  divider?: boolean;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/', roles: ['admin', 'user', 'client'] },
  { label: 'Gantt', icon: <BarChart2 size={20} />, href: '/gantt', roles: ['admin', 'user'], divider: true },
  { label: 'Tasks', icon: <CheckSquare size={20} />, href: '/tasks', roles: ['admin'] },
  { label: 'Time Tracking', icon: <Clock size={20} />, href: '/time', roles: ['admin', 'user'] },
  { label: 'Requests', icon: <MessagesSquare size={20} />, href: '/requests', roles: ['admin', 'user', 'client'], divider: true },
  
  { label: 'Projects', icon: <Briefcase size={20} />, href: '/projects', roles: ['admin'] },
  { label: 'Clients', icon: <Building2 size={20} />, href: '/clients', roles: ['admin'] },
  { label: 'Reports', icon: <BarChart3 size={20} />, href: '/reports', roles: ['admin'], divider: true },
  { label: 'Templates', icon: <FileTemplate size={20} />, href: '/templates', roles: ['admin'] },
  
  { label: 'User Management', icon: <UserCog size={20} />, href: '/users', roles: ['admin'] },
  { label: 'Costings', icon: <DollarSign size={20} />, href: '/costings', roles: ['admin'] },
  { label: 'Skills Matrix', icon: <Star size={20} />, href: '/skills', roles: ['admin'] },
  { label: 'Settings', icon: <Settings size={20} />, href: '/settings', roles: ['admin'] },
  
  // User specific routes
  { label: 'My Tasks', icon: <CheckSquare size={20} />, href: '/my-tasks', roles: ['user'] },
  { label: 'My Projects', icon: <Briefcase size={20} />, href: '/my-projects', roles: ['user', 'client'] },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role as 'admin' | 'user' | 'client')
  );
  
  const isActiveRoute = (href: string) => {
    if (href === '/projects/:projectId') {
      return location.pathname.startsWith('/projects/') && location.pathname !== '/projects';
    }
    return location.pathname === href;
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div 
      className={`bg-white border-r border-gray-200 h-screen transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } fixed left-0 top-0 z-30`}
    >
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-4 border-b border-gray-200 relative">
          <h1 className={`font-bold text-xl text-gray-800 transition-opacity duration-300 ${
            collapsed ? 'opacity-0 w-0' : 'opacity-100'
          }`}>
            TriMation
          </h1>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            {collapsed ? (
              <ChevronRight size={20} className="text-gray-500" />
            ) : (
              <ChevronLeft size={20} className="text-gray-500" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item, index) => {
              const isActive = isActiveRoute(item.href);
              return (
                <li key={item.href} className={item.divider ? 'mb-4 pb-4 border-b border-gray-200' : ''}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span
                      className={`ml-3 transition-opacity duration-300 ${
                        collapsed ? 'opacity-0 w-0' : 'opacity-100'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                  {!collapsed && item.children && (
                    <ul className="mt-1 ml-8 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = isActiveRoute(child.href);
                        // Don't show "Project Details" in submenu
                        if (child.href === '/projects/:projectId') return null;
                        return (
                          <li key={child.href}>
                            <Link
                              to={child.href}
                              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                isChildActive
                                  ? 'bg-indigo-50 text-indigo-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex items-center justify-center">
                                {child.icon}
                              </span>
                              <span className="ml-3">{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span
              className={`ml-3 transition-opacity duration-300 ${
                collapsed ? 'opacity-0 w-0' : 'opacity-100'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}