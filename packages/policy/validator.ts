// Enhanced validator with inspector pass and hallucination controls

import { 
  ValidationError, 
  InspectorResult, 
  ValidationResult,
  AssistantTurn,
  UserResponse,
  ThreadStage,
  DomainOfLife,
  Lang,
  AgeBand
} from '../contracts/types';

// Inspector Pass - Fast format/language check
export class InspectorPass {
  static inspect(turn: AssistantTurn, language: Lang, ageBand: AgeBand): InspectorResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let repaired = false;

    // Format validation
    const formatErrors = this.validateFormat(turn);
    errors.push(...formatErrors);

    // Language validation
    const languageErrors = this.validateLanguage(turn, language);
    errors.push(...languageErrors);

    // Age appropriateness
    const ageErrors = this.validateAgeAppropriate(turn, ageBand);
    errors.push(...ageErrors);

    // Content safety
    const safetyErrors = this.validateContentSafety(turn);
    errors.push(...safetyErrors);

    // Range and type checks
    const rangeErrors = this.validateRanges(turn);
    errors.push(...rangeErrors);

    // Contradiction scan
    const contradictionErrors = this.scanContradictions(turn);
    errors.push(...contradictionErrors);

    // Attempt auto-repair for minor issues
    if (errors.length > 0 && errors.every(e => e.type === 'format')) {
      repaired = this.attemptAutoRepair(turn);
      if (repaired) {
        errors.length = 0; // Clear errors if repair was successful
      }
    }

