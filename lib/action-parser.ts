// lib/action-parser.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parseISO, isValid } from 'date-fns';

const ajv = new Ajv({ allErrors: true, removeAdditional: true });
addFormats(ajv);

// paste the JSON Schema from Step 2 as action-packet.schema.json and require it here
const schema = require('./schemas/action-packet.schema.json');
const validate = ajv.compile(schema);

type RawAction = {
  event_name: string;
  start_date?: string | null;
  duration_days?: number | null;
  metric?: any;
  owner?: string | null;
  metadata?: Record<string, any>;
};

type ActionPacket = {
  problem: { summary: string; domain_of_life?: string; severity?: number; prob_id?: string | null };
  actions: RawAction[];
  metadata?: Record<string, any>;
};

function normalizeDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const iso = parseISO(s);
  if (isValid(iso)) return iso.toISOString().split('T')[0];
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

export function extractActionPacketJson(text: string): string | null {
  const match = text.match(/ACTION_PACKET\s*:\s*({[\s\S]*?})\s*(?=(?:\n[A-Z_ ]+?:)|$)/i);
  if (match) return match[1];
  const fallback = text.match(/({\s*"problem"[\s\S]*})/i);
  if (fallback) return fallback[1];
  return null;
}

export function parseActionPacket(text: string): { packet?: ActionPacket; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const jsonText = extractActionPacketJson(text);

  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed.actions)) {
        parsed.actions = parsed.actions.map((a: any, idx: number) => {
          const norm = { ...a };
          if (norm.start_date) {
            const iso = normalizeDate(norm.start_date);
            if (iso) norm.start_date = iso;
            else { warnings.push(`Action[${idx}] start_date unparseable: ${norm.start_date}`); norm.start_date = null; }
          }
          if (!norm.metadata) norm.metadata = {};
          return norm;
        });
      }
      const valid = validate(parsed);
      if (!valid) {
        errors.push(...(validate.errors || []).map(e => `${e.instancePath} ${e.message}`));
        return { packet: parsed as ActionPacket, errors, warnings };
      }
      return { packet: parsed as ActionPacket, errors, warnings };
    } catch (e: any) {
      errors.push('ACTION_PACKET JSON parse error: ' + e.message);
      // fallthrough to heuristics
    }
  }

  // fallback heuristics (best-effort)
  const actions: RawAction[] = [];
  const lines = text.split(/\r?\n/);
  let current: Partial<RawAction> | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const ev = line.match(/^(?:Event|Action|Task)\s*[:\-]\s*(.+)$/i);
    const start = line.match(/^(?:Start|Start Date)\s*[:\-]\s*(.+)$/i);
    const dur = line.match(/^(?:Duration)\s*[:\-]\s*(\d+)\s*(?:days)?/i);
    if (ev) { if (current) actions.push(current as RawAction); current = { event_name: ev[1].trim(), metadata: {} }; continue; }
    if (start && current) { current.start_date = normalizeDate(start[1].trim()); if (!current.start_date) warnings.push(`Unparseable start_date: ${start[1]}`); continue; }
    if (dur && current) { current.duration_days = parseInt(dur[1], 10); continue; }
    // inline detection: "Name - 2025-11-01 - 7d"
    const inlineParts = line.split(/\s*[-|]\s*/);
    if (!ev && inlineParts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(inlineParts[1])) {
      const a: RawAction = { event_name: inlineParts[0], start_date: normalizeDate(inlineParts[1]) };
      const durCandidate = inlineParts.find(p => /(\d+)d\b/.test(p));
      if (durCandidate) { const m = durCandidate.match(/(\d+)d/); if (m) a.duration_days = parseInt(m[1],10); }
      actions.push(a); current = null; continue;
    }
  }
  if (current) actions.push(current as RawAction);
  if (actions.length === 0) { errors.push('No actions parsed.'); return { errors, warnings }; }

  const packet: ActionPacket = { problem: { summary: 'Parsed from text (fallback)' }, actions };
  const valid = validate(packet as any);
  if (!valid) warnings.push(...(validate.errors || []).map(e => `${e.instancePath} ${e.message}`));
  return { packet, errors, warnings };
}
