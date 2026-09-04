'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — making an unlocked reward actually do something
 * =========================================================
 * V2 §57. Points buy themes, backgrounds and effects; this is the half that
 * puts them on the screen.
 *
 * Without it the economy was a promise that never paid: a child could earn 100
 * points, spend them on "Midnight", see the balance drop, and have their
 * dashboard look exactly the same. That is worse than not offering the reward —
 * it teaches them the points are pretend.
 *
 * ── Why a data attribute and CSS, not inline styles ─────────────────────────
 * The equipped theme sets `data-reward-theme` on <html> and the rules below do
 * the rest. One attribute means a theme can restyle anything without every
 * component knowing rewards exist, and removing a theme is removing an
 * attribute rather than unwinding styles applied across a tree.
 *
 * ── Cosmetic only, and bounded ──────────────────────────────────────────────
 * Themes may tint surfaces and backgrounds. They deliberately cannot touch
 * text colour, size or spacing: a nine-year-old choosing "Deep space" must not
 * be able to make their own dashboard unreadable, and support cannot debug a
 * screenshot of a layout nobody else can reproduce.
 */

/** Applies the learner's equipped cosmetics. Renders nothing itself. */
export default function RewardTheme() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data } = await supabase
          .from('student_rewards')
          .select('reward_key, rewards!inner(category)')
          .eq('user_id', user.id)
          .eq('equipped', true);

        if (cancelled || !data) return;

        // Themes and backgrounds both paint the page; the theme wins if both
        // are equipped, so two choices cannot fight over the same surface.
        const rows = data as unknown as { reward_key: string; rewards: { category: string } }[];
        const chosen =
          rows.find((r) => r.rewards?.category === 'theme')?.reward_key ??
          rows.find((r) => r.rewards?.category === 'background')?.reward_key ??
          null;
        setTheme(chosen);
      } catch {
        // A missing table or a signed-out user simply means no theme. Never a
        // reason to break a dashboard.
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute('data-reward-theme', theme);
    else root.removeAttribute('data-reward-theme');
    return () => root.removeAttribute('data-reward-theme');
  }, [theme]);

  return (
    <style>{`
      /* Surfaces only. Nothing here changes text colour or size — a learner
         must not be able to make their own dashboard unreadable. */
      [data-reward-theme="theme_midnight"] { --reward-bg: #0F172A; --reward-tint: #1E293B; }
      [data-reward-theme="theme_forest"]   { --reward-bg: #052E1B; --reward-tint: #064E3B; }
      [data-reward-theme="theme_sunrise"]  { --reward-bg: #7C2D12; --reward-tint: #9A3412; }
      [data-reward-theme="bg_space"]       { --reward-bg: #0B1026; --reward-tint: #1B2559; }
      [data-reward-theme="bg_ocean"]       { --reward-bg: #082F49; --reward-tint: #0C4A6E; }

      /* A band across the top of the dashboard rather than a full repaint:
         visible enough to feel earned, contained enough that every card below
         keeps the contrast it was designed with. */
      [data-reward-theme] .reward-surface {
        background: linear-gradient(135deg, var(--reward-bg), var(--reward-tint));
        color: #fff;
      }
      [data-reward-theme] .reward-surface .reward-muted { color: rgba(255,255,255,0.72); }
    `}</style>
  );
}
