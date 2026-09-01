'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { fetchDemand, type DemandSnapshot, type Slice } from '@/lib/dashboard/demand-data';
import {
  fetchSegmentConversion,
  MIN_FOR_RATE,
  type SegmentConversion,
} from '@/lib/dashboard/segment-conversion';

/**
 * SARIRO — what people are asking for
 * =========================================================
 * Sits beside the money funnel. The funnel answers "how many got through"; this
 * answers "who were they and what did they want", which is the question the
 * booking form started collecting on 1 Sep 2026 and nothing displayed.
 *
 * ── One hue, three charts ───────────────────────────────────────────────────
 * Every chart here is a count of the same thing — enquiries — split a different
 * way. That is MAGNITUDE, so it gets one hue and length does the work. Giving
 * the four learner stages four colours would say they are different KINDS of
 * thing rather than four sizes of the same thing, and it would also mean a
 * stage changing rank could change its colour, which is the one thing a
 * categorical palette must never do.
 *
 * Blue matches the funnel panel above it: same dashboard, same measure, same
 * colour. A second hue would imply a second kind of number.
 *
 * ── Why "not answered" is on the page ───────────────────────────────────────
 * Both fields are optional, and every booking taken before the columns existed
 * has neither. Those rows are counted and shown rather than quietly excluded:
 * a share of 60% means something different depending on whether the other 40%
 * said nothing or were never asked, and a total that disagrees with the request
 * list on the same screen destroys trust in both.
 */

/** Same hue as the funnel panel — one dashboard, one measure. */
const HUE = '#2563EB';
/** The bar's track: the same hue at low alpha, so a bar reads as a share. */
const TRACK = `${HUE}14`;

function BarRow({ slice, widest }: { slice: Slice; widest: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="text-[13.5px] text-slate-800">{slice.label}</span>
        <span className="text-[13px] font-bold text-slate-900 tabular-nums shrink-0">
          {slice.count}
          <span className="ml-2 font-semibold text-slate-500">
            {Math.round(slice.share * 100)}%
          </span>
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ background: TRACK }}>
        <div
          className="h-2 rounded-full transition-[width] duration-500"
          style={{
            // A count of zero must render as nothing, not as a sliver — but a
            // real count too small to see is worse, so non-zero gets a floor.
            width: `${slice.count > 0 ? Math.max((slice.count / widest) * 100, 3) : 0}%`,
            background: HUE,
          }}
        />
      </div>
    </div>
  );
}

function Chart({ title, hint, slices }: { title: string; hint?: string; slices: Slice[] }) {
  if (slices.length === 0) return null;
  const widest = Math.max(...slices.map((s) => s.count), 1);
  return (
    <div className="card card--feature">
      <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {title}
      </p>
      {hint && <p className="text-[12.5px] text-slate-500 mb-4">{hint}</p>}
      <div className={hint ? 'space-y-3' : 'space-y-3 mt-4'}>
        {slices.map((s) => (
          <BarRow key={s.key} slice={s} widest={widest} />
        ))}
      </div>
    </div>
  );
}

