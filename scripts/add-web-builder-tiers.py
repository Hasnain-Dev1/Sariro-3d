#!/usr/bin/env python3
"""Add Web Builder Intermediate + Advanced courses to sariro-data.ts."""
import re
from pathlib import Path

FILE = Path('/home/z/my-project/src/lib/sariro-data.ts')
src = FILE.read_text()

# Web Builder Intermediate — 7 modules, 42 lessons (6 per module)
WEB_BUILDER_INTER = '''  {
    id: "web-builder-studio",
    title: "Web Builder Studio",
    tagline: "Advanced React patterns, full-stack architecture, and production web engineering.",
    level: "Intermediate",
    audience: "Students",
    durationWeeks: 12,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Sep 17, 2026",
    featured: false,
    accent: "cyan",
    outcomes: [
      "Master advanced React patterns (render props, HOCs, compound components)",
      "Build full-stack apps with Next.js App Router, server actions, and streaming",
      "Implement authentication, authorization, and multi-tenant architecture",
      "Deploy production-grade apps with CI/CD, monitoring, and edge caching",
    ],
    syllabus: [
      { num: "01", name: "Advanced React Patterns", project: "Refactor a real app with compound components", lessons: ["Render props and HOCs", "Compound component pattern", "Custom hooks architecture", "Context vs state managers", "Performance with useMemo/useCallback", "Error boundaries and suspense"] },
      { num: "02", name: "Next.js App Router Deep Dive", project: "Build a streaming dashboard with server components", lessons: ["Server vs client components", "Server actions and mutations", "Streaming and Suspense", "Parallel and intercepting routes", "Middleware and edge functions", "Caching strategies (ISR, SSR, SSG)"] },
      { num: "03", name: "Database Design + ORM", project: "Design a multi-tenant SaaS database", lessons: ["PostgreSQL fundamentals", "Prisma ORM setup", "Relations and joins", "Indexes and query optimization", "Migrations workflow", "Multi-tenancy patterns"] },
      { num: "04", name: "Auth + Authorization", project: "Build RBAC + OAuth from scratch", lessons: ["Session vs JWT auth", "NextAuth.js integration", "Role-based access control", "OAuth providers (Google, GitHub)", "Email + magic link", "Protecting API routes"] },
      { num: "05", name: "Real-time + APIs", project: "Build a real-time collaboration feature", lessons: ["WebSocket basics", "Server-sent events", "Supabase Realtime", "Webhook design", "Rate limiting + queues", "File uploads to S3/R2"] },
      { num: "06", name: "Testing + Performance", project: "Achieve 95+ Lighthouse score", lessons: ["Jest + React Testing Library", "Playwright E2E tests", "Bundle analysis + code splitting", "Core Web Vitals", "Image optimization", "Edge caching + CDN"] },
      { num: "07", name: "Capstone — Ship a Production SaaS", project: "Launch a real SaaS with paying users", lessons: ["CI/CD with GitHub Actions", "Vercel deployment + preview URLs", "Error monitoring (Sentry)", "Analytics (PostHog)", "Stripe billing integration", "Launch + demo day"] },
    ],
  },
'''

