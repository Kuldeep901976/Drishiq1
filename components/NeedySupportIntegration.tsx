'use client';

import { NeedySupportService } from '@/lib/needy-support-service';
import { useEffect, useState } from 'react';

interface NeedySupportIntegrationProps {
  invitationType: 'investment_management' | 'story' | 'testimonial';
  onInvitationSent?: (needyId: string, invitationId: string) => void;
}

interface NeedyIndividual {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  urgency_level: string;
  priority_score: number;
  available_credits: number;
  pending_requests: number;
}

export default function NeedySupportIntegration({ 
  invitationType, 
  onInvitationSent 
}: NeedySupportIntegrationProps) {
  const [needyIndividuals, setNeedyIndividuals] = useState<NeedyIndividual[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNeedy, setSelectedNeedy] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (showModal) {
      loadNeedyIndividuals();
    }
  }, [showModal, invitationType]);

  const loadNeedyIndividuals = async () => {
    setLoading(true);
    try {
      const result = await NeedySupportService.listNeedyIndividuals({
        preferred_invitation_types: [invitationType],
        status: 'active',
        limit: 50
      });

      // Get support summary for each needy individual
      const summary = await NeedySupportService.getNeedySupportSummary();
      const needyWithCredits = result.data.map(needy => {
        const summaryData = summary.data.find((s: any) => s.needy_id === needy.id);
        return {
          ...needy,
          available_credits: summaryData?.total_available_credits || 0,
          pending_requests: summaryData?.pending_requests || 0
        };
      });

      // Filter to only show individuals with available credits
      const eligibleNeedy = needyWithCredits.filter(needy => needy.available_credits > 0);
      setNeedyIndividuals(eligibleNeedy);
    } catch (error) {
      console.error('Error loading needy individuals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitations = async () => {
    if (selectedNeedy.length === 0) return;

    setProcessing(true);
    try {
      const results = await Promise.allSettled(
        selectedNeedy.map(async (needyId) => {
          // Create invitation request
          const request = await NeedySupportService.createInvitationRequest({
            needy_id: needyId,
            invitation_type: invitationType,
            requested_credits: 1,
            reason: `Admin-initiated ${invitationType} invitation`
          });

          // Process the request immediately
          const success = await NeedySupportService.processInvitationRequest(
            request.data.id,
            'Sent via admin interface'
          );

          return { needyId, success, requestId: request.data.id };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);

      if (successful.length > 0) {
        alert(`Successfully sent ${successful.length} invitations. ${failed.length} failed.`);
        setSelectedNeedy([]);
        setShowModal(false);
        loadNeedyIndividuals(); // Refresh the list
        
        // Notify parent component
        successful.forEach(result => {
          if (result.status === 'fulfilled' && onInvitationSent) {
            onInvitationSent(result.value.needyId, result.value.requestId);
          }
        });
      } else {
        alert('Failed to send any invitations. Please check if support credits are available.');
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Error sending invitations. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Send from Support Credits
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Send {invitationType.replace('_', ' ')} Invitations from Support Credits
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading eligible individuals...</p>
                </div>
              ) : needyIndividuals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No eligible individuals found with available support credits.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedNeedy.length === needyIndividuals.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNeedy(needyIndividuals.map(n => n.id));
                          } else {
                            setSelectedNeedy([]);
                          }
                        }}
                        className="rounded"
                      />
                      <span className="font-medium">Select All</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {selectedNeedy.length} of {needyIndividuals.length} selected
                    </span>
                  </div>

                  {needyIndividuals.map((needy) => (
                    <div
                      key={needy.id}
                      className={`p-4 border rounded-lg ${
                        selectedNeedy.includes(needy.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedNeedy.includes(needy.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedNeedy([...selectedNeedy, needy.id]);
                              } else {
                                setSelectedNeedy(selectedNeedy.filter(id => id !== needy.id));
                              }
                            }}
                            className="rounded"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{needy.full_name}</h3>
                            <p className="text-sm text-gray-600">{needy.email || needy.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(needy.urgency_level)}`}>
                            {needy.urgency_level}
                          </span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              {needy.available_credits} credits available
                            </div>
                            <div className="text-xs text-gray-500">
                              Priority: {needy.priority_score}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvitations}
                disabled={selectedNeedy.length === 0 || processing}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? 'Sending...' : `Send ${selectedNeedy.length} Invitation${selectedNeedy.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
