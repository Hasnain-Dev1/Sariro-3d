# Sariro — Supabase auth emails

Six templates. **Do not edit the `.html` files** — they are generated.
Edit [`scripts/build-email-templates.mjs`](../../scripts/build-email-templates.mjs)
(copy and layout) or [`scripts/build-email-art.mjs`](../../scripts/build-email-art.mjs)
(the artwork), then:

```bash
npm run email:build
```

That regenerates the PNG/JPEG art into `public/images/email/` **and** the six
HTML files here.

## Order of operations — this one matters

The artwork is served from `https://sariro.com/images/email/`. Until that is
deployed, every email falls back to its flat version. So:

1. **Push and rebuild the site first** — that publishes the art.
2. Then paste the templates into Supabase.

Doing it the other way round is not broken, just plain, until the deploy lands.

## Where each one goes

Supabase Dashboard → **Authentication** → **Emails** → *Templates*.
Open the file, copy the whole thing (including `<!DOCTYPE …>`), paste it into the
message body, and set the subject beside it.

| Supabase template | File | Subject line | Colour |
|---|---|---|---|
| Confirm signup | `confirm-signup.html` | `Confirm your email — Sariro` | blue |
| Invite user | `invite-user.html` | `You've been invited to Sariro` | green |
| Magic Link | `magic-link.html` | `Your Sariro sign-in link` | cyan |
| Change Email Address | `change-email.html` | `Confirm your new email — Sariro` | violet |
| Reset Password | `reset-password.html` | `Reset your Sariro password` | amber |
| Reauthentication | `reauthentication.html` | `Your Sariro confirmation code` | cyan |

Each file is self-contained: no stylesheet to link, no font to load, nothing to
configure. Every one is 13–15 KB, well under Gmail's 102 KB clipping threshold.

## The variables are Supabase's own

| Variable | Used in |
|---|---|
| `{{ .ConfirmationURL }}` | the button — all but Reauthentication |
| `{{ .Token }}` | the six-digit code |
| `{{ .Email }}` | reset, change-email, invite |
| `{{ .NewEmail }}` | change-email only |

There is deliberately no `{{ slice .Token 0 1 }}` anywhere, tempting as one digit
per tile would look. Supabase does not promise which Go template functions are
available, and an auth email that fails to render is an account nobody can get
into. The code goes out whole.

Reauthentication has **no link** on purpose. Supabase sends it to confirm the
person at the keyboard before something sensitive, and a clickable link would
defeat the point — the code has to be carried by hand back to the tab that asked.

## How it is built

Two layers, and the split is the whole design:

**Structure is table cells.** The tactile ledge under every button and under the
card is not `box-shadow` — Outlook has never supported it — it is a darker table
row, inset a few pixels, sitting underneath. Same for the five-colour bar and the
underline. It renders in Outlook 2013 exactly as it does in Apple Mail.

**Decoration is images.** A table cell cannot blur, glow, overlap or float, and a
flat band of colour looks like a bank statement. So the glow behind each headline
is a real JPEG, written as SVG and rasterised by sharp.

**The banner is 1200×520 and the cell it fills is 260px tall.** That is not a
coincidence — 1200×520 at the card's 600px width *is* 260px, and the cell is
`background-size: cover`, so any other ratio crops. The first thing cropped off
a taller image is the bottom, which is where the wave is. Change one of those
numbers and you must change the other; both are commented at their definitions.

**Every image sits behind a `bgcolor` that is the flat version of the same
design.** Images blocked → warm-black band, coloured kicker, tactile button: a
finished email, not a broken one. Images on → it lights up. Nothing is ever lost
when an image fails, only added when it arrives. This is verified, not assumed.

No word is ever baked into a picture, for the same reason — **with one
deliberate exception: the logo.** `public/logo.svg` is rasterised into a single
lockup PNG (mark + "Sariro"), because an `<img>` with an empty `alt` still
leaves a placeholder box wherever images are blocked. "Logo picture + live text"
degraded to "broken picture next to the word Sariro", which looks worse than
either. One image carrying the whole lockup degrades to its **alt text**, dressed
by inline font styles into the same typed wordmark the header had before the real
logo went in.

A logo is the one safe place for this, because `alt` can carry the whole of what
the picture says. A heading never can — which is why every word in the banners is
still live HTML. Expect a small placeholder glyph beside the alt text in some
clients; that is the client's own chrome, not something the template controls.

## The flows these emails belong to

| Email | Sent by | Lands on |
|---|---|---|
| Confirm signup | `/auth/sign-up` | `/auth/callback` → dashboard |
| Magic Link | **Email me a code instead**, on `/auth/sign-in` | verified in place, no redirect |
| Reset Password | `/auth/forgot-password` | `/auth/callback` → `/auth/reset-password` |
| Invite user | Supabase dashboard | `/auth/callback` → dashboard |

`https://sariro.com/auth/callback` must be in **Authentication → URL
Configuration → Redirect URLs**. It already is, for Google and GitHub — worth
checking if a reset link ever bounces to the site root.

## Before you rely on these

**Turn on custom SMTP first.** Supabase's built-in mailer is rate limited to a
handful of messages an hour and sends from a Supabase address, so on a busy
morning the fourth parent to sign up gets nothing — with no error anywhere they
can see. Use the Hostinger credentials the rest of the product already sends
through (`HOSTINGER_MAIL_*` in `.env`), under Project Settings → Authentication →
SMTP Settings.

Until that is done these templates are correct and largely undelivered.
