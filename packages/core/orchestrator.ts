// Orchestrator - Stage machine and slot coverage management

import { 
  ThreadStage, 
  SlotLedger, 
  SlotDefinition, 
  StageTransition, 
  OrchestratorConfig,
  UserResponse,
  DomainOfLife,
  ValidationError,
  InspectorResult,
  ValidationResult
} from '../contracts/types';

// Default slot definitions for each domain of life
export const DEFAULT_SLOT_DEFINITIONS: Record<DomainOfLife, SlotDefinition[]> = {
  'career': [
    { id: 'domainOfLife', name: 'Domain of Life', type: 'string', required: true },
    { id: 'goal', name: 'Career Goal', type: 'string', required: true },
    { id: 'timeframe', name: 'Timeframe', type: 'string', required: true },
    { id: 'availability', name: 'Availability', type: 'string', required: true },
    { id: 'resources', name: 'Resources', type: 'string', required: true },
    { id: 'constraints', name: 'Constraints', type: 'string', required: true },
    { id: 'language', name: 'Language', type: 'string', required: true },
    { id: 'experience', name: 'Experience Level', type: 'string', required: false },
    { id: 'industry', name: 'Industry', type: 'string', required: false },
    { id: 'location', name: 'Location', type: 'string', required: false }
  ],
  'relationships': [
    { id: 'domainOfLife', name: 'Domain of Life', type: 'string', required: true },
    { id: 'goal', name: 'Relationship Goal', type: 'string', required: true },
    { id: 'timeframe', name: 'Timeframe', type: 'string', required: true },
    { id: 'availability', name: 'Availability', type: 'string', required: true },
    { id: 'resources', name: 'Resources', type: 'string', required: true },
    { id: 'constraints', name: 'Constraints', type: 'string', required: true },
    { id: 'language', name: 'Language', type: 'string', required: true },
    { id: 'relationshipType', name: 'Relationship Type', type: 'string', required: false },
    { id: 'currentStatus', name: 'Current Status', type: 'string', required: false }
  ],
  'health': [
    { id: 'domainOfLife', name: 'Domain of Life', type: 'string', required: true },
    { id: 'goal', name: 'Health Goal', type: 'string', required: true },
    { id: 'timeframe', name: 'Timeframe', type: 'string', required: true },
    { id: 'availability', name: 'Availability', type: 'string', required: true },
    { id: 'resources', name: 'Resources', type: 'string', required: true },
    { id: 'constraints', name: 'Constraints', type: 'string', required: true },
    { id: 'language', name: 'Language', type: 'string', required: true },
    { id: 'currentHealth', name: 'Current Health Status', type: 'string', required: false },
    { id: 'medicalHistory', name: 'Medical History', type: 'string', required: false }
  ],
  'finance': [
    { id: 'domainOfLife', name: 'Domain of Life', type: 'string', required: true },
    { id: 'goal', name: 'Financial Goal', type: 'string', required: true },
    { id: 'timeframe', name: 'Timeframe', type: 'string', required: true },
    { id: 'availability', name: 'Availability', type: 'string', required: true },
    { id: 'resources', name: 'Resources', type: 'string', required: true },
    { id: 'constraints', name: 'Constraints', type: 'string', required: true },
    { id: 'language', name: 'Language', type: 'string', required: true },
    { id: 'currentIncome', name: 'Current Income', type: 'string', required: false },
    { id: 'debtLevel', name: 'Debt Level', type: 'string', required: false }
  ],
  'education': [
    { id: 'domainOfLife', name: 'Domain of Life', type: 'string', required: true },
    { id: 'goal', name: 'Educational Goal', type: 'string', required: true },
    { id: 'timeframe', name: 'Timeframe', type: 'string', required: true },
    { id: 'availability', name: 'Availability', type: 'string', required: true },
    { id: 'resources', name: 'Resources', type: 'string', required: true },
    { id: 'constraints', name: 'Constraints', type: 'string', required: true },
    { id: 'language', name: 'Language', type: 'string', required: true },
    { id: 'currentLevel', name: 'Current Education Level', type: 'string', required: false },
    { id: 'subject', name: 'Subject Area', type: 'string', required: false }
  ],
  'personal-growth': [
    { id: 'domainOfLife', name: 'Domain of Life', type: 'string', required: true },
    { id: 'goal', name: 'Personal Growth Goal', type: 'string', required: true },
    { id: 'timeframe', name: 'Timeframe', type: 'string', required: true },
    { id: 'availability', name: 'Availability', type: 'string', required: true },
    { id: 'resources', name: 'Resources', type: 'string', required: true },
    { id: 'constraints', name: 'Constraints', type: 'string', required: true },
    { id: 'language', name: 'Language', type: 'string', required: true },
    { id: 'currentSkills', name: 'Current Skills', type: 'string', required: false },
    { id: 'growthArea', name: 'Growth Area', type: 'string', required: false }
  ],
  'family': [
    { id: 'domainOfLife', name: 'Domain of Life', type: 'string', required: true },
    { id: 'goal', name: 'Family Goal', type: 'string', required: true },
    { id: 'timeframe', name: 'Timeframe', type: 'string', required: true },
    { id: 'availability', name: 'Availability', type: 'string', required: true },
    { id: 'resources', name: 'Resources', type: 'string', required: true },
    { id: 'constraints', name: 'Constraints', type: 'string', required: true },
    { id: 'language', name: 'Language', type: 'string', required: true },
    { id: 'familySize', name: 'Family Size', type: 'string', required: false },
    { id: 'familyType', name: 'Family Type', type: 'string', required: false }
  ],
  'hobbies': [
    { id: 'domainOfLife', name: 'Domain of Life', type: 'string', required: true },
    { id: 'goal', name: 'Hobby Goal', type: 'string', required: true },
    { id: 'timeframe', name: 'Timeframe', type: 'string', required: true },
    { id: 'availability', name: 'Availability', type: 'string', required: true },
    { id: 'resources', name: 'Resources', type: 'string', required: true },
    { id: 'constraints', name: 'Constraints', type: 'string', required: true },
    { id: 'language', name: 'Language', type: 'string', required: true },
    { id: 'hobbyType', name: 'Hobby Type', type: 'string', required: false },
    { id: 'skillLevel', name: 'Skill Level', type: 'string', required: false }
  ]
};

