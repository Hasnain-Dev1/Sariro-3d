import { NextResponse } from 'next/server';
import { isSupabaseConfigured, createServerClientHelper } from '@/lib/supabase/server';

/* ===============================================================
   /auth/callback — OAuth redirect handler
   Supabase redirects here after Google/GitHub OAuth completes.
   We exchange the code for a session, then redirect to ?next=.
=============================================================== */

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // Same default as the sign-in pages: a person who has just authenticated is
  // going to their dashboard unless they were sent here from somewhere else.
  let next = requestUrl.searchParams.get('next') || '/dashboard';
  const errorParam = requestUrl.searchParams.get('error');

  /* A password-recovery link exchanges for a real session, so without this it
     landed on the dashboard — signed in, with no way to set the password it
     was sent to set, and no sign anything had happened. Supabase stamps the
     type on the redirect; forgot-password also asks for ?next=, so this is a
     belt-and-braces second route to the same screen for the case where the
     template is edited and the next param is lost. */
  if (requestUrl.searchParams.get('type') === 'recovery') {
    next = '/auth/reset-password';
  }
  /* Whether this is a password reset at all, however it was labelled. Both
     routes below need it, and the answer decides where a failure lands. */
  const isRecovery = next.startsWith('/auth/reset-password');

  /* An expired or already-used link comes back as an error in the URL FRAGMENT
     (#error=...), which never reaches the server. Supabase also sends
     error_code/error_description as query params in some flows — catching them
     here means the person is told to ask for a new link rather than being
     dropped on sign-in with a raw error string. */
  const errorCode = requestUrl.searchParams.get('error_code');
  if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
    /* A spent reset link goes to the reset screen, not back to the start.
       The same email carries a six-digit code, and that code is unaffected by
       whatever consumed the link — so the screen that accepts it is the one
       thing here that can still finish the job. */
    return NextResponse.redirect(
      new URL(isRecovery ? '/auth/reset-password' : '/auth/forgot-password?expired=1', requestUrl.origin)
    );
  }

  // If there's an error in the query string, redirect to sign-in with the error
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(errorParam)}`, requestUrl.origin)
    );
  }

  // If Supabase isn't configured yet, redirect to sign-in with a friendly message
  if (!isSupabaseConfigured) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent('Supabase not configured yet')}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      const supabase = await createServerClientHelper();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[auth/callback] exchange error:', error.message);
        /* A reset that fails to exchange is NOT a sign-in problem, and dumping
           a raw Supabase string on the sign-in page told a locked-out parent
           nothing they could act on. The commonest cause is asking on a laptop
           and opening the email on a phone: the client uses PKCE, so the other
           half of the exchange is in the laptop's storage and the phone
           arrives with half a handshake. Send them to the screen that takes
           the code instead, which needs no browser state at all. */
        return NextResponse.redirect(
          new URL(
            isRecovery ? '/auth/reset-password' : `/auth/sign-in?error=${encodeURIComponent(error.message)}`,
            requestUrl.origin
          )
        );
      }
    } catch (err) {
      console.error('[auth/callback] exception:', err);
      return NextResponse.redirect(
        new URL(isRecovery ? '/auth/reset-password' : '/auth/sign-in?error=callback_failed', requestUrl.origin)
      );
    }
  }

  // Successful auth — redirect to the "next" page (or home)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
