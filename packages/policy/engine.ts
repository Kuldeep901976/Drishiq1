// Policy engine for decision making and validation

import { 
  User, 
  Lang, 
  AgeBand, 
  UserType, 
  DomainOfLife,
  PolicyConfig,
  FeatureFlags,
  ValidationResultDetails
} from '../contracts/types';

// Language enforcement
export class LanguageEnforcer {
  private static readonly SUPPORTED_LANGUAGES: Lang[] = [
    'en', 'hi', 'bn', 'es', 'pt', 'ar', 'de', 'fr', 'ja', 'ru', 'ta', 'zh'
  ];

  static validateLanguage(language: Lang): ValidationResultDetails {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.SUPPORTED_LANGUAGES.includes(language)) {
      errors.push(`Unsupported language: ${language}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static enforceLanguage(content: string, targetLanguage: Lang): string {
    // Simple language enforcement - in production, this would use proper translation
    if (targetLanguage === 'hi' && !/[\u0900-\u097F]/.test(content)) {
      return `[Hindi] ${content}`;
    }
    if (targetLanguage === 'bn' && !/[\u0980-\u09FF]/.test(content)) {
      return `[Bengali] ${content}`;
    }
    if (targetLanguage === 'ar' && !/[\u0600-\u06FF]/.test(content)) {
      return `[Arabic] ${content}`;
    }
    return content;
  }
}

// Age-appropriate content validation
export class AgeContentValidator {
  private static readonly ADULT_KEYWORDS = [
    'alcohol', 'drugs', 'violence', 'explicit', 'mature', 'adult-only'
  ];

  private static readonly CHILD_SAFE_KEYWORDS = [
    'family', 'friends', 'school', 'play', 'learn', 'fun', 'safe'
  ];

  static validateContent(content: string, ageBand: AgeBand): ValidationResultDetails {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (ageBand === 'child' || ageBand === 'teen') {
      const hasAdultContent = this.ADULT_KEYWORDS.some(keyword => 
        content.toLowerCase().includes(keyword)
      );

      if (hasAdultContent) {
        errors.push('Content contains age-inappropriate material');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static adjustToneForAge(content: string, ageBand: AgeBand): string {
    switch (ageBand) {
      case 'child':
        return this.makeChildFriendly(content);
      case 'teen':
        return this.makeTeenFriendly(content);
      case 'adult':
      case 'senior':
        return content; // No adjustment needed
      default:
        return content;
    }
  }

  private static makeChildFriendly(content: string): string {
    // Replace complex words with simpler ones
    return content
      .replace(/\bchallenge\b/g, 'fun problem')
      .replace(/\bstrategy\b/g, 'plan')
      .replace(/\bcomplex\b/g, 'tricky')
      .replace(/\banalyze\b/g, 'look at');
  }

  private static makeTeenFriendly(content: string): string {
    // Make content more relatable for teens
    return content
      .replace(/\bchallenge\b/g, 'situation')
      .replace(/\bstrategy\b/g, 'approach')
      .replace(/\bcomplex\b/g, 'complicated');
  }
}

// Content safety filters
export class ContentSafetyFilter {
  private static readonly PROFANITY_PATTERNS = [
    /\b(shit|damn|hell|fuck|bitch|asshole)\b/gi,
    // Add more patterns as needed
  ];

  private static readonly PII_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}-\d{3}-\d{4}\b/g // Phone
  ];

  static filterProfanity(content: string, enabled: boolean = true): string {
    if (!enabled) return content;

    let filtered = content;
    for (const pattern of this.PROFANITY_PATTERNS) {
      filtered = filtered.replace(pattern, '[FILTERED]');
    }
    return filtered;
  }

  static filterPII(content: string, enabled: boolean = true): string {
    if (!enabled) return content;

    let filtered = content;
    for (const pattern of this.PII_PATTERNS) {
      filtered = filtered.replace(pattern, '[REDACTED]');
    }
    return filtered;
  }

  static validateContent(content: string, policies: PolicyConfig): ValidationResultDetails {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (policies.rules.profanityFilter) {
      const hasProfanity = this.PROFANITY_PATTERNS.some(pattern => 
        pattern.test(content)
      );
      if (hasProfanity) {
        errors.push('Content contains profanity');
      }
    }

    if (policies.rules.piiFilter) {
      const hasPII = this.PII_PATTERNS.some(pattern => 
        pattern.test(content)
      );
      if (hasPII) {
        errors.push('Content contains personally identifiable information');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// User type feature flags
export class FeatureFlagManager {
  private static readonly DEFAULT_FLAGS: Record<UserType, FeatureFlags> = {
    student: {
      id: 'student',
      userType: 'student',
      offerReport: true,
      showAds: false,
      motivationalNudges: true,
      emojiDecoration: true
    },
    professional: {
      id: 'professional',
      userType: 'professional',
      offerReport: true,
      showAds: true,
      motivationalNudges: false,
      emojiDecoration: false
    },
    parent: {
      id: 'parent',
      userType: 'parent',
      offerReport: true,
      showAds: false,
      motivationalNudges: true,
      emojiDecoration: true
    },
    senior: {
      id: 'senior',
      userType: 'senior',
      offerReport: true,
      showAds: false,
      motivationalNudges: false,
      emojiDecoration: false
    },
    other: {
      id: 'other',
      userType: 'other',
      offerReport: true,
      showAds: true,
      motivationalNudges: false,
      emojiDecoration: false
    }
  };

  static getFeatureFlags(userType: UserType): FeatureFlags {
    return this.DEFAULT_FLAGS[userType] || this.DEFAULT_FLAGS.other;
  }

  static canShowAds(userType: UserType): boolean {
    return this.getFeatureFlags(userType).showAds;
  }

  static canOfferReport(userType: UserType): boolean {
    return this.getFeatureFlags(userType).offerReport;
  }

  static shouldShowMotivationalNudges(userType: UserType): boolean {
    return this.getFeatureFlags(userType).motivationalNudges;
  }

  static shouldUseEmojiDecoration(userType: UserType): boolean {
    return this.getFeatureFlags(userType).emojiDecoration;
  }
}

// Evidence mode handler
export class EvidenceModeHandler {
  static addEvidenceCaution(content: string, confidence: number): string {
    if (confidence < 0.7) {
      return `${content}\n\n*Note: This information is based on general patterns and may not apply to your specific situation. Consider consulting with a professional for personalized advice.*`;
    }
    return content;
  }

  static shouldAddEvidenceMode(domainOfLife: DomainOfLife): boolean {
    // Enable evidence mode for domains that require factual accuracy
    const evidenceDomains: DomainOfLife[] = ['health', 'finance', 'career'];
    return evidenceDomains.includes(domainOfLife);
  }
}

// Template availability checker
export class TemplateAvailabilityChecker {
  static checkTemplateAvailability(
    domainOfLife: DomainOfLife,
    ageBand: AgeBand,
    gender: string,
    location: string,
    language: Lang,
    availableTemplates: any[]
  ): boolean {
    return availableTemplates.some(template => 
      template.facets.domainOfLife.includes(domainOfLife) &&
      template.facets.ageBand.includes(ageBand) &&
      template.facets.gender.includes(gender) &&
      template.facets.location.includes(location) &&
      template.facets.language.includes(language) &&
      template.active
    );
  }

  static getBestMatchingTemplate(
    domainOfLife: DomainOfLife,
    ageBand: AgeBand,
    gender: string,
    location: string,
    language: Lang,
    availableTemplates: any[]
  ): any | null {
    const matchingTemplates = availableTemplates.filter(template => 
      template.facets.domainOfLife.includes(domainOfLife) &&
      template.facets.ageBand.includes(ageBand) &&
      template.facets.gender.includes(gender) &&
      template.facets.location.includes(location) &&
      template.facets.language.includes(language) &&
      template.active
    );

    if (matchingTemplates.length === 0) return null;

    // Return the first matching template (could be enhanced with scoring)
    return matchingTemplates[0];
  }
}

// Main policy engine
export class PolicyEngine {
  static processUserInput(
    content: string,
    user: User,
    policies: PolicyConfig,
    featureFlags: FeatureFlags
  ): ValidationResultDetails {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Language validation
    const langValidation = LanguageEnforcer.validateLanguage(user.preferredLanguage);
    if (!langValidation.isValid) {
      errors.push(...langValidation.errors);
    }

    // Age-appropriate content
    const ageValidation = AgeContentValidator.validateContent(content, user.ageBand);
    if (!ageValidation.isValid) {
      errors.push(...ageValidation.errors);
    }

    // Content safety
    const safetyValidation = ContentSafetyFilter.validateContent(content, policies);
    if (!safetyValidation.isValid) {
      errors.push(...safetyValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static processAssistantOutput(
    content: string,
    user: User,
    policies: PolicyConfig,
    domainOfLife: DomainOfLife
  ): string {
    let processed = content;

    // Enforce language
    processed = LanguageEnforcer.enforceLanguage(processed, user.preferredLanguage);

    // Adjust tone for age
    processed = AgeContentValidator.adjustToneForAge(processed, user.ageBand);

    // Filter profanity
    processed = ContentSafetyFilter.filterProfanity(processed, policies.rules.profanityFilter);

    // Filter PII
    processed = ContentSafetyFilter.filterPII(processed, policies.rules.piiFilter);

    // Add evidence mode if enabled
    if (policies.rules.enableEvidenceMode && EvidenceModeHandler.shouldAddEvidenceMode(domainOfLife)) {
      processed = EvidenceModeHandler.addEvidenceCaution(processed, 0.8); // Default confidence
    }

    return processed;
  }
}

