import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Search, Plus, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { getSkills, createSkill, getSkillsMatrix, bulkUpdateSkillMatrix } from '../../lib/skills';
import { listUsers } from '../../lib/auth';
import type { Skill, User } from '../../types/database';

export function SkillsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [filters, setFilters] = useState({
    search: '',
  });
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  // Fetch all users and skills
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
  });

  const { data: skillMatrix = [] } = useQuery({
    queryKey: ['skills-matrix'],
    queryFn: getSkillsMatrix,
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    user.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      await createSkill(newSkillName.trim());
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setNewSkillName('');
      setShowAddSkill(false);
    } catch (err) {
      setError('Failed to add skill');
    }
  };

  const handleProficiencyChange = async (
    userId: string,
    skillId: string,
    level: 'none' | 'medium' | 'high'
  ) => {
    setSaving(true);
    try {
      await bulkUpdateSkillMatrix([{ userId, skillId, proficiencyLevel: level }]);
      queryClient.invalidateQueries({ queryKey: ['skills-matrix'] });
    } catch (err) {
      setError('Failed to update skill level');
    } finally {
      setSaving(false);
    }
  };

  const getProficiencyLevel = (userId: string, skillId: string) => {
    return skillMatrix.find(
      matrix => matrix.user_id === userId && matrix.skill_id === skillId
    )?.proficiency_level || 'none';
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Star className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Skills Matrix</h1>
        </div>
        <button
          onClick={() => setShowAddSkill(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Skill
        </button>
      </div>

      {showAddSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Skill</h3>
              <button
                onClick={() => setShowAddSkill(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSkill}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddSkill(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  Add Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search users..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                User
              </th>
              {skills.map((skill) => (
                <th key={skill.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {skill.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </td>
                {skills.map((skill) => {
                  const level = getProficiencyLevel(user.id, skill.id);
                  return (
                    <td key={skill.id} className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={level}
                        onChange={(e) => handleProficiencyChange(
                          user.id,
                          skill.id,
                          e.target.value as 'none' | 'medium' | 'high'
                        )}
                        disabled={saving}
                        className={`text-sm rounded-full px-3 py-1 font-medium ${getProficiencyColor(level)}`}
                      >
                        <option value="none">None</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}