# Practice rooms for every course — plan (18 Sep 2026)

**Brief (Mimo, via Hasnain):** build a practice room for every course, the way Public Speaking has one: coding, physics, chemistry and the rest.

**What exists today:** `/dashboard/student/practice` is the Public Speaking room.
- Speaking, listening, writing and sound labs, plus Voice Quest (rank, streak, XP, homework).
- **Runs on the device:** no API call and no cost per attempt, so a child can try nine times. This is a founding principle (see the header of `practice/page.tsx`).
- **Gated by enrolment:** `lib/speaking/access.ts` covers active or completed enrolment, band-specific rooms and a locked state that explains why.
- **Logged:** `practice_attempts` stores user, kind (`speaking|listening|writing`), drill id, score 0–100 and metrics. RLS is own rows only.
- **Tied to the syllabus:** drills are keyed to lessons (`public-speaking:<band>:<module>:<lesson>`).

---

## 1. The idea in one line
One practice hub. Each enrolled course brings its own room, whose labs fit the subject. They share one engine for questions, checking, hints, mastery, streaks and logging, and everything is checked on the device.

## 2. The shared engine (built once, used by every subject)

| Piece | What it does |
|:--|:--|
| **Item types** | multiple choice; numeric answer (tolerance, **units**, significant figures); algebraic expression (checked by evaluating at random points); fill in the blank; put steps in order; sort into groups; match pairs; label a diagram (SVG hotspots); code with hidden tests |
| **Generators** | Parametric templates, e.g. "a car accelerates from {u} to {v} in {t} s…", with seeded random numbers. The same seed always gives the same question, so an attempt can be replayed and checked, and practice never runs out. |
| **Checkers** | Pure functions with unit tests: numeric/units, expression equivalence, balanced chemical equation (atom counting), order and sort comparison, code test runner. |
| **Session runner** | A set of 5–10 items with instant feedback. A hint costs points. After an attempt it shows the worked solution and offers "try one like it". |
| **Mastery per topic** | Each topic key (e.g. `physics:g9:kinematics:suvat`) climbs through levels (spaced repetition); wrong answers come back later. |
| **Syllabus link** | Every lesson in `lib/school` and the coding syllabi lists the topic keys it teaches. The room opens on **"This week's lesson"** (the batch's position) and unlocks topics as they are taught. |
| **Quest layer** | The Voice Quest engine (rank, streak, XP, daily quest) is generalised so a student has one streak across all subjects. |
| **Logging** | `practice_attempts` gains `subject` and `topic`, and new kinds (`problem`, `quiz`, `code`, `lab`). SQL script for Mimo to run. |
| **Access** | `access.ts` is generalised: each enrolled course (active or completed) opens its room. Other subjects show as locked cards ("comes with Physics"). |

## 3. The rooms

| Subject | Labs (MVP **in bold**) | Checked by |
|:--|:--|:--|
| **Coding & AI** | **Code kata:** starter code plus hidden tests, run in a Web Worker (safe, instant). **Web playground:** HTML/CSS/JS in a sandboxed frame, with a live preview and checklist tests. **Fix the bug** and **predict the output**. Later: Python in the browser (Pyodide), AI prompt drills. | tests in the worker |
| **Maths** (G1–12 + focus) | **Problem generator per topic:** arithmetic → fractions → equations → geometry → algebra → trigonometry → calculus. **Mental-maths sprint** (timed). Mistakes return later. | numeric / expression |
| **Physics** (G7–12, Mechanics) | **Numerical problems with units** (m/s vs km/h). **Formula builder:** pick the right equation first. Simulations: projectile, pendulum, simple circuit. Graph reading. | units-aware numeric |
| **Chemistry** (G7–12, Organic) | **Equation balancer.** **Periodic-table trainer.** **Moles and stoichiometry generator.** Naming compounds. Organic reaction cards. | atom counting, numeric |
| **Biology** (G7–12) | **Label the diagram** (cell, heart, flower…). **Put the process in order** (mitosis, digestion). **Sort** (classification). Flash cards with spaced repetition. | order, sort, hotspots |
| **Science** (G1–6) | **Predict → watch → explain** mini-experiments (shadows, floating and sinking, states of matter). **Sort it** (living/non-living, magnetic). Picture quizzes. | multiple choice, sort |
| **English** (G1–12) | **Reading:** a passage, then questions. **Grammar drills** (generated). **Vocabulary** with spaced repetition. Reuses the Writing and Listening labs from Public Speaking. | multiple choice, fill in the blank |
| **Public Speaking** | Stays as it is; it moves into the hub as one room. | on-device audio |

## 4. How it fits the rest of the product
- **Teacher:** each student's practice this week (minutes, topics mastered, where they are stuck) on the class and student view. Later, a teacher can **assign a set as homework**.
- **Parent report card:** practice streak and topics mastered per subject. This drives renewals.
- **Trial students:** a 24-hour taster of the room for their trial subject, to help conversion.
- **Points and leaderboards:** practice XP feeds the existing points. Scores are worked out on the device, so a determined student could fake their own score. Only XP from items the server can re-check from the seed counts towards leaderboards (phase 4).

## 5. Build order

| Phase | Scope | Rough size |
|:--|:--|:--|
| **0: Foundation** | Engine (item types, checkers + tests, generators, session runner, mastery); hub page with a subject switcher; access generalised; `practice_attempts` migration; logging; Quest streak across subjects | 1–2 days |
| **1: Maths + Coding** | Maths generators for core topics, all grades, keyed to the curriculum. Coding katas + web playground for each track and level. | 2–3 days |
| **2: Physics + Chemistry** | Units-aware problems, formula builder, 2 simulations; equation balancer, periodic table, stoichiometry | 2–3 days |
| **3: Biology, Science, English** | Diagrams, sequencing, sorting, flash cards; predict-watch-explain; reading and grammar | 2–3 days |
| **4: People around the learner** | Teacher view + assign homework, parent report, trial taster, cross-subject leaderboard, Python via Pyodide | 2 days |

Each phase ships on its own: tests, build, preview check, then push once you say so.

## 6. Decisions for Mimo (defaults in bold)
1. **Which rooms first?** **Maths + Coding** (easiest to auto-check, most students), then Physics and Chemistry.
2. **Coding languages in the MVP:** **JavaScript / HTML / CSS in the browser** (free, instant). Python later via Pyodide, a ~10 MB download on first use. Should any track need Python on day one?
3. **Question source:** **generated problems (endless, auto-checked) plus a small hand-written set per topic.** The alternative is only hand-written question banks: better quality, far slower to reach every grade.
4. **AI hints (Claude):** **not in the MVP.** They cost money per use, and the speaking room is deliberately free to run. A rate-limited "Explain this step" could come later.
5. **Access:** **included with each enrolled course, locked cards for others, a 24-hour taster for trial students.**

---

## 7. Queue added by Mimo (18 Sep 2026, after the plan)
Mimo now asks for **AI in the rooms**. That replaces the "no AI in the MVP" default in §6.4. AI calls cost money, so each AI feature gets a per-student daily limit and a cache.

1. **Maths curriculum + a 10-minute end-of-lesson quiz.** Every lesson ends with a timed quiz drawn from that lesson's topics, marked on the spot. The score goes on the lesson's progress, so the teacher and parent see whether the lesson landed.
2. **Maths AI room.** Builds on the maths engine (40 topics, 1,000s of seeded problems):
   - AI problem solver: explains any problem step by step
   - Mistake guide: reads the child's working, finds the wrong step, fixes the logic
   - Other ways to solve the same problem
   - Problem sets by level; timed tests per module
   - **10 test sheets per module**: auto-marked from final answers, scored, with an auto-generated report per child
   - **AI rating of the child's approach** (method, not just answer)
   - Aim: best-in-class
3. **Coding AI room.** Katas plus AI: hints that point at the bug without giving the answer, code review, "explain this error", and different ways to solve the same kata.
4. **Trial activity redesign.** Each grade gets its own story and its own trial activity, around real-world problem solving, with a hook in every lesson that pulls the child towards enrolling.
5. **Attendance system.** Review and optimise attendance marking, late/no-show handling and reports.

**Order:**
1. Finish rooms phase 0–1 (engine, Maths, Coding): in progress.
2. The quiz at the end of each lesson and the module test sheets. These need no AI and reuse the engine.
3. Maths AI room, then Coding AI room: Claude API through a server route with per-student limits.
4. Trial stories per grade.
5. Attendance.

---

## 8. The arcade (Play tab, 18–19 Sep 2026)
Hasnain: "a game-like practice room where I get addicted and don't feel the time pass". Every game's rules sit in `src/lib/practice/games/*.ts`, pure and tested; the screens only draw them. Every round is logged to `practice_attempts` as `maths:game:<slug>`.

| Game | Grades | What the child does |
|---|---|---|
| ⚔️ Boss Battles | 1–12 | Each syllabus module has a boss. Answers are hits (fast ones and streaks hit harder); a wrong or slow answer lets the boss hit back. Three stars per boss (★ → ★★★ harder). Wins are logged as `maths:game:boss:g7:m3:t2`, so the trophy shelf needs no new table |
| 🎂 Cake Shop | 1–6 | Cut, serve and eat cake slices; sell cupcakes (fractions, take-away) |
| ⚖️ Balance Scale | 2–9 | Grades 2–5: weigh a mystery box with weights, then work it out. Grades 5–9: solve `ax + b = cx + d` by doing the same to both pans; par = fewest moves |
| 🏴‍☠️ Treasure Map | 2–12 | Grades 2–4: walk squares from the tent. Then: plot and read coordinates, translations, reflections, midpoints, points on lines, where two lines cross. A wrong dig is labelled ("swapped!", "check the signs") |
| 🔦 Angle Laser | 3–12 | Turn a laser on a protractor and fire: kinds of angle, turn to N°, measure (both scales drawn), estimate with no scale, missing angles, bearings, radians |
| ☄️ Meteor Storm | 1–12 | Type answers to blast falling questions |

`useRound` in `components/practice/games/game-kit.tsx` is the shared loop: patience clock, coins, streak, hearts, levels, best score, logging.

---

## 9. The Code Lab (19 Sep 2026)
Mimo sent a mock-up (a "NeonCode Tutor": challenge list, editor, run tests, three hints, an AI tutor). Hasnain: build it for every coding course, but professional, not that neon look. It replaces the old Coding room at `/dashboard/student/practice/coding`.

- **Layout:** the challenge (or the list of all of them) | the editor (CodeMirror 6, Sariro's dark theme) with tests, console and live page under it | the tutor. On phones: Challenge / Code / Tutor tabs.
- **Languages, all in the browser and free:**
  - JavaScript in a Web Worker (`public/practice/code-runner.js`)
  - Python through Pyodide 0.29.5 from jsDelivr in a Web Worker (`public/practice/py-runner.js` + `py-harness.py`)
  - HTML & CSS in a sandboxed frame, checked by `public/practice/web-checker.js` against the computed page
- **Packs** (`src/lib/practice/lab/packs`): 44 Python, 41 JavaScript (the 25 old katas, ids kept) and 17 HTML & CSS challenges. Tiers run Easy to Expert. Every solution passes and every starter fails, tested through the real runners: CPython runs the same harness, and jsdom runs the same checker.
- **Which pack opens first:** Python for python, data, agent, automation, security, cloud and scratch. HTML for web-basics and design. JavaScript for the rest. Java courses open on JavaScript until a Java runner exists. The course level suggests the tier.
- **Progress:** a solve is logged to practice_attempts (subject coding, topic = the challenge id, score 100 − 25 per hint, never below 40). XP, level and streak come from those rows, with no new table.
- **Tutor:**
  - The on-device guide (`diagnose.ts`) reads every run: returning vs printing, capitals, off-by-one, indentation, endless loops, a failing hidden test.
  - The AI tutor is Claude through `POST /api/practice/tutor`. It is Socratic, never gives the solution, and the reference solution is never sent to it.
  - Its default is `claude-opus-5` at low effort, with server-side fallbacks. It **fails closed** unless `ANTHROPIC_API_KEY` is set AND `scripts/ai-tutor.sql` has run. Each learner gets a daily limit (`TUTOR_DAILY_LIMIT`, default 20), counted atomically in the database.

---

## 10. The Maths AI coach (19 Sep 2026) — Mimo's queue item 2
A fifth tab in the Maths room, **AI Coach**. There is also an "Ask the AI coach" button on every answered practice question, which opens the coach beside the set so the set is kept.
- **Input:** type the problem, or photograph it. A photo is shrunk on the device to 1600px JPEG, and Claude reads the image.
- **Guide me step by step:** a streamed conversation that never gives the final answer.
- **Show the full solution:** numbered steps, the answer, how to check it and the key idea. "Show another way" gives a genuinely different method.
- **Check my working:** typed, or a photo of the page. It returns the first wrong line with what went wrong, why and how to fix it, plus 1–5 ratings for understanding, method, accuracy and presentation, one strength, a next step and another way.
- **Answer format:** structured JSON outputs validated with zod v4 (`src/lib/practice/maths/coach.ts`). Maths is plain Unicode, never LaTeX.
- **Route and model:** `POST /api/practice/maths-coach`, on Claude Opus 5 at low effort for solutions and medium for checking, with server-side fallbacks.
- **Gate:** it shares `lib/practice/ai-gate.ts` with the Code Lab tutor, so it fails closed, is limited to maths students and staff, and uses the same daily allowance (`TUTOR_DAILY_LIMIT`).

**Queue status (§7):**
1. The lesson quiz: done.
2. The Maths AI room: done here.
3. The Coding AI room: done in §9.
4. Trial stories: done in `src/lib/trial/stories`.
5. Attendance: done, see the attendance memory note.
