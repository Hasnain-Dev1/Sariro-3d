'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { QUICK_REPLIES } from '@/lib/faq-data';
import { HoneypotField } from '@/components/security/honeypot';

/* ===============================================================
   ChatBubble — Sariro's floating assistant.
   - Flying entrance: bubble flies in from off-screen right (arc)
   - Idle bob: gentle vertical float while waiting
   - Ping tooltip: every 12s of inactivity, "👋 Need help?" pops
   - On click: expands to chat panel (slide-up + scale)
   - Brand match: dark glass, blue→violet gradient, amber accents
=============================================================== */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'sariro-chat-history';
const PING_INTERVAL_MS = 12000; // 12s
const PING_DISMISS_SECONDS = 4; // auto-hide after 4s

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [hasEntrancePlayed, setHasEntrancePlayed] = useState(false);
  const [showPing, setShowPing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------- Restore history on mount ---------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setHasUserInteracted(true);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    // trigger entrance after a beat
    const t = setTimeout(() => setHasEntrancePlayed(true), 600);
    return () => clearTimeout(t);
  }, []);

  /* ---------- Persist history on change ---------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      // storage full or disabled — non-fatal
    }
  }, [messages]);

  /* ---------- Auto-scroll to bottom on new message ---------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  /* ---------- Body scroll lock when chat panel is open ----------
     When the panel is open, lock the underlying page so only the
     chat messages area scrolls. Restored on close. Also handles
     the case where SmoothScrollProvider (Lenis) is active — we
     pause it via the data attribute it watches. */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (open) {
      // Capture current scroll position so we don't jump when locking
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalLeft = document.body.style.left;
      const originalWidth = document.body.style.width;

      // Lock: freeze body in place
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = `-${scrollX}px`;
      document.body.style.width = '100%';

      // Hint SmoothScrollProvider (Lenis) to pause if present
      document.documentElement.setAttribute('data-scroll-locked', 'true');
      // Dispatch event that SmoothScrollProvider listens for — stops Lenis entirely
      window.dispatchEvent(new CustomEvent('sariro:scroll-lock', { detail: { locked: true } }));

      return () => {
        // Restore
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.left = originalLeft;
        document.body.style.width = originalWidth;
        document.documentElement.removeAttribute('data-scroll-locked');
        // Restart Lenis
        window.dispatchEvent(new CustomEvent('sariro:scroll-lock', { detail: { locked: false } }));
        // Jump back to where the user was
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [open]);

  /* ---------- Prevent wheel/touch scroll from leaking out of the panel ----------
     `overscroll-behavior: contain` on the messages container stops scroll
     chaining — when the user hits the top/bottom of the chat, the page
     behind doesn't start scrolling. (Applied via inline style below.) */

  /* ---------- Ping tooltip loop ---------- */
  useEffect(() => {
    if (open || hasUserInteracted) return; // no ping when chat is open or user already engaged
    if (!hasEntrancePlayed) return; // wait for entrance to finish

    const tick = () => {
      setShowPing(true);
      pingDismissTimerRef.current = setTimeout(() => setShowPing(false), PING_DISMISS_SECONDS * 1000);
    };
    // first ping after 4s, then every PING_INTERVAL
    const firstPing = setTimeout(tick, 4000);
    pingTimerRef.current = setInterval(tick, PING_INTERVAL_MS);

    return () => {
      clearTimeout(firstPing);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (pingDismissTimerRef.current) clearTimeout(pingDismissTimerRef.current);
    };
  }, [open, hasUserInteracted, hasEntrancePlayed]);

  /* ---------- Focus input when panel opens ---------- */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  /* ---------- Send a message ---------- */
  const sendMessage = useCallback(
    async (text: string, honeypot?: string | null) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      setHasUserInteracted(true);
      setShowPing(false);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, website: honeypot ?? '' }),
        });
        const data = await res.json();
        const reply = data.reply ?? "Hmm, I couldn't process that. Try again?";

        // Simulate typing delay for natural feel (300-700ms based on reply length)
        const delay = Math.min(Math.max(reply.length * 8, 300), 800);
        await new Promise((r) => setTimeout(r, delay));

        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const errMsg: Message = {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content:
            "I had trouble reaching my brain just now. Try again in a moment, or email contact@sariro.com and a human will reply within 24h.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping]
  );

  /* ---------- Initial assistant greeting when panel first opens ---------- */
  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      // Seed with a welcome message
      const welcome: Message = {
        id: `a-welcome-${Date.now()}`,
        role: 'assistant',
        content:
          "👋 Hey! I'm the Sariro assistant. Ask me anything about our courses, pricing, scholarships, or how to get started. Try a quick reply below or type your own question.",
        timestamp: Date.now(),
      };
      setMessages([welcome]);
    }
  };

  return (
    <>
      {/* ===================================================
          BUBBLE (closed state)
         =================================================== */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-bubble"
            onClick={handleOpen}
            aria-label="Open Sariro assistant"
            initial={{ x: 200, y: 100, opacity: 0, scale: 0.5 }}
            animate={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 80,
                damping: 12,
                mass: 1.1,
                delay: 0.6, // wait for page to settle
              },
            }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-[55] group sariro-chat-bubble"
          >
            {/* Idle bob — gentle vertical float */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              {/* Glow ring */}
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-60 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #F59E0B 100%)',
                }}
              />
              {/* Ping pulse ring */}
              <motion.span
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: '0 0 0 2px rgba(37,99,235,0.5)' }}
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              />

              {/* Main bubble */}
              <div
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl cursor-pointer border-2 border-white/20"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 60%, #0F172A 100%)',
                }}
              >
                <MessageCircle
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                  strokeWidth={2.4}
                  fill="currentColor"
                  style={{ fillOpacity: 0.15 }}
                />
                {/* Sparkles accent — top-right */}
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center ring-2 ring-slate-950"
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-3 h-3 text-slate-900" strokeWidth={2.8} />
                </motion.div>
              </div>

              {/* Ping tooltip — "👋 Need help?" */}
              <AnimatePresence>
                {showPing && (
                  <motion.div
                    key="ping-tooltip"
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-3 pointer-events-none whitespace-nowrap"
                  >
                    <div className="glass-dark rounded-2xl px-4 py-2.5 shadow-xl border border-white/10">
                      <p
                        className="text-sm font-bold text-white"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        👋 Need help?
                      </p>
                      <p className="text-[10px] text-slate-300 mt-0.5">Ask me anything about Sariro</p>
                      {/* Arrow */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-white/10" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===================================================
          CHAT PANEL (open state)
         =================================================== */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 60, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 sm:rounded-3xl z-[55] w-full sm:w-[400px] h-[100vh] sm:h-[600px] sm:max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-white/10 sariro-chat-panel"
            style={{
              background: 'linear-gradient(180deg, #0B1120 0%, #111827 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            {/* Glow background */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] rounded-full blur-[80px] opacity-30 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
            />

            {/* ---------- Header ---------- */}
            <div className="relative flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
                >
                  <MessageCircle className="w-5 h-5 text-white" strokeWidth={2.4} fill="currentColor" style={{ fillOpacity: 0.2 }} />
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-slate-950" />
                </div>
                <div>
                  <h3
                    className="text-sm font-extrabold text-white"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Sariro Assistant
                  </h3>
                  <p
                    className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    <span className="text-green-400">●</span> Online · typically replies instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-11 h-11 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors z-10 touch-manipulation shrink-0"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* ---------- Messages ---------- */}
            <div
              className="relative flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth chat-msg-scroll"
              data-lenis-prevent
              style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                  Ask me anything about Sariro!
                </div>
              )}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white/5 border border-white/10 text-slate-100 rounded-bl-sm'
                    }`}
                    style={{
                      fontFamily: msg.role === 'user' ? 'var(--font-inter)' : 'var(--font-inter)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 rounded-full bg-slate-400"
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick replies (only show when messages.length === 1, i.e. just the welcome) */}
              {messages.length === 1 && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2 pt-2"
                >
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-full px-3 py-1.5 transition-colors"
                      style={{ fontFamily: 'var(--font-grotesk)' }}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ---------- Input ---------- */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Pull honeypot value from the form so bots that auto-fill
                // hidden fields get caught server-side.
                const fd = new FormData(e.currentTarget);
                const honeypot = fd.get('website') as string | null;
                sendMessage(input, honeypot);
              }}
              className="relative p-3 border-t border-white/10 flex items-center gap-2"
            >
              <HoneypotField name="website" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                disabled={isTyping}
                maxLength={1000}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                }}
              >
                <Send className="w-4 h-4" strokeWidth={2.4} />
              </button>
            </form>

            {/* Footer */}
            <div className="px-4 py-2 text-center text-[10px] text-slate-500 border-t border-white/5">
              Powered by Sariro SLM ·{' '}
              <a href="mailto:contact@sariro.com" className="hover:text-slate-300 underline">
                Need a human?
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
