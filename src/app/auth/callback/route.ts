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
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const errorParam = requestUrl.searchParams.get('error');

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
        return NextResponse.redirect(
          new URL(`/auth/sign-in?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        );
      }
    } catch (err) {
      console.error('[auth/callback] exception:', err);
      return NextResponse.redirect(
        new URL(`/auth/sign-in?error=callback_failed`, requestUrl.origin)
      );
    }
  }

  // Successful auth — redirect to the "next" page (or home)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