// Default orchestrator configuration
export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  stageThresholds: {
    discoverCoverageThreshold: 0.8, // 80%
    maxQuestionsPerTurn: 4
  },
  requiredSlots: {
    'career': ['domainOfLife', 'goal', 'timeframe', 'availability', 'resources', 'constraints', 'language'],
    'relationships': ['domainOfLife', 'goal', 'timeframe', 'availability', 'resources', 'constraints', 'language'],
    'health': ['domainOfLife', 'goal', 'timeframe', 'availability', 'resources', 'constraints', 'language'],
    'finance': ['domainOfLife', 'goal', 'timeframe', 'availability', 'resources', 'constraints', 'language'],
    'education': ['domainOfLife', 'goal', 'timeframe', 'availability', 'resources', 'constraints', 'language'],
    'personal-growth': ['domainOfLife', 'goal', 'timeframe', 'availability', 'resources', 'constraints', 'language'],
    'family': ['domainOfLife', 'goal', 'timeframe', 'availability', 'resources', 'constraints', 'language'],
    'hobbies': ['domainOfLife', 'goal', 'timeframe', 'availability', 'resources', 'constraints', 'language']
  },
  evidenceMode: {
    'career': true,
    'relationships': false,
    'health': true,
    'finance': true,
    'education': true,
    'personal-growth': false,
    'family': false,
    'hobbies': false
  },
  maxRetries: 3,
  fallbackOrder: ['openai', 'anthropic', 'grok'],
  timeBudgets: {
    'openai': 30000,
    'anthropic': 30000,
    'grok': 30000
  }
};

