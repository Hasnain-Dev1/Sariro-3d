#!/usr/bin/env python3
"""SURGICAL insertion: add 4 new tracks + 10 new courses.
Does NOT touch any existing code — only inserts new content.
"""
from pathlib import Path

FILE = Path('/home/z/my-project/src/lib/sariro-data.ts')
src = FILE.read_text()

# 1. Add 4 new tracks BEFORE the closing `] as const;` of TRACKS
# Find the exact closing: `] as const;\n\nexport const COURSES`
tracks_close = src.find('] as const;\n\nexport const COURSES')
assert tracks_close > 0, 'Could not find TRACKS closing'

new_tracks = '''  {
    id: "prompt-engineering",
    name: "Prompt Engineering Track",
    short: "Prompt Eng",
    tagline: "Master the art and science of talking to AI.",
    accent: "violet",
    icon: "Sparkles",
    levels: ["Beginner"],
  },
  {
    id: "gtm-engineering",
    name: "GTM Engineering Track",
    short: "GTM Eng",
    tagline: "Build AI-powered go-to-market machines.",
    accent: "amber",
    icon: "Rocket",
    levels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    id: "ai-security",
    name: "AI Security Track",
    short: "AI Security",
    tagline: "Build AI security tools and defend against AI threats.",
    accent: "blue",
    icon: "Shield",
    levels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    id: "data-intelligence",
    name: "Data Intelligence Track",
    short: "Data Intel",
    tagline: "Turn raw data into AI-powered insights and predictions.",
    accent: "green",
    icon: "Database",
    levels: ["Beginner", "Intermediate", "Advanced"],
  },
'''

src = src[:tracks_close] + new_tracks + src[tracks_close:]

# 2. Add 10 new courses BEFORE the closing `];` of COURSES
# Use regex to find `];` followed by newlines then `export const EVENTS`
import re
courses_match = re.search(r'\];\n+export const EVENTS', src)
assert courses_match, 'Could not find COURSES closing'
courses_close = courses_match.start()

