import { Fragment, type ReactNode } from 'react';

/**
 * SARIRO — a very small Markdown for the Code Lab
 * ============================================================================
 * Challenge prompts and the tutor's replies use a handful of Markdown: `code`,
 * **bold**, "- " lists, ``` fenced blocks, blank-line paragraphs. This renders
 * exactly those as React elements — no HTML is ever injected, so nothing the
 * tutor (or a prompt) says can become markup.
 */

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok.startsWith('`')
      ? <code key={`${key}-${i++}`} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.88em] text-slate-800">{tok.slice(1, -1)}</code>
      : <strong key={`${key}-${i++}`} className="font-bold text-slate-900">{tok.slice(2, -2)}</strong>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text, className = '' }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const parts = text.replace(/\r/g, '').split(/```/);
  parts.forEach((part, pi) => {
    if (pi % 2 === 1) {
      const code = part.replace(/^[a-z]*\n/, '').replace(/\n$/, '');
      blocks.push(<pre key={`pre${pi}`} className="my-2 overflow-x-auto rounded-lg bg-[#0B1020] px-3 py-2 font-mono text-[12.5px] leading-relaxed text-slate-100">{code}</pre>);
      return;
    }
    part.split(/\n{2,}/).forEach((para, bi) => {
      const lines = para.split('\n').filter((l) => l.trim());
      if (!lines.length) return;
      if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
        blocks.push(
          <ul key={`ul${pi}-${bi}`} className="my-1.5 list-disc space-y-1 pl-5">
            {lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-•*]\s+/, ''), `li${pi}-${bi}-${li}`)}</li>)}
          </ul>
        );
        return;
      }
      blocks.push(
        <p key={`p${pi}-${bi}`} className="my-1.5 first:mt-0 last:mb-0">
          {lines.map((l, li) => <Fragment key={li}>{li > 0 && <br />}{inline(l, `p${pi}-${bi}-${li}`)}</Fragment>)}
        </p>
      );
    });
  });
  return <div className={className}>{blocks}</div>;
}
