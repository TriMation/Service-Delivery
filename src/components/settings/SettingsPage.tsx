import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Upload, Mail, Save, FileText, Lock, Bell, Info } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getSystemSettings, updateSystemSettings, uploadSettingsImage, testEmailSettings } from '../../lib/settings';
import type { SystemSettings } from '../../types/database';

export function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSystemSettings,
  });
  const [activeTab, setActiveTab] = useState<string>('general');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [showShortcodes, setShowShortcodes] = useState(false);

  // Update formData when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const shortcodes = [
    { code: '{project_name}', description: 'Name of the project' },
    { code: '{company_name}', description: 'Name of the client company' },
    { code: '{date}', description: 'Current date (e.g., Jan 15, 2024)' },
    { code: '{page}', description: 'Current page number' },
    { code: '{pages}', description: 'Total number of pages' },
    { code: '{total_hours}', description: 'Total hours logged on the project' },
    { code: '{tasks_completed}', description: 'Number of completed tasks' },
    { code: '{tasks_total}', description: 'Total number of tasks' },
    { code: '{start_date}', description: 'Project start date' },
    { code: '{end_date}', description: 'Project end date (if set)' },
  ];

  const updateMutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(undefined), 3000);
    },
    onError: (error) => {
      setError('Failed to update settings');
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'pdf_header') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or GIF file');
      return;
    }

    // Validate file size and dimensions for PDF header
    if (type === 'pdf_header') {
      if (file.size > 500 * 1024) { // 500KB max for header
        setError('PDF header image must be less than 500KB');
        return;
      }

      // Check dimensions
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          if (img.width > 1000 || img.height > 200) {
            setError('PDF header image must be max 1000px wide and 200px tall');
            resolve(false);
          } 
          resolve(true);
        };
      });

      if (error) return; // Stop if dimension check failed
    } else {
      // Regular logo size limit
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        return;
      }
    }

    setLoading(true);
    try {
      const url = await uploadSettingsImage(file, type);
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'pdf_header_image']: url
      }));
      setSuccess('Image uploaded successfully');
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      const success = await testEmailSettings({
        host: formData.smtp_host!,
        port: formData.smtp_port!,
        username: formData.smtp_username!,
        password: formData.smtp_password!,
        from_email: formData.smtp_from_email!
      });
      
      if (success) {
        setSuccess('Email test successful!');
      } else {
        setError('Failed to send test email');
      }
    } catch (err) {
      setError('Failed to test email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'pdf', label: 'PDF Output', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.organization_name || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Logo
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {formData.logo_url && (
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="h-12 w-12 object-contain"
                    />
                  )}
                  <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={formData.primary_color || '#4f46e5'}
                  onChange={(e) =>
                    setFormData({ ...formData, primary_color: e.target.value })
                  }
                  className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  min="8"
                  max="32"
                  value={formData.password_min_length || 8}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password_min_length: parseInt(e.target.value)
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  value={formData.session_timeout || 30}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      session_timeout: parseInt(e.target.value)
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="two_factor_enabled"
                  checked={formData.two_factor_enabled || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      two_factor_enabled: e.target.checked
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="two_factor_enabled"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Enable Two-Factor Authentication
                </label>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Header Image
                  <span className="ml-2 text-sm text-gray-500">
                    (Max: 1000x200px, 500KB)
                  </span>
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {formData.pdf_header_image && (
                    <img
                      src={formData.pdf_header_image}
                      alt="PDF Header"
                      className="h-12 w-auto object-contain"
                    />
                  )}
                  <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Header Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'pdf_header')}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title Format
                  <button
                    type="button"
                    onClick={() => setShowShortcodes(!showShortcodes)}
                    className="ml-2 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    {showShortcodes ? 'Hide' : 'Show'} Shortcodes
                  </button>
                </label>
                <textarea
                  type="text"
                  value={formData.pdf_title_format || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, pdf_title_format: e.target.value })
                  }
                  placeholder="e.g., {project_name} - Project Report"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-24"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-medium text-gray-900">Available Shortcodes</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShortcodes(!showShortcodes)}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    {showShortcodes ? 'Hide' : 'Show'} Shortcodes
                  </button>
                </div>
                {showShortcodes && (
                  <div className="grid grid-cols-2 gap-4">
                    {shortcodes.map(({ code, description }) => (
                      <div key={code} className="flex items-start space-x-3 text-sm">
                        <code className="px-2 py-1 bg-gray-100 rounded text-gray-800">{code}</code>
                        <span className="text-gray-600">{description}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-4">
                  Use these shortcodes in the Title Format and Footer Text fields above to add dynamic content to your PDF reports.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Font Family
                  </label>
                  <select
                    value={formData.pdf_font_family || 'Roboto'}
                    onChange={(e) =>
                      setFormData({ ...formData, pdf_font_family: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="Roboto">Roboto</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times">Times New Roman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Body Font Size
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="16"
                    value={formData.pdf_font_size_body || 10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pdf_font_size_body: parseInt(e.target.value)
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Top Margin
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pdf_margin_top || 40}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pdf_margin_top: parseInt(e.target.value)
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bottom Margin
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pdf_margin_bottom || 40}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pdf_margin_bottom: parseInt(e.target.value)
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Left Margin
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pdf_margin_left || 40}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pdf_margin_left: parseInt(e.target.value)
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Right Margin
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pdf_margin_right || 40}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pdf_margin_right: parseInt(e.target.value)
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={formData.pdf_footer_text || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, pdf_footer_text: e.target.value })
                  }
                  placeholder="e.g., Page {page} of {pages} - Generated on {date}"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={formData.smtp_host || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, smtp_host: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={formData.smtp_port || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smtp_port: parseInt(e.target.value)
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={formData.smtp_username || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, smtp_username: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={formData.smtp_password || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, smtp_password: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  From Email Address
                </label>
                <input
                  type="email"
                  value={formData.smtp_from_email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, smtp_from_email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={loading || !formData.smtp_host}
                  className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Test Email Settings
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
              {success}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading || updateMutation.isPending}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}