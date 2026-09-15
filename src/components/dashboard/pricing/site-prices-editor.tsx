'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Globe, Loader2, Save } from 'lucide-react';
import { LESSONS_PER_GRADE } from '@/lib/school/curriculum';
import { cadencePlans, formatPrice, perClassFor, type SitePrices } from '@/lib/school/pricing';
import { LABEL, SITE_PRICE_LIMITS, validateSitePrices } from '@/lib/pricing/site-prices';
import { Card, NumberField } from './fields';

/**
 * The website's own prices — still dollars, still one price worldwide. What is
 * saved here is what every page shows and what checkout charges, within a
 * moment of saving. The rupee price list above is for the sales team and is
 * not shown on the website.
 */
export default function SitePricesEditor() {
  const [saved, setSaved] = useState<SitePrices | null>(null);
  const [draft, setDraft] = useState<SitePrices | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/site-prices', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!live || !j?.ok) return;
        setSaved(j.prices);
        setDraft(j.prices);
      })
      .catch(() => { if (live) setMsg({ ok: false, text: 'Could not load the website prices.' }); });
    return () => { live = false; };
  }, []);

  if (!draft || !saved) {
    return (
      <Card title="Website prices ($)" icon={<Globe className="w-4 h-4 text-slate-500" />}>
        <div className="flex items-center gap-2 text-[13px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      </Card>
    );
  }

  const check = validateSitePrices(draft);
  const dirty = (Object.keys(draft) as (keyof SitePrices)[]).some((k) => draft[k] !== saved[k]);
  const set = (k: keyof SitePrices) => (v: number | null) => { setMsg(null); setDraft({ ...draft, [k]: v ?? NaN }); };
  const preview = check.ok ? check.prices : null;

  const save = async () => {
    if (!check.ok) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/site-prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: check.prices }),
      });
      const j = await res.json();
      if (j?.ok) {
        setSaved(j.prices);
        setDraft(j.prices);
        setMsg({ ok: true, text: 'Saved. The website and checkout now use these prices.' });
      } else {
        setMsg({ ok: false, text: j?.message ?? 'That did not save.' });
      }
    } catch {
      setMsg({ ok: false, text: 'That did not save.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Website prices ($)"
      icon={<Globe className="w-4 h-4 text-slate-500" />}
      aside={
        <a href="/pricing" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-700 hover:text-blue-900">
          Open /pricing <ExternalLink className="w-3.5 h-3.5" />
        </a>
      }
    >
      <p className="text-[12.5px] text-slate-600 mb-4 max-w-2xl">
        The school-subject prices every visitor sees, anywhere in the world. Every other figure on the site — per class,
        the 3-month plan, the full year — is worked out from these four, and checkout charges from them too.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['groupMonthly', 'oneToOneMonthly'] as const).map((k) => (
          <NumberField key={k} label={LABEL[k]} prefix="$" value={Number.isFinite(draft[k]) ? draft[k] : null} allowEmpty onChange={set(k)}
            hint={`$${SITE_PRICE_LIMITS[k].min}–$${SITE_PRICE_LIMITS[k].max}`} />
        ))}
        {(['quarterlyDiscount', 'fullDiscount'] as const).map((k) => (
          <NumberField key={k} label={LABEL[k]} suffix="% off" value={Number.isFinite(draft[k]) ? draft[k] : null} allowEmpty onChange={set(k)}
            hint={`0–${SITE_PRICE_LIMITS[k].max}%`} />
        ))}
      </div>

      {!check.ok && <p className="mt-3 text-[12.5px] font-semibold text-rose-700">{check.error}</p>}

      {preview && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
            What the website will show
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['1:4', '1:1'] as const).map((ratio) => (
              <div key={ratio} className="text-[13px] text-slate-700">
                <p className="font-bold text-slate-900">{ratio === '1:4' ? 'Small batch (1:4)' : 'One to one'}</p>
                <p className="tabular-nums">{formatPrice(ratio === '1:4' ? preview.groupMonthly : preview.oneToOneMonthly)} a month · {formatPrice(perClassFor(ratio, preview))} a class</p>
                {cadencePlans(LESSONS_PER_GRADE, ratio, preview).slice(1).map((p) => (
                  <p key={p.cadence} className="tabular-nums text-slate-600">
                    {p.label}: {p.perPaymentFormatted}{p.savingLabel ? ` · ${p.savingLabel.toLowerCase()} a year` : ''}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || !check.ok || busy}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-slate-900 text-white text-[13px] font-bold disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save website prices
        </button>
        {dirty && (
          <button type="button" onClick={() => { setDraft(saved); setMsg(null); }} className="text-[13px] font-bold text-slate-500 hover:text-slate-800">
            Discard
          </button>
        )}
        {msg && (
          <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
            {msg.ok && <CheckCircle2 className="w-4 h-4" />} {msg.text}
          </span>
        )}
      </div>
    </Card>
  );
}