// Stage transition definitions
export const STAGE_TRANSITIONS: StageTransition[] = [
  {
    from: 'DISCOVER',
    to: 'MIRROR',
    condition: (ledger, responses) => {
      const requiredSlots = DEFAULT_ORCHESTRATOR_CONFIG.requiredSlots['personal-growth']; // Default domain
      const knownRequired = requiredSlots.filter(slot => ledger.known.has(slot));
      const coverage = knownRequired.length / requiredSlots.length;
      return coverage >= DEFAULT_ORCHESTRATOR_CONFIG.stageThresholds.discoverCoverageThreshold && ledger.conflicts.size === 0;
    },
    description: 'Move to MIRROR when 80% of required slots are known and no conflicts'
  },
  {
    from: 'MIRROR',
    to: 'OPTIONS',
    condition: (ledger, responses) => {
      const lastResponse = responses[responses.length - 1];
      return lastResponse && lastResponse.selected.includes('Yes');
    },
    description: 'Move to OPTIONS when user confirms understanding'
  },
  {
    from: 'MIRROR',
    to: 'DISCOVER',
    condition: (ledger, responses) => {
      const lastResponse = responses[responses.length - 1];
      return lastResponse && lastResponse.selected.includes('No');
    },
    description: 'Fallback to DISCOVER when user rejects understanding'
  },
  {
    from: 'OPTIONS',
    to: 'PLAN',
    condition: (ledger, responses) => {
      const lastResponse = responses[responses.length - 1];
      return lastResponse && lastResponse.selected.length > 0;
    },
    description: 'Move to PLAN when at least one option is chosen'
  },
  {
    from: 'PLAN',
    to: 'HANDOFF',
    condition: (ledger, responses) => {
      const requiredSlots = DEFAULT_ORCHESTRATOR_CONFIG.requiredSlots['personal-growth'];
      const knownRequired = requiredSlots.filter(slot => ledger.known.has(slot));
      const coverage = knownRequired.length / requiredSlots.length;
      return coverage >= 1.0 && ledger.conflicts.size === 0;
    },
    description: 'Move to HANDOFF when all required slots are complete and valid'
  }
];

// Slot Ledger Manager
export class SlotLedgerManager {
  private ledgers: Map<string, SlotLedger> = new Map();

  createLedger(threadId: string): SlotLedger {
    const ledger: SlotLedger = {
      threadId,
      known: new Map(),
      unknown: new Set(),
      conflicts: new Map(),
      lastUpdated: new Date()
    };
    this.ledgers.set(threadId, ledger);
    return ledger;
  }

  getLedger(threadId: string): SlotLedger | undefined {
    return this.ledgers.get(threadId);
  }

  updateSlot(threadId: string, slotId: string, value: any): void {
    const ledger = this.ledgers.get(threadId);
    if (!ledger) return;

    // Remove from unknown if it was there
    ledger.unknown.delete(slotId);
    
    // Check for conflicts
    this.checkConflicts(ledger, slotId, value);
    
    // Update known slots
    ledger.known.set(slotId, value);
    ledger.lastUpdated = new Date();
  }

  markSlotUnknown(threadId: string, slotId: string): void {
    const ledger = this.ledgers.get(threadId);
    if (!ledger) return;

    ledger.unknown.add(slotId);
    ledger.lastUpdated = new Date();
  }

  getCoverage(threadId: string, domainOfLife: DomainOfLife): number {
    const ledger = this.ledgers.get(threadId);
    if (!ledger) return 0;

    const requiredSlots = DEFAULT_ORCHESTRATOR_CONFIG.requiredSlots[domainOfLife];
    const knownRequired = requiredSlots.filter(slot => ledger.known.has(slot));
    return knownRequired.length / requiredSlots.length;
  }

  getUnknownSlots(threadId: string, domainOfLife: DomainOfLife): string[] {
    const ledger = this.ledgers.get(threadId);
    if (!ledger) return [];

    const requiredSlots = DEFAULT_ORCHESTRATOR_CONFIG.requiredSlots[domainOfLife];
    return requiredSlots.filter(slot => !ledger.known.has(slot));
  }

  getConflicts(threadId: string): Map<string, string[]> {
    const ledger = this.ledgers.get(threadId);
    return ledger ? ledger.conflicts : new Map();
  }

