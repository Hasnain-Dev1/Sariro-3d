'use client';

import { useState } from 'react';
import ModuleOutline, { type OutlineModule } from '@/components/curriculum/module-outline';

/**
 * SARIRO — the five Public Speaking syllabi, one tab per age group
 * ============================================================================
 * Each age group is its own course with its own modules and lesson titles, so
 * the course page cannot show "the" syllabus. A parent picks their child's age
 * group and reads that course; switching tabs shows how differently the same
 * forty-eight weeks are spent at seven and at twenty-seven.
 */

export interface SyllabusTab {
  key: string;
  emoji: string;
  name: string;
  grades: string;
  color: string;
  promise: string;
  modules: OutlineModule[];
}

export default function SpeakingSyllabusTabs({ tabs, accent }: { tabs: SyllabusTab[]; accent: string }) {
  const [active, setActive] = useState(tabs[0]?.key ?? '');
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!tab) return null;
  return (
    <div>
      <div role="tablist" aria-label="Age group" className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => {
          const on = t.key === tab.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold border transition-colors ${
                on ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
              style={on ? { background: t.color } : undefined}
            >
              <span aria-hidden>{t.emoji}</span> {t.grades}
            </button>
          );
        })}
      </div>
      <p className="prose-measure text-[14.5px] text-slate-600 leading-[1.65] mb-5">
        <span className="font-semibold text-slate-900">{tab.name} · {tab.grades}.</span> {tab.promise}
      </p>
      <ModuleOutline key={tab.key} accent={accent} modules={tab.modules} />
    </div>
  );
}
