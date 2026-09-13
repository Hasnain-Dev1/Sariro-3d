'use client';

import { Download } from 'lucide-react';

/** The browser's own print dialog is the PDF: "Save as PDF" is in every one of them. */
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-tactile btn-tactile-primary px-5 py-3 text-sm inline-flex items-center gap-2"
    >
      <Download className="w-4 h-4" /> Download or print
    </button>
  );
}
