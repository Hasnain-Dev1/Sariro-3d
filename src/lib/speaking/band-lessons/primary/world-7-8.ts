import { bd, type BandLesson } from '../types';

/** Grades 4–6 · Worlds 7 and 8 — real situations, and the grand stage. */
const d = (n: number, part: 'a' | 'b' | 'c', x: Parameters<typeof bd>[3]) => bd('primary', n, part, x);

export const PRIMARY_WORLD_7: BandLesson[] = [
  {
    number: 37,
    oneLine: 'In an interview, give a short answer with one example — then stop.',
    idea: [
      'You might be interviewed to join a school team, become a class prefect, get into a special programme or appear in the school newspaper. The interviewer wants to get to know you.',
      'A great answer has three parts: your answer, one example, and then you stop. Talking for too long is the most common mistake — short and clear is better.',
    ],
    model: {
      text: 'Question: Why do you want to be class monitor? Answer: Because I like helping people get organised. Last term, I made a chart so our group always knew whose turn it was to present.',
      noticing: ['The answer comes first.', 'One real example.', 'Then it stops.'],
    },
    drills: [
      d(37, 'a', { title: 'Tell me about yourself', brief: 'Answer the interview question "Tell me about yourself" in under a minute: who you are, what you love, and one thing you are proud of.', targetSeconds: 50 }),
      d(37, 'b', { title: 'Answer, example, stop', brief: 'Answer "Why should we choose you for the school quiz team?" with an answer, one example, and then stop.', targetSeconds: 40 }),
    ],
    extraDrills: [
      d(37, 'c', { title: 'Tricky question', brief: 'Answer "What is something you are not good at yet?" honestly, with what you are doing to get better.', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Answers that go on and on — practise stopping.', 'One-word answers with no example.'],
    selfCheck: ['Did I give an example?', 'Did I stop when I had finished?'],
    realWorld: 'Interviewing to be class monitor, join a team or take part in a special programme.',
    homeTip: 'Play interviewer: ask your child "Why should you be picked for…?" and help them answer, give one example, and stop.',
    soundLab: ['x', 'g'],
    writePrompt: 'Write your answer to "Tell me about yourself" in three short sentences you could say in an interview.',
  },
  {
    number: 38,
    oneLine: 'When a teacher asks you questions, say what you know, and it is fine to say what you do not.',
    idea: [
      'In an oral test, a project presentation or a viva for a science fair, the teacher wants to see what you understand. Explaining in your own words is better than repeating memorised lines.',
      'If you do not know something, do not make it up. Say "I am not sure, but I think…" or "I have not learned that yet, but I would like to find out." That is honest and sounds smart.',
    ],
    drills: [
      d(38, 'a', { title: 'Explain it in my words', brief: 'Explain something you learned in science or maths this term in your own words, as if a teacher asked you "What did you learn?"', targetSeconds: 60 }),
      d(38, 'b', { title: 'The honest "I am not sure"', brief: 'Answer this science fair judge question: "Why do you think your experiment worked that way?" Include one thing you are not sure about, and say it well.', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(38, 'c', { title: 'Reading test questions', brief: 'Pretend a teacher asks you about a book you read: what happened, who your favourite character was, and why. Answer in your own words.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Memorised textbook sentences — ask "say it differently".', 'Guessing confidently instead of admitting uncertainty.'],
    selfCheck: ['Did I explain in my own words?', 'Did I say "I am not sure" honestly when I needed to?'],
    realWorld: 'Answering a judge\'s questions at the science fair or an oral exam in class.',
    homeTip: 'Ask your child to teach you one thing they learned this week. When they are unsure, praise them for saying so.',
    writePrompt: 'Write three sentences explaining something you learned this term in your own words, and one thing you are still not sure about.',
  },
  {
    number: 39,
    oneLine: 'Presenting a project to your class is a conversation, not a performance.',
    idea: [
      'Your classmates know you, which can feel scarier than strangers. But it also means you can be relaxed and natural. Talk to them the way you would at break time — just clearer.',
      'Classmates may interrupt with questions. Answer briefly, then say "Where was I? Oh yes…" and carry on. Being interrupted is not a problem; it means they are listening.',
    ],
    drills: [
      d(39, 'a', { title: 'Two-minute project', brief: 'Present a school project, real or imagined, for two minutes: what you did, what you found out and what surprised you.', targetSeconds: 120 }),
      d(39, 'b', { title: 'Interrupted and back', brief: 'Start presenting your project. Halfway, pretend a classmate asks "How long did it take?". Answer briefly and get back on track.', targetSeconds: 90 }),
    ],
    extraDrills: [
      d(39, 'c', { title: 'Group presentation part', brief: 'Pretend you are part of a group presentation. Introduce your part, hand over to the next person by name, and keep it under one minute.', targetSeconds: 50 }),
    ],
    mentorWatchFor: ['Children who panic when interrupted.', 'Group handovers that are awkward — practise "Now, Priya will tell you about…".'],
    selfCheck: ['Did I sound natural, like talking to friends?', 'Did I get back on track after the question?'],
    realWorld: 'Presenting a group project or show and tell to your classmates.',
    homeTip: 'While your child practises a presentation at home, interrupt once with a question. Cheer when they answer and carry on.',
    soundLab: ['ough'],
    writePrompt: 'Write the plan for a two-minute project presentation: what you did, what you found out, and what surprised you.',
  },
  {
    number: 40,
    oneLine: 'In a group discussion, listen well, build on others\' ideas, and invite quiet people in.',
    idea: [
      'In group work, some people talk all the time and some never speak. Good group speakers do neither. They listen, add to what others said, and make sure everyone gets a turn.',
      'Useful phrases: "I agree with Aarav, and I would add…", "That is a good point, but what about…?", "Sana, what do you think?"',
    ],
    drills: [
      d(40, 'a', { title: 'Building phrases', brief: 'Imagine your group is planning a class party. Say three things you would add using "I agree, and…", "Good idea, but…" and "What if we also…".', targetSeconds: 45 }),
      d(40, 'b', { title: 'Bring someone in', brief: 'Pretend you are leading a group discussion about a class trip. Invite a quiet classmate to share their idea kindly, then respond to what they said.', targetSeconds: 40 }),
    ],
    extraDrills: [
      d(40, 'c', { title: 'Disagree kindly', brief: 'Disagree with this idea politely and give your reason: "We should have no playtime so we can finish more work."', targetSeconds: 40 }),
    ],
    mentorWatchFor: ['Dominant speakers who never build on others.', 'Disagreement that becomes about the person, not the idea.'],
    selfCheck: ['Did I build on someone else\'s idea?', 'Did I invite anyone else in?'],
    realWorld: 'Working in a group to plan a project, a class assembly or a science experiment.',
    homeTip: 'During a family decision (like what to cook), practise "I agree, and…" and asking the quietest person what they think.',
    writePrompt: 'Write three phrases you can use in group work to agree, to disagree kindly and to invite someone to speak.',
  },
  {
    number: 41,
    oneLine: 'When you have to speak without planning, use a simple shape: then, now, next.',
    idea: [
      'Sometimes a teacher asks you to speak with no warning. You do not need lots of ideas — you need a shape to put your ideas into.',
      'Try "Then, now, next": what it was like before, what it is like now, and what might happen next. Or "Point, example, point": say your point, give an example, say your point again.',
    ],
    drills: [
      d(41, 'a', { title: 'Then, now, next', brief: 'Talk for one minute about "games", using the shape: what games were like for your grandparents, what they are like now, and what they might be like in the future.', targetSeconds: 60 }),
      d(41, 'b', { title: 'Point, example, point', brief: 'Your topic is "Why breakfast is important". Give your point, one example, and your point again — no planning time!', targetSeconds: 45 }),
    ],
    extraDrills: [
      d(41, 'c', { title: 'Random topic card', brief: 'Choose any object near you and talk about it for forty-five seconds using the then, now, next shape.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Freezing at the start — the shape is the first sentence.', 'Speakers who forget the "next" part.'],
    selfCheck: ['Which shape did I use?', 'Did I keep going the whole time?'],
    realWorld: 'Being asked to share your thoughts in class without any warning.',
    homeTip: 'In the car, call out a random topic like "shoes" and your child speaks for thirty seconds using then, now, next.',
    writePrompt: 'Write a "then, now, next" plan for the topic "school" in three short sentences.',
  },
  {
    number: 42,
    oneLine: 'If someone asks a surprise question, repeat it, think for a second, then answer.',
    idea: [
      'After a presentation, classmates might ask questions you did not expect. You do not need to answer instantly.',
      'Repeat or rephrase the question — "So you are asking why it floats?" — which gives you a few seconds to think. Then answer what they really asked. If you do not know, say so honestly.',
    ],
    drills: [
      d(42, 'a', { title: 'Repeat, then answer', brief: 'Answer this surprise question about your favourite hobby: "What is the hardest part about it?" Repeat the question first, then answer.', targetSeconds: 45 }),
      d(42, 'b', { title: 'The tricky classmate', brief: 'After a talk on why dogs are the best pets, a classmate asks: "But cats are cleaner, so why not cats?" Answer calmly and kindly.', targetSeconds: 40 }),
    ],
    extraDrills: [
      d(42, 'c', { title: 'Three surprise questions', brief: 'Answer three quick surprise questions about your school: your favourite subject, the hardest thing, and one change you would make.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['Rushing to answer before understanding.', 'Defensive answers to challenging questions.'],
    selfCheck: ['Did I repeat the question first?', 'Did I answer what was actually asked?'],
    realWorld: 'Answering questions from classmates after your presentation.',
    homeTip: 'After your child tells you about something, ask one surprise question and let them practise repeating it before answering.',
    writePrompt: 'Write three questions your class might ask after your presentation, and a short answer to each.',
  },
];

export const PRIMARY_WORLD_8: BandLesson[] = [
  {
    number: 43,
    oneLine: 'Change how you speak depending on who is listening.',
    idea: [
      'You would not explain a game the same way to your grandmother, your little brother and your best friend. Great speakers change their words, speed and examples for their audience.',
      'Before you speak, ask: Who is listening? What do they already know? What will interest them? Then adjust.',
    ],
    drills: [
      d(43, 'a', { title: 'Two audiences', brief: 'Explain what your school is like first to a five-year-old, then to a new teacher joining the school.', targetSeconds: 80 }),
      d(43, 'b', { title: 'They look bored — change it!', brief: 'Start explaining a hobby. Halfway, imagine your audience looks bored. Change your approach — ask a question, tell a story, or speed up — and win them back.', targetSeconds: 70 }),
    ],
    extraDrills: [
      d(43, 'c', { title: 'Grandparents edition', brief: 'Explain a video game or app you like to a grandparent who has never used it.', targetSeconds: 60 }),
    ],
    mentorWatchFor: ['The same explanation said slower rather than truly adapted.', 'Talking down to the younger audience.'],
    selfCheck: ['What did I change for each audience?', 'How did I win back the bored audience?'],
    realWorld: 'Explaining your school project to younger students on a visit day.',
    homeTip: 'Ask your child to explain the same thing to you and then to a younger cousin or friend. Talk about what changed.',
    writePrompt: 'Write how you would explain one hobby to a five-year-old and to a grandparent. What would you change?',
  },
  {
    number: 44,
    oneLine: 'Slides should show pictures and a few words — you do the talking.',
    idea: [
      'Slides full of sentences make people read instead of listen, and speakers end up reading the slide aloud with their back to the class.',
      'Good slides have one big picture or a few key words. You explain everything else. Remember: the audience came to hear you, not to read your slides.',
    ],
    drills: [
      d(44, 'a', { title: 'Talk without slides', brief: 'Give a ninety-second talk about a planet or country with no slides at all, describing it so clearly your audience can picture it.', targetSeconds: 90 }),
      d(44, 'b', { title: 'One picture, one minute', brief: 'Choose one picture — a photo, a drawing or an object — and talk about it for one minute, pointing out details as you go.', targetSeconds: 60 }),
    ],
    extraDrills: [
      d(44, 'c', { title: 'Fix the slide', brief: 'Describe a slide full of text about volcanoes, then explain how you would redesign it with one picture and three words.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Children reading slides word for word.', 'Turning their back to the audience to look at the screen.'],
    selfCheck: ['Could my audience follow without slides?', 'How many words would my slide have?'],
    realWorld: 'Making a slideshow for a class project or school assembly.',
    homeTip: 'Help your child make a three-slide presentation with only pictures and up to three words per slide.',
    writePrompt: 'Plan three slides for a project: for each one, choose one picture and no more than three key words.',
  },
  {
    number: 45,
    oneLine: 'In a debate, listen carefully and answer the other side\'s best point.',
    idea: [
      'A debate is not two speeches. It is about answering what the other side said. The best debaters listen carefully, repeat the other side\'s point fairly, and then explain why they disagree.',
      'Always attack the idea, never the person. "That point misses something important" is good. "That is a stupid idea" is not.',
    ],
    drills: [
      d(45, 'a', { title: 'Say their point fairly', brief: 'The other team says "Homework helps us learn." Repeat their point fairly in your own words, even if you disagree with it.', targetSeconds: 30 }),
      d(45, 'b', { title: 'Rebuttal', brief: 'Now debate against it: "Homework should be banned for primary school." Answer the other team\'s best point, then give your own reason.', targetSeconds: 75 }),
    ],
    extraDrills: [
      d(45, 'c', { title: 'Switch sides', brief: 'Argue FOR longer school holidays for forty-five seconds, then argue AGAINST them for forty-five seconds.', targetSeconds: 90 }),
    ],
    mentorWatchFor: ['Rebuttals that ignore what the other side said.', 'Personal comments instead of arguments.'],
    selfCheck: ['Did I repeat their point fairly?', 'Did I answer it or just give my own speech?'],
    realWorld: 'Taking part in a class debate or a school debating competition.',
    homeTip: 'Have a friendly family debate on a fun topic like "Pizza is better than pasta" — each side must repeat the other\'s point first.',
    writePrompt: 'Write the other side\'s best point in a debate, your fair summary of it, and your answer.',
  },
  {
    number: 46,
    oneLine: 'Good feedback is kind and specific: what worked, and one thing to try.',
    idea: [
      '"That was good" or "That was bad" does not help anyone improve. Good feedback names a specific moment: "When you paused before the ending, everyone leaned in."',
      'Give one thing that worked and one thing to try next time. And when you receive feedback, just say "Thank you" — you can decide later what to use.',
    ],
    drills: [
      d(46, 'a', { title: 'Star and step', brief: 'Think of a presentation you saw recently. Give feedback with one star (a specific thing that worked) and one step (a specific thing to try next).', targetSeconds: 45 }),
      d(46, 'b', { title: 'Receiving feedback', brief: 'Imagine someone told you "You spoke too fast." Respond with "Thank you", then ask one question to understand it better.', targetSeconds: 25 }),
    ],
    extraDrills: [
      d(46, 'c', { title: 'Feedback on myself', brief: 'Listen to one of your recordings from this course and give yourself a star and a step out loud.', targetSeconds: 45 }),
    ],
    mentorWatchFor: ['Vague feedback like "nice job" — ask "which moment?"', 'Defensive reactions to feedback.'],
    selfCheck: ['Was my feedback about a specific moment?', 'Did I say thank you when I got feedback?'],
    realWorld: 'Giving feedback to classmates after their presentations.',
    homeTip: 'After a family activity, each person gives one star and one step about how it went.',
    writePrompt: 'Write one star and one step for a talk you watched, and one star and one step for your own last recording.',
  },
  {
    number: 47,
    oneLine: 'Now put it all together in a speech about something you really care about.',
    idea: [
      'This is your big speech. Choose a topic you truly care about: an animal you want to protect, a change you want at school, a person who inspires you.',
      'Use everything: a hook, one big idea, three points with signposts, a story, a strong ending, calm pauses, eye contact and confident posture. Practise it several times before the final recording.',
    ],
    drills: [
      d(47, 'a', { title: 'The plan from memory', brief: 'Say your speech plan from memory: your hook, your big idea, your three points and your ending — no notes.', targetSeconds: 40 }),
      d(47, 'b', { title: 'My big speech', brief: 'Give your full speech of about two minutes on something you care about. Stand tall, look at your audience and finish with your strongest line.', targetSeconds: 120 }),
    ],
    extraDrills: [
      d(47, 'c', { title: 'One more take', brief: 'Record your big speech again after listening to your first take. Pick one thing to improve and do it.', targetSeconds: 120 }),
    ],
    mentorWatchFor: ['Topics chosen to impress rather than cared about.', 'Speeches that forget the ending when nerves hit.'],
    selfCheck: ['Which skills from this course did I use?', 'What am I proudest of in this speech?'],
    realWorld: 'Giving a speech in school assembly, a competition or a special event.',
    homeTip: 'Be the audience for a practice run at home. Afterwards, share what you learned from your child\'s speech.',
    writePrompt: 'Write the plan for your big speech: hook, big idea, three points with a story, and your strongest ending line.',
  },
];
