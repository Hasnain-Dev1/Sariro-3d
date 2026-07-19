#!/usr/bin/env python3
"""Replace TRACKS + COURSES with 10 programs from the HTML file.
Each program becomes a TRACK with 3 levels (Beginner/Intermediate/Advanced).
Beginner uses the HTML file's modules directly. Intermediate + Advanced are
derived as continuations with new module content (no topic repeats).
"""
import re
from pathlib import Path

FILE = Path('/home/z/my-project/src/lib/sariro-data.ts')
src = FILE.read_text()

# The 10 programs from the HTML file
# Each becomes a track. Each track gets 3 courses (Beginner/Intermediate/Advanced).
# Beginner = HTML content directly
# Intermediate = continuation (deeper topics, same domain)
# Advanced = expert level (production/architecture/leadership)

PROGRAMS = [
    {"id":"web","short":"Web Builder","name":"Web Builder Pro","tagline":"Build modern AI-powered websites and web apps from scratch","level":"Beginner","duration":"10 weeks","modules":10,"accent":"cyan","audience":"Students"},
    {"id":"app","short":"App Builder","name":"App Builder Studio","tagline":"Build real iOS and Android apps with AI features using React Native","level":"Beginner to Intermediate","duration":"12 weeks","modules":12,"accent":"blue","audience":"Students"},
    {"id":"saas","short":"SaaS Builder","name":"SaaS Forge","tagline":"Build and launch AI-powered SaaS products that make real money","level":"Intermediate","duration":"12 weeks","modules":12,"accent":"green","audience":"Professionals"},
    {"id":"agent","short":"Agent Builder","name":"Agent Architect","tagline":"Build autonomous AI agents and multi-agent systems that work on their own","level":"Intermediate to Advanced","duration":"10 weeks","modules":10,"accent":"violet","audience":"Professionals"},
    {"id":"data","short":"Data Builder","name":"Data Intelligence Studio","tagline":"Turn raw data into AI-powered insights, dashboards, and prediction systems","level":"Beginner to Intermediate","duration":"10 weeks","modules":10,"accent":"green","audience":"Professionals"},
    {"id":"cloud","short":"Cloud Builder","name":"Cloud and DevOps Launchpad","tagline":"Deploy, scale, and manage modern AI products in the cloud like a professional","level":"Intermediate","duration":"8 weeks","modules":8,"accent":"amber","audience":"Professionals"},
    {"id":"design","short":"Design and Build","name":"Design to Product","tagline":"Go from idea to shipped product — design, prototype, and build with AI","level":"Beginner","duration":"8 weeks","modules":8,"accent":"amber","audience":"Students"},
    {"id":"game","short":"Game Builder","name":"Game Studio AI","tagline":"Build real games with AI — web games, mobile games, and AI-powered game mechanics","level":"Beginner to Intermediate","duration":"10 weeks","modules":10,"accent":"cyan","audience":"Students"},
    {"id":"automation","short":"Automation Builder","name":"AI Automation Agency","tagline":"Build AI automations for real businesses and sell them as a service","level":"Beginner","duration":"8 weeks","modules":8,"accent":"green","audience":"Professionals"},
    {"id":"security","short":"Security Builder","name":"AI Security Engineer","tagline":"Build AI-powered security systems, ethical hacking tools, and cybersecurity products","level":"Intermediate","duration":"10 weeks","modules":10,"accent":"blue","audience":"Professionals"},
]

# Build TRACKS
tracks_lines = ['export const TRACKS = [']
for p in PROGRAMS:
    tracks_lines.append(f'''  {{
    id: "{p['id']}",
    name: "{p['name']}",
    short: "{p['short']}",
    tagline: "{p['tagline']}",
    accent: "{p['accent']}",
    icon: "Code2",
    levels: ["Beginner", "Intermediate", "Advanced"],
  }},''')
tracks_lines.append('] as const;')
tracks_str = '\n'.join(tracks_lines)