  private checkConflicts(ledger: SlotLedger, slotId: string, value: any): void {
    // Simple conflict detection rules
    if (slotId === 'timeframe' && typeof value === 'string') {
      if (value.includes('2 hours/day') && ledger.known.get('availability')?.includes('no time weekdays')) {
        ledger.conflicts.set('timeframe', ['availability']);
      }
    }
    
    if (slotId === 'availability' && typeof value === 'string') {
      if (value.includes('no time weekdays') && ledger.known.get('timeframe')?.includes('2 hours/day')) {
        ledger.conflicts.set('availability', ['timeframe']);
      }
    }
  }

  clearConflicts(threadId: string): void {
    const ledger = this.ledgers.get(threadId);
    if (ledger) {
      ledger.conflicts.clear();
      ledger.lastUpdated = new Date();
    }
  }
}

// Stage Machine Manager
export class StageMachineManager {
  private currentStages: Map<string, ThreadStage> = new Map();
  private slotLedgerManager: SlotLedgerManager;

  constructor(slotLedgerManager: SlotLedgerManager) {
    this.slotLedgerManager = slotLedgerManager;
  }

  getCurrentStage(threadId: string): ThreadStage {
    return this.currentStages.get(threadId) || 'DISCOVER';
  }

  setStage(threadId: string, stage: ThreadStage): void {
    this.currentStages.set(threadId, stage);
  }

  canTransition(threadId: string, from: ThreadStage, to: ThreadStage, responses: UserResponse[]): boolean {
    const transition = STAGE_TRANSITIONS.find(t => t.from === from && t.to === to);
    if (!transition) return false;

    const ledger = this.slotLedgerManager.getLedger(threadId);
    if (!ledger) return false;

    return transition.condition(ledger, responses);
  }

  getNextStage(threadId: string, responses: UserResponse[]): ThreadStage | null {
    const currentStage = this.getCurrentStage(threadId);
    
    for (const transition of STAGE_TRANSITIONS) {
      if (transition.from === currentStage && this.canTransition(threadId, currentStage, transition.to, responses)) {
        return transition.to;
      }
    }
    
    return null;
  }

  transitionToNextStage(threadId: string, responses: UserResponse[]): ThreadStage {
    const nextStage = this.getNextStage(threadId, responses);
    if (nextStage) {
      this.setStage(threadId, nextStage);
      return nextStage;
    }
    return this.getCurrentStage(threadId);
  }

  getStagePrompt(threadId: string, domainOfLife: DomainOfLife): string {
    const currentStage = this.getCurrentStage(threadId);
    const ledger = this.slotLedgerManager.getLedger(threadId);
    
    switch (currentStage) {
      case 'DISCOVER':
        const unknownSlots = this.slotLedgerManager.getUnknownSlots(threadId, domainOfLife);
        return `You are in DISCOVER stage. Ask questions to gather information about: ${unknownSlots.join(', ')}. Focus on understanding the user's core intent and constraints. Ask ≤4 questions per turn.`;
      
      case 'MIRROR':
        const knownSlots = Array.from(ledger?.known.entries() || []);
        return `You are in MIRROR stage. Reflect back what you understand about: ${knownSlots.map(([k, v]) => `${k}: ${v}`).join(', ')}. Ask a single Yes/No question to confirm understanding.`;
      
      case 'OPTIONS':
        return `You are in OPTIONS stage. Offer 2-4 actionable pathways based on what you've learned. Use multi-select questions. Include examples only if needed.`;
      
      case 'PLAN':
        const remainingSlots = this.slotLedgerManager.getUnknownSlots(threadId, domainOfLife);
        return `You are in PLAN stage. Create a detailed plan. Fill remaining slots: ${remainingSlots.join(', ')}. Ask ≤4 targeted questions per turn.`;
      
      case 'HANDOFF':
        return `You are in HANDOFF stage. Finalize the plan and provide next steps. Use <CODE>DONE</CODE> and <STRUCT>REPORT</STRUCT> or <STRUCT>SCHEDULE</STRUCT>.`;
      
      default:
        return `You are in ${currentStage} stage. Continue the conversation appropriately.`;
    }
  }
}

