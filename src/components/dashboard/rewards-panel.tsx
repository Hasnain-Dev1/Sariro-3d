'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, Loader2, Check, Lock, Flame } from 'lucide-react';
import {
  fetchGamification, redeemReward, equipReward, CATEGORY_LABEL,
  type GamificationState, type RewardCategory,
} from '@/lib/dashboard/gamification';

/**
 * SARIRO — points and rewards
 * =========================================================
 * V2 §56-57. Turning up earns points; points unlock cosmetics.
 *
 * ── What a locked reward shows ──────────────────────────────────────────────
 * How far away it is, in classes. "45 more points" means nothing to a nine
 * year old; "about 5 more classes" is a thing they can picture. That is the
 * whole mechanic — the number has to connect to the behaviour.
 *
 * ── Nothing here is purchasable ─────────────────────────────────────────────
 * Points cannot be bought and never become class credits. Everything in the
 * catalogue is cosmetic, which is what keeps this a reason to attend rather
 * than a second currency a parent has to think about.
 */

const POINTS_PER_CLASS = 10;

const CATEGORY_ORDER: RewardCategory[] = ['theme', 'background', 'avatar', 'badge', 'effect'];

export default function RewardsPanel() {
  const [state, setState] = useState<GamificationState | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await fetchGamification();
      setState(s);
      setFailed(s ? null : 'Sign in to see your points.');
    } catch {
      setFailed('Rewards are not set up yet.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const grouped = useMemo(() => {
    if (!state) return [];
    return CATEGORY_ORDER
      .map((category) => ({
        category,
        items: state.rewards.filter((r) => r.category === category),
      }))
      .filter((g) => g.items.length > 0);
  }, [state]);

  const unlock = async (key: string) => {
    setBusy(key);
    const res = await redeemReward(key);
    setBusy(null);
    if (res.success) { setMsg({ text: 'Unlocked!', ok: true }); void load(); }
    else setMsg({ text: res.error ?? 'Could not unlock that.', ok: false });
  };

  const equip = async (key: string) => {
    setBusy(key);
    const res = await equipReward(key);
    setBusy(null);
    if (res.success) { setMsg(null); void load(); }
    else setMsg({ text: res.error ?? 'Could not use that.', ok: false });
  };

  if (failed) {
    return <div className="card card--compact"><p className="text-[13px] text-slate-600">{failed}</p></div>;
  }
  if (!state) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance, streak, lifetime. Lifetime never falls, so spending on a
          cosmetic never costs a learner their standing. */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card card--compact">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Points</p>
          <p className="text-2xl font-extrabold tabular-nums mt-1 leading-none text-slate-900">
            {state.balance}
          </p>
        </div>
        <div className="card card--compact">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Streak</p>
          <p className="text-2xl font-extrabold tabular-nums mt-1 leading-none flex items-center gap-1"
            style={{ color: state.streak > 0 ? '#C2410C' : undefined }}>
            {state.streak > 0 && <Flame className="w-5 h-5" />}
            {state.streak}
          </p>
        </div>
        <div className="card card--compact">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Earned ever</p>
          <p className="text-2xl font-extrabold tabular-nums mt-1 leading-none text-slate-900">
            {state.lifetimeEarned}
          </p>
        </div>
      </div>

      {msg && (
        <div
          className="rounded-lg border px-3.5 py-2.5 text-[13px]"
          style={msg.ok
            ? { borderColor: '#A7F3D0', background: '#ECFDF5', color: '#065F46' }
            : { borderColor: '#FCD34D', background: '#FFFBEB', color: '#92400E' }}
        >
          {msg.text}
        </div>
      )}

      {grouped.map((g) => (
        <div key={g.category} className="card card--feature">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            {CATEGORY_LABEL[g.category]}
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {g.items.map((r) => {
              const owned = state.unlocked.has(r.key);
              const inUse = state.equipped.has(r.key);
              const short = r.cost - state.balance;
              const classesAway = Math.ceil(short / POINTS_PER_CLASS);
              return (
                <div key={r.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-[14px]">{r.name}</p>
                      {r.description && (
                        <p className="text-[12.5px] text-slate-500 leading-[1.5]">{r.description}</p>
                      )}
                    </div>
                    {!owned && (
                      <span className="text-[12.5px] font-extrabold text-slate-700 tabular-nums shrink-0">
                        {r.cost}
                      </span>
                    )}
                  </div>

                  {owned ? (
                    <button
                      type="button"
                      onClick={() => equip(r.key)}
                      disabled={busy === r.key || inUse}
                      className={`w-full inline-flex items-center justify-center gap-1.5 min-h-[36px] rounded-lg text-[12.5px] font-bold mt-1.5 ${
                        inUse
                          ? 'bg-green-50 text-green-700 cursor-default'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {busy === r.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : inUse ? <><Check className="w-3.5 h-3.5" /> In use</>
                          : 'Use this'}
                    </button>
                  ) : state.balance >= r.cost ? (
                    <button
                      type="button"
                      onClick={() => unlock(r.key)}
                      disabled={busy === r.key}
                      className="w-full inline-flex items-center justify-center gap-1.5 min-h-[36px] rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-bold mt-1.5 disabled:opacity-50"
                    >
                      {busy === r.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Unlock
                    </button>
                  ) : (
                    // Distance in classes, not points — a number a child can
                    // picture and act on.
                    <p className="w-full text-center text-[12px] text-slate-500 min-h-[36px] flex items-center justify-center gap-1.5 mt-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      About {classesAway} more {classesAway === 1 ? 'class' : 'classes'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {state.history.length > 0 && (
        <div className="card card--feature">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Your points
          </p>
          <ul className="space-y-1">
            {state.history.slice(0, 12).map((t) => (
              <li key={t.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-slate-600 min-w-0 truncate">{t.reason}</span>
                <span
                  className="tabular-nums font-bold shrink-0"
                  style={{ color: t.amount > 0 ? '#15803D' : '#64748B' }}
                >
                  {t.amount > 0 ? `+${t.amount}` : t.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
