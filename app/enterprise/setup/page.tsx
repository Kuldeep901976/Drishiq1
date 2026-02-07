'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function EnterpriseSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    billingEmail: '',
    ownerEmail: '',
    ownerFirstName: '',
    ownerLastName: '',
    industry: '',
    companySize: 'small',
    subscriptionTier: 'professional'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSlug = (companyName: string) => {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const companyName = e.target.value;
    setFormData(prev => ({
      ...prev,
      companyName,
      companySlug: generateSlug(companyName)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Create company with default setup
      const { data, error } = await (supabase as any).rpc('create_company_with_defaults', {
        p_company_name: formData.companyName,
        p_company_slug: formData.companySlug,
        p_billing_email: formData.billingEmail,
        p_owner_email: formData.ownerEmail,
        p_owner_first_name: formData.ownerFirstName,
        p_owner_last_name: formData.ownerLastName
      });

      if (error) {
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Company created successfully! Redirecting to admin setup...');
        setTimeout(() => {
          router.push(`/enterprise/${formData.companySlug}/admin/setup`);
        }, 2000);
      }
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Set Up Your Company
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your enterprise account and admin hierarchy
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleCompanyNameChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label htmlFor="companySlug" className="block text-sm font-medium text-gray-700">
                  Company URL Slug *
                </label>
                <input
                  id="companySlug"
                  name="companySlug"
                  type="text"
                  required
                  value={formData.companySlug}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="acme-corporation"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will be your company URL: /enterprise/{formData.companySlug}
                </p>
              </div>

              <div>
                <label htmlFor="billingEmail" className="block text-sm font-medium text-gray-700">
                  Billing Email *
                </label>
                <input
                  id="billingEmail"
                  name="billingEmail"
                  type="email"
                  required
                  value={formData.billingEmail}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="billing@acme.com"
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                  Company Size
                </label>
                <select
                  id="companySize"
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="startup">Startup (1-10 employees)</option>
                  <option value="small">Small (11-50 employees)</option>
                  <option value="medium">Medium (51-200 employees)</option>
                  <option value="large">Large (201-1000 employees)</option>
                  <option value="enterprise">Enterprise (1000+ employees)</option>
                </select>
              </div>
            </div>

            {/* Owner Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Company Owner</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ownerFirstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    id="ownerFirstName"
                    name="ownerFirstName"
                    type="text"
                    required
                    value={formData.ownerFirstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="ownerLastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    id="ownerLastName"
                    name="ownerLastName"
                    type="text"
                    required
                    value={formData.ownerLastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700">
                  Owner Email *
                </label>
                <input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  required
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john.doe@acme.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will be the primary admin account for your company
                </p>
              </div>
            </div>

            {/* Subscription */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Subscription Plan</h3>
              
              <div>
                <label htmlFor="subscriptionTier" className="block text-sm font-medium text-gray-700">
                  Plan
                </label>
                <select
                  id="subscriptionTier"
                  name="subscriptionTier"
                  value={formData.subscriptionTier}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="basic">Basic - $29/month (up to 10 users)</option>
                  <option value="professional">Professional - $99/month (up to 50 users)</option>
                  <option value="enterprise">Enterprise - $299/month (up to 200 users)</option>
                  <option value="custom">Custom - Contact sales</option>
                </select>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-md ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating Company...' : 'Create Company'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
