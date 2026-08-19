import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * Momentum · Lesson 27 — Custom Domains & DNS
 * Module 5 (Deploy + Capstone) · Lesson 27 of 30
 */
export const lesson27: StructuredLesson = {
  courseId: 'web-101',
  moduleNum: 5,
  lessonIndex: 2,
  globalNumber: 27,
  name: 'Custom domains & DNS',
  title: 'A Real Address — Custom Domains & DNS',
  subtitle: "Point a real domain name at Momentum, and understand how the internet finds it.",

  concept: {
    durationMin: 15,
    summary:
      "Learn what DNS actually does, the key record types that connect a domain to a host, and how to attach a custom domain to a Vercel deployment.",
    sections: [
      {
        heading: 'What is a domain, really?',
        body:
          "Computers find each other on the internet using IP addresses (like 76.76.21.21) — hard for humans to remember. A domain name (like momentum-app.com) is a human-friendly label that MAPS to an IP address (or, more precisely for modern hosts like Vercel, to their infrastructure). You 'buy' a domain from a registrar (Namecheap, GoDaddy, Google Domains, etc.) — really, you're renting the right to use that name for a period of time.",
      },
      {
        heading: 'What is DNS?',
        body:
          "DNS (Domain Name System) is the internet's phonebook: it translates a domain name into the technical information needed to reach it. When you type momentum-app.com into a browser, DNS servers are queried to find out WHERE that name points, before your browser can even start loading the page.",
      },
      {
        heading: 'The key DNS record types you’ll actually use',
        body:
          "An A record points a domain directly to an IP address. A CNAME record points a domain to ANOTHER domain name (an alias) — this is what you'll typically use for a subdomain pointing at Vercel. Vercel usually asks for one of these two, depending on whether you're connecting a root domain (momentum-app.com) or a subdomain (www.momentum-app.com or app.momentum-app.com).",
        code: {
          language: 'text',
          code:
            "Type    Name/Host       Value\nA       @               76.76.21.21          (root domain -> Vercel's IP)\nCNAME   www             cname.vercel-dns.com (subdomain -> Vercel's hostname)",
        },
      },
      {
        heading: 'Connecting a domain in Vercel',
        body:
          "In your Vercel project: Settings → Domains → add your domain (e.g. momentum-app.com). Vercel tells you EXACTLY which DNS records to add, and where — you then go to your DOMAIN REGISTRAR's dashboard (not Vercel) to add those records, since the registrar controls your domain's DNS settings.",
      },
      {
        heading: 'DNS propagation — why it’s not instant',
        body:
          "DNS changes don't take effect everywhere immediately — they can take anywhere from a few minutes to (rarely) up to 48 hours to 'propagate' across the internet's many DNS servers worldwide, each with its own caching. This is normal; Vercel's dashboard shows a checkmark once it detects the records are correctly set and active.",
      },
    ],
    keyTerms: [
      { term: 'Domain', definition: "A human-readable name (e.g. momentum-app.com) that maps to a host, rented from a registrar." },
      { term: 'DNS', definition: "Domain Name System — the internet's system for translating domain names into technical routing information." },
      { term: 'A record', definition: "A DNS record pointing a domain directly to an IP address." },
      { term: 'CNAME record', definition: "A DNS record pointing a domain to ANOTHER domain name (an alias)." },
      { term: 'Registrar', definition: "The company you rent a domain name from (e.g. Namecheap, GoDaddy)." },
      { term: 'DNS propagation', definition: "The delay before a DNS change is visible everywhere on the internet." },
    ],
    commonMistakes: [
      "Trying to add DNS records inside Vercel instead of your domain REGISTRAR's dashboard — Vercel only tells you what to add, it doesn't control your registrar.",
      "Expecting DNS changes to work instantly and panicking when they don't — propagation can genuinely take time.",
      "Confusing an A record (points to an IP) with a CNAME (points to another domain name) and adding the wrong type.",
      "Forgetting to also connect www if you want both the root domain and www to work.",
      "Not double-checking for typos in the record VALUE — a single wrong character breaks the whole connection.",
    ],
    takeaways: [
      "A domain is a human-friendly name mapping to a host, rented from a registrar.",
      "DNS translates domain names into the routing information browsers need.",
      "A records point to an IP; CNAME records point to another domain name.",
      "You add DNS records at your REGISTRAR, following the exact values Vercel provides.",
      "DNS changes can take time to propagate — patience and Vercel's status checkmark are the way to verify.",
    ],
  },

  miniProject: {
    durationMin: 15,
    title: 'Reading real DNS records',
    objective:
      "Practise reading and understanding DNS records for a real domain, without needing to own or configure one yet.",
    instructions: [
      "Pick any well-known site (e.g. github.com).",
      "Use an online DNS lookup tool (or a terminal command like nslookup) to inspect its records.",
      "Identify whether it uses an A record, and note the IP address returned.",
      "Write down, in your own words, what that record means.",
    ],
    code: [
      {
        language: 'bash',
        code:
          "nslookup github.com\n\n# Example output (simplified):\n# Name:    github.com\n# Address: 140.82.112.3",
      },
    ],
    explanation:
      "nslookup queries DNS servers directly and shows you the actual record data for a domain — in this case, an A record resolving github.com to a real IP address. This is exactly what your browser does silently every time you visit a site: look up the domain, get back an address, THEN connect to that address to load the page. Seeing the raw lookup output makes the earlier concept ('DNS is the internet's phonebook') concrete rather than abstract.",
    expectedOutput:
      "A terminal output showing the domain name and one or more numeric IP addresses it resolves to.",
    learned: [
      "How to perform a real DNS lookup.",
      "What an A record's actual output looks like.",
      "That domain resolution happens before every page load.",
      "How to read basic DNS query results.",
    ],
  },

  finalProject: {
    durationMin: 30,
    feature: "Momentum connected to a real custom domain (or a subdomain, if using a domain you already own) — a professional address instead of the default .vercel.app URL.",
    why:
      "A custom domain (yourhabitapp.com instead of momentum-app-yourname.vercel.app) is the difference between a demo and a real product — it's what you'd put on a resume, a business card, or share with actual users.",
    fileLocation: "Vercel dashboard (Settings → Domains) + your domain registrar's DNS settings — no code changes",
    code: [
      {
        language: 'text',
        filename: 'Vercel dashboard steps',
        code:
          "1. In your Vercel project, go to Settings → Domains.\n2. Type your domain (e.g. momentum-app.com) and click \"Add\".\n3. Vercel shows the EXACT DNS records you need to add — usually an A record\n   for the root domain and/or a CNAME for www.\n4. Copy those exact values.",
      },
      {
        language: 'text',
        filename: 'Registrar dashboard steps',
        code:
          "1. Log into your domain registrar (Namecheap, GoDaddy, etc.) — NOT Vercel.\n2. Find the DNS settings / DNS management section for your domain.\n3. Add the records EXACTLY as Vercel specified (correct type, name, and value).\n4. Save, then return to Vercel and wait for the domain status to show \"Valid\".",
      },
    ],
    placement:
      "This is entirely dashboard configuration across two different platforms (Vercel for the app, your registrar for DNS) — no code in the Momentum project changes. If you don't own a domain, you can either purchase an inexpensive one for this exercise, or use a free subdomain-style option some registrars offer, or simply document the steps you WOULD take (many students complete this lesson conceptually until they invest in a domain for their portfolio).",
    implementation:
      "Vercel's domain check works by periodically querying DNS itself to confirm the records you added match what it's expecting — once they do (and propagation has happened), it marks the domain 'Valid' and starts serving Momentum at that address, with automatic HTTPS (a secure padlock) provisioned for you with zero extra configuration. The registrar is where you actually CONTROL the DNS records because that company legally administers your domain name; Vercel can only tell you what those records need to say.",
    expectedResult:
      "Visiting your custom domain (once DNS has propagated) shows Momentum, running exactly as it does on the .vercel.app URL — but at an address you own and control.",
    connects:
      "Momentum now has a professional home. Lesson 28 adds SEO and meta tags so the domain shares beautifully on social media and ranks properly in search, and Lesson 29-30 wrap up the capstone build and launch.",
  },

  quiz: [
    { id: 'l27q1', kind: 'concept', prompt: 'What is DNS, in plain terms?', options: ['A hosting platform', 'The system that translates domain names into the technical info needed to reach them', 'A programming language', 'A type of database'], answerIndex: 1, explanation: "DNS is often described as the internet's phonebook — translating names into routable addresses." },
    { id: 'l27q2', kind: 'concept', prompt: 'What does an A record do?', options: ['Points a domain to another domain name', 'Points a domain directly to an IP address', 'Deletes a domain', 'Sets up email'], answerIndex: 1, explanation: "An A record maps a domain name directly to a numeric IP address." },
    { id: 'l27q3', kind: 'concept', prompt: 'What does a CNAME record do?', options: ['Points a domain to an IP directly', 'Points a domain to ANOTHER domain name (an alias)', 'Registers a new domain', 'Sets a password'], answerIndex: 1, explanation: "CNAME creates an alias pointing to another hostname, commonly used for subdomains." },
    { id: 'l27q4', kind: 'application', prompt: 'Where do you actually ADD the DNS records Vercel asks for?', options: ['Inside the Vercel dashboard only', 'At your domain REGISTRAR’s DNS management settings', 'In your Next.js code', 'In .env.local'], answerIndex: 1, explanation: "The registrar controls your domain's DNS; Vercel only tells you what values to add there." },
    { id: 'l27q5', kind: 'concept', prompt: 'Why might a newly-added DNS record not work immediately?', options: ['It never works immediately', 'DNS propagation takes time to spread across the internet’s many DNS servers', 'The record is always wrong at first', 'Vercel blocks it deliberately'], answerIndex: 1, explanation: "Propagation delay is normal and can range from minutes to (rarely) up to 48 hours." },
    { id: 'l27q6', kind: 'debug', prompt: 'A student adds DNS records but they’re a CNAME when Vercel asked for an A record. What’s likely to happen?', options: ['It works exactly the same either way', 'The domain likely won’t resolve correctly until the right record type is used', 'DNS ignores record type', 'Vercel automatically fixes it'], answerIndex: 1, explanation: "Record type matters — using the wrong one typically prevents correct resolution." },
    { id: 'l27q7', kind: 'application', prompt: 'What does Vercel automatically provision once a custom domain is verified?', options: ['A new GitHub repo', 'HTTPS (a secure certificate) for the domain', 'A new API key', 'A database'], answerIndex: 1, explanation: "Vercel handles HTTPS certificate provisioning automatically for connected domains." },
    { id: 'l27q8', kind: 'output', prompt: 'What does an nslookup (or similar DNS lookup) command reveal for a domain?', options: ['Its source code', 'The domain’s resolved DNS record data (like an IP address)', 'Its file structure', 'Its API keys'], answerIndex: 1, explanation: "DNS lookup tools query and display a domain's actual DNS record data." },
    { id: 'l27q9', kind: 'project', prompt: "Why doesn't connecting a custom domain require any changes to Momentum's actual code?", options: ['It secretly does require code changes', 'Domain connection is purely DNS/hosting configuration, unrelated to the app’s source code', 'Next.js doesn’t support custom domains', 'It’s a coincidence'], answerIndex: 1, explanation: "The app itself doesn't know or care what domain serves it — domain routing is entirely a hosting/DNS concern." },
    { id: 'l27q10', kind: 'concept', prompt: 'What is a registrar?', options: ['A hosting platform like Vercel', 'The company you rent a domain name from', 'A CSS framework', 'A type of DNS record'], answerIndex: 1, explanation: "A registrar (Namecheap, GoDaddy, etc.) is who you purchase/rent a domain name through." },
  ],

  homework: {
    task:
      "Write a short 'How I connected my domain' note (a few sentences, in your README or a new NOTES.md) documenting the record type(s) you used and roughly how long propagation took for you — useful both as a personal reference and as evidence of understanding for a portfolio reviewer.",
    requirements: [
      "Note which record type(s) you added (A and/or CNAME).",
      "Note the approximate propagation time you observed.",
      "If you didn't purchase a domain, document the STEPS you would take instead, showing you understand the process conceptually.",
    ],
    expectedOutcome:
      "A short, clear written record showing you understand domain/DNS configuration, whether or not you completed it with a real purchased domain.",
    extends: 'final',
    previousHomeworkHint: {
      forLessonNumber: 26,
      hint: "Lesson 26 asked you to add a second environment variable, NEXT_PUBLIC_APP_VERSION, configured both locally and on Vercel, and display it in the footer.",
      steps: [
        "Add NEXT_PUBLIC_APP_VERSION=1.0.0 to .env.local.",
        "Add the same variable name on Vercel (Settings → Environment Variables), then redeploy.",
        "In your Footer component, read process.env.NEXT_PUBLIC_APP_VERSION and render it.",
        "Confirm it shows on both localhost and the live site.",
      ],
      codeGuidance: [
        {
          language: 'tsx',
          filename: 'components/Footer.tsx',
          code:
            "export function Footer() {\n  return (\n    <footer className=\"flex justify-between items-center px-8 py-5 border-t text-sm text-slate-500\">\n      <p>Made with Momentum · Sariro · v{process.env.NEXT_PUBLIC_APP_VERSION}</p>\n    </footer>\n  );\n}",
        },
      ],
    },
  },
};
