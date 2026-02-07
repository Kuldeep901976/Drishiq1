'use client';

import {
    Alert,
    Badge,
    Button,
    Card,
    CardBody,
    Container,
    Input,
    LoadingSpinner,
    Section,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow
} from '@/components/ui/DrishiqUI';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  action_type: string;
  table_name: string;
  record_id: string;
  admin_email: string;
  old_data: any;
  new_data: any;
  action_details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [durationFilter, setDurationFilter] = useState<string>('7d');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [durationFilter, actionFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        duration: durationFilter,
        action: actionFilter,
        search: searchTerm
      });
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAuditLogs(data.auditLogs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAlert({ type: 'error', message: 'Failed to fetch audit logs' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAuditLogs();
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'create': return 'success';
      case 'update': return 'warning';
      case 'delete': return 'error';
      case 'approve': return 'info';
      case 'restore': return 'success';
      default: return 'info';
    }
  };

  const formatActionDetails = (details: any) => {
    if (!details) return 'No details';
    
    if (typeof details === 'string') {
      return details;
    }
    
    if (details.bulk_operation) {
      return `Bulk operation on ${details.request_ids?.length || 0} items`;
    }
    
    return JSON.stringify(details, null, 2);
  };

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case '1d': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 7 Days';
    }
  };

  if (loading) {
    return (
      <Container>
        <Section>
          <LoadingSpinner />
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0B4422] mb-2">Audit Logs</h1>
            <p className="text-gray-600">Track all administrative actions and changes</p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="secondary">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Alert */}
        {alert && (
          <Alert 
            variant={alert.type} 
            onClose={() => setAlert(null)}
            className="drishiq-mb-lg"
          >
            {alert.message}
          </Alert>
        )}

        {/* Filters */}
        <Card className="drishiq-mb-lg">
          <CardBody>
            <div className="drishiq-flex gap-6 flex-wrap items-end">
              <div className="flex-1 min-w-80">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <Input
                  placeholder="Search by admin email, action type, or table name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="w-56">
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <Select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  options={[
                    { value: '1d', label: 'Last 24 Hours' },
                    { value: '7d', label: 'Last 7 Days' },
                    { value: '30d', label: 'Last 30 Days' },
                    { value: '90d', label: 'Last 90 Days' },
                    { value: '1y', label: 'Last Year' }
                  ]}
                />
              </div>
              <div className="w-56">
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                <Select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Actions' },
                    { value: 'create', label: 'Create' },
                    { value: 'update', label: 'Update' },
                    { value: 'delete', label: 'Delete' },
                    { value: 'approve', label: 'Approve' },
                    { value: 'restore', label: 'Restore' }
                  ]}
                />
              </div>
              <Button onClick={handleSearch} variant="primary">
                Search
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Timestamp</TableCell>
                <TableCell header>Action</TableCell>
                <TableCell header>Admin</TableCell>
                <TableCell header>Table</TableCell>
                <TableCell header>Record ID</TableCell>
                <TableCell header>Details</TableCell>
                <TableCell header>IP Address</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No audit logs found for the selected criteria
                  </td>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action_type)}>
                        {log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{log.admin_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{log.table_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 font-mono">{log.record_id}</div>
                    </TableCell>
                                      <TableCell>
                    <div className="max-w-lg">
                      <div className="text-sm text-gray-900">
                        {formatActionDetails(log.action_details)}
                      </div>
                      {log.old_data && log.new_data && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">
                            View Changes
                          </summary>
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                            <div className="mb-1">
                              <strong>Old:</strong> {JSON.stringify(log.old_data, null, 2)}
                            </div>
                            <div>
                              <strong>New:</strong> {JSON.stringify(log.new_data, null, 2)}
                            </div>
                          </div>
                        </details>
                      )}
                    </div>
                  </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">{log.ip_address || 'N/A'}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </Section>
    </Container>
  );
} 