new_courses = '''
  /* ============================================================
     PROMPT ENGINEERING TRACK — 1 course (Beginner only)
     ============================================================ */
  {
    id: "prompt-eng-101",
    trackId: "prompt-engineering",
    title: "Prompt Engineering Mastery",
    tagline: "From vibes-based prompting to engineered, reproducible prompts that ship to production.",
    level: "Beginner", audience: "Professionals", durationWeeks: 6, modules: 5, lessons: 30,
    price: 199, originalPrice: 398, nextCohort: "Jul 22, 2026", featured: true, accent: "violet",
    outcomes: ["Design prompts that ship to production", "Build a reusable prompt library", "Evaluate prompts with real metrics", "Save 40%+ on API costs"],
    syllabus: [
      { num: "01", name: "Foundations of Prompting", project: "Reverse-engineer a production prompt", lessons: ["How LLMs read prompts", "System vs user vs assistant roles", "Tokens, context windows, limits", "Temperature, top-p, sampling", "Prompt structure patterns", "Common pitfalls"] },
      { num: "02", name: "Prompt Patterns & Engineering", project: "Build a library of 10 patterns", lessons: ["Few-shot prompting", "Chain-of-thought", "Self-critique + refinement", "Structured output (JSON)", "Tool use + function calling", "Multi-turn design"] },
      { num: "03", name: "Building a Prompt Library", project: "Ship a versioned prompt library", lessons: ["Prompt versioning + git", "Templating with variables", "A/B testing prompts", "Prompt composition + chaining", "Documentation standards", "Collaboration workflows"] },
      { num: "04", name: "Evaluation & Metrics", project: "Build an eval harness", lessons: ["Why evals matter", "Automated vs human evals", "LLM-as-judge", "Regression testing", "Cost + latency tracking", "Production monitoring"] },
      { num: "05", name: "Capstone — Production Prompt System", project: "Ship a real prompt-driven feature", lessons: ["Feature design", "Prompt chain build", "Guardrails + safety", "Production deploy", "Monitoring + iterating", "Case study"] },
    ],
  },

  /* ============================================================
     GTM ENGINEERING TRACK — 3 continuous courses
     ============================================================ */
  {
    id: "gtm-101",
    trackId: "gtm-engineering",
    title: "AI-Powered Outbound",
    tagline: "Build cold outreach machines that book meetings. AI personalization at scale.",
    level: "Beginner", audience: "Professionals", durationWeeks: 8, modules: 5, lessons: 30,
    price: 199, originalPrice: 398, nextCohort: "Aug 26, 2026", featured: true, accent: "amber",
    outcomes: ["Build an AI-personalized cold email system", "Achieve 5%+ reply rates", "Set up lead enrichment + scoring", "Book 10+ qualified meetings/week"],
    syllabus: [
      { num: "01", name: "GTM Fundamentals", project: "Map your ICP + buyer journey", lessons: ["What is GTM engineering", "ICP definition", "Buyer personas + pain points", "Channels: email, LinkedIn", "Metrics (reply, meeting, pipeline)", "GTM stack overview"] },
      { num: "02", name: "Lead Sourcing + Enrichment", project: "Build a 100-lead enriched list", lessons: ["Apollo, Clay, LinkedIn Sales Nav", "Firmographic + technographic data", "Email finding + verification", "AI enrichment (news, triggers)", "Lead scoring model", "CRM sync"] },
      { num: "03", name: "AI Personalization", project: "Write 50 personalized cold emails with AI", lessons: ["Why generic emails fail", "Personalization at scale with Claude", "Spintax + variation", "Reference frameworks", "Avoiding AI-sounding language", "A/B testing"] },
      { num: "04", name: "Outbound Automation", project: "Launch a 7-touch sequence", lessons: ["Instantly, Smartlead, Lemlist", "Domain warming + deliverability", "Multi-channel sequences", "Meeting booking + calendar sync", "Reply handling", "Compliance"] },
      { num: "05", name: "Capstone — Outbound Machine", project: "Launch a campaign that books meetings", lessons: ["Campaign planning", "Lead list + enrichment", "AI personalization pipeline", "Sequence launch + monitoring", "Optimization from data", "Demo day"] },
    ],
  },
  {
    id: "gtm-201",
    trackId: "gtm-engineering",
    title: "RevOps & Pipeline Engineering",
    tagline: "Turn leads into pipeline. CRM automation, attribution, and AI-powered sales ops.",
    level: "Intermediate", audience: "Professionals", durationWeeks: 12, modules: 7, lessons: 42,
    price: 299, originalPrice: 854, nextCohort: "Sep 17, 2026", featured: false, accent: "amber",
    outcomes: ["Build a full RevOps stack", "Implement multi-touch attribution", "Create AI-powered lead scoring", "Ship a sales analytics dashboard"],
    syllabus: [
      { num: "01", name: "CRM Architecture", project: "Design a HubSpot/Attio schema", lessons: ["CRM data models", "Custom objects + fields", "Deal stages + pipeline", "Lifecycle stages", "Data hygiene", "Migration"] },
      { num: "02", name: "Pipeline Automation", project: "Build 5 automations saving 10hrs/week", lessons: ["Workflow automation", "Lead routing + assignment", "Stage transitions", "Notifications + tasks", "Slack/Teams integration", "Error handling"] },
      { num: "03", name: "AI-Powered Sales Ops", project: "Build an AI sales assistant bot", lessons: ["Meeting notes + CRM sync", "AI deal coaching", "Automated follow-ups", "Sentiment analysis", "Objection playbooks", "Predictive scoring"] },
      { num: "04", name: "Attribution + Analytics", project: "Build a multi-touch attribution dashboard", lessons: ["First/last/multi-touch", "UTM strategy", "Data warehouse basics", "dbt transforms", "Dashboard design", "Pipeline velocity"] },
      { num: "05", name: "Lead Scoring + Routing", project: "Build an ML lead scoring model", lessons: ["Explicit + implicit scoring", "Feature engineering", "scikit-learn classification", "Real-time scoring API", "Routing rules + SLAs", "A/B testing"] },
      { num: "06", name: "Intent + ABM", project: "Build an account-based marketing engine", lessons: ["Intent data (G2, Bombora, Clay)", "ABM tier definition", "Account personalization", "Sales + marketing plays", "Target account lists", "ABM attribution"] },
      { num: "07", name: "Capstone — RevOps System", project: "Ship a complete RevOps system", lessons: ["Stack audit + architecture", "CRM setup + automation", "Attribution dashboard", "AI sales assistant", "Analytics + reporting", "Demo to sales leaders"] },
    ],
  },
  {
    id: "gtm-301",
    trackId: "gtm-engineering",
    title: "AI GTM Platform Engineering",
    tagline: "Build AI agents that run your entire go-to-market. From prospecting to closing.",
    level: "Advanced", audience: "Professionals", durationWeeks: 16, modules: 16, lessons: 96,
    price: 699, originalPrice: 2330, nextCohort: "Oct 14, 2026", featured: false, accent: "violet",
    outcomes: ["Build AI sales agents that prospect autonomously", "Ship a multi-agent GTM platform", "Implement real-time intent detection", "Architect revenue intelligence systems"],
    syllabus: [
      { num: "01", name: "GTM Agent Architecture", project: "Design a multi-agent GTM system", lessons: ["Agent roles in GTM", "Prospecting agent design", "Qualification agent", "Outreach agent", "Orchestration patterns", "Safety + human-in-the-loop"] },
      { num: "02", name: "Prospecting Agents", project: "Build an agent that finds leads 24/7", lessons: ["Clay + Apollo API", "Web scraping with agents", "Enrichment pipeline", "Deduplication + quality", "Trigger-based prospecting", "Cost optimization"] },
      { num: "03", name: "Qualification Agents", project: "Build an agent that qualifies leads", lessons: ["BANT + MEDDIC", "Conversational qualification", "Multi-turn dialogue", "Sentiment + intent", "Handoff to human AE", "CRM sync + deal creation"] },
      { num: "04", name: "Outreach Agents", project: "Build an agent that sends outreach", lessons: ["Personalization at scale", "Multi-channel orchestration", "Reply classification", "Objection handling", "Sequence optimization with RL", "Deliverability"] },
      { num: "05", name: "Meeting Booking Agents", project: "Build an agent that books meetings", lessons: ["Calendar API integration", "Time zone handling", "Reminders + confirmations", "Pre-meeting briefs", "No-show recovery", "Calendar optimization"] },
      { num: "06", name: "Sales Intelligence Agents", project: "Build an agent that researches accounts", lessons: ["10-K + earnings analysis", "LinkedIn + news monitoring", "Competitor battlecards", "Stakeholder mapping", "Pre-meeting briefs", "Post-meeting summary"] },
      { num: "07", name: "Pipeline Prediction", project: "Build a deal prediction model", lessons: ["Feature engineering from CRM", "Time-series forecasting", "Win/loss prediction", "Deal velocity analysis", "Forecast accuracy", "Scenario modeling"] },
      { num: "08", name: "Churn Prediction + Retention", project: "Build a churn early-warning system", lessons: ["Churn signals from product data", "Survival analysis", "Health score design", "At-risk alerts", "Save plays", "Expansion detection"] },
      { num: "09", name: "Revenue Attribution with ML", project: "Build an ML attribution model", lessons: ["Markov chain attribution", "Shapley value", "Data warehouse + feature store", "Model training + deployment", "Attribution dashboard", "Marketing mix optimization"] },
      { num: "10", name: "Pricing + Packaging Optimization", project: "Build a pricing recommendation engine", lessons: ["Willingness-to-pay modeling", "Cohort + segment analysis", "Price elasticity", "Packaging strategy", "A/B testing pricing", "Revenue forecasting"] },
      { num: "11", name: "GTM Data Platform", project: "Build a GTM data warehouse", lessons: ["Data warehouse architecture", "ELT pipelines (Fivetran, Airbyte)", "dbt models for GTM", "Reverse ETL (Hightouch, Census)", "Data quality", "Privacy + compliance"] },
      { num: "12", name: "Multi-Agent Orchestration", project: "Build a 5-agent GTM crew", lessons: ["CrewAI for GTM", "Agent communication", "Shared state + memory", "Conflict resolution", "Supervisor agent", "Production deployment"] },
      { num: "13", name: "Real-Time Intent Detection", project: "Build a real-time intent pipeline", lessons: ["Intent data sources", "Streaming architecture (Kafka, Redis)", "Signal scoring", "Trigger-based automation", "Slack/Teams alerting", "Rep assignment"] },
      { num: "14", name: "GTM Security + Compliance", project: "Audit a GTM stack for compliance", lessons: ["Data privacy (GDPR, CCPA)", "Consent management", "Email compliance", "Data retention", "Vendor security review", "SOC2 for GTM"] },
      { num: "15", name: "GTM Leadership + Strategy", project: "Write a GTM strategy doc", lessons: ["GTM operating model", "Sales/marketing/CS alignment", "Compensation plans", "Territory + quota planning", "Board reporting", "Scaling GTM teams"] },
      { num: "16", name: "Capstone — AI GTM Platform", project: "Build + ship a multi-agent GTM platform", lessons: ["Platform architecture", "Multi-agent system", "CRM + data integration", "Analytics + forecasting", "Demo to CRO + board", "Portfolio + case study"] },
    ],
  },

  /* ============================================================
     AI SECURITY TRACK — 3 continuous courses
     ============================================================ */
  {
    id: "sec-101",
    trackId: "ai-security",
    title: "Security Fundamentals",
    tagline: "Learn how attackers think and how to defend. From zero to your first security audit.",
    level: "Beginner", audience: "Students", durationWeeks: 8, modules: 5, lessons: 30,
    price: 199, originalPrice: 398, nextCohort: "Aug 19, 2026", featured: false, accent: "blue",
    outcomes: ["Understand the attacker mindset", "Audit a web app for OWASP Top 10", "Set up basic security monitoring", "Implement secure auth + authz"],
    syllabus: [
      { num: "01", name: "Security Mindset", project: "Threat-model a real application", lessons: ["Attacker vs defender", "CIA triad + AAA", "Threat modeling (STRIDE)", "Risk assessment", "Security culture", "Responsible disclosure"] },
      { num: "02", name: "Web Vulnerabilities", project: "Find 3 vulnerabilities in a test app", lessons: ["OWASP Top 10", "XSS", "SQL injection", "CSRF", "IDOR", "Security misconfiguration"] },
      { num: "03", name: "Authentication + Authorization", project: "Build secure login + RBAC", lessons: ["Passwords + hashing", "Session vs JWT", "OAuth 2.0 + OIDC", "RBAC", "MFA", "Common auth mistakes"] },
      { num: "04", name: "Network + Infrastructure Security", project: "Secure an AWS environment basics", lessons: ["TCP/IP + DNS", "Firewalls + security groups", "HTTPS + TLS", "VPN + zero trust", "Cloud IAM", "Secrets management"] },
      { num: "05", name: "Capstone — Security Audit", project: "Conduct + report a full security audit", lessons: ["Audit methodology", "Manual testing checklist", "Burp Suite basics", "Writing a security report", "Remediation", "Presenting to stakeholders"] },
    ],
  },
  {
    id: "sec-201",
    trackId: "ai-security",
    title: "AI-Powered Security Tools",
    tagline: "Build AI tools that detect threats, analyze code, and automate security work.",
    level: "Intermediate", audience: "Professionals", durationWeeks: 12, modules: 7, lessons: 42,
    price: 299, originalPrice: 854, nextCohort: "Sep 03, 2026", featured: false, accent: "blue",
    outcomes: ["Build an AI vulnerability scanner", "Create an AI security monitoring dashboard", "Implement AI-assisted code review", "Ship automated security reports"],
    syllabus: [
      { num: "01", name: "AI for Security Analysis", project: "Build an AI code vulnerability scanner", lessons: ["Claude for code analysis", "Static analysis with AI", "Pattern recognition in logs", "False positive reduction", "Severity scoring", "Fix suggestions"] },
      { num: "02", name: "Threat Detection with ML", project: "Build an anomaly detection system", lessons: ["Log aggregation (Loki, ELK)", "Feature engineering from logs", "Isolation forest + one-class SVM", "Real-time detection", "Alert tuning", "Incident response"] },
      { num: "03", name: "AI-Powered Pentesting", project: "AI-assisted pentest on a test env", lessons: ["Recon automation", "AI exploit hypotheses", "Automated scanning", "Burp Suite + AI", "Privilege escalation", "Report generation"] },
      { num: "04", name: "Security Automation", project: "Build a SOC automation pipeline", lessons: ["SOAR fundamentals", "Playbook design", "Automated triage + enrichment", "Threat intel integration", "Slack/Teams alerting", "Metrics + SLAs"] },
      { num: "05", name: "Cloud Security Monitoring", project: "Build a cloud security dashboard", lessons: ["AWS CloudTrail + GuardDuty", "Azure Security Center", "GCP SCC", "CSPM", "Container scanning", "Compliance automation"] },
      { num: "06", name: "Adversarial AI Defense", project: "Defend an AI model against attacks", lessons: ["Prompt injection", "Jailbreak techniques", "Data poisoning detection", "Model extraction", "Adversarial examples", "Red-teaming LLMs"] },
      { num: "07", name: "Capstone — Security Product", project: "Build + ship an AI security tool", lessons: ["Product design", "Scanner implementation", "Dashboard + reporting", "API + integration", "Pricing model", "Demo + portfolio"] },
    ],
  },
  {
    id: "sec-301",
    trackId: "ai-security",
    title: "AI Red Team & Advanced SecOps",
    tagline: "Offensive AI security at scale. Red-team LLMs, build adversarial systems, lead security orgs.",
    level: "Advanced", audience: "Professionals", durationWeeks: 16, modules: 16, lessons: 96,
    price: 699, originalPrice: 2330, nextCohort: "Oct 14, 2026", featured: false, accent: "violet",
    outcomes: ["Lead AI red-team engagements", "Build adversarial AI testing frameworks", "Architect enterprise SecOps platforms", "Design AI governance programs"],
    syllabus: [
      { num: "01", name: "AI Red Teaming Methodology", project: "Design a red-team engagement plan", lessons: ["Red team vs pentest vs bug bounty", "OWASP LLM Top 10", "Attack surface mapping", "Rules of engagement", "Scope + success criteria", "Executive reporting"] },
      { num: "02", name: "Prompt Injection at Scale", project: "Build a prompt injection testing framework", lessons: ["Direct vs indirect injection", "System prompt extraction", "Jailbreak taxonomy", "Automated jailbreak generation", "Bypassing filters", "Defensive mitigations"] },
      { num: "03", name: "Model Extraction + Privacy", project: "Extract a model's training data", lessons: ["Model inversion", "Membership inference", "Training data extraction", "Differential privacy", "Federated learning security", "Privacy-preserving ML"] },
      { num: "04", name: "Adversarial Examples", project: "Generate adversarial inputs for a vision model", lessons: ["FGSM + PGD attacks", "Carlini-Wagner", "Adversarial patches", "Evasion in production", "Defensive distillation", "Certified robustness"] },
      { num: "05", name: "AI Supply Chain Security", project: "Audit an ML pipeline for supply chain risks", lessons: ["Model serialization risks", "Backdoored models", "Dataset poisoning", "Dependency vulnerabilities", "SBOM for ML", "Model signing"] },
      { num: "06", name: "Multi-Agent Attack Systems", project: "Build a multi-agent red-team system", lessons: ["Autonomous pentest agents", "Multi-agent coordination", "Recon + exploit agents", "Evasion agent", "Human-in-the-loop", "Scaling operations"] },
      { num: "07", name: "Defensive AI Systems", project: "Build an AI defense platform", lessons: ["AI-powered WAF", "Behavioral anomaly detection", "Automated incident response", "Threat hunting with AI", "Deception + honeypots", "Defense-in-depth for AI"] },
      { num: "08", name: "Enterprise SecOps Architecture", project: "Design an enterprise SecOps platform", lessons: ["SOC 2 + ISO 27001", "SIEM + SOAR integration", "Threat intel platform", "Security data lake", "Detection engineering", "MTTD/MTTR optimization"] },
      { num: "09", name: "Cloud Native Security", project: "Secure a multi-cloud K8s environment", lessons: ["K8s security best practices", "Service mesh security (Istio)", "Container runtime security", "Cloud-native threat detection", "Zero trust architecture", "Supply chain security (SLSA)"] },
      { num: "10", name: "AI Governance + Compliance", project: "Write an AI governance framework", lessons: ["EU AI Act", "NIST AI RMF", "Model cards + risk assessments", "Audit trails + explainability", "Bias auditing + fairness", "Regulatory reporting"] },
      { num: "11", name: "Forensics + Incident Response", project: "Conduct a forensic investigation", lessons: ["Digital forensics fundamentals", "AI-specific forensics", "Incident response lifecycle", "Post-incident analysis", "Lessons learned", "Legal notification"] },
      { num: "12", name: "Threat Intelligence", project: "Build a threat intel platform for AI threats", lessons: ["Threat intel sources + feeds", "STIX/TAXII", "AI threat landscape tracking", "IOC management", "Threat hunting workflows", "Information sharing (ISACs)"] },
      { num: "13", name: "Secure ML Engineering", project: "Build a secure ML training pipeline", lessons: ["Secure by design ML", "Reproducible + auditable training", "Model versioning + lineage", "Secure deployment", "Monitoring ML in production", "Incident response for ML"] },
      { num: "14", name: "Bug Bounty + Disclosure", project: "Submit a valid bug bounty report", lessons: ["Bug bounty platforms", "AI-specific bounties", "Writing high-quality reports", "Communication + negotiation", "CVSS scoring", "Coordinated disclosure"] },
      { num: "15", name: "Security Leadership", project: "Build a security team charter", lessons: ["CISO leadership", "Security team structures", "Budget + resource planning", "Board communication", "Security culture + training", "Vendor risk management"] },
      { num: "16", name: "Capstone — AI Security Platform", project: "Build + ship an AI red-team or defense platform", lessons: ["Platform architecture", "Red-team OR defense system", "Integration + testing", "Documentation + reporting", "Demo to security leaders", "Portfolio + OSS release"] },
    ],
  },

  /* ============================================================
     DATA INTELLIGENCE TRACK — 3 continuous courses
     ============================================================ */
  {
    id: "data-101",
    trackId: "data-intelligence",
    title: "Data Thinking & Python Basics",
    tagline: "From zero to your first data dashboard. Learn Python, Pandas, and how to ask the right questions.",
    level: "Beginner", audience: "Students", durationWeeks: 8, modules: 5, lessons: 30,
    price: 199, originalPrice: 398, nextCohort: "Aug 12, 2026", featured: false, accent: "green",
    outcomes: ["Analyze a real dataset and find insights", "Clean messy real-world data with Pandas", "Build your first interactive dashboard", "Tell stories with data"],
    syllabus: [
      { num: "01", name: "Data Thinking", project: "Analyze a dataset and find 3 insights", lessons: ["What data can tell you", "Types of analysis", "Asking the right questions", "Data sources + collection", "Correlation vs causation", "Common data mistakes"] },
      { num: "02", name: "Python for Data", project: "Clean a messy CSV dataset", lessons: ["Python basics for data", "Jupyter notebooks", "Pandas DataFrames", "Filtering + sorting", "Handling missing data", "Data type conversion"] },
      { num: "03", name: "Exploratory Analysis", project: "Explore a real dataset end-to-end", lessons: ["Summary statistics", "Grouping + aggregation", "Merging + joining", "Pivot tables", "Outlier detection", "Hypothesis generation"] },
      { num: "04", name: "Data Visualization", project: "Build 5 charts that tell a story", lessons: ["Chart selection", "Plotly + Matplotlib", "Dashboard design", "Color + accessibility", "Storytelling with data", "Common viz mistakes"] },
      { num: "05", name: "Capstone — Data Dashboard", project: "Ship an interactive dashboard", lessons: ["Streamlit basics", "Building the dashboard", "Adding interactivity", "Deploying live", "Presenting insights", "Portfolio write-up"] },
    ],
  },
  {
    id: "data-201",
    trackId: "data-intelligence",
    title: "AI Analytics & Machine Learning",
    tagline: "Turn data into predictions. ML, AI-powered analytics, and production data products.",
    level: "Intermediate", audience: "Professionals", durationWeeks: 12, modules: 7, lessons: 42,
    price: 299, originalPrice: 854, nextCohort: "Sep 03, 2026", featured: false, accent: "green",
    outcomes: ["Build an AI-powered analytics assistant", "Train + deploy a churn prediction model", "Create a real-time prediction API", "Ship a data pipeline"],
    syllabus: [
      { num: "01", name: "SQL + Data Warehousing", project: "Build a data warehouse", lessons: ["SQL fundamentals", "Window functions", "PostgreSQL + Supabase", "Data modeling (star schema)", "ETL basics", "Query optimization"] },
      { num: "02", name: "AI for Data Analysis", project: "Build an AI data analyst", lessons: ["Claude API for data questions", "Natural language to SQL", "Automated insight generation", "AI-powered reporting", "Context injection", "Hallucination prevention"] },
      { num: "03", name: "Machine Learning Basics", project: "Build a churn prediction model", lessons: ["ML without deep math", "scikit-learn pipeline", "Train/test split + cross-validation", "Classification + regression", "Feature engineering", "Model evaluation"] },
      { num: "04", name: "Prediction Systems", project: "Build a price prediction tool", lessons: ["Regression models", "Feature selection", "Model deployment with Streamlit", "Real-time prediction API", "Monitoring performance", "A/B testing models"] },
      { num: "05", name: "Data Pipelines", project: "Build an automated data pipeline", lessons: ["ETL pipeline design", "Scheduling (cron + Airflow)", "Data quality checks", "Pipeline monitoring", "Error handling + retries", "Documentation"] },
      { num: "06", name: "Business Intelligence", project: "Build a KPI dashboard", lessons: ["KPI design frameworks", "Power BI / Metabase", "Automated reporting", "Executive dashboards", "Self-service analytics", "Driving decisions"] },
      { num: "07", name: "Capstone — AI Analytics Product", project: "Ship a complete AI analytics product", lessons: ["End-to-end product design", "Real data source integration", "User-facing dashboard", "Automated pipeline", "Documentation + demo", "Portfolio presentation"] },
    ],
  },
  {
    id: "data-301",
    trackId: "data-intelligence",
    title: "Data Platform Engineering",
    tagline: "Build data platforms at scale. Real-time streaming, MLOps, and enterprise data architecture.",
    level: "Advanced", audience: "Professionals", durationWeeks: 16, modules: 16, lessons: 96,
    price: 699, originalPrice: 2330, nextCohort: "Oct 14, 2026", featured: false, accent: "violet",
    outcomes: ["Architect enterprise data platforms", "Build real-time streaming pipelines", "Implement MLOps at production scale", "Lead data engineering teams"],
    syllabus: [
      { num: "01", name: "Data Platform Architecture", project: "Design an enterprise data platform", lessons: ["Data mesh vs lake vs warehouse", "Lakehouse architecture", "Multi-region strategies", "Data governance + cataloging", "Platform team operating model", "Cost optimization"] },
      { num: "02", name: "Streaming Data Systems", project: "Build a real-time streaming pipeline", lessons: ["Kafka fundamentals", "Spark Structured Streaming", "Flink for stream processing", "Windowing + state management", "Exactly-once semantics", "Stream-table duality"] },
      { num: "03", name: "Advanced Data Modeling", project: "Design a multi-tenant data model", lessons: ["Dimensional modeling (Kimball)", "Data Vault 2.0", "Multi-tenant SaaS patterns", "Slowly changing dimensions", "Data contracts", "Schema evolution"] },
      { num: "04", name: "dbt + Analytics Engineering", project: "Build a dbt project with 50+ models", lessons: ["dbt fundamentals", "Modeling patterns", "Testing + documentation", "CI/CD for dbt", "dbt Cloud + orchestration", "Analytics as code"] },
      { num: "05", name: "MLOps at Scale", project: "Build an MLOps pipeline", lessons: ["ML lifecycle management", "Feature stores (Feast, Tecton)", "Model registry + versioning", "Continuous training", "Model monitoring + drift", "A/B testing + canary"] },
      { num: "06", name: "Vector Databases + RAG", project: "Build a production RAG system", lessons: ["Vector DB architecture (Pinecone, Weaviate)", "Embedding model selection", "Chunking + indexing", "Hybrid search", "RAG evaluation", "Production RAG patterns"] },
      { num: "07", name: "Real-Time Analytics", project: "Build a real-time analytics dashboard", lessons: ["ClickHouse + Druid", "Materialized views", "Real-time aggregation", "Sub-second queries", "Streaming + batch lambda", "User-facing analytics"] },
      { num: "08", name: "Data Quality + Observability", project: "Build a data observability platform", lessons: ["Data quality (Great Expectations)", "Anomaly detection in data", "Data lineage tracking", "Freshness + volume monitoring", "Data incident management", "SLA + SLO for data"] },
      { num: "09", name: "Privacy-Enhancing Tech", project: "Implement differential privacy", lessons: ["Differential privacy", "Homomorphic encryption", "Federated learning", "Synthetic data generation", "k-anonymity + l-diversity", "Privacy-preserving analytics"] },
      { num: "10", name: "Data Governance + Compliance", project: "Build a data governance framework", lessons: ["Data catalog (DataHub, Collibra)", "Data lineage + provenance", "Access control + RBAC", "GDPR + CCPA compliance", "Data retention + deletion", "Audit + compliance reporting"] },
      { num: "11", name: "Cloud Data Platforms", project: "Deploy a cloud data platform", lessons: ["Snowflake architecture", "Databricks Lakehouse", "BigQuery + GCP stack", "AWS Redshift + Lake Formation", "Azure Synapse + Fabric", "Multi-cloud strategies"] },
      { num: "12", name: "ML Feature Engineering at Scale", project: "Build a feature store", lessons: ["Feature engineering patterns", "Online vs offline features", "Feature store architecture", "Feature discovery + reuse", "Point-in-time correctness", "Feature monitoring"] },
      { num: "13", name: "Experimentation + Causal Inference", project: "Build an A/B testing platform", lessons: ["Experiment design + power analysis", "A/B testing infrastructure", "Causal inference (DID, IV, RDD)", "Quasi-experiments", "Network effects + interference", "Decision frameworks"] },
      { num: "14", name: "Data Mesh + Federated Governance", project: "Design a data mesh architecture", lessons: ["Data mesh principles", "Domain-oriented ownership", "Self-serve platform", "Federated governance", "Data product thinking", "Org change management"] },
      { num: "15", name: "Data Leadership", project: "Write a data strategy document", lessons: ["Data strategy frameworks", "Building data teams", "Data literacy programs", "Stakeholder management", "ROI of data initiatives", "Board-level reporting"] },
      { num: "16", name: "Capstone — Data Platform", project: "Build + ship a production data platform", lessons: ["Platform architecture", "Streaming + batch pipelines", "MLOps + feature store", "Governance + observability", "Demo to data leaders", "Portfolio + case study"] },
    ],
  },
'''

src = src[:courses_close] + new_courses + src[courses_close:]

FILE.write_text(src)
print(f'Wrote {len(src):,} bytes')
print('Added 4 tracks + 10 courses (surgical insert — nothing else touched)')
