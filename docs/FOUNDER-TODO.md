# Sariro — the things only you can do

> Everything on this list is blocked on an account, a dashboard, or a decision —
> not on engineering. The code for each is already written and pushed.
> **Last updated:** 30 Aug 2026.

---

## 0. REDEPLOY FIRST — nothing below works without it

Checked 30 Aug 2026: **sariro.com is running old code.** The homepage still
titles itself "AI & Technology Education", the nav still has Explore + Subjects,
`/subjects` still returns 200 instead of redirecting, and
`/api/cron/class-reminders` returns **404**.

Everything from this session is pushed to GitHub and none of it is deployed —
the curriculum, the homepage, the copy, the warm palette, the CSP fix, the
reminders. **Pull `main` on Hostinger and rebuild.** One deploy makes it all live.

Setting `CRON_SECRET` before this does nothing: the route it protects does not
exist in production yet.

Verify the deploy took:
```bash
curl -s https://sariro.com | grep -o '<title>[^<]*</title>'
# want: Sariro — live classes in maths, science, English and coding
curl -s -o /dev/null -w "%{http_code}
" https://sariro.com/api/cron/class-reminders
# want: 401 (route exists, secret not set yet) — NOT 404
```

---

## 1. Turn on class reminders (5 minutes, after the deploy)

The migration is **already done** — you ran `scripts/class-reminders.sql` and got
"Success. No rows returned", which is correct for DDL. Only the secret and the
cron are left. It fails closed on
purpose — an open endpoint that writes notifications to arbitrary users is a spam
vector, and a reminder at 3am costs more trust than a missed class.

**Set the secret and schedule it.**

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

**I overstated this earlier — here is the measured picture.** You already have a
CDN: `sariro.com` returns `Server: hcdn` (Hostinger's), and Next.js caching is
working (`x-nextjs-cache: HIT`). So Cloudflare is not the transformation I first
implied, and you were right to ask.

What the numbers actually say, measured 30 Aug 2026:

| Phase | Time | What fixes it |
|---|---|---|
| DNS + TCP + TLS | ~320 ms | A closer edge — Cloudflare has ~330 locations, Hostinger far fewer. This is the part Cloudflare genuinely fixes. |
| Server thinking | ~270 ms | Nothing at the CDN. This is Hostinger + Supabase. |
| **Transferring the page** | **~630 ms** | **The homepage is 444 KB of HTML (already Brotli'd). No CDN fixes a page that big — it only moves it closer.** |

So: Cloudflare buys you maybe 300 ms of the ~1.2 s, and the single biggest win is
actually shipping a smaller homepage — that is engineering work, not config.

**The stronger reason to do it is security, not speed.** The free tier gives a
WAF, DDoS protection, and **edge rate limiting**. Sariro's own rate limiter is
in-memory, so every deploy clears every block; Cloudflare rejects abuse before it
reaches Hostinger at all and survives deploys by definition. That fixes a real
gap that would otherwise need code and another migration.

**If you only do one thing here, do the cache rules in step 5** — those are what
keep dashboards and APIs uncached, and getting them wrong is the only way this
change can hurt you.

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
