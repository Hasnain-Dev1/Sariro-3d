'use client';

import { useState } from 'react';
import { FilePlus2, History } from 'lucide-react';
import InvoiceGenerator from '@/components/dashboard/invoice-generator';
import InvoiceHistory from '@/components/dashboard/invoice-history';

/**
 * SARIRO — the invoicing workspace
 * =========================================================
 * Two views over one thing: raising an invoice, and everything already raised.
 *
 * They share a mount so that issuing one refreshes the other — a number was
 * just consumed from the series, and history that still shows the previous
 * total would make somebody wonder whether it saved.
 */

export default function InvoiceWorkspace() {
  const [view, setView] = useState<'new' | 'history'>('new');
  /** Bumped on issue, so History reloads rather than showing a stale list. */
  const [issuedAt, setIssuedAt] = useState(0);

  const TABS = [
    { key: 'new' as const, label: 'New invoice', icon: FilePlus2 },
    { key: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200 invoice-workspace-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setView(t.key)}
              className={`inline-flex items-center gap-1.5 min-h-[42px] px-3.5 text-xs font-bold transition-colors ${
                view === t.key
                  ? 'text-violet-700 border-b-2 border-violet-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {view === 'new'
        ? <InvoiceGenerator onIssued={() => setIssuedAt((n) => n + 1)} />
        : <InvoiceHistory key={issuedAt} />}
    </div>
  );
}
