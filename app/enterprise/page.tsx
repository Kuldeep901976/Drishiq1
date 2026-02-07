'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  created_at: string;
  organization_members: Array<{
    role: string;
    is_active: boolean;
  }>;
}

export default function EnterprisePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/organizations');
      const data = await response.json();
      
      if (data.success) {
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (name: string, slug: string, description?: string) => {
    try {
      const response = await fetch('/api/organization/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          description
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchOrganizations(); // Refresh organizations
      } else {
        alert(data.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enterprise Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your organizations and teams</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Organization
          </Button>
        </div>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organizations</h3>
            <p className="text-gray-600 mb-4">You're not a member of any organizations yet.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => {
            const userMembership = org.organization_members[0];
            return (
              <Card key={org.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{org.name}</span>
                    <Badge className={getStatusColor(org.status)}>
                      {org.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {org.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getRoleColor(userMembership?.role || 'member')}>
                        {userMembership?.role || 'member'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        /{org.slug}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Created {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                    </div>
                    
                    <div className="pt-2">
                      <Link href={`/enterprise/${org.id}`}>
                        <Button className="w-full">
                          Manage Organization
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create Organization</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('name') as string;
              const slug = formData.get('slug') as string;
              const description = formData.get('description') as string;
              createOrganization(name, slug, description);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Organization Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input 
                    type="text" 
                    name="slug" 
                    required 
                    pattern="[a-z0-9-]+"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="organization-slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <textarea 
                    name="description" 
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Describe your organization"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button type="submit" className="flex-1">Create Organization</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
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
