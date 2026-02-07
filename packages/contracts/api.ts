// API contracts for ChatModule system

import { 
  ApiResponse, 
  ChatRequest, 
  ChatResponse, 
  User, 
  Thread, 
  Message, 
  ProviderConfig, 
  RoutingRule, 
  ReportTemplate, 
  PolicyConfig, 
  FeatureFlags,
  UsageMetrics,
  ChatSession,
  Lang,
  DomainOfLife
} from './types';

// Chat API endpoints
export interface ChatApi {
  // Send a message and get assistant response
  sendMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>>;
  
  // Get thread history
  getThreadHistory(threadId: string): Promise<ApiResponse<Message[]>>;
  
  // Create new thread
  createThread(userId: string, domainOfLife: DomainOfLife, language: Lang): Promise<ApiResponse<Thread>>;
  
  // Resume existing thread
  resumeThread(threadId: string): Promise<ApiResponse<Thread>>;
}

// Admin API endpoints
export interface AdminApi {
  // Provider management
  getProviders(): Promise<ApiResponse<ProviderConfig[]>>;
  createProvider(config: Omit<ProviderConfig, 'id'>): Promise<ApiResponse<ProviderConfig>>;
  updateProvider(id: string, config: Partial<ProviderConfig>): Promise<ApiResponse<ProviderConfig>>;
  deleteProvider(id: string): Promise<ApiResponse<void>>;
  
  // Routing rules
  getRoutingRules(): Promise<ApiResponse<RoutingRule[]>>;
  createRoutingRule(rule: Omit<RoutingRule, 'id'>): Promise<ApiResponse<RoutingRule>>;
  updateRoutingRule(id: string, rule: Partial<RoutingRule>): Promise<ApiResponse<RoutingRule>>;
  deleteRoutingRule(id: string): Promise<ApiResponse<void>>;
  
  // Report templates
  getReportTemplates(): Promise<ApiResponse<ReportTemplate[]>>;
  createReportTemplate(template: Omit<ReportTemplate, 'id'>): Promise<ApiResponse<ReportTemplate>>;
  updateReportTemplate(id: string, template: Partial<ReportTemplate>): Promise<ApiResponse<ReportTemplate>>;
  deleteReportTemplate(id: string): Promise<ApiResponse<void>>;
  
  // Policy configuration
  getPolicies(): Promise<ApiResponse<PolicyConfig[]>>;
  updatePolicy(id: string, policy: Partial<PolicyConfig>): Promise<ApiResponse<PolicyConfig>>;
  
  // Feature flags
  getFeatureFlags(): Promise<ApiResponse<FeatureFlags[]>>;
  updateFeatureFlags(flags: Partial<FeatureFlags>): Promise<ApiResponse<FeatureFlags>>;
  
  // Monitoring
  getUsageMetrics(timeRange: { start: Date; end: Date }): Promise<ApiResponse<UsageMetrics[]>>;
  getSessionMetrics(sessionId: string): Promise<ApiResponse<ChatSession>>;
}

// User API endpoints
export interface UserApi {
  // User management
  getCurrentUser(): Promise<ApiResponse<User>>;
  updateUser(updates: Partial<User>): Promise<ApiResponse<User>>;
  
  // Thread management
  getUserThreads(): Promise<ApiResponse<Thread[]>>;
  getThread(threadId: string): Promise<ApiResponse<Thread>>;
  
  // Language switching
  updateLanguage(language: Lang): Promise<ApiResponse<void>>;
}

// Streaming API for real-time chat
export interface StreamingApi {
  // Server-Sent Events for chat streaming
  streamChat(request: ChatRequest): EventSource;
  
  // WebSocket for bidirectional communication
  connectWebSocket(): WebSocket;
}

// Error types
export interface ChatError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ApiValidationError extends ChatError {
  field: string;
  value: any;
}

export interface ProviderError extends ChatError {
  provider: string;
  model: string;
  retryable: boolean;
}

// Configuration types
export interface ChatConfig {
  apiBaseUrl: string;
  wsUrl: string;
  defaultLanguage: Lang;
  maxRetries: number;
  timeout: number;
  enableStreaming: boolean;
}

export interface AdminConfig {
  apiBaseUrl: string;
  authToken: string;
  refreshToken: string;
  timeout: number;
}

// Event types for real-time updates
export interface ChatEvent {
  type: 'message' | 'question' | 'progress' | 'error' | 'complete';
  data: any;
  timestamp: Date;
}

export interface MessageEvent extends ChatEvent {
  type: 'message';
  data: {
    content: string;
    isStreaming: boolean;
    isComplete: boolean;
  };
}

export interface QuestionEvent extends ChatEvent {
  type: 'question';
  data: {
    questionBlocks: any[];
    progress: string;
  };
}

export interface ProgressEvent extends ChatEvent {
  type: 'progress';
  data: {
    current: number;
    total: number;
    percentage: number;
  };
}

export interface ErrorEvent extends ChatEvent {
  type: 'error';
  data: {
    error: ChatError;
    retryable: boolean;
  };
}

export interface CompleteEvent extends ChatEvent {
  type: 'complete';
  data: {
    flowState: string;
    structIntent: string;
    sessionId: string;
  };
}


