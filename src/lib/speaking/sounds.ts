/**
 * SARIRO — Sound Lab: one spelling, several sounds
 * ============================================================================
 * English spelling does not tell you how to say a word. "Q" is /kw/ in queen,
 * /k/ in antique and "kyoo" in queue. "-ed" is /t/ in walked, /d/ in played
 * and /ɪd/ in wanted. A child who was taught "letters make sounds" meets these
 * in public — reading aloud in class, in an interview, ordering at a counter —
 * and gets them wrong in front of people.
 *
 * So each pattern here is taught the way a good speaking coach would: the
 * spelling, every way it is actually said, a word list for each, the traps that
 * catch fluent speakers too, what trips up Indian English in particular, and
 * real sentences from real situations to say it in.
 *
 * Pure data plus the game logic (sortRound, scoreRound, stampFor), so the
 * content and the scoring are tested (sounds.test.ts): no word is listed under
 * two sounds, every pattern has a game's worth of words, and every lesson that
 * points at a pattern points at one that exists.
 */

export interface SoundWord {
  word: string;
  /** What the voice should say when the bare word is ambiguous (read/read, record/record). */
  say?: string;
}

export interface SoundWay {
  id: string;
  /** Written the way a dictionary would: /kw/. */
  ipa: string;
  /** Written the way a child would: "kw". */
  sounds: string;
  /** What the mouth does. */
  how: string;
  words: SoundWord[];
}

export interface SoundTrap {
  word: string;
  say?: string;
  why: string;
}

export interface RealLine {
  /** Where you would say it. */
  situation: string;
  line: string;
}

export interface SoundPattern {
  id: string;
  /** The spelling, big: "Q", "-ED". */
  spelling: string;
  title: string;
  /** One sentence that makes a child want to know. */
  hook: string;
  /** The rule, when there is one worth learning. */
  rule?: string;
  ways: SoundWay[];
  traps: SoundTrap[];
  /** Where Indian English commonly slips, said kindly. */
  indiaTip?: string;
  /** Where British and American English say it differently. */
  accentNote?: string;
  realWorld: RealLine[];
}

const w = (...words: string[]): SoundWord[] => words.map((word) => ({ word }));