# Web Builder Advanced — 16 modules, 96 lessons (6 per module)
WEB_BUILDER_ADV = '''  {
    id: "web-builder-master",
    title: "Web Builder Master",
    tagline: "Full advanced web engineering — distributed systems, edge computing, and platform architecture.",
    level: "Advanced",
    audience: "Professionals",
    durationWeeks: 16,
    modules: 16,
    lessons: 96,
    price: 699,
    originalPrice: 2330,
    nextCohort: "Oct 14, 2026",
    featured: false,
    accent: "violet",
    outcomes: [
      "Architect distributed web systems at scale",
      "Master edge computing, serverless, and micro-frontend patterns",
      "Build design systems + component libraries used by 100+ developers",
      "Lead web engineering teams and make senior architecture decisions",
    ],
    syllabus: [
      { num: "01", name: "Distributed Systems Fundamentals", project: "Design a distributed web architecture", lessons: ["CAP theorem in practice", "Consistency models", "Distributed caching", "Message queues (Redis, BullMQ)", "Event-driven architecture", "Service mesh basics"] },
      { num: "02", name: "Micro-Frontends", project: "Build a micro-frontend platform", lessons: ["Module federation", "Single-spa framework", "Shared state across MFEs", "Routing strategies", "Build-time vs runtime integration", "Deployment pipelines for MFEs"] },
      { num: "03", name: "Edge Computing + CDN", project: "Deploy an edge-first application", lessons: ["Cloudflare Workers", "Vercel Edge Functions", "Edge databases (Turso, PlanetScale)", "Smart caching layers", "Geo-distributed state", "Latency optimization"] },
      { num: "04", name: "Advanced Database Engineering", project: "Build a sharded multi-region database", lessons: ["Read replicas + write masters", "Sharding strategies", "Connection pooling (PgBouncer)", "Full-text search (Postgres FTS)", "Time-series data patterns", "Database observability"] },
      { num: "05", name: "Design Systems + Component Libraries", project: "Build a company-wide design system", lessons: ["Design tokens architecture", "Component API design", "Headless UI patterns", "Documentation (Storybook)", "Versioning + semver for libs", "Monorepo publishing (Turborepo)"] },
      { num: "06", name: "WebAssembly + Performance", project: "Optimize a real app with Wasm", lessons: ["Wasm fundamentals", "Rust to Wasm compilation", "Calling Wasm from JS", "Performance profiling", "Memory management", "When NOT to use Wasm"] },
      { num: "07", name: "Security Engineering", project: "Conduct a full security audit", lessons: ["OWASP Top 10 deep dive", "CSP + CORS mastery", "XSS + CSRF prevention", "Supply chain security", "Secrets management (Vault)", "Penetration testing basics"] },
      { num: "08", name: "Observability + Monitoring", project: "Build a full observability stack", lessons: ["OpenTelemetry setup", "Distributed tracing", "Log aggregation (Loki)", "Metrics (Prometheus + Grafana)", "Alerting design", "Incident response runbooks"] },
      { num: "09", name: "Advanced API Design", project: "Design a versioned public API", lessons: ["REST vs GraphQL vs tRPC", "API versioning strategies", "Rate limiting + quotas", "Webhook orchestration", "API gateways (Kong)", "SDK generation"] },
      { num: "10", name: "State Management at Scale", project: "Architect state for a 100K-user app", lessons: ["Zustand vs Redux vs Jotai", "Server state (TanStack Query)", "Optimistic updates", "Conflict resolution", "Offline-first patterns", "State synchronization"] },
      { num: "11", name: "DevOps for Web Engineers", project: "Build a zero-downtime deploy pipeline", lessons: ["Docker + Kubernetes for web", "Terraform for infra", "Blue-green deployments", "Canary releases", "Database migrations at scale", "Rollback strategies"] },
      { num: "12", name: "Performance Engineering", project: "Achieve sub-1s load times globally", lessons: ["RUM vs synthetic monitoring", "Web Vitals optimization", "JavaScript bundle analysis", "Tree shaking deep dive", "Lazy loading strategies", "Progressive enhancement"] },
      { num: "13", name: "AI-Powered Web Apps", project: "Build an AI-native web application", lessons: ["Streaming AI responses (SSE)", "AI chat UI patterns", "Vector search on the web", "Edge AI inference", "AI-generated UI (v0 integration)", "Cost optimization for AI APIs"] },
      { num: "14", name: "Accessibility + Internationalization", project: "Make a real app WCAG 2.2 + i18n compliant", lessons: ["WCAG 2.2 compliance", "Screen reader testing", "Keyboard navigation patterns", "ARIA attributes mastery", "i18n with next-intl", "RTL language support"] },
      { num: "15", name: "Tech Leadership + Architecture", project: "Write an architecture decision record (ADR)", lessons: ["Reading + writing ADRs", "Tech debt management", "Code review at scale", "Mentoring junior devs", "Cross-team collaboration", "Architecture for unknowns"] },
      { num: "16", name: "Capstone — Platform Engineering", project: "Build + ship a web platform used by real developers", lessons: ["Platform design from scratch", "Developer experience (DX)", "Documentation + onboarding", "Launch strategy", "Demo to industry panel", "Portfolio + case study"] },
    ],
  },
'''

# Insert Web Builder Intermediate before "saas-forge" (first intermediate course)
# Find the pattern: the end of the last beginner course (AI Automation Agency) followed by the intermediate comment
inter_marker = "  /* ============================================================\n     INTERMEDIATE COURSES"
insert_pos = src.find(inter_marker)
assert insert_pos > 0, "Could not find INTERMEDIATE COURSES marker"

# Insert WEB_BUILDER_INTER right after the intermediate marker + newline
insert_after = src.find('\n', insert_pos) + 1
src = src[:insert_after] + WEB_BUILDER_INTER + src[insert_after:]

# Insert Web Builder Advanced before "agent-architect" (the only advanced course)
adv_marker = '  /* ============================================================\n     ADVANCED COURSES'
insert_pos = src.find(adv_marker)
assert insert_pos > 0, "Could not find ADVANCED COURSES marker"

insert_after = src.find('\n', insert_pos) + 1
src = src[:insert_after] + WEB_BUILDER_ADV + src[insert_after:]

FILE.write_text(src)
print(f'Wrote {len(src):,} bytes to {FILE}')
print('Added: Web Builder Studio (Intermediate) + Web Builder Master (Advanced)')
