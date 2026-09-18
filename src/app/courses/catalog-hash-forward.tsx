'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /courses#catalog used to be the coding catalogue, further down /courses. It is
 * its own page now (/courses/coding), and a #fragment never reaches the server —
 * so old links and bookmarks are forwarded here, in the browser.
 */
export default function CatalogHashForward() {
  const router = useRouter();
  useEffect(() => {
    if (window.location.hash === '#catalog') router.replace('/courses/coding#catalog');
  }, [router]);
  return null;
}
