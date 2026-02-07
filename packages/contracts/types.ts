// Shared types and contracts for ChatModule system

export type Lang = 'en' | 'hi' | 'bn' | 'es' | 'pt' | 'ar' | 'de' | 'fr' | 'ja' | 'ru' | 'ta' | 'zh';

export type UserType = 'student' | 'professional' | 'parent' | 'senior' | 'other';

export type AgeBand = 'child' | 'teen' | 'adult' | 'senior';

export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

export type DomainOfLife = 'career' | 'relationships' | 'health' | 'finance' | 'education' | 'personal-growth' | 'family' | 'hobbies';

export type ProviderType = 'openai' | 'anthropic' | 'grok';

export type ModelType = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'claude-3.5' | 'grok-1';

export type FlowState = 'OK' | 'DELAY' | 'LIMIT_X' | 'DONE';

export type StructIntent = 'NONE' | 'REPORT' | 'SCHEDULE';

export type QuestionType = 'single' | 'multi';

export type ThreadStage = 'DISCOVER' | 'MIRROR' | 'OPTIONS' | 'PLAN' | 'HANDOFF';

export type SlotStatus = 'known' | 'unknown' | 'conflict';

export type ValidationResult = 'PASS' | 'REVISE';

export interface ValidationResultDetails {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface User {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  location: string;
  userType: UserType;
  ageBand: AgeBand;
  preferredLanguage: Lang;
  createdAt: Date;
  updatedAt: Date;
}

export interface Thread {
  id: string;
  userId: string;
  domainOfLife: DomainOfLife;
  language: Lang;
  status: 'active' | 'completed' | 'paused';
  stage: ThreadStage;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: ProviderType;
    model?: ModelType;
    tokensIn?: number;
    tokensOut?: number;
    processingTime?: number;
  };
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  required?: boolean;
}

export interface QuestionBlock {
  id: string;
  questions: Question[];
  progress: string; // "k/N" format
  type: QuestionType;
}

export interface UserResponse {
  questionId: string;
  selected: string[];
  extra?: string;
  transcript?: string;
}

export interface AssistantTurn {
  message: string;
  questionBlocks: QuestionBlock[];
  flowState: FlowState;
  structIntent: StructIntent;
  language: Lang;
  phase?: ThreadStage; // Optional hint from assistant
}

export interface ProviderConfig {
  id: string;
  type: ProviderType;
  name: string;
  models: ModelType[];
  defaultModel: ModelType;
  temperature: number;
  maxTokens: number;
  timeout: number;
  active: boolean;
  fallbackOrder: number;
}

export interface RoutingRule {
  id: string;
  condition: {
    domainOfLife?: DomainOfLife[];
    language?: Lang[];
    userType?: UserType[];
    ageBand?: AgeBand[];
  };
  providerId: string;
  model: ModelType;
  priority: number;
  active: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  facets: {
    domainOfLife: DomainOfLife[];
    ageBand: AgeBand[];
    gender: Gender[];
    location: string[];
    language: Lang[];
  };
  content: string;
  active: boolean;
}

export interface PolicyConfig {
  id: string;
  name: string;
  rules: {
    enableEvidenceMode: boolean;
    contentSafety: boolean;
    profanityFilter: boolean;
    piiFilter: boolean;
    ageAppropriateContent: boolean;
  };
  active: boolean;
}

export interface FeatureFlags {
  id: string;
  userType: UserType;
  offerReport: boolean;
  showAds: boolean;
  motivationalNudges: boolean;
  emojiDecoration: boolean;
}

export interface UsageMetrics {
  sessionId: string;
  providerId: string;
  model: ModelType;
  tokensIn: number;
  tokensOut: number;
  bytesIn: number;
  bytesOut: number;
  processingTime: number;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  threadId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  totalTurns: number;
  totalTokens: number;
  providerUsage: UsageMetrics[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface ChatRequest {
  threadId: string;
  userId: string;
  message?: string;
  responses?: UserResponse[];
  language: Lang;
  domainOfLife?: DomainOfLife;
}

export interface ChatResponse {
  threadId: string;
  turn: AssistantTurn;
  sessionId: string;
  usage: UsageMetrics;
}

// Validation types
export interface ValidationResultDetails {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  repaired?: boolean;
}

export interface TagValidationResult extends ValidationResultDetails {
  messageCount: number;
  questionBlockCount: number;
  uniqueQuestionIds: string[];
  progressValid: boolean;
  flowStateValid: boolean;
  structIntentValid: boolean;
}

export interface SlotLedger {
  threadId: string;
  known: Map<string, any>;
  unknown: Set<string>;
  conflicts: Map<string, string[]>;
  lastUpdated: Date;
}

export interface SlotDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  required: boolean;
  domainOfLife?: DomainOfLife[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface StageTransition {
  from: ThreadStage;
  to: ThreadStage;
  condition: (ledger: SlotLedger, responses: UserResponse[]) => boolean;
  description: string;
}

export interface OrchestratorConfig {
  stageThresholds: {
    discoverCoverageThreshold: number; // Default: 0.8 (80%)
    maxQuestionsPerTurn: number; // Default: 4
  };
  requiredSlots: {
    [K in DomainOfLife]: string[];
  };
  evidenceMode: {
    [K in DomainOfLife]: boolean;
  };
  maxRetries: number;
  fallbackOrder: string[];
  timeBudgets: {
    [K in ProviderType]: number;
  };
}

export interface ValidationError {
  type: 'format' | 'range' | 'contradiction' | 'language' | 'content';
  message: string;
  field?: string;
  value?: any;
  suggestion?: string;
}

export interface InspectorResult {
  result: ValidationResult;
  errors: ValidationError[];
  warnings: string[];
  repaired?: boolean;
}
