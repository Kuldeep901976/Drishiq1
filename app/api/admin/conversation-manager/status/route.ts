/**
 * API endpoint to get ConversationManager status
 * Links ConversationManager to Admin UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversationManagerStatus, getConfiguredStages, visualizeStageFlow } from '@/lib/conversation-manager-admin-integration';

export async function GET(request: NextRequest) {
  try {
    // Get ConversationManager stats
    const managerStatus = await getConversationManagerStatus();
    
    // Get configured stages
    const stages = await getConfiguredStages();
    
    // Visualize flow
    const flow = visualizeStageFlow(stages);

    return NextResponse.json({
      manager: managerStatus,
      stages: {
        total: stages.length,
        active: stages.filter(s => s.is_active).length,
        list: stages
      },
      flow: flow,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error getting ConversationManager status:', error);
    return NextResponse.json(
      { error: 'Failed to get status', details: error.message },
      { status: 500 }
    );
  }
}