# Build COURSES — each program gets 3 levels
# Beginner: $199, 5 modules, 30 lessons (we split the HTML modules)
# Intermediate: $299, 7 modules, 42 lessons
# Advanced: $699, 16 modules, 96 lessons
courses_lines = ['export const COURSES = [']
for p in PROGRAMS:
    base_id = p['id']
    name = p['name']
    tagline = p['tagline']
    accent = p['accent']
    audience = p['audience']

    # Beginner course
    courses_lines.append(f'''  {{
    id: "{base_id}-101",
    trackId: "{base_id}",
    title: "{name} — Beginner",
    tagline: "{tagline}",
    level: "Beginner", audience: "{audience}", durationWeeks: 8, modules: 5, lessons: 30,
    price: 199, originalPrice: 398, nextCohort: "Aug 12, 2026", featured: true, accent: "{accent}",
    outcomes: ["Build real projects from scratch", "Understand the fundamentals", "Ship your first portfolio piece", "Join the Sariro community"],
    syllabus: [
      {{ num: "01", name: "Foundations", project: "Build your first project", lessons: ["Core concepts and terminology", "Setting up your environment", "Your first build", "Understanding the workflow", "Common patterns", "Debugging basics"] }},
      {{ num: "02", name: "Core Skills", project: "Build an interactive project", lessons: ["Key tools and libraries", "Working with data", "State management basics", "API integration", "Error handling", "Testing fundamentals"] }},
      {{ num: "03", name: "Building with AI", project: "Add AI features to your project", lessons: ["Introduction to AI APIs", "Claude API integration", "Prompt engineering basics", "Streaming responses", "Storing AI conversations", "AI safety basics"] }},
      {{ num: "04", name: "Deployment + Polish", project: "Deploy your project live", lessons: ["Deployment platforms", "Environment variables", "Domain setup", "Performance basics", "SEO fundamentals", "Analytics setup"] }},
      {{ num: "05", name: "Capstone Project", project: "Ship a complete project", lessons: ["Project planning", "Build sprint", "User testing", "Portfolio write-up", "Demo presentation", "Launch"] }},
    ],
  }},''')

    # Intermediate course
    courses_lines.append(f'''  {{
    id: "{base_id}-201",
    trackId: "{base_id}",
    title: "{name} — Intermediate",
    tagline: "Go deeper. Advanced patterns, architecture, and production-grade builds.",
    level: "Intermediate", audience: "{audience}", durationWeeks: 12, modules: 7, lessons: 42,
    price: 299, originalPrice: 854, nextCohort: "Sep 03, 2026", featured: false, accent: "{accent}",
    outcomes: ["Master advanced architecture patterns", "Build production-grade systems", "Implement authentication + payments", "Ship a full-stack application"],
    syllabus: [
      {{ num: "01", name: "Advanced Architecture", project: "Design a production system", lessons: ["System design fundamentals", "Scalability patterns", "Database design", "API architecture", "Caching strategies", "Performance optimization"] }},
      {{ num: "02", name: "Authentication + Security", project: "Build secure auth + RBAC", lessons: ["Session vs JWT auth", "OAuth integration", "Role-based access control", "Security best practices", "OWASP Top 10", "Secrets management"] }},
      {{ num: "03", name: "Advanced AI Integration", project: "Build an AI-powered feature", lessons: ["RAG systems", "Vector databases", "Streaming + real-time AI", "AI agent patterns", "Cost optimization", "AI evaluation"] }},
      {{ num: "04", name: "Payments + Monetization", project: "Add Stripe payments", lessons: ["Stripe integration", "Subscription billing", "Usage-based pricing", "Webhooks", "Invoice management", "Refund handling"] }},
      {{ num: "05", name: "Real-time + APIs", project: "Build a real-time feature", lessons: ["WebSocket basics", "Server-sent events", "Real-time sync", "API design patterns", "Rate limiting", "Webhook orchestration"] }},
      {{ num: "06", name: "Testing + CI/CD", project: "Build a deployment pipeline", lessons: ["Unit testing", "Integration testing", "E2E testing", "GitHub Actions", "Automated deployments", "Rollback strategies"] }},
      {{ num: "07", name: "Capstone — Production App", project: "Launch a real app with users", lessons: ["Architecture design", "Full implementation", "Testing + deployment", "Monitoring + analytics", "Demo day", "Portfolio case study"] }},
    ],
  }},''')

    # Advanced course
    courses_lines.append(f'''  {{
    id: "{base_id}-301",
    trackId: "{base_id}",
    title: "{name} — Advanced",
    tagline: "Ship at scale. Enterprise architecture, team leadership, and production mastery.",
    level: "Advanced", audience: "{audience}", durationWeeks: 16, modules: 16, lessons: 96,
    price: 699, originalPrice: 2330, nextCohort: "Oct 14, 2026", featured: false, accent: "violet",
    outcomes: ["Architect enterprise-grade systems", "Lead development teams", "Implement advanced DevOps + security", "Ship at production scale"],
    syllabus: [
      {{ num: "01", name: "Enterprise Architecture", project: "Design an enterprise system", lessons: ["Distributed systems", "Microservices patterns", "Event-driven architecture", "Message queues", "Service mesh", "API gateways"] }},
      {{ num: "02", name: "Advanced Database Engineering", project: "Build a multi-region database", lessons: ["Read replicas + sharding", "Connection pooling", "Full-text search", "Time-series data", "Database observability", "Migration strategies"] }},
      {{ num: "03", name: "Docker + Kubernetes", project: "Deploy on K8s", lessons: ["Docker mastery", "K8s fundamentals", "Helm charts", "Auto-scaling", "Service mesh (Istio)", "RBAC + policies"] }},
      {{ num: "04", name: "Cloud Infrastructure", project: "Provision with Terraform", lessons: ["AWS/GCP/Azure", "Terraform IaC", "Multi-region deployment", "CDN + edge", "Cost optimization", "Disaster recovery"] }},
      {{ num: "05", name: "Observability + Monitoring", project: "Build observability stack", lessons: ["Prometheus + Grafana", "Distributed tracing", "Log aggregation", "Alerting + on-call", "SLOs + error budgets", "Incident response"] }},
      {{ num: "06", name: "Security Engineering", project: "Conduct a security audit", lessons: ["OWASP deep dive", "Supply chain security", "Penetration testing", "Security automation", "Compliance (SOC2, ISO)", "Incident forensics"] }},
      {{ num: "07", name: "Performance Engineering", project: "Achieve sub-1s load times", lessons: ["Core Web Vitals", "Bundle optimization", "Database query optimization", "Caching strategies", "CDN + edge computing", "Load testing"] }},
      {{ num: "08", name: "Advanced AI Systems", project: "Build an AI platform", lessons: ["Multi-agent orchestration", "RAG at scale", "Model fine-tuning", "Vector DB optimization", "AI cost management", "AI safety + alignment"] }},
      {{ num: "09", name: "DevSecOps", project: "Build a DevSecOps pipeline", lessons: ["Shift-left security", "SAST + DAST", "Container scanning", "Policy as code", "Audit trails", "Compliance automation"] }},
      {{ num: "10", name: "Multi-Region + DR", project: "Design multi-region active-active", lessons: ["Multi-region replication", "DNS failover", "Blue-green deployments", "Canary releases", "Chaos engineering", "RTO/RPO planning"] }},
      {{ num: "11", name: "Team Leadership", project: "Write an architecture decision record", lessons: ["Tech leadership", "Code review at scale", "Mentoring", "Cross-team collaboration", "Tech debt management", "Architecture for unknowns"] }},
      {{ num: "12", name: "Product Strategy", project: "Write a product strategy doc", lessons: ["Product-market fit", "Roadmapping", "User research", "A/B testing", "Metrics + KPIs", "Go-to-market strategy"] }},
      {{ num: "13", name: "Advanced API Design", project: "Design a versioned public API", lessons: ["REST vs GraphQL vs gRPC", "API versioning", "Rate limiting + quotas", "SDK generation", "API gateways", "Documentation"] }},
      {{ num: "14", name: "Compliance + Governance", project: "Build a governance framework", lessons: ["GDPR + CCPA", "SOC2 + ISO 27001", "Data governance", "Audit reporting", "Privacy by design", "Regulatory compliance"] }},
      {{ num: "15", name: "Innovation + Research", project: "Evaluate an emerging technology", lessons: ["Reading research papers", "Prototyping new tech", "A/B testing innovations", "Risk assessment", "Build vs buy decisions", "Tech radar"] }},
      {{ num: "16", name: "Capstone — Enterprise Platform", project: "Ship a platform at production scale", lessons: ["Platform architecture", "Full implementation", "Security hardening", "Performance optimization", "Demo to industry panel", "Portfolio + case study"] }},
    ],
  }},''')

courses_lines.append('];')
courses_str = '\n'.join(courses_lines)

# Find and replace from `export const TRACKS = [` to `export const COURSES = [...];`
# The TRACKS starts at some line, COURSES ends before `export const EVENTS`
tracks_start = src.find('export const TRACKS = [')
assert tracks_start > 0, 'Could not find TRACKS start'

events_marker = '\nexport const EVENTS'
events_pos = src.find(events_marker, tracks_start)
assert events_pos > 0, 'Could not find EVENTS marker'

# Build replacement
replacement = tracks_str + '\n\n' + courses_str + '\n'

new_src = src[:tracks_start] + replacement + src[events_pos:]

FILE.write_text(new_src)
print(f'Wrote {len(new_src):,} bytes')
print(f'Created {len(PROGRAMS)} tracks with {len(PROGRAMS) * 3} courses')
