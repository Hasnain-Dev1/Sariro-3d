'use client';

import { useEffect } from 'react';
import { targetOf } from '@/lib/ops/commands';

/**
 * SARIRO — taking a member of staff to the thing
 * ============================================================================
 * Queue items and commands point at three kinds of place: a section on this
 * page (#decisions), a tab on this page (?tab=credit_requests — HR's dashboard
 * is tabbed), or another page. Each needs a different move, and a plain link
 * handled none of the first two well: a hash under a sticky header lands the
 * heading behind the header, and a query string does not switch a tab that
 * lives in React state.
 */

const TAB_EVENT = 'sariro:ops-tab';
/** The sticky topbar is 64px; a little more so the heading is not flush against it. */
const HEADER_OFFSET = 84;

export function goTo(href: string, navigate: (href: string) => void): void {
  const target = targetOf(href);

  if (target.kind === 'scroll') {
    const el = document.getElementById(target.id);
    if (!el) { navigate(href); return; }
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: 'smooth' });
    history.replaceState(null, '', `#${target.id}`);
    flash(el);
    return;
  }

  if (target.kind === 'tab') {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', target.tab);
    url.hash = '';
    history.replaceState(null, '', url.toString());
    window.dispatchEvent(new CustomEvent(TAB_EVENT, { detail: target.tab }));
    window.setTimeout(() => {
      const bar = document.getElementById('ops-tabs');
      if (bar) window.scrollTo({ top: bar.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: 'smooth' });
    }, 60);
    return;
  }

  navigate(target.href);
}

/** A brief glow on the section that was jumped to, so the eye finds it. */
function flash(el: HTMLElement) {
  el.classList.remove('ops-flash');
  void el.offsetWidth; // restart the animation if it is already running
  el.classList.add('ops-flash');
  window.setTimeout(() => el.classList.remove('ops-flash'), 1800);
}

/**
 * For a tabbed dashboard: opens the tab named in ?tab= on arrival, and follows
 * the queue and the command bar when they switch it. `allowed` keeps a
 * hand-edited URL from selecting a tab that does not exist.
 */
export function useOpsTab<T extends string>(setTab: (tab: T) => void, allowed: readonly T[]): void {
  useEffect(() => {
    const apply = (tab: string | null) => {
      if (tab && (allowed as readonly string[]).includes(tab)) setTab(tab as T);
    };
    apply(new URLSearchParams(window.location.search).get('tab'));
    const onTab = (e: Event) => apply((e as CustomEvent<string>).detail);
    window.addEventListener(TAB_EVENT, onTab);
    return () => window.removeEventListener(TAB_EVENT, onTab);
    // `allowed` is a constant list at every call site, so it is not a dependency.
  }, [setTab]);
}