export const SOUND_PATTERNS: SoundPattern[] = [
  {
    id: 'q',
    spelling: 'Q',
    title: 'One letter, three sounds',
    hook: 'Queen, antique and queue all have a Q — and not one of them says it the same way.',
    rule: 'QU is usually "kw". At the end of a French-looking word (-que) it is just "k". Say the letter\'s own name, "kyoo", in queue and when you read letters out: IQ, HQ, QR.',
    ways: [
      { id: 'kw', ipa: '/kw/', sounds: 'kw', how: 'A "k" with your lips already rounding for "w".', words: w('queen', 'quick', 'quiet', 'question', 'quiz', 'equal', 'squash', 'require', 'frequent', 'liquid') },
      { id: 'k', ipa: '/k/', sounds: 'k', how: 'Just "k". The U is silent.', words: w('antique', 'unique', 'technique', 'mosquito', 'bouquet', 'conquer', 'liquor', 'cheque', 'Iraq', 'Qatar') },
      { id: 'kyoo', ipa: '/kjuː/', sounds: 'kyoo', how: 'The name of the letter itself.', words: [{ word: 'queue' }, { word: 'IQ', say: 'I Q' }, { word: 'HQ', say: 'H Q' }, { word: 'QR code', say: 'Q R code' }, { word: 'Q&A', say: 'Q and A' }, { word: 'BBQ', say: 'barbecue' }] },
    ],
    traps: [
      { word: 'conquer / conquest', say: 'conquer. conquest.', why: 'Same root, different sound: conquer is "k", conquest is "kw".' },
      { word: 'liquid / liquor', say: 'liquid. liquor.', why: 'Liquid is "kw"; liquor is "k". Swapping them is noticed.' },
      { word: 'quay', say: 'key', why: 'A harbour wall. Said exactly like "key".' },
    ],
    indiaTip: 'In "queue" the "ue" is silent — it is one sound, "kyoo", not "kyoo-yoo".',
    realWorld: [
      { situation: 'At a ticket counter', line: 'Is this the queue for tickets, or do I scan the QR code?' },
      { situation: 'In class', line: 'I have a quick question about the technique.' },
      { situation: 'At a shop', line: 'This antique clock is quite unique.' },
    ],
  },
  {
    id: 'ed',
    spelling: '-ED',
    title: 'The past has three sounds',
    hook: 'Walked, played and wanted all end in -ed. Only one of them adds a syllable.',
    rule: 'After a "t" or "d" sound, say "id" (wanted, needed). After a breathy sound — p, k, f, s, sh, ch — say "t" (jumped, washed). Everywhere else, say "d" (played, called).',
    ways: [
      { id: 't', ipa: '/t/', sounds: 't', how: 'No extra syllable. "Walked" is one beat: walkt.', words: w('walked', 'jumped', 'laughed', 'watched', 'finished', 'kissed', 'stopped', 'helped', 'cooked', 'washed') },
      { id: 'd', ipa: '/d/', sounds: 'd', how: 'No extra syllable. "Played" is one beat: playd.', words: w('played', 'called', 'cleaned', 'lived', 'opened', 'cried', 'loved', 'turned', 'arrived', 'showed') },
      { id: 'id', ipa: '/ɪd/', sounds: 'id', how: 'A whole extra beat: want-id, need-id.', words: w('wanted', 'needed', 'started', 'decided', 'visited', 'painted', 'added', 'waited', 'landed', 'invited') },
    ],
    traps: [
      { word: 'naked', why: 'An adjective, not a past tense — so it is "nay-kid", two beats.' },
      { word: 'learned (an adjective)', say: 'a learned professor', why: '"A learn-id professor" means wise. "I learnd it" is the verb.' },
      { word: 'fixed', why: 'Ends in an "s" sound (x = ks), so it is "fikst" — one beat.' },
    ],
    indiaTip: 'The most common slip is adding a beat everywhere: "walk-ed", "play-ed". Only t and d words get the extra beat.',
    realWorld: [
      { situation: 'Telling a story', line: 'I walked in, waited a minute, and then everybody laughed.' },
      { situation: 'In an interview', line: 'I started a club, organised the events, and helped forty students.' },
      { situation: 'Apologising', line: 'I missed the bus, so I called and asked them to wait.' },
    ],
  },
  {
    id: 's-ending',
    spelling: '-S',
    title: 'Plurals have three sounds too',
    hook: 'Cats hiss, dogs buzz, and buses add a whole syllable.',
    rule: 'After a breathy sound (p, t, k, f) it is "s". After a hissing sound (s, z, sh, ch, j) it is "iz". Everywhere else it buzzes as "z".',
    ways: [
      { id: 's', ipa: '/s/', sounds: 's', how: 'A hiss, no voice.', words: w('cats', 'books', 'maps', 'laughs', 'months', 'shops', 'bikes', 'cups') },
      { id: 'z', ipa: '/z/', sounds: 'z', how: 'A buzz — put your hand on your throat and feel it.', words: w('dogs', 'bags', 'cars', 'trees', 'pens', 'days', 'plays', 'rooms') },
      { id: 'iz', ipa: '/ɪz/', sounds: 'iz', how: 'An extra beat: bus-iz, box-iz.', words: w('buses', 'boxes', 'watches', 'dishes', 'prizes', 'bridges', 'faces', 'oranges') },
    ],
    traps: [
      { word: 'houses', why: 'One house has an "s"; many houses change to "howziz".' },
      { word: 'clothes', why: 'Usually said "kloze" — the "th" nearly disappears.' },
    ],
    realWorld: [
      { situation: 'Shopping', line: 'Two boxes of oranges and three bags of apples, please.' },
      { situation: 'Presenting', line: 'The results cover six months, four cities and ten schools.' },
    ],
  },
  {
    id: 'th',
    spelling: 'TH',
    title: 'Soft, buzzing — or just T',
    hook: 'Think, this and Thailand: three different sounds wearing the same two letters.',
    rule: 'Most TH words are soft (think) or buzzing (this). A handful of names borrowed from other languages simply say "t".',
    ways: [
      { id: 'soft', ipa: '/θ/', sounds: 'th (soft)', how: 'Tongue tip lightly between your teeth, blow — no voice.', words: w('think', 'three', 'thank', 'bath', 'month', 'teeth', 'author', 'birthday', 'nothing', 'mouth') },
      { id: 'buzz', ipa: '/ð/', sounds: 'th (buzzing)', how: 'Same tongue, but switch your voice on — it buzzes.', words: w('this', 'that', 'mother', 'weather', 'breathe', 'those', 'clothing', 'brother', 'together', 'rhythm') },
      { id: 't', ipa: '/t/', sounds: 't', how: 'A plain "t", the H is silent.', words: w('Thomas', 'Thailand', 'Thames', 'thyme', 'Theresa') },
    ],
    traps: [
      { word: 'bath / bathe', say: 'bath. bathe.', why: 'The noun is soft, the verb buzzes.' },
      { word: 'breath / breathe', say: 'breath. breathe.', why: 'Take a soft breath; breathe with a buzz.' },
    ],
    indiaTip: 'TH often comes out as a "t" or "d" — "tink", "dis". Put the tongue tip visibly between the teeth; a mirror helps.',
    realWorld: [
      { situation: 'Thanking a host', line: 'Thank you both for this — the three of us really enjoyed it.' },
      { situation: 'Weather small talk', line: 'The weather this month has been thoroughly strange.' },
    ],
  },
  {
    id: 'c',
    spelling: 'C',
    title: 'K, S or SH',
    hook: 'The C in cat, city and ocean is three different sounds.',
    rule: 'Before e, i or y, C is usually "s" (city, cycle). Before -ial, -ian, -ious and -ean it becomes "sh". Elsewhere it is "k".',
    ways: [
      { id: 'k', ipa: '/k/', sounds: 'k', how: 'Back of the tongue up — a clean "k".', words: w('cat', 'cold', 'cup', 'clock', 'picnic', 'music', 'cream', 'actor') },
      { id: 's', ipa: '/s/', sounds: 's', how: 'A hiss.', words: w('city', 'cent', 'cycle', 'face', 'ice', 'pencil', 'circle', 'dance') },
      { id: 'sh', ipa: '/ʃ/', sounds: 'sh', how: 'Lips pushed forward: "sh".', words: w('ocean', 'special', 'delicious', 'social', 'efficient', 'musician', 'ancient', 'official') },
    ],
    traps: [
      { word: 'circus', why: 'Both Cs in one word: the first is "s", the second is "k".' },
      { word: 'accept', why: 'Two Cs, two sounds: "ak-sept".' },
    ],
    realWorld: [
      { situation: 'Ordering food', line: 'The special pizza looks delicious — with ice cream after, please.' },
      { situation: 'Introducing yourself', line: 'I am a musician, and I study science in the city.' },
    ],
  },
  {
    id: 'ch',
    spelling: 'CH',
    title: 'Chair, school and chef',
    hook: 'English borrowed words from Greek and French and kept their CH sounds.',
    rule: 'Everyday English words: "ch" (chair). Greek words — often science — say "k" (chemistry). French words say "sh" (chef).',
    ways: [
      { id: 'ch', ipa: '/tʃ/', sounds: 'ch', how: 'A "t" that bursts into "sh".', words: w('chair', 'cheese', 'church', 'teacher', 'lunch', 'choose', 'beach', 'chicken') },
      { id: 'k', ipa: '/k/', sounds: 'k', how: 'Just "k". The H is silent.', words: w('school', 'chemistry', 'character', 'stomach', 'echo', 'orchestra', 'Christmas', 'technology') },
      { id: 'sh', ipa: '/ʃ/', sounds: 'sh', how: 'Soft "sh".', words: w('chef', 'machine', 'brochure', 'parachute', 'moustache', 'chic', 'Chicago', 'chandelier') },
    ],
    traps: [
      { word: 'archive / archer', say: 'archive. archer.', why: 'Archive is "k"; archer is "ch".' },
    ],
    accentNote: '"Schedule" is "shed-yool" in British English and "sked-jool" in American. Both are correct — pick one and keep it.',
    realWorld: [
      { situation: 'At school', line: 'Our chemistry teacher showed us the machine in the lab.' },
      { situation: 'At a restaurant', line: 'Could the chef make the chicken without cheese?' },
    ],
  },
  {
    id: 'g',
    spelling: 'G',
    title: 'Hard, soft, or French',
    hook: 'Go, giant and garage: the same letter, and the third one is barely English.',
    rule: 'Before e, i or y, G is often soft like "j" (giant, gym). But very common words break the rule — get, give, girl — so learn those by ear.',
    ways: [
      { id: 'hard', ipa: '/ɡ/', sounds: 'g', how: 'Like "k" with your voice on.', words: w('go', 'game', 'big', 'girl', 'give', 'get', 'finger', 'tiger') },
      { id: 'soft', ipa: '/dʒ/', sounds: 'j', how: 'Like the J in jam.', words: w('giant', 'gym', 'giraffe', 'magic', 'page', 'energy', 'general', 'orange') },
      { id: 'zh', ipa: '/ʒ/', sounds: 'zh', how: 'A buzzing "sh", as in "measure".', words: w('beige', 'massage', 'mirage', 'genre', 'regime', 'collage', 'camouflage') },
    ],
    traps: [
      { word: 'gif', why: 'Argued about for years. Its inventor says "jif"; most people say "gif". Either works.' },
    ],
    accentNote: '"Garage" is "GA-rij" or "GA-rahzh" in British English and "guh-RAHZH" in American.',
    realWorld: [
      { situation: 'Talking about a film', line: 'The genre is fantasy — giants, magic, and a lot of camouflage.' },
      { situation: 'At the gym', line: 'I get most of my energy from the morning game.' },
    ],
  },
  {
    id: 'x',
    spelling: 'X',
    title: 'Box, exam and xylophone',
    hook: 'X is two sounds pretending to be one letter — and at the start of a word it gives up entirely.',
    rule: 'Usually "ks" (box). Before a stressed vowel, EX- often buzzes to "gz" (exam). At the very start of a word, X is just "z".',
    ways: [
      { id: 'ks', ipa: '/ks/', sounds: 'ks', how: 'A "k" straight into a hiss.', words: w('box', 'six', 'taxi', 'next', 'relax', 'excellent', 'text', 'fix') },
      { id: 'gz', ipa: '/ɡz/', sounds: 'gz', how: 'The buzzing version: "igzam".', words: w('exam', 'exact', 'example', 'exist', 'exhibit', 'executive', 'exhausted', 'examine') },
      { id: 'z', ipa: '/z/', sounds: 'z', how: 'A plain buzz.', words: w('xylophone', 'xenon', 'Xerox', 'xenophobia') },
    ],
    traps: [
      { word: 'exercise / exist', say: 'exercise. exist.', why: 'Exercise is "ks"; exist is "gz". It depends where the stress falls.' },
    ],
    realWorld: [
      { situation: 'Before an exam', line: 'I am exhausted, but I know the exact examples for the exam.' },
      { situation: 'Booking a ride', line: 'The taxi is next — six minutes away.' },
    ],
  },
  {
    id: 'ough',
    spelling: 'OUGH',
    title: 'The famous six',
    hook: 'Though, through, tough, cough, bough, thought: one spelling, six sounds. Even native speakers get stuck.',
    ways: [
      { id: 'oh', ipa: '/əʊ/', sounds: 'oh', how: 'Like "go".', words: w('though', 'dough', 'although', 'doughnut') },
      { id: 'oo', ipa: '/uː/', sounds: 'oo', how: 'Like "too".', words: w('through', 'throughout', 'breakthrough') },
      { id: 'uff', ipa: '/ʌf/', sounds: 'uff', how: 'Like "stuff".', words: w('tough', 'rough', 'enough') },
      { id: 'off', ipa: '/ɒf/', sounds: 'off', how: 'Like "off".', words: w('cough', 'trough') },
      { id: 'ow', ipa: '/aʊ/', sounds: 'ow', how: 'Like "cow".', words: w('bough', 'drought', 'plough') },
      { id: 'aw', ipa: '/ɔː/', sounds: 'aw', how: 'Like "saw".', words: w('thought', 'bought', 'brought', 'fought', 'ought') },
    ],
    traps: [
      { word: 'though / through / thorough', say: 'though. through. thorough.', why: 'Three words that look almost identical: "tho", "throo", "thuh-ruh".' },
    ],
    realWorld: [
      { situation: 'At a bakery', line: 'I thought I bought enough doughnuts, though they went through them fast.' },
      { situation: 'Feeling unwell', line: 'It has been a tough week — a rough cough and not enough sleep.' },
    ],
  },
  {
    id: 'oo',
    spelling: 'OO',
    title: 'Food, good and blood',
    hook: 'Moon rhymes with spoon, but book does not rhyme with it — and blood rhymes with neither.',
    ways: [
      { id: 'long', ipa: '/uː/', sounds: 'oo (long)', how: 'Lips round and pushed forward, held.', words: w('food', 'moon', 'school', 'spoon', 'tooth', 'cool', 'zoo', 'noon') },
      { id: 'short', ipa: '/ʊ/', sounds: 'oo (short)', how: 'Short and relaxed — like "put".', words: w('good', 'book', 'look', 'foot', 'wood', 'cook', 'stood', 'wool') },
      { id: 'uh', ipa: '/ʌ/', sounds: 'uh', how: 'Like "cup".', words: w('blood', 'flood') },
    ],
    traps: [
      { word: 'door / floor', why: 'A fourth sound again: "or".' },
    ],
    indiaTip: '"Food" and "good" often come out the same. Food is long and pushed; good is short and lazy.',
    realWorld: [
      { situation: 'At lunch', line: 'The food at school is good, but I brought my own spoon.' },
      { situation: 'Reading aloud', line: 'Look at the book by the wooden door.' },
    ],
  },
  {
    id: 'ea',
    spelling: 'EA',
    title: 'Bead, bread and break',
    hook: 'Read it today and you "reed" it. Read it yesterday and you "red" it.',
    ways: [
      { id: 'ee', ipa: '/iː/', sounds: 'ee', how: 'A smile-shaped "ee".', words: w('eat', 'sea', 'teach', 'clean', 'leaf', 'team', 'dream', 'please') },
      { id: 'eh', ipa: '/e/', sounds: 'eh', how: 'Short, like "bed".', words: w('bread', 'head', 'weather', 'ready', 'heavy', 'breakfast', 'sweat', 'feather') },
      { id: 'ay', ipa: '/eɪ/', sounds: 'ay', how: 'Like "day".', words: w('great', 'break', 'steak') },
    ],
    traps: [
      { word: 'read / read', say: 'I read every day. Yesterday I read a book.', why: 'Present is "reed"; past is "red". The sentence tells you which.' },
      { word: 'lead / lead', say: 'Lead the team. The pencil has lead.', why: '"Leed" the team; the metal is "led".' },
    ],
    realWorld: [
      { situation: 'Morning', line: 'I am ready — I had bread and eggs for breakfast.' },
      { situation: 'Team talk', line: 'Please read this before the break; it is a great plan.' },
    ],
  },
  {
    id: 'silent',
    spelling: 'K W B T H',
    title: 'Letters you never say',
    hook: 'Knife, write, thumb, listen, hour — each one has a letter that is only there for your eyes.',
    ways: [
      { id: 'k', ipa: '(k)', sounds: 'silent K', how: 'KN at the start: say only the N.', words: w('knife', 'know', 'knee', 'knock', 'knight', 'knowledge') },
      { id: 'w', ipa: '(w)', sounds: 'silent W', how: 'WR at the start: say only the R.', words: w('write', 'wrong', 'wrist', 'answer', 'sword', 'two') },
      { id: 'b', ipa: '(b)', sounds: 'silent B', how: 'MB at the end, and a few others: no B.', words: w('climb', 'thumb', 'comb', 'debt', 'doubt', 'lamb') },
      { id: 't', ipa: '(t)', sounds: 'silent T', how: 'STEN and STLE: no T.', words: w('listen', 'castle', 'whistle', 'fasten', 'Christmas', 'mortgage') },
      { id: 'h', ipa: '(h)', sounds: 'silent H', how: 'The word starts with the vowel.', words: w('hour', 'honest', 'honour', 'heir', 'ghost', 'rhyme') },
    ],
    traps: [
      { word: 'an hour, a house', say: 'an hour. a house.', why: 'A silent H starts with a vowel sound, so it takes "an".' },
      { word: 'often', why: 'Both "offen" and "often" are correct today.' },
    ],
    realWorld: [
      { situation: 'An honest apology', line: 'To be honest, I knew the answer — I just wrote the wrong one.' },
      { situation: 'Directions', line: 'Climb the hill, listen for the whistle, and knock on the castle door.' },
    ],
  },
  {
    id: 'v-w',
    spelling: 'V · W',
    title: 'Vest or west?',
    hook: '"Very well" is the most common place an Indian English accent is noticed — and it takes one minute to fix.',
    rule: 'V: top teeth touch the bottom lip and buzz. W: no teeth at all — lips make a small circle and open.',
    ways: [
      { id: 'v', ipa: '/v/', sounds: 'v', how: 'Top teeth on bottom lip, buzz.', words: w('van', 'very', 'vote', 'vest', 'video', 'voice', 'vine', 'vet') },
      { id: 'w', ipa: '/w/', sounds: 'w', how: 'Round lips, no teeth, open.', words: w('wet', 'west', 'wine', 'window', 'water', 'walk', 'wary', 'worse') },
    ],
    traps: [
      { word: 'very well', why: 'Both sounds in two words. Say it slowly: teeth on lip for V, no teeth for W.' },
      { word: 'vine / wine', say: 'vine. wine.', why: 'A minimal pair — only the first sound changes the meaning.' },
    ],
    indiaTip: 'Many Indian languages have one sound between V and W, so both come out the same. Use a mirror: you should see teeth for V and none for W.',
    realWorld: [
      { situation: 'In an interview', line: 'I worked very well with the video team every week.' },
      { situation: 'Giving directions', line: 'Walk west past the van, then wait by the window.' },
    ],
  },
  {
    id: 'stress',
    spelling: 'RE·cord',
    title: 'Same word, different stress',
    hook: 'Break a world REcord, or reCORD a video. Move the stress and the word changes job.',
    rule: 'In a pair like this, stress the first part for a thing (a noun) and the second part for an action (a verb).',
    ways: [
      {
        id: 'noun', ipa: 'ˈ● ○', sounds: 'FIRST part — a thing', how: 'Lean on the start: REcord, PREsent.',
        words: [
          { word: 'a record', say: 'She holds the world record.' },
          { word: 'a present', say: 'Thank you for the present.' },
          { word: 'an object', say: 'What is that object?' },
          { word: 'a contest', say: 'We won the contest.' },
          { word: 'produce', say: 'Fresh produce from the farm.' },
          { word: 'a permit', say: 'You need a parking permit.' },
          { word: 'an increase', say: 'There was a big increase.' },
          { word: 'a refund', say: 'Can I have a refund?' },
        ],
      },
      {
        id: 'verb', ipa: '○ ˈ●', sounds: 'SECOND part — an action', how: 'Lean on the end: reCORD, preSENT.',
        words: [
          { word: 'to record', say: 'Let us record a video.' },
          { word: 'to present', say: 'I will present my project.' },
          { word: 'to object', say: 'I object to that.' },
          { word: 'to contest', say: 'They will contest the result.' },
          { word: 'to produce', say: 'Farms produce food.' },
          { word: 'to permit', say: 'We do not permit phones.' },
          { word: 'to increase', say: 'Prices increase every year.' },
          { word: 'to refund', say: 'We will refund your money.' },
        ],
      },
    ],
    traps: [
      { word: 'desert / dessert', say: 'the Sahara desert. chocolate dessert.', why: 'Two different words: DEsert is sand, deSSERT is pudding — remember dessert has two S for "so sweet".' },
    ],
    realWorld: [
      { situation: 'Presenting a project', line: 'Today I will present our record: a forty percent increase.' },
      { situation: 'At a shop counter', line: 'I would like a refund — can you refund it to my card?' },
    ],
  },
];

