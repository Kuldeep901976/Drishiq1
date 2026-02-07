'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  max_users: number;
  max_credits: number;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  users: {
    id: string;
    email: string;
    name?: string;
  };
}

interface OrganizationInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface CreditPool {
  id: string;
  name: string;
  description?: string;
  total_credits: number;
  used_credits: number;
  available_credits: number;
  is_active: boolean;
}

interface OrganizationAnalytics {
  organization_id: string;
  organization_name: string;
  status: string;
  total_members: number;
  active_members: number;
  owners: number;
  admins: number;
  managers: number;
  members: number;
  viewers: number;
  total_credits: number;
  used_credits: number;
  available_credits: number;
  created_at: string;
  last_activity_at?: string;
}

export default function OrganizationDashboard({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [creditPools, setCreditPools] = useState<CreditPool[]>([]);
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (user && organizationId) {
      fetchData();
    }
  }, [user, organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch organization details
      const orgResponse = await fetch(`/api/organization/${organizationId}`);
      const orgData = await orgResponse.json();
      if (orgData.success) {
        setOrganization(orgData.organization);
      }
      
      // Fetch members
      const membersResponse = await fetch(`/api/organization/${organizationId}/members`);
      const membersData = await membersResponse.json();
      if (membersData.success) {
        setMembers(membersData.members);
      }
      
      // Fetch invitations
      const invitationsResponse = await fetch(`/api/organization/${organizationId}/invitations`);
      const invitationsData = await invitationsResponse.json();
      if (invitationsData.success) {
        setInvitations(invitationsData.invitations);
      }
      
      // Fetch credit pools
      const creditsResponse = await fetch(`/api/organization/${organizationId}/credits`);
      const creditsData = await creditsResponse.json();
      if (creditsData.success) {
        setCreditPools(creditsData.credit_pools);
      }
      
      // Fetch analytics
      const analyticsResponse = await fetch(`/api/organization/${organizationId}/analytics`);
      const analyticsData = await analyticsResponse.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (email: string, role: string, message?: string) => {
    try {
      const response = await fetch(`/api/organization/${organizationId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
          message
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setShowInviteModal(false);
        fetchData(); // Refresh data
      } else {
        alert(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation');
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organization/${organizationId}/members`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: memberId,
          action: 'update_role',
          role: newRole
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
      } else {
        alert(data.error || 'Failed to update member role');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role');
    }
  };

  const createCreditPool = async (name: string, description: string, totalCredits: number) => {
    try {
      const response = await fetch(`/api/organization/${organizationId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_pool',
          name,
          description,
          total_credits: totalCredits
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreditModal(false);
        fetchData(); // Refresh data
      } else {
        alert(data.error || 'Failed to create credit pool');
      }
    } catch (error) {
      console.error('Error creating credit pool:', error);
      alert('Failed to create credit pool');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-blue-500';
      case 'suspended': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-orange-500';
      case 'member': return 'bg-blue-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Organization not found</h2>
        <p className="text-gray-600 mt-2">The organization you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600 mt-1">{organization.description || 'No description'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(organization.status)}>
              {organization.status}
            </Badge>
            <Badge variant="outline">
              {organization.slug}
            </Badge>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{analytics.active_members}</div>
              <div className="text-sm text-gray-600">Active Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{analytics.available_credits}</div>
              <div className="text-sm text-gray-600">Available Credits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">{analytics.used_credits}</div>
              <div className="text-sm text-gray-600">Used Credits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{invitations.filter(i => i.status === 'pending').length}</div>
              <div className="text-sm text-gray-600">Pending Invitations</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {['overview', 'members', 'invitations', 'credits', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Created:</span> {formatDistanceToNow(new Date(organization.created_at), { addSuffix: true })}</div>
                    <div><span className="font-medium">Status:</span> {organization.status}</div>
                    <div><span className="font-medium">Max Users:</span> {organization.max_users}</div>
                    <div><span className="font-medium">Max Credits:</span> {organization.max_credits}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <div className="text-sm text-gray-600">
                    {analytics?.last_activity_at 
                      ? `Last activity ${formatDistanceToNow(new Date(analytics.last_activity_at), { addSuffix: true })}`
                      : 'No recent activity'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Organization Members</h2>
            <Button onClick={() => setShowInviteModal(true)}>
              Invite Member
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.users.name || member.users.email}
                            </div>
                            <div className="text-sm text-gray-500">{member.users.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={member.is_active ? 'default' : 'secondary'}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select 
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Pending Invitations</h2>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invitation.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getRoleColor(invitation.role)}>
                            {invitation.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={invitation.status === 'pending' ? 'default' : 'secondary'}>
                            {invitation.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {invitation.status === 'pending' && (
                            <Button size="sm" variant="outline">
                              Resend
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Credit Pools</h2>
            <Button onClick={() => setShowCreditModal(true)}>
              Create Credit Pool
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditPools.map((pool) => (
              <Card key={pool.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pool.name}</span>
                    <Badge variant={pool.is_active ? 'default' : 'secondary'}>
                      {pool.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{pool.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Credits:</span>
                      <span className="font-semibold">{pool.total_credits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Used Credits:</span>
                      <span className="font-semibold">{pool.used_credits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available:</span>
                      <span className="font-semibold text-green-600">{pool.available_credits}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                Organization settings management would be implemented here...
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Invite Member</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const email = formData.get('email') as string;
              const role = formData.get('role') as string;
              const message = formData.get('message') as string;
              inviteUser(email, role, message);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select name="role" required className="w-full px-3 py-2 border rounded-md">
                    <option value="">Select a role</option>
                    <option value="viewer">Viewer</option>
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message (Optional)</label>
                  <textarea 
                    name="message" 
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Personal message to include with the invitation"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button type="submit" className="flex-1">Send Invitation</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Pool Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create Credit Pool</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              const totalCredits = parseInt(formData.get('total_credits') as string);
              createCreditPool(name, description, totalCredits);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pool Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter pool name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    name="description" 
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Describe the purpose of this credit pool"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Credits</label>
                  <input 
                    type="number" 
                    name="total_credits" 
                    required 
                    min="1"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter total credits"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button type="submit" className="flex-1">Create Pool</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreditModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
