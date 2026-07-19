#!/usr/bin/env python3
"""Add 4 new tracks + their courses to sariro-data.ts.
1. Prompt Engineering (Beginner only)
2. GTM Engineering (3 stages)
3. AI Security (3 stages)
4. Data Intelligence (3 stages)
Each follows the continuous-path principle: no topic repeats across stages.
"""
import re
from pathlib import Path

FILE = Path('/home/z/my-project/src/lib/sariro-data.ts')
src = FILE.read_text()

# 1. Add new tracks to COURSE_TRACKS array (before the closing `] as const;`)
new_tracks = '''  {
    id: "prompt-engineering",
    name: "Prompt Engineering Track",
    short: "Prompt Eng",
    tagline: "Master the art and science of talking to AI. From vibes to engineered, reproducible prompts.",
    accent: "violet",
    icon: "Sparkles",
    levels: ["Beginner"],
  },
  {
    id: "gtm-engineering",
    name: "GTM Engineering Track",
    short: "GTM Eng",
    tagline: "Build AI-powered go-to-market machines. From cold outreach to revenue operations.",
    accent: "amber",
    icon: "Rocket",
    levels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    id: "ai-security",
    name: "AI Security Track",
    short: "AI Security",
    tagline: "Build AI-powered security tools and defend against AI threats. From OWASP to red-teaming.",
    accent: "blue",
    icon: "Shield",
    levels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    id: "data-intelligence",
    name: "Data Intelligence Track",
    short: "Data Intel",
    tagline: "Turn raw data into AI-powered insights, dashboards, and prediction systems.",
    accent: "green",
    icon: "Database",
    levels: ["Beginner", "Intermediate", "Advanced"],
  },
'''

# Insert before the closing `] as const;` of COURSE_TRACKS
tracks_close = src.find('] as const;\n\nexport const COURSES')
assert tracks_close > 0, 'Could not find COURSE_TRACKS closing'
src = src[:tracks_close] + new_tracks + src[tracks_close:]

