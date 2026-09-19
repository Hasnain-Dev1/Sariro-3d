'use client';

import { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

/**
 * SARIRO — the Code Lab's editor (CodeMirror 6)
 * ============================================================================
 * A real code editor: syntax colours, line numbers, bracket matching and
 * auto-closing, undo, search, and Tab that indents (Python needs it). The
 * theme is Sariro's own — a calm dark surface with the coding room's orange
 * for the cursor. Ctrl/⌘ + Enter runs the tests.
 *
 * Uncontrolled on purpose: the parent passes the starting text and hears every
 * change; to load different text, give the editor a new `key`.
 */

export type EditorLanguage = 'javascript' | 'python' | 'html' | 'css';

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword], color: '#C4B5FD' },
  { tag: [t.definitionKeyword, t.modifier], color: '#C4B5FD' },
  { tag: [t.string, t.special(t.string), t.regexp], color: '#86EFAC' },
  { tag: [t.number, t.integer, t.float], color: '#FDBA74' },
  { tag: [t.bool, t.null, t.atom], color: '#FCA5A5' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#64748B', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.definition(t.variableName)), t.function(t.propertyName)], color: '#7DD3FC' },
  { tag: [t.definition(t.variableName)], color: '#F1F5F9' },
  { tag: [t.propertyName], color: '#93C5FD' },
  { tag: [t.className, t.typeName], color: '#FDE68A' },
  { tag: [t.operator, t.punctuation, t.bracket], color: '#CBD5E1' },
  { tag: [t.tagName], color: '#F9A8D4' },
  { tag: [t.attributeName], color: '#FDE68A' },
  { tag: [t.attributeValue], color: '#86EFAC' },
  { tag: [t.self, t.special(t.variableName)], color: '#F9A8D4' },
  { tag: [t.unit, t.color], color: '#FDBA74' },
]);

const theme = (fontSize: number) => EditorView.theme({
  '&': { height: '100%', fontSize: `${fontSize}px`, backgroundColor: '#0B1020', color: '#E2E8F0' },
  '.cm-scroller': { fontFamily: 'ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.65' },
  '.cm-content': { caretColor: '#F97316', padding: '12px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#F97316', borderLeftWidth: '2px' },
  '.cm-gutters': { backgroundColor: '#0B1020', color: '#475569', border: 'none', paddingLeft: '6px' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#CBD5E1' },
  '.cm-activeLine': { backgroundColor: 'rgba(148, 163, 184, 0.07)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(59, 130, 246, 0.32) !important' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(249, 115, 22, 0.25)', outline: 'none' },
  '.cm-selectionMatch': { backgroundColor: 'rgba(250, 204, 21, 0.14)' },
  '.cm-foldPlaceholder': { backgroundColor: '#1E293B', border: 'none', color: '#94A3B8' },
  '.cm-tooltip': { backgroundColor: '#111827', border: '1px solid #1F2937', color: '#E2E8F0' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#1E3A5F', color: '#F8FAFC' },
  '.cm-panels': { backgroundColor: '#111827', color: '#E2E8F0' },
  '.cm-searchMatch': { backgroundColor: 'rgba(250, 204, 21, 0.25)' },
  '&.cm-focused': { outline: 'none' },
}, { dark: true });

const LANGS: Record<EditorLanguage, () => ReturnType<typeof javascript>> = {
  javascript: () => javascript(),
  python: () => python(),
  html: () => html(),
  css: () => css(),
};

export default function CodeEditor({ initial, language, onChange, onRun, fontSize = 15, label }: {
  initial: string;
  language: EditorLanguage;
  onChange: (text: string) => void;
  onRun?: () => void;
  fontSize?: number;
  label: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const sizing = useRef(new Compartment());
  const handlers = useRef({ onChange, onRun });
  useEffect(() => { handlers.current = { onChange, onRun }; }, [onChange, onRun]);

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial,
        extensions: [
          keymap.of([{ key: 'Mod-Enter', preventDefault: true, run: () => { handlers.current.onRun?.(); return true; } }]),
          basicSetup,
          keymap.of([indentWithTab]),
          indentUnit.of(language === 'python' ? '    ' : '  '),
          EditorState.tabSize.of(4),
          LANGS[language](),
          syntaxHighlighting(highlight),
          sizing.current.of(theme(fontSize)),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': label, spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
          EditorView.updateListener.of((u) => { if (u.docChanged) handlers.current.onChange(u.state.doc.toString()); }),
        ],
      }),
    });
    view.current = v;
    return () => { v.destroy(); view.current = null; };
    // Created once per mount (initial text, language, label): new text comes with a new key.
  }, []);

  useEffect(() => {
    view.current?.dispatch({ effects: sizing.current.reconfigure(theme(fontSize)) });
  }, [fontSize]);

  return <div ref={host} className="h-full w-full overflow-hidden" />;
}
