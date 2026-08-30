# Sariro — the things only you can do

> Everything on this list is blocked on an account, a dashboard, or a decision —
> not on engineering. The code for each is already written and pushed.
> **Last updated:** 30 Aug 2026.

---

## 1. Turn on class reminders (10 minutes)

The code is live but sends nothing until both steps are done. It fails closed on
purpose — an open endpoint that writes notifications to arbitrary users is a spam
vector, and a reminder at 3am costs more trust than a missed class.

**Step 1 — run the migration.**
Supabase → SQL Editor → paste `scripts/class-reminders.sql` → Run. Idempotent,
safe to re-run. It adds one column and one index.

**Step 2 — set the secret and schedule it.**

```bash
openssl rand -hex 32          # generate the secret
```

Put it in **Hostinger → env config** as `CRON_SECRET`, then add a cron every
10 minutes:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://sariro.com/api/cron/class-reminders
```

**Check it before trusting it.** `?dryRun=1` lists what *would* be reminded
without sending or claiming anything:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" "https://sariro.com/api/cron/class-reminders?dryRun=1"
```

Expect `{"ok":true,...}`. If you get `401`, the secret is not set or does not
match. If you get `column bookings.reminder_sent_at does not exist`, step 1 has
not run.

Reminders go **in-app only** until you decide D4 below. Add `?email=1` to the
cron URL once you have.

---

## 2. Put Cloudflare in front of sariro.com (30 minutes)

**Why this one is worth doing before any further code.** TTFB is ~946 ms. That is
the ceiling on every page, and no amount of front-end work gets under it — the
server takes that long to answer. Cloudflare caches the static pages at the edge
and serves them in tens of milliseconds. It is the single biggest speed win
available, and it is configuration, not code.

1. **Add the site.** Cloudflare → Add a site → `sariro.com` → Free plan.
2. **Point the nameservers.** Cloudflare gives you two. Set them at your domain
   registrar, replacing Hostinger's. Propagation is usually under an hour.
3. **SSL/TLS → Overview → set to `Full (strict)`.** Not "Flexible" — Flexible
   sends unencrypted traffic between Cloudflare and Hostinger, and will also
   cause redirect loops with Next.js.
4. **Speed → Optimization → enable Brotli.**
5. **Add two cache rules** so logged-in pages and APIs are never cached. This is
   the step that matters most — get it wrong and one student sees another
   student's dashboard.

   Rules → Cache Rules → Create:

   | Rule | If | Then |
   |---|---|---|
   | Bypass dashboard | URI Path starts with `/dashboard` | Cache eligibility: **Bypass cache** |
   | Bypass API | URI Path starts with `/api` | Cache eligibility: **Bypass cache** |

   Add `/auth` to the bypass list too if you add authenticated pages there.

6. **Verify.** After the nameservers switch:

   ```bash
   curl -sI https://sariro.com | grep -iE "cf-cache-status|server"
   curl -sI https://sariro.com/dashboard | grep -i cf-cache-status   # must say BYPASS or DYNAMIC
   ```

   The homepage should eventually report `cf-cache-status: HIT`. `/dashboard`
   must **never** report `HIT`.

**If anything looks wrong,** Cloudflare → Overview → **Pause Cloudflare on this
site** reverts to direct-to-Hostinger in about a minute without touching DNS.

---

## 3. Four decisions

Engineering is not blocked on these, but the product is shaped by them.

| # | Decision | What hangs on it |
|---|---|---|
| **D4** | **WhatsApp or email for class reminders?** | Reminders ship in-app only until this is decided. Email needs nothing new — it is a flag on the cron URL. WhatsApp needs a Meta or Twilio account and a template approval, which takes days, so start it early if that is the answer. |
| **D5** | **`web-201` sells 42 lessons and has 1 written.** | The only place the site sells content that does not exist. Either write the 41, or narrow the public syllabus to what is real. Whichever you pick, the page and the content should agree. |
| D3 | What to cut from each dashboard below the fold | The top of each dashboard now answers its one question; the rest is still long. |
| — | **Should `.env.example` be in the repo?** | It is gitignored twice over, so nobody cloning Sariro gets an env template. It holds no secrets by definition, and committing it is the normal convention. One line in `.gitignore`. |

---

## 4. Confirm two Razorpay values

From `HANDOFF-CONTEXT.md` §5, still outstanding:

- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_CURRENCY=USD`

**Without both, checkout returns 503 by design** — the currency guard refuses to
charge rather than risk billing a $199 course as ₹199. Nothing else on this list
matters as much as being able to take money.

---

## 5. Two things worth a human eye

Neither is broken, but both were verified structurally rather than visually,
because the browser tooling could not screenshot scrolled pages on this site.

- **The warm palette** touched 25 files including dashboards and auth modals.
  Worth ten minutes clicking through `/dashboard`, `/pricing` and the sign-in
  screens.
- **The new homepage sections** (`Seven subjects. One class size.` and
  `Four steps, and the first one is free.`) have never been seen rendered by
  anyone.
