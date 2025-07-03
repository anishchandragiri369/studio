'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Copy, UserPlus, Settings, Share2, CheckCircle } from 'lucide-react';

interface FamilyGroup {
  id: string;
  group_name: string;
  primary_user_id: string;
  invite_code: string;
  max_members: number;
  is_active: boolean;
  family_group_members: Array<{
    id: string;
    user_id: string;
    role: 'admin' | 'member';
    joined_at: string;
    permissions: {
      can_pause: boolean;
      can_modify_address: boolean;
      can_view_billing: boolean;
    };
  }>;
}

interface FamilySharingManagerProps {
  currentUserId: string;
}

export default function FamilySharingManager({ currentUserId }: FamilySharingManagerProps) {
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [createFormData, setCreateFormData] = useState({
    group_name: '',
    max_members: 6,
    allow_individual_deliveries: true
  });
  
  const [joinFormData, setJoinFormData] = useState({
    invite_code: ''
  });

  useEffect(() => {
    fetchFamilyGroup();
  }, [currentUserId]);

  const fetchFamilyGroup = async () => {
    try {
      const response = await fetch(`/api/family-groups?user_id=${currentUserId}`);
      const result = await response.json();
      
      if (response.ok && result.family_groups?.length > 0) {
        setFamilyGroup(result.family_groups[0]);
      }
    } catch (err) {
      console.error('Error fetching family group:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!createFormData.group_name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/family-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createFormData,
          primary_user_id: currentUserId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFamilyGroup(result.family_group);
        setShowCreateForm(false);
        setSuccess('Family group created successfully!');
        setCreateFormData({ group_name: '', max_members: 6, allow_individual_deliveries: true });
      } else {
        setError(result.error || 'Failed to create family group');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinFormData.invite_code.trim()) {
      setError('Invite code is required');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await fetch('/api/family-groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invite_code: joinFormData.invite_code.toUpperCase(),
          user_id: currentUserId
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFamilyGroup(result.family_group);
        setShowJoinForm(false);
        setSuccess('Successfully joined family group!');
        setJoinFormData({ invite_code: '' });
      } else {
        setError(result.error || 'Failed to join family group');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const copyInviteCode = async () => {
    if (familyGroup?.invite_code) {
      try {
        await navigator.clipboard.writeText(familyGroup.invite_code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = familyGroup.invite_code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const isPrimaryUser = familyGroup?.primary_user_id === currentUserId;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading family groups...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="mr-3" />
            Family Subscription Sharing
          </h1>
          <p className="mt-2 text-blue-100">
            Share subscriptions with family members and split costs
          </p>
        </div>

        <div className="p-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center text-green-800">
                <CheckCircle className="mr-2" size={20} />
                {success}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!familyGroup ? (
            // No Family Group - Show Create/Join Options
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Start Sharing with Family
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create a family group to share subscriptions and split costs, or join an existing family group.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <Plus className="mr-2" size={20} />
                  Create Family Group
                </button>
                
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                >
                  <UserPlus className="mr-2" size={20} />
                  Join Family Group
                </button>
              </div>
            </div>
          ) : (
            // Has Family Group - Show Group Details
            <div className="space-y-6">
              {/* Group Info */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{familyGroup.group_name}</h2>
                    <p className="text-gray-600">
                      {familyGroup.family_group_members?.length || 0} of {familyGroup.max_members} members
                    </p>
                  </div>
                  {isPrimaryUser && (
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <Settings size={20} />
                    </button>
                  )}
                </div>

                {/* Invite Code */}
                <div className="bg-white p-4 rounded border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Code
                  </label>
                  <div className="flex items-center space-x-3">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-lg">
                      {familyGroup.invite_code}
                    </code>
                    <button
                      onClick={copyInviteCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <Copy className="mr-1" size={16} />
                      {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Share this code with family members to invite them
                  </p>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Family Members</h3>
                <div className="space-y-3">
                  {familyGroup.family_group_members?.map((member) => (
                    <div key={member.id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">
                            Member {member.user_id === currentUserId ? '(You)' : ''}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.role === 'admin' ? 'Admin' : 'Member'} • 
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.permissions.can_pause && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              Can Pause
                            </span>
                          )}
                          {member.permissions.can_modify_address && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              Can Modify Address
                            </span>
                          )}
                          {member.permissions.can_view_billing && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              Can View Billing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 bg-white border rounded-lg hover:bg-gray-50 text-left">
                    <Share2 className="text-blue-500 mb-2" size={24} />
                    <h4 className="font-medium text-gray-800">Share Subscription</h4>
                    <p className="text-sm text-gray-600">Add a subscription to family sharing</p>
                  </button>
                  
                  <button className="p-4 bg-white border rounded-lg hover:bg-gray-50 text-left">
                    <Users className="text-green-500 mb-2" size={24} />
                    <h4 className="font-medium text-gray-800">Manage Members</h4>
                    <p className="text-sm text-gray-600">Update member permissions</p>
                  </button>
                  
                  <button className="p-4 bg-white border rounded-lg hover:bg-gray-50 text-left">
                    <Settings className="text-purple-500 mb-2" size={24} />
                    <h4 className="font-medium text-gray-800">Group Settings</h4>
                    <p className="text-sm text-gray-600">Configure sharing preferences</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Family Group Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Create Family Group</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={createFormData.group_name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, group_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Smith Family"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Members
                  </label>
                  <select
                    value={createFormData.max_members}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, max_members: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} members</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow_individual"
                    checked={createFormData.allow_individual_deliveries}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, allow_individual_deliveries: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_individual" className="ml-2 text-sm text-gray-700">
                    Allow individual delivery addresses
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Family Group Modal */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Join Family Group</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code *
                </label>
                <input
                  type="text"
                  value={joinFormData.invite_code}
                  onChange={(e) => setJoinFormData(prev => ({ ...prev, invite_code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="FAM12345678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the invite code shared by your family member
                </p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
