// Core chat domain logic and tag protocol parser

import { 
  AssistantTurn, 
  UserResponse, 
  Thread, 
  Message, 
  Question, 
  QuestionBlock,
  FlowState,
  StructIntent,
  Lang,
  ValidationResultDetails,
  TagValidationResult
} from '../contracts/types';

export type BlockType = "radio" | "checkbox" | "text" | "textarea";

export interface InteractiveBlock {
  id: string;
  question: string;
  type: BlockType;
  options: string[]; // empty for text/textarea
}

// Legacy interface for backward compatibility
export interface InteractiveOption {
  label: string;
  expanded: boolean;
  detail?: string;
}

export interface InteractiveQuestionBlock {
  id: string;
  question: string;
  type: "radio" | "checkbox";
  options: InteractiveOption[];
}

// Enhanced parser that handles both XML and Markdown formats
export class TagProtocolParser {
  private static readonly MARKDOWN_PATTERNS = {
    QUESTION_BLOCK: /### QUESTION\s*\nType:\s*(single-choice|multi-choice)\s*\nPrompt:\s*(.*?)\s*\n\nOptions:\s*\n((?:[(\[]\s*[)\]]\s*.*?\n?)*)/gs,
    SINGLE_OPTION: /\(\s*\)\s*(.*?)(?=\n|$)/g,
    MULTI_OPTION: /\[\s*\]\s*(.*?)(?=\n|$)/g,
    MESSAGE_CONTENT: /^(?!### QUESTION)(.*?)(?=### QUESTION|$)/gs
  };

  private static readonly XML_PATTERNS = {
    MSG: /<MSG>(.*?)<\/MSG>/gs,
    QT: /<QT[^>]*type=["']?(\w+)["']?[^>]*progress=["']?([^"']*)["']?[^>]*>(.*?)<\/QT>/gs,
    Q: /<Q[^>]*>(.*?)<\/Q>/gs,
    O: /<O>(.*?)<\/O>/gs,
    CODE: /<CODE>(.*?)<\/CODE>/gs,
    STRUCT: /<STRUCT>(.*?)<\/STRUCT>/gs,
    BLOCK: /<BLOCK[^>]*id=["']?([^"']*)["']?[^>]*>(.*?)<\/BLOCK>/gs,
    TYPE: /<TYPE>(.*?)<\/TYPE>/gs,
    OPTION: /<OPTION>(.*?)<\/OPTION>/gs
  };

  static parseAssistantResponse(content: string): AssistantTurn {
    // Check if content is XML format
    if (content.includes('<MSG>') || content.includes('<QT>') || content.includes('<BLOCK>')) {
      return this.parseXMLResponse(content);
    }
    
    // Otherwise parse as Markdown
    return this.parseMarkdownResponse(content);
  }

  static parseInteractiveBlocks(content: string): InteractiveBlock[] {
    console.log("🧩 Assistant message (raw):", content);
    
    const blocks: InteractiveBlock[] = [];
    
    if (!content.includes('<BLOCK>')) {
      console.log("🧩 No BLOCK tags found");
      return blocks;
    }

    // Try a simpler, more robust approach
    const blockMatches = content.match(/<BLOCK[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/BLOCK>/g);
    console.log("🧩 Found block matches:", blockMatches);
    
    if (!blockMatches) {
      console.log("🧩 No block matches found");
      return blocks;
    }

    blockMatches.forEach((blockMatch, index) => {
      console.log(`🧩 Processing block ${index + 1}:`, blockMatch.substring(0, 100) + '...');
      
      // Extract ID
      const idMatch = blockMatch.match(/id="([^"]+)"/);
      const id = idMatch ? idMatch[1] : `block_${index}`;
      
      // Extract question
      const questionMatch = blockMatch.match(/<Q>([\s\S]*?)<\/Q>/);
      const question = questionMatch ? questionMatch[1].trim() : '';
      
      // Extract type
      const typeMatch = blockMatch.match(/<TYPE>([\s\S]*?)<\/TYPE>/);
      const type = typeMatch ? typeMatch[1].trim().toLowerCase() : 'radio';
      
      // Extract options
      const optionMatches = blockMatch.match(/<OPTION>([\s\S]*?)<\/OPTION>/g);
      const options = optionMatches ? optionMatches.map(opt => opt.replace(/<\/?OPTION>/g, '').trim()) : [];
      
      console.log(`🧩 Block ${index + 1} parsed:`, { id, question, type, options });
      
      if (question && options.length >= 2) {
        blocks.push({
          id,
          question,
          type: type as "radio" | "checkbox",
          options
        });
      }
    });
    
    console.log("🧩 Parsed Blocks:", blocks);
    return blocks;
  }

  // Legacy method for backward compatibility
  static parseInteractiveBlocksLegacy(content: string): InteractiveQuestionBlock[] {
    const blocks = this.parseInteractiveBlocks(content);
    return blocks.map(block => ({
      id: block.id,
      question: block.question,
      type: block.type as "radio" | "checkbox",
      options: block.options.map(opt => ({
        label: opt,
        expanded: false
      }))
    }));
  }

  private static parseXMLResponse(content: string): AssistantTurn {
    const message = this.extractXMLMessage(content);
    const questionBlocks = this.extractXMLQuestionBlocks(content);
    const flowState = this.extractXMLFlowState(content);
    const structIntent = this.extractXMLStructIntent(content);
    const language = this.detectLanguage(content);

    return {
      message,
      questionBlocks,
      flowState,
      structIntent,
      language
    };
  }

  private static parseMarkdownResponse(content: string): AssistantTurn {
    const message = this.extractMessage(content);
    const questionBlocks = this.extractQuestionBlocks(content);
    const flowState = this.extractFlowState(content);
    const structIntent = this.extractStructIntent(content);
    const language = this.detectLanguage(content);

    return {
      message,
      questionBlocks,
      flowState,
      structIntent,
      language
    };
  }

  private static extractXMLMessage(content: string): string {
    const msgMatches = content.matchAll(this.XML_PATTERNS.MSG);
    const messages: string[] = [];
    
    for (const match of msgMatches) {
      messages.push(match[1].trim());
    }
    
    return messages.join(' ') || 'I understand. Let me help you with that.';
  }

  private static extractXMLQuestionBlocks(content: string): QuestionBlock[] {
    const blocks: QuestionBlock[] = [];
    const qtMatches = content.matchAll(this.XML_PATTERNS.QT);
    
    for (const match of qtMatches) {
      const type = match[1] === 'single' ? 'single' : 'multi';
      const progress = match[2] || '1/1';
      const qtContent = match[3];
      
      // Extract question
      const qMatch = qtContent.match(this.XML_PATTERNS.Q);
      if (!qMatch) continue;
      
      const questionId = qMatch[1];
      const questionText = qMatch[2].trim();
      
      // Extract options
      const optionMatches = qtContent.matchAll(this.XML_PATTERNS.O);
      const options: string[] = [];
      
      for (const optMatch of optionMatches) {
        options.push(optMatch[1].trim());
      }
      
      if (options.length >= 2) {
        const question: Question = {
          id: questionId || `q_${blocks.length + 1}`,
          text: questionText,
          type,
          options: options.map(text => text.trim())
        };
        
        const block: QuestionBlock = {
          id: `block_${blocks.length + 1}`,
          questions: [question],
          progress: progress,
          type: type
        };
        
        blocks.push(block);
      }
    }
    
    return blocks;
  }

  private static extractXMLFlowState(content: string): FlowState {
    const codeMatch = content.match(this.XML_PATTERNS.CODE);
    if (!codeMatch) return 'OK';
    
    const code = codeMatch[1].trim().toUpperCase();
    switch (code) {
      case 'OK': return 'OK';
      case 'DELAY': return 'DELAY';
      case 'LIMIT_X': return 'LIMIT_X';
      case 'DONE': return 'DONE';
      default: return 'OK';
    }
  }

  private static extractXMLStructIntent(content: string): StructIntent {
    const structMatch = content.match(this.XML_PATTERNS.STRUCT);
    if (!structMatch) return 'NONE';
    
    const struct = structMatch[1].trim().toUpperCase();
    switch (struct) {
      case 'REPORT': return 'REPORT';
      case 'SCHEDULE': return 'SCHEDULE';
      default: return 'NONE';
    }
  }

  private static extractMessage(content: string): string {
    // Extract content that's not part of question blocks
    const messageParts: string[] = [];
    const lines = content.split('\n');
    let inQuestionBlock = false;
    let currentMessage = '';

    for (const line of lines) {
      if (line.trim().startsWith('### QUESTION')) {
        // Save current message if any
        if (currentMessage.trim()) {
          messageParts.push(currentMessage.trim());
        }
        currentMessage = '';
        inQuestionBlock = true;
        continue;
      }
      
      if (inQuestionBlock) {
        // Skip question block content
        if (line.trim() === '' && currentMessage.trim()) {
          // End of question block, start collecting message again
          inQuestionBlock = false;
        }
        continue;
      }
      
      // Collect non-question content
      currentMessage += line + '\n';
    }

    // Add final message part
    if (currentMessage.trim()) {
      messageParts.push(currentMessage.trim());
    }

    const fullMessage = messageParts.join('\n\n').trim();
    return fullMessage || 'I understand. Let me help you with that.';
  }

  private static extractQuestionBlocks(content: string): QuestionBlock[] {
    const blocks: QuestionBlock[] = [];
    const questionMatches = content.matchAll(this.MARKDOWN_PATTERNS.QUESTION_BLOCK);

    for (const match of questionMatches) {
      const type = match[1] === 'single-choice' ? 'single' : 'multi';
      const prompt = match[2].trim();
      const optionsText = match[3];

      // Extract options based on type
      const options = this.extractOptionsFromMarkdown(optionsText, type);
      
      if (options.length >= 2) {
        const question: Question = {
          id: `q_${blocks.length + 1}`,
          text: prompt,
          type,
          options: options.map(text => text.trim())
        };

        blocks.push({
          id: `block_${blocks.length + 1}`,
          questions: [question],
          progress: '1/1', // Default progress
          type
        });
      }
    }

    return blocks;
  }

  private static extractOptionsFromMarkdown(optionsText: string, type: 'single' | 'multi'): string[] {
    const options: string[] = [];
    const pattern = type === 'single' ? this.MARKDOWN_PATTERNS.SINGLE_OPTION : this.MARKDOWN_PATTERNS.MULTI_OPTION;
    
    const matches = optionsText.matchAll(pattern);
    for (const match of matches) {
      const optionText = match[1].trim();
      if (optionText) {
        options.push(optionText);
      }
    }

    return options;
  }

  private static extractFlowState(content: string): FlowState {
    // Look for flow state indicators in the content
    if (content.includes('DONE') || content.includes('completed')) return 'DONE';
    if (content.includes('DELAY') || content.includes('wait')) return 'DELAY';
    if (content.includes('LIMIT') || content.includes('limit reached')) return 'LIMIT_X';
    return 'OK'; // Default
  }

  private static extractStructIntent(content: string): StructIntent {
    // Look for structure intent indicators
    if (content.includes('REPORT') || content.includes('report')) return 'REPORT';
    if (content.includes('SCHEDULE') || content.includes('schedule')) return 'SCHEDULE';
    return 'NONE'; // Default
  }

  private static detectLanguage(content: string): Lang {
    // Simple language detection based on content
    // In production, this would be more sophisticated
    if (/[\u0900-\u097F]/.test(content)) return 'hi';
    if (/[\u0980-\u09FF]/.test(content)) return 'bn';
    if (/[\u0600-\u06FF]/.test(content)) return 'ar';
    if (/[\u4E00-\u9FFF]/.test(content)) return 'zh';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(content)) return 'ja';
    return 'en'; // Default
  }
}

// Tag protocol validator
export class TagProtocolValidator {
  static validateAssistantTurn(turn: AssistantTurn): TagValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let repaired = false;

    // Validate message
    if (!turn.message || turn.message.trim().length === 0) {
      errors.push('Message content is required');
    }

    // Validate question blocks
    if (turn.questionBlocks.length > 4) {
      errors.push('Maximum 4 question blocks allowed per turn');
    }

    const uniqueQuestionIds = new Set<string>();
    let progressValid = true;

    for (const block of turn.questionBlocks) {
      // Validate progress format
      if (!/^\d+\/\d+$/.test(block.progress)) {
        errors.push(`Invalid progress format: ${block.progress}`);
        progressValid = false;
      }

      // Validate questions
      if (block.questions.length === 0) {
        errors.push('Question block must contain at least one question');
      }

      for (const question of block.questions) {
        // Check for unique question IDs
        if (uniqueQuestionIds.has(question.id)) {
          errors.push(`Duplicate question ID: ${question.id}`);
        }
        uniqueQuestionIds.add(question.id);

        // Validate question content
        if (!question.text || question.text.trim().length === 0) {
          errors.push(`Question text is required for ID: ${question.id}`);
        }

        // Validate options
        if (question.options.length < 2) {
          errors.push(`Question ${question.id} must have at least 2 options`);
        }
      }
    }

    // Validate flow state
    const validFlowStates: FlowState[] = ['OK', 'DELAY', 'LIMIT_X', 'DONE'];
    if (!validFlowStates.includes(turn.flowState)) {
      errors.push(`Invalid flow state: ${turn.flowState}`);
    }

    // Validate struct intent
    const validStructIntents: StructIntent[] = ['NONE', 'REPORT', 'SCHEDULE'];
    if (!validStructIntents.includes(turn.structIntent)) {
      errors.push(`Invalid struct intent: ${turn.structIntent}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      repaired,
      messageCount: turn.message ? 1 : 0,
      questionBlockCount: turn.questionBlocks.length,
      uniqueQuestionIds: Array.from(uniqueQuestionIds),
      progressValid,
      flowStateValid: validFlowStates.includes(turn.flowState),
      structIntentValid: validStructIntents.includes(turn.structIntent)
    };
  }

  static autoRepair(turn: AssistantTurn): AssistantTurn {
    const repaired = { ...turn };

    // Auto-repair common issues
    if (!repaired.message) {
      repaired.message = 'I understand. Let me help you with that.';
    }

    // Ensure progress format is correct
    for (const block of repaired.questionBlocks) {
      if (!/^\d+\/\d+$/.test(block.progress)) {
        block.progress = '1/1'; // Default fallback
      }
    }

    // Ensure valid flow state
    if (!['OK', 'DELAY', 'LIMIT_X', 'DONE'].includes(repaired.flowState)) {
      repaired.flowState = 'OK';
    }

    // Ensure valid struct intent
    if (!['NONE', 'REPORT', 'SCHEDULE'].includes(repaired.structIntent)) {
      repaired.structIntent = 'NONE';
    }

    return repaired;
  }
}

// Question bucketing and progress logic
export class QuestionBucketManager {
  private currentProgress: Map<string, { current: number; total: number }> = new Map();

  updateProgress(threadId: string, questionId: string, totalQuestions: number): string {
    const current = this.currentProgress.get(threadId) || { current: 0, total: 0 };
    
    // Increment current question
    current.current = Math.max(current.current, this.getQuestionNumber(questionId));
    
    // Update total if it's higher
    if (totalQuestions > current.total) {
      current.total = totalQuestions;
    }

    this.currentProgress.set(threadId, current);
    
    return `${current.current}/${current.total}`;
  }

  private getQuestionNumber(questionId: string): number {
    // Extract question number from ID (e.g., "q1" -> 1)
    const match = questionId.match(/q(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  getProgress(threadId: string): string {
    const current = this.currentProgress.get(threadId);
    if (!current) return '1/1';
    return `${current.current}/${current.total}`;
  }

  resetProgress(threadId: string): void {
    this.currentProgress.delete(threadId);
  }
}

// Thread management
export class ThreadManager {
  private threads: Map<string, Thread> = new Map();
  private messages: Map<string, Message[]> = new Map();

  createThread(userId: string, domainOfLife: string, language: Lang): Thread {
    const thread: Thread = {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      domainOfLife: domainOfLife as any,
      language,
      status: 'active',
      stage: 'DISCOVER',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date()
    };

    this.threads.set(thread.id, thread);
    this.messages.set(thread.id, []);
    
    return thread;
  }

  getThread(threadId: string): Thread | undefined {
    return this.threads.get(threadId);
  }

  addMessage(threadId: string, message: Message): void {
    const messages = this.messages.get(threadId) || [];
    messages.push(message);
    this.messages.set(threadId, messages);

    // Update thread timestamp
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.lastMessageAt = new Date();
      thread.updatedAt = new Date();
    }
  }

  getMessages(threadId: string): Message[] {
    return this.messages.get(threadId) || [];
  }

  updateThreadStatus(threadId: string, status: 'active' | 'completed' | 'paused'): void {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.status = status;
      thread.updatedAt = new Date();
    }
  }
}

// Usage accounting
export class UsageAccountant {
  private sessionUsage: Map<string, any[]> = new Map();

  recordUsage(sessionId: string, usage: any): void {
    const usageList = this.sessionUsage.get(sessionId) || [];
    usageList.push({
      ...usage,
      timestamp: new Date()
    });
    this.sessionUsage.set(sessionId, usageList);
  }

  getSessionUsage(sessionId: string): any[] {
    return this.sessionUsage.get(sessionId) || [];
  }

  getTotalTokens(sessionId: string): { in: number; out: number } {
    const usageList = this.sessionUsage.get(sessionId) || [];
    return usageList.reduce(
      (total, usage) => ({
        in: total.in + (usage.tokensIn || 0),
        out: total.out + (usage.tokensOut || 0)
      }),
      { in: 0, out: 0 }
    );
  }

  clearSessionUsage(sessionId: string): void {
    this.sessionUsage.delete(sessionId);
  }
}