# 2. Add new courses before the closing `];` of COURSES array
new_courses = '''

  /* ============================================================
     PROMPT ENGINEERING TRACK — 1 course (Beginner only)
     ============================================================ */
  {
    id: "prompt-eng-101",
    trackId: "prompt-engineering",
    title: "Prompt Engineering Mastery",
    tagline: "From vibes-based prompting to engineered, reproducible prompts that ship to production.",
    level: "Beginner",
    audience: "Professionals",
    durationWeeks: 6,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Jul 22, 2026",
    featured: true,
    accent: "violet",
    outcomes: [
      "Design prompts that ship to production",
      "Build a reusable prompt library for your team",
      "Evaluate prompts with real metrics",
      "Save 40%+ on API costs through better prompting",
    ],
    syllabus: [
      { num: "01", name: "Foundations of Prompting", project: "Reverse-engineer a real production prompt", lessons: ["How LLMs actually read prompts", "System vs user vs assistant roles", "Tokens, context windows, and limits", "Temperature, top-p, and sampling", "Prompt structure patterns", "Common pitfalls and anti-patterns"] },
      { num: "02", name: "Prompt Patterns & Engineering", project: "Build a library of 10 reusable patterns", lessons: ["Few-shot prompting", "Chain-of-thought reasoning", "Self-critique and refinement", "Structured output (JSON, XML)", "Tool use and function calling", "Multi-turn conversation design"] },
      { num: "03", name: "Building a Prompt Library", project: "Ship a versioned prompt library for a team", lessons: ["Prompt versioning and git", "Templating with variables", "A/B testing prompts", "Prompt composition and chaining", "Documentation standards", "Sharing and collaboration workflows"] },
      { num: "04", name: "Evaluation & Metrics", project: "Build an eval harness for your prompts", lessons: ["Why evals matter (and why most teams skip them)", "Automated vs human evals", "LLM-as-judge patterns", "Regression testing for prompts", "Cost and latency tracking", "Production monitoring"] },
      { num: "05", name: "Capstone — Production Prompt System", project: "Ship a real prompt-driven feature to production", lessons: ["Designing the feature", "Building the prompt chain", "Adding guardrails and safety", "Deploying to production", "Monitoring and iterating", "Case study write-up"] },
    ],
  },

  /* ============================================================
     GTM ENGINEERING TRACK — 3 continuous courses, no topic repeats
     ============================================================ */

  /* ---- GTM · Beginner ----
     AI-Powered Outbound — cold outreach at scale with AI personalization. */
  {
    id: "gtm-101",
    trackId: "gtm-engineering",
    title: "AI-Powered Outbound",
    tagline: "Build cold outreach machines that book meetings. AI personalization at scale.",
    level: "Beginner",
    audience: "Professionals",
    durationWeeks: 8,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Aug 26, 2026",
    featured: true,
    accent: "amber",
    outcomes: [
      "Build an AI-personalized cold email system",
      "Achieve 5%+ reply rates on cold outbound",
      "Set up lead enrichment + scoring pipelines",
      "Book 10+ qualified meetings per week",
    ],
    syllabus: [
      { num: "01", name: "GTM Fundamentals", project: "Map your ICP and buyer journey", lessons: ["What is GTM engineering", "ICP definition framework", "Buyer personas and pain points", "Channels: email, LinkedIn, multi-channel", "Metrics that matter (reply, meeting, pipeline)", "GTM stack overview"] },
      { num: "02", name: "Lead Sourcing + Enrichment", project: "Build a 100-lead enriched list", lessons: ["Apollo, Clay, LinkedIn Sales Nav", "Firmographic + technographic data", "Email finding + verification", "Enrichment with AI (company news, triggers)", "Building a lead scoring model", "CRM sync (HubSpot, Attio)"] },
      { num: "03", name: "AI Personalization", project: "Write 50 personalized cold emails with AI", lessons: ["Why generic emails fail", "Personalization at scale with Claude API", "Spintax and variation engineering", "Reference frameworks (competitor, trigger, pain)", "Avoiding AI-sounding language", "A/B testing subject lines + bodies"] },
      { num: "04", name: "Outbound Automation", project: "Launch a 7-touch multi-channel sequence", lessons: ["Instantly, Smartlead, Lemlist setup", "Domain warming + deliverability", "Multi-channel sequences (email + LinkedIn)", "Meeting booking + calendar sync", "Reply handling + objection responses", "Compliance (CAN-SPAM, GDPR)"] },
      { num: "05", name: "Capstone — Outbound Machine", project: "Launch a full outbound campaign that books meetings", lessons: ["Campaign planning + ICP finalization", "Lead list building + enrichment", "AI personalization pipeline", "Sequence launch + monitoring", "Optimization from reply data", "Demo day — present results"] },
    ],
  },

  /* ---- GTM · Intermediate ----
     RevOps + Pipeline Engineering — assumes outbound from 101.
     Goes into CRM, pipeline automation, attribution. */
  {
    id: "gtm-201",
    trackId: "gtm-engineering",
    title: "RevOps & Pipeline Engineering",
    tagline: "Turn leads into pipeline. CRM automation, attribution, and AI-powered sales ops.",
    level: "Intermediate",
    audience: "Professionals",
    durationWeeks: 12,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Sep 17, 2026",
    featured: false,
    accent: "amber",
    outcomes: [
      "Build a full RevOps stack with CRM + automation",
      "Implement multi-touch attribution modeling",
      "Create AI-powered lead scoring + routing",
      "Ship a sales analytics dashboard",
    ],
    syllabus: [
      { num: "01", name: "CRM Architecture", project: "Design a HubSpot/Attio schema from scratch", lessons: ["CRM data models", "Custom objects + fields", "Deal stages + pipeline design", "Lifecycle stages definition", "Data hygiene patterns", "Migration from spreadsheets"] },
      { num: "02", name: "Pipeline Automation", project: "Build 5 automations that save 10hrs/week", lessons: ["Workflow automation (HubSpot, Attio)", "Lead routing + assignment", "Stage transition triggers", "Notification + task automation", "Slack/Teams integration", "Error handling + logging"] },
      { num: "03", name: "AI-Powered Sales Ops", project: "Build an AI sales assistant bot", lessons: ["Meeting notes + CRM sync (Claude API)", "AI deal coaching + next steps", "Automated follow-up generation", "Sentiment analysis on calls", "Objection handling playbooks", "Predictive deal scoring"] },
      { num: "04", name: "Attribution + Analytics", project: "Build a multi-touch attribution dashboard", lessons: ["First-touch vs last-touch vs multi-touch", "UTM parameter strategy", "Data warehouse basics (Postgres, BigQuery)", "dbt for data transformation", "Dashboard design (Looker, Metabase)", "Pipeline velocity metrics"] },
      { num: "05", name: "Lead Scoring + Routing", project: "Build an ML-powered lead scoring model", lessons: ["Explicit + implicit scoring", "Feature engineering from CRM data", "scikit-learn classification model", "Real-time scoring API", "Routing rules + SLAs", "A/B testing scoring models"] },
      { num: "06", name: "Intent + ABM", project: "Build an account-based marketing engine", lessons: ["Intent data (G2, Bombora, Clay)", "ABM tier definition", "Account-level personalization", "Coordinate sales + marketing plays", "Target account list building", "ABM attribution + measurement"] },
      { num: "07", name: "Capstone — RevOps System", project: "Ship a complete RevOps system for a real company", lessons: ["Stack audit + architecture", "CRM setup + automation", "Attribution dashboard", "AI sales assistant", "Analytics + reporting", "Demo to sales leaders"] },
    ],
  },

  /* ---- GTM · Advanced ----
     AI GTM Platform — assumes RevOps from 201.
     Goes into building a full GTM platform with agents. */
  {
    id: "gtm-301",
    trackId: "gtm-engineering",
    title: "AI GTM Platform Engineering",
    tagline: "Build AI agents that run your entire go-to-market. From prospecting to closing.",
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
      "Build AI sales agents that prospect + qualify autonomously",
      "Ship a multi-agent GTM platform",
      "Implement real-time intent + trigger detection",
      "Architect revenue intelligence systems at scale",
    ],
    syllabus: [
      { num: "01", name: "GTM Agent Architecture", project: "Design a multi-agent GTM system", lessons: ["Agent roles in GTM", "Prospecting agent design", "Qualification agent design", "Outreach agent design", "Orchestration patterns", "Safety + human-in-the-loop"] },
      { num: "02", name: "Prospecting Agents", project: "Build an agent that finds + enriches leads 24/7", lessons: ["Clay + Apollo API integration", "Web scraping with agents", "Enrichment pipeline design", "Deduplication + data quality", "Trigger-based prospecting", "Cost optimization at scale"] },
      { num: "03", name: "Qualification Agents", project: "Build an agent that qualifies leads via email/chat", lessons: ["BANT + MEDDIC frameworks", "Conversational qualification", "Multi-turn dialogue management", "Sentiment + intent detection", "Handoff to human AE", "CRM sync + deal creation"] },
      { num: "04", name: "Outreach Agents", project: "Build an agent that personalizes + sends outreach", lessons: ["Personalization at scale", "Multi-channel orchestration", "Reply classification + routing", "Objection handling automation", "Sequence optimization with RL", "Deliverability monitoring"] },
      { num: "05", name: "Meeting Booking Agents", project: "Build an agent that books meetings autonomously", lessons: ["Calendar API integration", "Time zone handling", "Reminder + confirmation flows", "Pre-meeting brief generation", "No-show recovery sequences", "Calendar optimization"] },
      { num: "06", name: "Sales Intelligence Agents", project: "Build an agent that researches accounts pre-meeting", lessons: ["10-K + earnings call analysis", "LinkedIn + news monitoring", "Competitor battlecard generation", "Stakeholder mapping", "Pre-meeting brief automation", "Post-meeting summary + CRM sync"] },
      { num: "07", name: "Pipeline Prediction", project: "Build a deal prediction model", lessons: ["Feature engineering from CRM", "Time-series forecasting", "Win/loss prediction models", "Deal velocity analysis", "Forecast accuracy tracking", "Scenario modeling"] },
      { num: "08", name: "Churn Prediction + Retention", project: "Build a churn early-warning system", lessons: ["Churn signals from product data", "Survival analysis models", "Health score design", "At-risk account alerts", "Automated save plays", "Expansion opportunity detection"] },
      { num: "09", name: "Revenue Attribution with ML", project: "Build an ML-powered attribution model", lessons: ["Markov chain attribution", "Shapley value attribution", "Data warehouse + feature store", "Model training + deployment", "Attribution dashboard", "Marketing mix optimization"] },
      { num: "10", name: "Pricing + Packaging Optimization", project: "Build a pricing recommendation engine", lessons: ["Willingness-to-pay modeling", "Cohort + segment analysis", "Price elasticity estimation", "Packaging strategy", "A/B testing pricing", "Revenue impact forecasting"] },
      { num: "11", name: "GTM Data Platform", project: "Build a GTM data warehouse from scratch", lessons: ["Data warehouse architecture", "ELT pipelines (Fivetran, Airbyte)", "dbt models for GTM", "Reverse ETL (Hightouch, Census)", "Data quality + observability", "Privacy + compliance (GDPR)"] },
      { num: "12", name: "Multi-Agent Orchestration", project: "Build a 5-agent GTM crew", lessons: ["CrewAI for GTM agents", "Agent communication protocols", "Shared state + memory", "Conflict resolution", "Supervisor agent design", "Production deployment"] },
      { num: "13", name: "Real-Time Intent Detection", project: "Build a real-time intent signal pipeline", lessons: ["Intent data sources + APIs", "Streaming architecture (Kafka, Redis)", "Signal scoring + prioritization", "Trigger-based automation", "Slack/Teams alerting", "Sales rep assignment"] },
      { num: "14", name: "GTM Security + Compliance", project: "Audit a GTM stack for compliance", lessons: ["Data privacy (GDPR, CCPA)", "Consent management", "Email compliance (CAN-SPAM, CASL)", "Data retention policies", "Vendor security review", "SOC2 for GTM tools"] },
      { num: "15", name: "GTM Leadership + Strategy", project: "Write a GTM strategy doc for a SaaS company", lessons: ["GTM operating model design", "Sales/marketing/CS alignment", "Compensation plan design", "Territory + quota planning", "Board-level reporting", "Scaling GTM teams"] },
      { num: "16", name: "Capstone — AI GTM Platform", project: "Build + ship a multi-agent GTM platform", lessons: ["Platform architecture", "Multi-agent system build", "CRM + data platform integration", "Analytics + forecasting", "Demo to CRO + board", "Portfolio + case study"] },
    ],
  },

  /* ============================================================
     AI SECURITY TRACK — 3 continuous courses, no topic repeats
     ============================================================ */

  /* ---- AI Security · Beginner ----
     Security Fundamentals — no prior security knowledge needed. */
  {
    id: "sec-101",
    trackId: "ai-security",
    title: "Security Fundamentals",
    tagline: "Learn how attackers think and how to defend. From zero to your first security audit.",
    level: "Beginner",
    audience: "Students",
    durationWeeks: 8,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Aug 19, 2026",
    featured: false,
    accent: "blue",
    outcomes: [
      "Understand the attacker mindset and threat landscape",
      "Audit a web app for OWASP Top 10 vulnerabilities",
      "Set up basic security monitoring",
      "Implement secure authentication + authorization",
    ],
    syllabus: [
      { num: "01", name: "Security Mindset", project: "Threat-model a real application", lessons: ["Attacker vs defender thinking", "CIA triad + AAA framework", "Threat modeling (STRIDE)", "Risk assessment matrices", "Security culture + responsibility", "Responsible disclosure basics"] },
      { num: "02", name: "Web Vulnerabilities", project: "Find 3 vulnerabilities in a test app", lessons: ["OWASP Top 10 overview", "XSS — cross-site scripting", "SQL injection basics", "CSRF — cross-site request forgery", "Insecure direct object references", "Security misconfiguration"] },
      { num: "03", name: "Authentication + Authorization", project: "Build secure login + RBAC", lessons: ["Passwords + hashing (bcrypt, argon2)", "Session vs JWT auth", "OAuth 2.0 + OIDC", "Role-based access control", "MFA implementation", "Common auth mistakes"] },
      { num: "04", name: "Network + Infrastructure Security", project: "Secure an AWS environment basics", lessons: ["TCP/IP + DNS security", "Firewalls + security groups", "HTTPS + TLS certificates", "VPN + zero trust basics", "Cloud IAM fundamentals", "Secrets management intro"] },
      { num: "05", name: "Capstone — Security Audit", project: "Conduct + report a full security audit", lessons: ["Audit methodology", "Manual testing checklist", "Burp Suite basics", "Writing a security report", "Remediation recommendations", "Presenting to stakeholders"] },
    ],
  },

  /* ---- AI Security · Intermediate ----
     AI-Powered Security Tools — assumes security fundamentals from 101. */
  {
    id: "sec-201",
    trackId: "ai-security",
    title: "AI-Powered Security Tools",
    tagline: "Build AI tools that detect threats, analyze code, and automate security work.",
    level: "Intermediate",
    audience: "Professionals",
    durationWeeks: 12,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Sep 03, 2026",
    featured: false,
    accent: "blue",
    outcomes: [
      "Build an AI vulnerability scanner",
      "Create an AI security monitoring dashboard",
      "Implement AI-assisted code review for security",
      "Ship automated security report generation",
    ],
    syllabus: [
      { num: "01", name: "AI for Security Analysis", project: "Build an AI code vulnerability scanner", lessons: ["Claude for code analysis", "Static analysis with AI", "Pattern recognition in logs", "False positive reduction", "Severity scoring with AI", "Automated fix suggestions"] },
      { num: "02", name: "Threat Detection with ML", project: "Build an anomaly detection system", lessons: ["Log aggregation (Loki, ELK)", "Feature engineering from logs", "Isolation forest + one-class SVM", "Real-time streaming detection", "Alert tuning + thresholds", "Incident response playbooks"] },
      { num: "03", name: "AI-Powered Pentesting", project: "AI-assisted pentest on a test environment", lessons: ["Reconnaissance automation", "AI-generated exploit hypotheses", "Automated vulnerability scanning", "Burp Suite + AI integration", "Privilege escalation detection", "Pentest report generation"] },
      { num: "04", name: "Security Automation", project: "Build a SOC automation pipeline", lessons: ["SOAR fundamentals", "Playbook design + automation", "Automated triage + enrichment", "Threat intelligence integration", "Slack/Teams alerting", "Metrics + SLA tracking"] },
      { num: "05", name: "Cloud Security Monitoring", project: "Build a cloud security dashboard", lessons: ["AWS CloudTrail + GuardDuty", "Azure Security Center", "GCP Security Command Center", "CSPM (Cloud Security Posture Mgmt)", "Container security scanning", "Compliance automation"] },
      { num: "06", name: "Adversarial AI Defense", project: "Defend an AI model against attacks", lessons: ["Prompt injection attacks", "Jailbreak techniques", "Data poisoning detection", "Model extraction attacks", "Adversarial examples", "Red-teaming LLMs"] },
      { num: "07", name: "Capstone — Security Product", project: "Build + ship an AI security tool", lessons: ["Product design", "Scanner implementation", "Dashboard + reporting", "API + integration", "Pricing model", "Demo + portfolio"] },
    ],
  },

  /* ---- AI Security · Advanced ----
     AI Red Team + Advanced SecOps — assumes AI security tools from 201. */
  {
    id: "sec-301",
    trackId: "ai-security",
    title: "AI Red Team & Advanced SecOps",
    tagline: "Offensive AI security at scale. Red-team LLMs, build adversarial systems, lead security orgs.",
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
      "Lead AI red-team engagements against production LLMs",
      "Build adversarial AI testing frameworks",
      "Architect enterprise SecOps platforms",
      "Design AI governance + compliance programs",
    ],
    syllabus: [
      { num: "01", name: "AI Red Teaming Methodology", project: "Design a red-team engagement plan", lessons: ["Red team vs pentest vs bug bounty", "LLM threat modeling (OWASP LLM Top 10)", "Attack surface mapping for AI", "Rules of engagement", "Scope + success criteria", "Reporting to executives"] },
      { num: "02", name: "Prompt Injection at Scale", project: "Build a prompt injection testing framework", lessons: ["Direct vs indirect prompt injection", "System prompt extraction", "Jailbreak taxonomy", "Automated jailbreak generation", "Bypassing content filters", "Defensive mitigations"] },
      { num: "03", name: "Model Extraction + Privacy", project: "Extract a model's training data", lessons: ["Model inversion attacks", "Membership inference", "Training data extraction", "Differential privacy basics", "Federated learning security", "Privacy-preserving ML"] },
      { num: "04", name: "Adversarial Examples", project: "Generate adversarial inputs for a vision model", lessons: ["FGSM + PGD attacks", "Carlini-Wagner attack", "Adversarial patches", "Evasion in production", "Defensive distillation", "Certified robustness"] },
      { num: "05", name: "AI Supply Chain Security", project: "Audit an ML pipeline for supply chain risks", lessons: ["Model serialization risks (pickle)", "Backdoored models", "Dataset poisoning", "Dependency vulnerabilities", "SBOM for ML", "Model signing + verification"] },
      { num: "06", name: "Multi-Agent Attack Systems", project: "Build a multi-agent red-team system", lessons: ["Autonomous pentest agents", "Multi-agent attack coordination", "Recon + exploit agents", "Evasion agent design", "Human-in-the-loop red-teaming", "Scaling red-team operations"] },
      { num: "07", name: "Defensive AI Systems", project: "Build an AI defense platform", lessons: ["AI-powered WAF", "Behavioral anomaly detection", "Automated incident response", "Threat hunting with AI", "Deception technology + honeypots", "Defense-in-depth for AI"] },
      { num: "08", name: "Enterprise SecOps Architecture", project: "Design a enterprise SecOps platform", lessons: ["SOC 2 + ISO 27001 architecture", "SIEM + SOAR integration", "Threat intelligence platform", "Security data lake", "Detection engineering at scale", "MTTD/MTTR optimization"] },
      { num: "09", name: "Cloud Native Security", project: "Secure a multi-cloud K8s environment", lessons: ["K8s security best practices", "Service mesh security (Istio)", "Container runtime security", "Cloud-native threat detection", "Zero trust architecture", "Supply chain security (SLSA)"] },
      { num: "10", name: "AI Governance + Compliance", project: "Write an AI governance framework", lessons: ["EU AI Act compliance", "NIST AI Risk Management Framework", "Model cards + risk assessments", "Audit trails + explainability", "Bias auditing + fairness", "Regulatory reporting"] },
      { num: "11", name: "Forensics + Incident Response", project: "Conduct a forensic investigation on an AI breach", lessons: ["Digital forensics fundamentals", "AI-specific forensics", "Incident response lifecycle", "Post-incident analysis", "Lessons learned + process improvement", "Legal + regulatory notification"] },
      { num: "12", name: "Threat Intelligence", project: "Build a threat intel platform for AI threats", lessons: ["Threat intel sources + feeds", "STIX/TAXII frameworks", "AI threat landscape tracking", "Indicator + IOC management", "Threat hunting workflows", "Information sharing (ISACs)"] },
      { num: "13", name: "Secure ML Engineering", project: "Build a secure ML training pipeline", lessons: ["Secure by design ML", "Reproducible + auditable training", "Model versioning + lineage", "Secure deployment patterns", "Monitoring ML in production", "Incident response for ML"] },
      { num: "14", name: "Bug Bounty + Disclosure", project: "Submit a valid bug bounty report", lessons: ["Bug bounty platforms (HackerOne, Bugcrowd)", "AI-specific bug bounties", "Writing high-quality reports", "Communication + negotiation", "CVSS scoring", "Coordinated disclosure"] },
      { num: "15", name: "Security Leadership", project: "Build a security team charter", lessons: ["CISO leadership", "Security team structures", "Budget + resource planning", "Board-level communication", "Security culture + training", "Vendor risk management"] },
      { num: "16", name: "Capstone — AI Security Platform", project: "Build + ship an AI red-team or defense platform", lessons: ["Platform architecture", "Red-team OR defense system build", "Integration + testing", "Documentation + reporting", "Demo to security leaders", "Portfolio + open-source release"] },
    ],
  },

  /* ============================================================
     DATA INTELLIGENCE TRACK — 3 continuous courses, no topic repeats
     ============================================================ */

  /* ---- Data Intelligence · Beginner ----
     Data Thinking + Python — start from absolute zero. */
  {
    id: "data-101",
    trackId: "data-intelligence",
    title: "Data Thinking & Python Basics",
    tagline: "From zero to your first data dashboard. Learn Python, Pandas, and how to ask the right questions.",
    level: "Beginner",
    audience: "Students",
    durationWeeks: 8,
    modules: 5,
    lessons: 30,
    price: 199,
    originalPrice: 398,
    nextCohort: "Aug 12, 2026",
    featured: false,
    accent: "green",
    outcomes: [
      "Analyze a real dataset and find actionable insights",
      "Clean messy real-world data with Pandas",
      "Build your first interactive dashboard",
      "Tell stories with data that drive decisions",
    ],
    syllabus: [
      { num: "01", name: "Data Thinking", project: "Analyze a dataset and find 3 insights", lessons: ["What data can tell you", "Types of analysis (descriptive, diagnostic, predictive)", "Asking the right questions", "Data sources + collection", "Correlation vs causation", "Common data mistakes"] },
      { num: "02", name: "Python for Data", project: "Clean a messy CSV dataset", lessons: ["Python basics for data", "Jupyter notebooks", "Pandas DataFrames", "Filtering + sorting", "Handling missing data", "Data type conversion"] },
      { num: "03", name: "Exploratory Analysis", project: "Explore a real dataset end-to-end", lessons: ["Summary statistics", "Grouping + aggregation", "Merging + joining data", "Pivot tables", "Outlier detection", "Hypothesis generation"] },
      { num: "04", name: "Data Visualization", project: "Build 5 charts that tell a story", lessons: ["Chart selection (bar, line, scatter, heatmap)", "Plotly + Matplotlib basics", "Dashboard design principles", "Color + accessibility", "Storytelling with data", "Common viz mistakes"] },
      { num: "05", name: "Capstone — Data Dashboard", project: "Ship an interactive dashboard", lessons: ["Streamlit basics", "Building the dashboard", "Adding interactivity", "Deploying live", "Presenting insights", "Portfolio write-up"] },
    ],
  },

  /* ---- Data Intelligence · Intermediate ----
     AI Analytics + ML Basics — assumes Python + Pandas from 101. */
  {
    id: "data-201",
    trackId: "data-intelligence",
    title: "AI Analytics & Machine Learning",
    tagline: "Turn data into predictions. ML, AI-powered analytics, and production data products.",
    level: "Intermediate",
    audience: "Professionals",
    durationWeeks: 12,
    modules: 7,
    lessons: 42,
    price: 299,
    originalPrice: 854,
    nextCohort: "Sep 03, 2026",
    featured: false,
    accent: "green",
    outcomes: [
      "Build an AI-powered analytics assistant",
      "Train + deploy a churn prediction model",
      "Create a real-time prediction API",
      "Ship a data pipeline that runs automatically",
    ],
    syllabus: [
      { num: "01", name: "SQL + Data Warehousing", project: "Build a data warehouse", lessons: ["SQL fundamentals (SELECT, JOIN, GROUP BY)", "Window functions", "PostgreSQL + Supabase", "Data modeling (star schema)", "ETL basics", "Query optimization"] },
      { num: "02", name: "AI for Data Analysis", project: "Build an AI data analyst", lessons: ["Claude API for data questions", "Natural language to SQL", "Automated insight generation", "AI-powered reporting", "Context injection patterns", "Hallucination prevention"] },
      { num: "03", name: "Machine Learning Basics", project: "Build a churn prediction model", lessons: ["ML without deep math", "scikit-learn pipeline", "Train/test split + cross-validation", "Classification + regression", "Feature engineering", "Model evaluation metrics"] },
      { num: "04", name: "Prediction Systems", project: "Build a price prediction tool", lessons: ["Regression models (linear, random forest)", "Feature selection", "Model deployment with Streamlit", "Real-time prediction API", "Monitoring model performance", "A/B testing models"] },
      { num: "05", name: "Data Pipelines", project: "Build an automated data pipeline", lessons: ["ETL pipeline design", "Scheduling with cron + Airflow basics", "Data quality checks", "Pipeline monitoring + alerting", "Error handling + retries", "Documentation"] },
      { num: "06", name: "Business Intelligence", project: "Build a KPI dashboard", lessons: ["KPI design frameworks", "Power BI / Metabase basics", "Automated reporting", "Executive dashboards", "Self-service analytics", "Driving decisions with data"] },
      { num: "07", name: "Capstone — AI Analytics Product", project: "Ship a complete AI analytics product", lessons: ["End-to-end product design", "Real data source integration", "User-facing dashboard", "Automated pipeline", "Documentation + demo", "Portfolio presentation"] },
    ],
  },

  /* ---- Data Intelligence · Advanced ----
     Data Platform Engineering — assumes ML + analytics from 201. */
  {
    id: "data-301",
    trackId: "data-intelligence",
    title: "Data Platform Engineering",
    tagline: "Build data platforms at scale. Real-time streaming, MLOps, and enterprise data architecture.",
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
      "Architect enterprise data platforms",
      "Build real-time streaming pipelines",
      "Implement MLOps at production scale",
      "Lead data engineering teams",
    ],
    syllabus: [
      { num: "01", name: "Data Platform Architecture", project: "Design an enterprise data platform", lessons: ["Data mesh vs data lake vs warehouse", "Lakehouse architecture (Databricks)", "Multi-region data strategies", "Data governance + cataloging", "Platform team operating model", "Cost optimization at scale"] },
      { num: "02", name: "Streaming Data Systems", project: "Build a real-time streaming pipeline", lessons: ["Kafka fundamentals", "Spark Structured Streaming", "Flink for stream processing", "Windowing + state management", "Exactly-once semantics", "Stream-table duality"] },
      { num: "03", name: "Advanced Data Modeling", project: "Design a multi-tenant data model", lessons: ["Dimensional modeling (Kimball)", "Data Vault 2.0", "Multi-tenant SaaS patterns", "Slowly changing dimensions", "Data contracts", "Schema evolution"] },
      { num: "04", name: "dbt + Analytics Engineering", project: "Build a dbt project with 50+ models", lessons: ["dbt fundamentals", "Modeling patterns (staging, marts, snapshots)", "Testing + documentation", "CI/CD for dbt", "dbt Cloud + orchestration", "Analytics as code"] },
      { num: "05", name: "MLOps at Scale", project: "Build an MLOps pipeline", lessons: ["ML lifecycle management", "Feature stores (Feast, Tecton)", "Model registry + versioning", "Continuous training pipelines", "Model monitoring + drift detection", "A/B testing + canary deployment"] },
      { num: "06", name: "Vector Databases + RAG", project: "Build a production RAG system", lessons: ["Vector DB architecture (Pinecone, Weaviate)", "Embedding model selection", "Chunking + indexing strategies", "Hybrid search (vector + keyword)", "RAG evaluation + optimization", "Production RAG patterns"] },
      { num: "07", name: "Real-Time Analytics", project: "Build a real-time analytics dashboard", lessons: ["ClickHouse + Druid", "Materialized views", "Real-time aggregation patterns", "Sub-second query optimization", "Streaming + batch lambda", "User-facing analytics"] },
      { num: "08", name: "Data Quality + Observability", project: "Build a data observability platform", lessons: ["Data quality frameworks (Great Expectations)", "Anomaly detection in data", "Data lineage tracking", "Freshness + volume monitoring", "Data incident management", "SLA + SLO for data"] },
      { num: "09", name: "Privacy-Enhancing Tech", project: "Implement differential privacy", lessons: ["Differential privacy", "Homomorphic encryption basics", "Federated learning", "Synthetic data generation", "k-anonymity + l-diversity", "Privacy-preserving analytics"] },
      { num: "10", name: "Data Governance + Compliance", project: "Build a data governance framework", lessons: ["Data catalog (DataHub, Collibra)", "Data lineage + provenance", "Access control + RBAC for data", "GDPR + CCPA compliance", "Data retention + deletion", "Audit + compliance reporting"] },
      { num: "11", name: "Cloud Data Platforms", project: "Deploy a cloud data platform", lessons: ["Snowflake architecture", "Databricks Lakehouse", "BigQuery + GCP data stack", "AWS Redshift + Lake Formation", "Azure Synapse + Fabric", "Multi-cloud data strategies"] },
      { num: "12", name: "ML Feature Engineering at Scale", project: "Build a feature store", lessons: ["Feature engineering patterns", "Online vs offline features", "Feature store architecture", "Feature discovery + reuse", "Point-in-time correctness", "Feature monitoring"] },
      { num: "13", name: "Experimentation + Causal Inference", project: "Build an A/B testing platform", lessons: ["Experiment design + power analysis", "A/B testing infrastructure", "Causal inference (DID, IV, regression discontinuity)", "Quasi-experiments", "Network effects + interference", "Decision frameworks"] },
      { num: "14", name: "Data Mesh + Federated Governance", project: "Design a data mesh architecture", lessons: ["Data mesh principles", "Domain-oriented data ownership", "Self-serve data platform", "Federated computational governance", "Data product thinking", "Organizational change management"] },
      { num: "15", name: "Data Leadership", project: "Write a data strategy document", lessons: ["Data strategy frameworks", "Building data teams", "Data literacy programs", "Stakeholder management", "ROI of data initiatives", "Board-level data reporting"] },
      { num: "16", name: "Capstone — Data Platform", project: "Build + ship a production data platform", lessons: ["Platform architecture", "Streaming + batch pipelines", "MLOps + feature store", "Governance + observability", "Demo to data leaders", "Portfolio + case study"] },
    ],
  },
'''

# Insert before the closing `];` of COURSES array
courses_close = src.find('];\n\nexport const EVENTS')
assert courses_close > 0, 'Could not find COURSES closing'
src = src[:courses_close] + new_courses + src[courses_close:]

FILE.write_text(src)
print(f'Wrote {len(src):,} bytes to {FILE}')
print('Added: 4 new tracks + 10 new courses')
