'use client';

import { useEffect } from 'react';
import { targetOf } from '@/lib/ops/commands';

/**
 * SARIRO — taking a member of staff to the thing
 * ============================================================================
 * Queue items and commands point at four kinds of place: a section
 * (/dashboard/super-admin/finance#expenses), a tab (/dashboard/hr?tab=sales —
 * HR's dashboard is tabbed), a dialog (/dashboard/admin/classes?do=schedule-
 * batch), or another page. On the page already open, each needs its own move:
 * a hash under a sticky header lands the heading behind the header, a query
 * string does not switch a tab that lives in React state, and nothing opens a
 * dialog. Anywhere else it is a navigation, and the page finishes the job on
 * arrival (useOpsTab, useOpsDo, and the arrival in workspace.tsx).
 */

const TAB_EVENT = 'sariro:ops-tab';
export const DO_EVENT = 'sariro:ops-do';
/** The sticky topbar is 64px; a little more so the heading is not flush against it. */
const HEADER_OFFSET = 84;

export function scrollToElement(el: HTMLElement) {
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: 'smooth' });
}

export function goTo(href: string, navigate: (href: string) => void): void {
  const target = targetOf(href, window.location.pathname);

  if (target.kind === 'scroll') {
    const el = document.getElementById(target.id);
    if (!el) { navigate(href); return; }
    scrollToElement(el);
    history.replaceState(history.state, '', `${window.location.pathname}${window.location.search}#${target.id}`);
    flash(el);
    return;
  }

  if (target.kind === 'tab') {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', target.tab);
    url.hash = '';
    history.replaceState(history.state, '', url.toString());
    window.dispatchEvent(new CustomEvent(TAB_EVENT, { detail: target.tab }));
    window.setTimeout(() => {
      const bar = document.getElementById('ops-tabs');
      if (bar) scrollToElement(bar);
    }, 60);
    return;
  }

  if (target.kind === 'do') {
    window.dispatchEvent(new CustomEvent(DO_EVENT, { detail: target.action }));
    return;
  }

  navigate(target.href);
}

/** A brief glow on the section that was jumped to, so the eye finds it. */
export function flash(el: HTMLElement) {
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