export function soundPattern(id: string): SoundPattern | null {
  return SOUND_PATTERNS.find((p) => p.id === id) ?? null;
}

/* ── The sorting game ─────────────────────────────────────────────────────── */

export interface SortItem {
  word: SoundWord;
  wayId: string;
}

/** A tiny seeded shuffle, so a round can be replayed in a test. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/**
 * `size` words to sort, drawn from every way in turn so no sound is left out,
 * then shuffled. A pattern with fewer words than `size` uses them all.
 */
export function sortRound(pattern: SoundPattern, size = 8, rand: () => number = Math.random): SortItem[] {
  const pools = pattern.ways.map((way) => shuffle(way.words.map((word) => ({ word, wayId: way.id })), rand));
  const out: SortItem[] = [];
  const total = pools.reduce((n, p) => n + p.length, 0);
  for (let i = 0; out.length < Math.min(size, total); i++) {
    const pool = pools[i % pools.length];
    const next = pool.shift();
    if (next) out.push(next);
  }
  return shuffle(out, rand);
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type Stamp = 'gold' | 'silver' | 'try-again';

/** Gold for all but at most one wrong, silver for three in four. */
export function stampFor(correct: number, total: number): Stamp {
  if (total <= 0) return 'try-again';
  const ratio = correct / total;
  if (correct >= total - 1 && ratio >= 0.85) return 'gold';
  if (ratio >= 0.75) return 'silver';
  return 'try-again';
}

/** Whether a recognised phrase is the word they were asked to say. */
export function heardWord(target: SoundWord, heard: string): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const want = clean(target.word).replace(/^(a|an|to) /, '');
  const got = ` ${clean(heard)} `;
  return want.length > 0 && got.includes(` ${want} `);
}

/* ── Sound passport: what a learner has earned, kept on their device ──────── */

export const PASSPORT_KEY = 'sariro:sound-passport:v1';

export type Passport = Record<string, { best: Stamp; at: string }>;

const RANK: Record<Stamp, number> = { 'try-again': 0, silver: 1, gold: 2 };

export function parsePassport(raw: string | null): Passport {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') return {};
    const out: Passport = {};
    for (const [id, v] of Object.entries(data as Record<string, { best?: string; at?: string }>)) {
      if (!soundPattern(id) || !v || (v.best !== 'gold' && v.best !== 'silver')) continue;
      out[id] = { best: v.best, at: typeof v.at === 'string' ? v.at : '' };
    }
    return out;
  } catch {
    return {};
  }
}

/** Record a stamp, keeping the better of old and new. */
export function stampPassport(passport: Passport, id: string, stamp: Stamp, at: string): Passport {
  if (stamp === 'try-again') return passport;
  const prev = passport[id];
  if (prev && RANK[prev.best] >= RANK[stamp]) return passport;
  return { ...passport, [id]: { best: stamp, at } };
}
