'use client';

import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type ProgressFields = { weightKg: string; bodyFatPct: string; waistCm: string };
type ProgressInput = Partial<Record<keyof ProgressFields, number>>;
type SaveResult = { state: 'saved' | 'rejected' | 'uncertain'; message: string };

export function parseTrainerProgress(fields: ProgressFields):
  { ok: true; value: ProgressInput } | { ok: false; message: string } {
  const value: ProgressInput = {};
  for (const key of ['weightKg', 'bodyFatPct', 'waistCm'] as const) {
    const raw = fields[key].trim();
    if (!raw) continue;
    const number = Number(raw);
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw) ||
      !Number.isFinite(number) || (key === 'bodyFatPct' ? number < 0 || number > 100 : number <= 0)) {
      return { ok: false, message: key === 'bodyFatPct'
        ? 'Body fat must be between 0 and 100%.'
        : `${key === 'weightKg' ? 'Weight' : 'Waist'} must be greater than zero.` };
    }
    value[key] = number;
  }
  if (Object.keys(value).length === 0) return { ok: false, message: 'Enter at least one measurement.' };
  return { ok: true, value };
}

export async function saveTrainerProgress(
  clientId: string,
  value: ProgressInput,
  request: typeof fetch = fetch,
): Promise<SaveResult> {
  if (!clientId) return { state: 'rejected', message: 'Client context is unavailable. Refresh your session.' };
  // The existing endpoint independently requires an admin or a trainer with a shared session.
  // Never retry a request automatically: a response can fail after the record was created.
  try {
    const response = await request(`/api/clients/${encodeURIComponent(clientId)}/measurements`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', body: JSON.stringify(value),
    });
    if (response.status === 400) return { state: 'rejected', message: 'The measurements were not accepted. Check the values and try again.' };
    if (response.status === 401 || response.status === 403) return { state: 'rejected', message: 'You do not have access to record progress for this client. Refresh and check your session.' };
    if (response.status === 201) {
      const record = await response.json();
      if (record && typeof record.id === 'string' && record.id && record.clientId === clientId &&
        Object.entries(value).every(([key, expected]) => record[key] === expected)) {
        return { state: 'saved', message: 'Progress recorded. Latest measurements are refreshing.' };
      }
    }
  } catch {
    // Keep entered values without exposing a server response or raw diagnostic.
  }
  return { state: 'uncertain', message: 'The save could not be confirmed. Refresh and check the latest measurements before recording again.' };
}

export default function TrainerProgressForm({ clientId }: { clientId: string }) {
  const id = useId();
  const router = useRouter();
  const saving = useRef(false);
  const saveBlocked = useRef(false);
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<ProgressFields>({ weightKg: '', bodyFatPct: '', waistCm: '' });
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || saveBlocked.current) return;
    const parsed = parseTrainerProgress(fields);
    if (!parsed.ok) { setMessage(parsed.message); return; }
    saving.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await saveTrainerProgress(clientId, parsed.value);
      setMessage(result.message);
      if (result.state === 'saved') {
        setFields({ weightKg: '', bodyFatPct: '', waistCm: '' });
        router.refresh();
      } else if (result.state === 'uncertain') {
        saveBlocked.current = true;
        setUncertain(true);
      }
    } finally { saving.current = false; setBusy(false); }
  }

  return (
    <div className="mt-3">
      <button type="button" aria-expanded={open} aria-controls={`${id}-form`}
        onClick={() => setOpen(!open)} className="text-sm font-semibold text-flame-600 dark:text-flame-300">
        {open ? 'Hide progress form' : 'Record progress'}
      </button>
      {open && <form id={`${id}-form`} onSubmit={submit} className="mt-3 space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">Record current measurements. Units are shown below.</p>
        <fieldset disabled={busy || uncertain} className="space-y-3">
          <legend className="text-sm font-semibold">Client measurements</legend>
          {([
            ['weightKg', 'Weight (kg)', '0', undefined],
            ['bodyFatPct', 'Body fat (%)', '0', '100'],
            ['waistCm', 'Waist (cm)', '0', undefined],
          ] as const).map(([key, label, min, max]) => <div key={key}>
            <label className="text-sm" htmlFor={`${id}-${key}`}>{label}</label>
            <input id={`${id}-${key}`} name={key} type="number" step="any" min={min} max={max}
              value={fields[key]} onChange={(event) => setFields({ ...fields, [key]: event.target.value })}
              className="input mt-1" />
          </div>)}
          <button type="submit" className="btn-primary">{busy ? 'Saving…' : 'Save measurements'}</button>
        </fieldset>
        {message && <p role="status" className="text-sm">{message}</p>}
        {uncertain && <button type="button" onClick={() => window.location.reload()}
          className="text-sm font-semibold text-flame-600 dark:text-flame-300">
          Refresh latest measurements
        </button>}
      </form>}
    </div>
  );
}
