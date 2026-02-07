import { NextRequest, NextResponse } from 'next/server';
import { PersistentThreadManager } from '@/packages/core/persistent-thread-manager';
import { createServiceClient } from '@/lib/supabase';
import { createResponse, normalizeResponse } from '@/lib/responses/responsesClient';

export async function POST(req: NextRequest) {
  try {
    const { threadId } = await req.json();
    if (!threadId) {
      return NextResponse.json({ message: '' });
    }

    const threadManager = new PersistentThreadManager();
    const thread = await threadManager.getThread(threadId);
    if (!thread) {
      return NextResponse.json({ message: '' });
    }

    let first_name = 'unknown';
    let age_range = 'unknown';
    let gender = 'unknown';
    let problem_statement: string | null = null;

    if (thread.temp_user_id) {
      const supabase = createServiceClient();
      const { data: tempUser } = await supabase
        .from('temp_users')
        .select('name, age_range, gender, problem_statement')
        .eq('id', thread.temp_user_id)
        .maybeSingle();
      if (tempUser) {
        first_name = tempUser.name?.trim() || 'unknown';
        age_range = tempUser.age_range?.trim() || 'unknown';
        gender = tempUser.gender?.trim() || 'unknown';
        problem_statement = tempUser.problem_statement;
      }
    }

    const timezone = 'UTC';
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      })
        .formatToParts(new Date())
        .find(p => p.type === 'hour')?.value || '12'
    );

    if (hour >= 23 || hour < 6) {
      return NextResponse.json({ message: '' });
    }

    const prompt = `
You are continuing a casual human conversation after a pause.

This is NOT a reminder.
This is NOT empathy.
This is NOT coaching.

You simply continue the same question naturally.

User name: ${first_name}
Age range: ${age_range}
Gender: ${gender}
Issue (if shared): ${problem_statement || 'not shared'}

Write ONE short, natural sentence that feels like the same person continuing the chat.

No greetings.
No "are you there".
No motivational tone.
Max 16 words.
`;

    const llm = await createResponse(
      {
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: 'Continue a paused human conversation naturally.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      },
      'greeter'
    );

    const normalized = normalizeResponse(llm);
    const message = normalized.content?.trim() || '';

    return NextResponse.json({ message });
  } catch (e) {
    return NextResponse.json({ message: '' });
  }
}
