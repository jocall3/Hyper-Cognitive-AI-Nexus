export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'code' | 'system' | 'haptic' | 'bci_command' | '3d_model' | 'document' | 'simulation_log' | 'knowledge_graph_entry' | 'payment_transaction' | 'system_status_report' | 'identity_event' | 'governance_audit_log';
export type MessageSender = 'user' | 'ai' | 'system' | 'agent' | 'debugger';
export type InputModality = 'text' | 'speech' | 'vision' | 'haptic' | 'bci' | 'gesture' | 'eye_gaze' | 'raw_data_stream';
export type OutputModality = 'text' | 'speech' | 'vision' | 'haptic' | 'bci' | 'holographic' | 'ar_overlay';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
  mediaBlob?: Blob;
  feedback?: 'positive' | 'negative' | 'neutral' | 'thumbs_up' | 'thumbs_down';
  isStreamEnd?: boolean;
  originalPrompt?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  processingLatencyMs?: number;
  relatedTasks?: string[];
}

export interface AIEvent {
  id: string;
  type: 'system_alert' | 'user_interaction' | 'agent_action' | 'data_update' | 'security_alert' | 'ethical_violation_flag';
  source: string;
  payload: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
  traceId?: string;
}

export interface AIModelConfig {
  id: string;
  name: string;
  version: string;
  type: string;
  provider: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'training' | 'error';
  apiKey?: string;
  performanceMetrics?: {
    latency: number;
    throughput: number;
  };
  metadata?: Record<string, any>;
}

export interface AIUserProfile {
  userId: string;
  accountId: string;
  role: string;
  status: string;
  preferences: {
    language: string;
    verbosity: 'terse' | 'medium' | 'verbose';
    theme?: string;
  };
  learningStyles: string;
  expertiseLevels: Record<string, number>;
  securityCredentials: {
    keyId?: string;
    level: number;
    mfaEnabled: boolean;
    tokenLifetime?: number;
  };
  agentPermissions?: Record<string, string[]>;
}

export interface AIAgent {
  id: string;
  name: string;
  persona: string;
  role: string;
  status: 'idle' | 'executing' | 'offline' | 'learning';
  capabilities: string[];
  assignedTasks: AITask[];
  currentGoal: string;
  memoryCapacity: string;
  learningRate: string;
  ethicalGuidelines: string;
  securityClearance: string;
  resourceAllocation: any;
  version: string;
  lastOnline: number;
  isAutonomous: boolean;
  trustScore: number;
}

export interface AITask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgentId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  output?: string;
}

export interface TokenAccount {
  accountId: string;
  balance: number;
  currency: string;
}

export interface TransactionRecord {
  id: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  meta?: any;
}

export interface TokenRail {
  id: string;
  name: string;
  type: string;
}

export interface AILogEntry {
  id: string;
  timestamp: number;
  severity: string;
  source: string;
  type: string;
  payload: any;
  traceId?: string;
}