    return {
      result: errors.length === 0 ? 'PASS' : 'REVISE',
      errors,
      warnings,
      repaired
    };
  }

  private static validateFormat(turn: AssistantTurn): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check message count
    if (!turn.message || turn.message.trim().length === 0) {
      errors.push({
        type: 'format',
        message: 'Message content is required',
        field: 'message'
      });
    }

    // Check question block count
    if (turn.questionBlocks.length > 4) {
      errors.push({
        type: 'format',
        message: 'Maximum 4 question blocks allowed per turn',
        field: 'questionBlocks',
        value: turn.questionBlocks.length,
        suggestion: 'Reduce to 4 or fewer question blocks'
      });
    }

    // Check unique question IDs
    const questionIds = new Set<string>();
    for (const block of turn.questionBlocks) {
      for (const question of block.questions) {
        if (questionIds.has(question.id)) {
          errors.push({
            type: 'format',
            message: `Duplicate question ID: ${question.id}`,
            field: 'questionId',
            value: question.id,
            suggestion: 'Use unique question IDs'
          });
        }
        questionIds.add(question.id);

        // Check question content
        if (!question.text || question.text.trim().length === 0) {
          errors.push({
            type: 'format',
            message: `Question text is required for ID: ${question.id}`,
            field: 'questionText',
            value: question.id
          });
        }

        // Check options
        if (question.options.length < 2) {
          errors.push({
            type: 'format',
            message: `Question ${question.id} must have at least 2 options`,
            field: 'questionOptions',
            value: question.id,
            suggestion: 'Add more options'
          });
        }
      }
    }

    // Check progress format
    for (const block of turn.questionBlocks) {
      if (!/^\d+\/\d+$/.test(block.progress)) {
        errors.push({
          type: 'format',
          message: `Invalid progress format: ${block.progress}`,
          field: 'progress',
          value: block.progress,
          suggestion: 'Use format "k/N" where k and N are numbers'
        });
      }
    }

    return errors;
  }

  private static validateLanguage(turn: AssistantTurn, targetLanguage: Lang): ValidationError[] {
    const errors: ValidationError[] = [];

    // Simple language detection
    const content = turn.message + ' ' + turn.questionBlocks.map(b => 
      b.questions.map(q => q.text + ' ' + q.options.join(' ')).join(' ')
    ).join(' ');

    const hasTargetLanguage = this.detectLanguage(content, targetLanguage);
    
    if (!hasTargetLanguage) {
      errors.push({
        type: 'language',
        message: `Content should be in ${targetLanguage} language`,
        field: 'language',
        value: targetLanguage,
        suggestion: 'Translate content to target language'
      });
    }

    return errors;
  }

  private static validateAgeAppropriate(turn: AssistantTurn, ageBand: AgeBand): ValidationError[] {
    const errors: ValidationError[] = [];

    const content = turn.message + ' ' + turn.questionBlocks.map(b => 
      b.questions.map(q => q.text + ' ' + q.options.join(' ')).join(' ')
    ).join(' ');

    const adultKeywords = ['alcohol', 'drugs', 'violence', 'explicit', 'mature', 'adult-only'];
    
    if (ageBand === 'child' || ageBand === 'teen') {
      const hasAdultContent = adultKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );

      if (hasAdultContent) {
        errors.push({
          type: 'content',
          message: 'Content contains age-inappropriate material',
          field: 'ageAppropriate',
          value: ageBand,
          suggestion: 'Use age-appropriate language'
        });
      }
    }

    return errors;
  }

  private static validateContentSafety(turn: AssistantTurn): ValidationError[] {
    const errors: ValidationError[] = [];

    const content = turn.message + ' ' + turn.questionBlocks.map(b => 
      b.questions.map(q => q.text + ' ' + q.options.join(' ')).join(' ')
    ).join(' ');

    // Profanity check
    const profanityPatterns = [
      /\b(shit|damn|hell|fuck|bitch|asshole)\b/gi
    ];

    for (const pattern of profanityPatterns) {
      if (pattern.test(content)) {
        errors.push({
          type: 'content',
          message: 'Content contains profanity',
          field: 'profanity',
          suggestion: 'Remove profanity'
        });
        break;
      }
    }

    // PII check
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}-\d{3}-\d{4}\b/g // Phone
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(content)) {
        errors.push({
          type: 'content',
          message: 'Content contains personally identifiable information',
          field: 'pii',
          suggestion: 'Remove PII'
        });
        break;
      }
    }

    return errors;
  }

  private static validateRanges(turn: AssistantTurn): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for reasonable timeframes
    const timeframePattern = /(\d+)\s*(hour|day|week|month|year)s?/gi;
    const content = turn.message + ' ' + turn.questionBlocks.map(b => 
      b.questions.map(q => q.text + ' ' + q.options.join(' ')).join(' ')
    ).join(' ');

    let match;
    while ((match = timeframePattern.exec(content)) !== null) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      // Reasonable ranges
      if (unit === 'hour' && value > 24) {
        errors.push({
          type: 'range',
          message: `Unrealistic timeframe: ${value} hours`,
          field: 'timeframe',
          value: `${value} hours`,
          suggestion: 'Use realistic timeframes'
        });
      } else if (unit === 'day' && value > 365) {
        errors.push({
          type: 'range',
          message: `Unrealistic timeframe: ${value} days`,
          field: 'timeframe',
          value: `${value} days`,
          suggestion: 'Use realistic timeframes'
        });
      }
    }

    return errors;
  }

  private static scanContradictions(turn: AssistantTurn): ValidationError[] {
    const errors: ValidationError[] = [];

    const content = turn.message + ' ' + turn.questionBlocks.map(b => 
      b.questions.map(q => q.text + ' ' + q.options.join(' ')).join(' ')
    ).join(' ');

    // Simple contradiction detection
    const contradictions = [
      {
        pattern1: /no time/i,
        pattern2: /2 hours|daily|every day/i,
        message: 'Contradiction: "no time" vs "daily commitment"'
      },
      {
        pattern1: /beginner/i,
        pattern2: /expert|advanced|professional/i,
        message: 'Contradiction: "beginner" vs "expert level"'
      },
      {
        pattern1: /free|no cost/i,
        pattern2: /expensive|costly|budget/i,
        message: 'Contradiction: "free" vs "expensive"'
      }
    ];

    for (const contradiction of contradictions) {
      if (contradiction.pattern1.test(content) && contradiction.pattern2.test(content)) {
        errors.push({
          type: 'contradiction',
          message: contradiction.message,
          field: 'contradiction',
          suggestion: 'Resolve contradictory statements'
        });
      }
    }

    return errors;
  }

  private static detectLanguage(content: string, targetLanguage: Lang): boolean {
    // Simple language detection based on content
    if (targetLanguage === 'hi' && /[\u0900-\u097F]/.test(content)) return true;
    if (targetLanguage === 'bn' && /[\u0980-\u09FF]/.test(content)) return true;
    if (targetLanguage === 'ar' && /[\u0600-\u06FF]/.test(content)) return true;
    if (targetLanguage === 'zh' && /[\u4E00-\u9FFF]/.test(content)) return true;
    if (targetLanguage === 'ja' && /[\u3040-\u309F\u30A0-\u30FF]/.test(content)) return true;
    if (targetLanguage === 'en') return true; // Default to English
    return false;
  }

  private static attemptAutoRepair(turn: AssistantTurn): boolean {
    let repaired = false;

    // Fix progress format
    for (const block of turn.questionBlocks) {
      if (!/^\d+\/\d+$/.test(block.progress)) {
        block.progress = '1/1'; // Default fallback
        repaired = true;
      }
    }

    // Fix empty message
    if (!turn.message || turn.message.trim().length === 0) {
      turn.message = 'I understand. Let me help you with that.';
      repaired = true;
    }

    // Fix invalid flow state
    if (!['OK', 'DELAY', 'LIMIT_X', 'DONE'].includes(turn.flowState)) {
      turn.flowState = 'OK';
      repaired = true;
    }

    // Fix invalid struct intent
    if (!['NONE', 'REPORT', 'SCHEDULE'].includes(turn.structIntent)) {
      turn.structIntent = 'NONE';
      repaired = true;
    }

    return repaired;
  }
}

