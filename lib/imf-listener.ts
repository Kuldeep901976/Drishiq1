import { supabase } from '@/lib/supabase';
import { evaluateAndInvoke } from '@/lib/imf-supabase';

console.log("🚀 IMF listener started — watching for new problems...");

supabase
  .channel('problem-listener')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'problems' },
    async (payload: any) => {
      try {
        const context = payload.new;
        console.log("🧩 New problem detected:", context.problem_title);
        await evaluateAndInvoke(context);
        console.log("✅ IMF evaluated successfully for problem:", context.problem_id);
      } catch (err) {
        console.error("❌ IMF listener error:", err);
      }
    }
  )
  .subscribe();