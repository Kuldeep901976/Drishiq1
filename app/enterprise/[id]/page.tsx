import OrganizationDashboard from '@/components/OrganizationDashboard';
import { Metadata } from 'next';

interface PageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Organization Management - DrishiQ',
  description: 'Manage your organization members, invitations, and credit pools',
};

export default function OrganizationPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationDashboard organizationId={params.id} />
    </div>
  );
} 