// Hallucination Controls
export class HallucinationControls {
  static addEvidenceMode(turn: AssistantTurn, domainOfLife: DomainOfLife, confidence: number = 0.8): AssistantTurn {
    const evidenceDomains: DomainOfLife[] = ['health', 'finance', 'career'];
    
    if (evidenceDomains.includes(domainOfLife) && confidence < 0.7) {
      const caution = '\n\n*Note: This information is based on general patterns and may not apply to your specific situation. Consider consulting with a professional for personalized advice.*';
      return {
        ...turn,
        message: turn.message + caution
      };
    }
    
    return turn;
  }

  static validateFactualClaims(turn: AssistantTurn, domainOfLife: DomainOfLife): ValidationError[] {
    const errors: ValidationError[] = [];
    const content = turn.message.toLowerCase();

    // Check for overly confident claims in evidence domains
    const evidenceDomains: DomainOfLife[] = ['health', 'finance', 'career'];
    if (evidenceDomains.includes(domainOfLife)) {
      const confidentClaims = [
        'definitely', 'certainly', 'guaranteed', 'proven', 'scientific fact'
      ];

      for (const claim of confidentClaims) {
        if (content.includes(claim)) {
          errors.push({
            type: 'content',
            message: `Overly confident claim detected: "${claim}"`,
            field: 'factualClaim',
            value: claim,
            suggestion: 'Use more modest language for factual claims'
          });
        }
      }
    }

    return errors;
  }

  static moderateClaims(turn: AssistantTurn, domainOfLife: DomainOfLife): AssistantTurn {
    const evidenceDomains: DomainOfLife[] = ['health', 'finance', 'career'];
    
    if (evidenceDomains.includes(domainOfLife)) {
      let moderatedMessage = turn.message;
      
      // Replace overly confident language
      moderatedMessage = moderatedMessage.replace(/\bdefinitely\b/gi, 'likely');
      moderatedMessage = moderatedMessage.replace(/\bcertainly\b/gi, 'probably');
      moderatedMessage = moderatedMessage.replace(/\bguaranteed\b/gi, 'typically');
      moderatedMessage = moderatedMessage.replace(/\bproven\b/gi, 'suggested');
      moderatedMessage = moderatedMessage.replace(/\bscientific fact\b/gi, 'research suggests');
      
      return {
        ...turn,
        message: moderatedMessage
      };
    }
    
    return turn;
  }
}

