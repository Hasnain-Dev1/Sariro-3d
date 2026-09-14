'use client';

import { createContext, useContext, useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import {
  sectionSpec, type AnySectionId, type WorkspaceKey, type WorkspaceRole,
} from '@/lib/ops/workspaces';
import { DO_EVENT, flash, scrollToElement } from './go-to';

/**
 * SARIRO — one workspace page
 * ============================================================================
 * The admin and super-admin dashboards are one component each, rendered at a
 * different address per workspace. WorkspaceProvider says which workspace this
 * is; OpsSection renders a section only when lib/ops/workspaces.ts places it
 * here. The page lists every section once, in order, and the registry decides
 * where each one shows — so moving a panel to another workspace is a one-word
 * change, and every link to it moves with it.
 */

interface WorkspaceContext {
  role: WorkspaceRole;
  workspace: WorkspaceKey;
}

const Ctx = createContext<WorkspaceContext | null>(null);

export function useWorkspace(): WorkspaceContext | null {
  return useContext(Ctx);
}

/** Whether a section is on this page — for skipping the data it would load. */
export function useShows(id: AnySectionId): boolean {
  const ws = useContext(Ctx);
  return !!ws && sectionSpec(ws.role, id)?.workspace === ws.workspace;
}

export function WorkspaceProvider({ role, workspace, children }: WorkspaceContext & { children: ReactNode }) {
  useArrival(workspace);
  return <Ctx.Provider value={{ role, workspace }}>{children}</Ctx.Provider>;
}

export function OpsSection({
  id, title, icon: Icon, bare = false, children,
}: {
  id: AnySectionId;
  /** Heading; defaults to the section's name in the registry. */
  title?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** For panels that draw their own heading. */
  bare?: boolean;
  children: ReactNode;
}) {
  const ws = useContext(Ctx);
  if (!ws) return null;
  const spec = sectionSpec(ws.role, id);
  if (!spec || spec.workspace !== ws.workspace) return null;
  return (
    <section id={id} className="mb-10 scroll-mt-24" aria-label={spec.label}>
      {!bare && (
        <div className="flex items-center gap-2.5 mb-4">
          {Icon && <Icon className="w-5 h-5 text-slate-400" />}
          <h2 className="text-lg font-bold text-slate-900">{title ?? spec.label}</h2>
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Jobs that open a dialog rather than a section — "Schedule a batch", "Book a
 * trial". ⌘K and the Today queue send `?do=schedule-batch`; the page opens the
 * dialog on arrival, or at once if it is already open. The parameter is taken
 * off the address afterwards, so a reload does not open it again.
 */
export function useOpsDo(handlers: Record<string, () => void>): void {
  const ref = useRef(handlers);
  useEffect(() => { ref.current = handlers; });

  useEffect(() => {
    const run = (action: string | null) => {
      const handler = action ? ref.current[action] : undefined;
      if (handler) window.setTimeout(handler, 0);
    };
    const url = new URL(window.location.href);
    const action = url.searchParams.get('do');
    if (action) {
      url.searchParams.delete('do');
      history.replaceState(history.state, '', url.toString());
      run(action);
    }
    const onDo = (e: Event) => run((e as CustomEvent<string>).detail);
    window.addEventListener(DO_EVENT, onDo);
    return () => window.removeEventListener(DO_EVENT, onDo);
  }, []);
}

/**
 * Arriving at /dashboard/super-admin/finance#expenses from another page. The
 * browser's own jump fires before the panels above have loaded, and each one
 * that fills in pushes the target further down — so land once the section
 * exists, flash it, and land again after the page settles unless the reader
 * has started scrolling themselves.
 */
function useArrival(workspace: WorkspaceKey) {
  useEffect(() => {
    const timers: number[] = [];
    let touched = false;
    const onTouch = () => { touched = true; };

    const land = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      touched = false;
      let tries = 0;
      const attempt = () => {
        const el = document.getElementById(id);
        if (!el) {
          if (++tries < 25) timers.push(window.setTimeout(attempt, 120));
          return;
        }
        scrollToElement(el);
        flash(el);
        for (const delay of [600, 1400]) {
          timers.push(window.setTimeout(() => { if (!touched) scrollToElement(el); }, delay));
        }
      };
      attempt();
    };

    land();
    window.addEventListener('hashchange', land);
    window.addEventListener('wheel', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('keydown', onTouch);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('hashchange', land);
      window.removeEventListener('wheel', onTouch);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', onTouch);
    };
  }, [workspace]);
}
