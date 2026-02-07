/**
 * Parse interactive blocks - supports both old tag format and new JSON schema format
 */
export function parseInteractiveBlocks(text: string | any) {
  let textStr: string;
  if (typeof text === 'string') {
    textStr = text;
  } else if (text === null || text === undefined) {
    return [];
  } else if (typeof text === 'object') {
    if (text.message) {
      textStr = String(text.message);
    } else if (text.content) {
      textStr = String(text.content);
    } else {
      textStr = JSON.stringify(text);
    }
  } else {
    textStr = String(text);
  }

  if (!textStr || textStr.trim().length === 0) {
    return [];
  }

  const blockRegex = /<BLOCK[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/BLOCK>/gi;
  const blocks: any[] = [];
  let match;

  while ((match = blockRegex.exec(textStr)) !== null) {
    const blockId = match[1];
    const blockContent = match[2].trim();

    if (blockContent.trim().startsWith('{')) {
      try {
        const jsonData = JSON.parse(blockContent);

        if (jsonData.type === 'onboarding_deep_intake_round' && jsonData.questions) {
          blocks.push({
            id: blockId,
            type: 'onboarding_deep_intake_round',
            title: jsonData.title,
            description: jsonData.description,
            roundNumber: jsonData.roundNumber,
            totalRounds: jsonData.totalRounds,
            questions: jsonData.questions.map((q: any) => ({
              id: q.id,
              label: q.label,
              type: q.type || 'single_choice',
              options: q.options || [],
              required: q.required !== false,
            })),
          });
          continue;
        }

        if (jsonData.type === 'onboarding_question_bundle' && jsonData.questions) {
          blocks.push({
            id: blockId,
            type: 'onboarding_question_bundle',
            title: jsonData.title,
            description: jsonData.description,
            questions: jsonData.questions.map((q: any) => ({
              id: q.id,
              label: q.label,
              type: q.type || 'single_choice',
              options: q.options || [],
            })),
          });
          continue;
        }

        if (jsonData.type === 'onboarding_next_steps' && jsonData.options) {
          blocks.push({
            id: blockId,
            type: 'onboarding_next_steps',
            title: jsonData.title,
            description: jsonData.description,
            options: jsonData.options,
          });
          continue;
        }
      } catch (e) {
        // fall through
      }
    }

    const qRegex = /<Q>([\s\S]*?)<\/Q>/i;
    const tRegex = /<TYPE>([\s\S]*?)<\/TYPE>/i;
    const oRegex = /<OPTION[^>]*>([\s\S]*?)<\/OPTION>/gi;

    const questionMatch = blockContent.match(qRegex);
    const typeMatch = blockContent.match(tRegex);
    const optionMatches = Array.from(blockContent.matchAll(oRegex));

    blocks.push({
      id: blockId,
      question: questionMatch ? questionMatch[1].trim() : '',
      type: typeMatch ? typeMatch[1].trim() : 'single',
      options: optionMatches.map((m) => m[1].trim()),
    });
  }

  return blocks;
}