export default function DemandPanel() {
  const [data, setData] = useState<DemandSnapshot | null>(null);
  const [conv, setConv] = useState<SegmentConversion | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snapshot = await fetchDemand(30);
        if (!cancelled) setData(snapshot);
        // 90 days, not 30: a conversion rate needs enough enquiries to mean
        // anything, and buying decisions take longer than a month.
        // Failing separately — the demand charts are still worth showing if
        // this join cannot run.
        try {
          const c = await fetchSegmentConversion(90);
          if (!cancelled) setConv(c);
        } catch {
          /* leave the section out rather than break the panel */
        }
      } catch (e) {
        if (!cancelled) setFailed(e instanceof Error ? e.message : 'unknown error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="card card--feature mb-8">
        <p className="font-semibold text-slate-900 mb-1">Could not load demand.</p>
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">
          If this is the first time here, the columns may not exist yet — run{' '}
          <code className="px-1 rounded bg-slate-100">scripts/demo-request-learner.sql</code>.
        </p>
        <p className="text-[12px] text-slate-400 mt-2">{failed}</p>
      </div>
    );
  }

  if (!data) return null;

  const { total, unanswered, stages, subjects, grades, recent, windowDays, empty } = data;
  const answered = total - unanswered;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2.5 mb-4">
        <Users className="w-5 h-5 text-slate-400" />
        <h2 className="text-lg font-bold text-slate-900">Who is asking</h2>
        <span className="text-[12.5px] text-slate-500">last {windowDays} days</span>
      </div>

      {empty ? (
        <div className="card card--feature">
          <p className="font-semibold text-slate-900 mb-1">Nothing to show yet.</p>
          <p className="text-[14px] text-slate-600 leading-[1.6]">
            {total === 0
              ? `No free-class requests in the last ${windowDays} days.`
              : `${total} request${total === 1 ? '' : 's'} in the last ${windowDays} days, none carrying a subject or learner stage — those questions were added to the booking form on 1 Sep 2026, so only bookings taken since then can answer them.`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[13.5px] text-slate-600 mb-4 leading-[1.6]">
            <span className="font-bold text-slate-900 tabular-nums">{answered}</span> of {total}{' '}
            request{total === 1 ? '' : 's'} said who the learner is.
            {unanswered > 0 && (
              <span className="text-slate-500">
                {' '}
                The other {unanswered} either skipped the question or were taken before it existed —
                percentages below are of the {answered} that answered.
              </span>
            )}
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <Chart
              title="Where the learner is"
              hint="School child, student, or somebody in work — this decides who should teach the class."
              slices={stages}
            />
            <Chart
              title="What they want to learn"
              hint="Ranked by enquiries, not by what we sell most of."
              slices={subjects}
            />
          </div>

          {grades.length > 0 && (
            <div className="mt-4">
              <Chart
                title="School enquiries by year"
                hint="Which years the demand actually sits in — in school order, not by size."
                slices={grades}
              />
            </div>
          )}

          {/* ── does who they are predict whether they pay ──────────────
              Rendered as a table, not a chart. These are rates across segments
              of very different sizes, and a bar chart of percentages invites
              the reader to compare a 100% built on two enquiries against a 34%
              built on ninety. The counts sit beside every rate for that reason,
              and a segment under the threshold shows no rate at all. */}
          {conv && !conv.empty && conv.rows.length > 0 && (
            <div className="card card--feature mt-4">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Who actually buys
              </p>
              <p className="text-[12.5px] text-slate-500 mb-4 leading-[1.55]">
                Enquiries in the last {conv.windowDays} days, and how many of them we can prove
                later paid.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="text-left text-[12px] uppercase tracking-wider text-slate-500">
                      <th className="pb-2 font-semibold">Segment</th>
                      <th className="pb-2 font-semibold text-right tabular-nums">Enquiries</th>
                      <th className="pb-2 font-semibold text-right tabular-nums">Paid</th>
                      <th className="pb-2 font-semibold text-right tabular-nums">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conv.rows.map((r) => (
                      <tr key={r.key} className="border-t border-slate-100">
                        <td className="py-2 text-slate-800">{r.label}</td>
                        <td className="py-2 text-right tabular-nums text-slate-700">
                          {r.enquiries}
                        </td>
                        <td className="py-2 text-right tabular-nums text-slate-700">{r.paid}</td>
                        <td className="py-2 text-right tabular-nums font-bold text-slate-900">
                          {r.rate === null ? (
                            <span
                              className="font-semibold text-slate-400"
                              title={`Fewer than ${MIN_FOR_RATE} enquiries — a percentage here would be noise`}
                            >
                              —
                            </span>
                          ) : (
                            `${Math.round(r.rate * 100)}%`
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* The caveat belongs next to the number, not in a footnote
                  nobody reads. A rate believed to be exact, when it is a lower
                  bound, gets used to kill a segment that was doing fine. */}
              <p className="text-[12px] text-slate-500 mt-3 leading-[1.55]">
                <span className="font-semibold text-slate-700">These are floors, not totals.</span>{' '}
                A payment is matched to an enquiry by email address, so anyone who booked with one
                address and paid with another is invisible here — {conv.matchable} of{' '}
                {conv.withEmail} enquiries could be matched to an account at all. The real rates are
                this or better, never worse. A dash means fewer than {MIN_FOR_RATE} enquiries, where
                a percentage would be noise.
              </p>
            </div>
          )}

          {recent.length > 0 && (
            <div className="card card--feature mt-4">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Most recent
              </p>
              {/* A short list of raw answers beside the charts: if a bar looks
                  wrong, this is where you check it without leaving the page. */}
              <ul className="space-y-1.5">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-baseline gap-3 text-[13.5px]">
                    <span className="text-[12px] text-slate-400 tabular-nums shrink-0">{r.at}</span>
                    <span className="text-slate-700">{r.what}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
