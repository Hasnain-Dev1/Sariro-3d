/**
 * SARIRO — Capstone Projects + Enriched Lessons
 * =====================================================
 *
 * Each course gets ONE capstone project. Each lesson in that course advances
 * the capstone by one concrete step. After class, the student opens their
 * dashboard, sees the lesson's topic + objectives + capstone step, and
 * submits their project URL for teacher review.
 *
 * SHAPE:
 *   - COURSE_CAPSTONES[courseId] → { title, pitch, final_deliverable, total_steps }
 *   - ENRICHED_LESSONS[courseId][moduleNum][lessonIndex] → LessonObject
 *
 * BACKWARD COMPAT:
 *   - `sariro-data.ts` still exports `lessons: (string | LessonObject)[]`.
 *   - Use `lessonName(lesson)` to extract the display name from either shape.
 *   - Use `getEnrichedLesson(courseId, moduleNum, lessonIndex)` to get the
 *     full object (returns null for lessons that haven't been enriched yet).
 *
 * ENRICHMENT STATUS:
 *   ✅ python-elem    (48 lessons — flagship proof-of-concept)
 *   ⏳ Other 29 courses — enriched in future phases
 */

/* ───────────────────────────── Types ───────────────────────────── */

export interface LessonObject {
  /** Display name (also the unique key inside a module — same as the old string) */
  name: string;
  /** One-line topic summary shown on the submission page */
  topic: string;
  /** 2-4 concrete learning objectives (verb-first, measurable) */
  objectives: string[];
  /** Which capstone step this lesson unlocks */
  capstone_step: {
    title: string;
    description: string;
    deliverable: string;
    starter_hint?: string;
  };
  /** Estimated teaching + practice time (minutes) */
  estimated_minutes: number;
}

export interface CapstoneProject {
  /** Course ID this capstone belongs to (e.g. "python-elem") */
  course_id: string;
  /** Display title — should be memorable and age-appropriate */
  title: string;
  /** 1-2 sentence pitch shown on student dashboard */
  pitch: string;
  /** What the student has built by the final lesson */
  final_deliverable: string;
  /** Total steps = total lessons in the course */
  total_steps: number;
  /** Optional: link to starter repo or template */
  starter_url?: string;
}

/* ─────────────────────────── Capstones ─────────────────────────── */

export const COURSE_CAPSTONES: Record<string, CapstoneProject> = {
  "python-elem": {
    course_id: "python-elem",
    title: "SariroQuest: A Text Adventure",
    pitch:
      "Build a playable text-adventure game where every lesson adds one feature — by lesson 48 you have a complete game with saves, inventory, combat, and multiple endings.",
    final_deliverable:
      "A playable Python text adventure with: title screen, character creation, 5+ branching paths, inventory system, combat encounters, NPC dialogues, save/load, and at least 2 endings.",
    total_steps: 48,
    starter_url: "https://github.com/sariro-education/sariroquest-starter",
  },
  // Other 29 courses get capstones added in Phase 8 batches.
};

/* ──────────────── Enriched lessons per course ──────────────────── */
/*
 * Keyed by courseId → moduleNum (string, e.g. "01") → array of LessonObject
 * (array index = lesson position within the module, 0-based).
 *
 * IMPORTANT: The `name` field MUST exactly match the original string in
 * sariro-data.ts — it's the join key for lesson_progress rows in the DB.
 */

export const ENRICHED_LESSONS: Record<
  string,
  Record<string, LessonObject[]>
> = {
  "python-elem": {
    /* ─────────── Module 01: Your First Python Program ─────────── */
    "01": [
      {
        name: "Installing Python 3",
        topic: "Installing the Python interpreter on Windows, macOS, and Linux",
        objectives: [
          "Download Python 3.12+ from python.org",
          "Verify installation with `python --version` in terminal",
          "Locate the Python executable on your system",
        ],
        capstone_step: {
          title: "Set up your dev environment",
          description:
            "Install Python so you can run the game you're about to build. No code yet — just get the tool ready.",
          deliverable: "Screenshot of `python --version` showing 3.12+ in your terminal",
          starter_hint: "Open Terminal (Mac) or Command Prompt (Windows) and type: python --version",
        },
        estimated_minutes: 30,
      },
      {
        name: "Using the IDLE REPL",
        topic: "Interactive Python shell for experimenting one line at a time",
        objectives: [
          "Open IDLE and identify the REPL prompt (>>>)",
          "Run a math expression and see the result",
          "Use the up-arrow to recall previous commands",
        ],
        capstone_step: {
          title: "Test-drive the REPL",
          description:
            "Use the REPL to confirm Python is alive. Type a few expressions — this is your sandbox for the whole course.",
          deliverable: "Screenshot of IDLE with 3+ expressions you ran (math, text, anything)",
          starter_hint: ">>> 2 + 2\n>>> 'hello' + ' world'\n>>> print('SariroQuest')",
        },
        estimated_minutes: 25,
      },
      {
        name: "print() and comments",
        topic: "Displaying output on screen + leaving notes in code",
        objectives: [
          "Use print() to display text on screen",
          "Write single-line comments with #",
          "Write multi-line comments with triple quotes",
        ],
        capstone_step: {
          title: "Story intro screen",
          description:
            "Print the title and opening text of SariroQuest using print() and comments to label each section.",
          deliverable:
            "story_intro.py with 5+ print() lines and 3+ comments labeling sections (title, story, instructions)",
          starter_hint:
            "# === SARIRO QUEST ===\nprint('Welcome to SariroQuest!')\nprint('A text adventure by YOU')",
        },
        estimated_minutes: 45,
      },
      {
        name: "Variables and strings",
        topic: "Storing text in named containers",
        objectives: [
          "Assign a string to a variable using =",
          "Use descriptive variable names (game_title, not x)",
          "Reassign variables to update values",
        ],
        capstone_step: {
          title: "Game title as a variable",
          description:
            "Store the game title and player greeting in variables so they're easy to change later.",
          deliverable: "story_intro.py updated to use variables for title, greeting, and instructions",
          starter_hint:
            "game_title = 'SariroQuest'\nprint(game_title)\nprint('Welcome, adventurer!')",
        },
        estimated_minutes: 40,
      },
      {
        name: "Numbers and math operators",
        topic: "Integers, floats, and basic arithmetic",
        objectives: [
          "Use int and float types",
          "Perform +, -, *, /, //, %, ** operations",
          "Convert between strings and numbers with int() / float()",
        ],
        capstone_step: {
          title: "Add a game stat counter",
          description:
            "Add a health_points variable set to 100, and a level variable set to 1. Print them out so the player can see their stats.",
          deliverable:
            "story_intro.py with health_points, level, and score variables — printed in a stats box",
          starter_hint:
            "health_points = 100\nlevel = 1\nprint(f'HP: {health_points} | LVL: {level}')",
        },
        estimated_minutes: 45,
      },
      {
        name: "Your first .py script",
        topic: "Writing and running a saved Python file",
        objectives: [
          "Create a .py file in a code editor",
          "Run a script from terminal with `python filename.py`",
          "Understand the difference between REPL and script execution",
        ],
        capstone_step: {
          title: "Lock in your intro screen as a script",
          description:
            "Save your work as sariroquest.py. From now on, every lesson adds to THIS file. Run it from terminal to test.",
          deliverable:
            "sariroquest.py — your committed starting point. Push it to GitHub or share a Replit link.",
          starter_hint: "Save your file as `sariroquest.py`, then in terminal: python sariroquest.py",
        },
        estimated_minutes: 40,
      },
    ],

    /* ─────────── Module 02: Strings + User Input ─────────── */
    "02": [
      {
        name: "String concatenation",
        topic: "Joining strings with + operator",
        objectives: [
          "Concatenate strings with +",
          "Understand why you can't concatenate str + int without conversion",
          "Build a multi-part string from variables",
        ],
        capstone_step: {
          title: "Greet the player by name (basic)",
          description:
            "Use concatenation to greet the player. Their name is hardcoded for now — input comes next lesson.",
          deliverable: "sariroquest.py with a personalized greeting built via + concatenation",
          starter_hint: "player_name = 'Hero'\nprint('Welcome, ' + player_name + '!')",
        },
        estimated_minutes: 35,
      },
      {
        name: "f-strings",
        topic: "Modern Python string formatting with f'...{}...'",
        objectives: [
          "Write an f-string with embedded variables",
          "Format numbers inside f-strings (e.g. {hp:03d})",
          "Choose f-strings over concatenation for readability",
        ],
        capstone_step: {
          title: "Stats panel with f-strings",
          description:
            "Rebuild your stats display using f-strings so it looks clean: `HP: 100/100 | LVL: 1 | SCORE: 0`",
          deliverable: "sariroquest.py with f-string-based stats panel (no concatenation)",
          starter_hint: "print(f'HP: {health_points}/100 | LVL: {level} | SCORE: {score}')",
        },
        estimated_minutes: 40,
      },
      {
        name: "input() function",
        topic: "Reading text typed by the user",
        objectives: [
          "Capture user input with input()",
          "Store input in a variable for later use",
          "Add a prompt message inside input()",
        ],
        capstone_step: {
          title: "Ask the player's name",
          description:
            "Replace the hardcoded name with input(). Now every player gets a personalized greeting.",
          deliverable:
            "sariroquest.py that asks `What is your name, adventurer?` and greets them by name",
          starter_hint: "player_name = input('What is your name, adventurer? ')\nprint(f'Welcome, {player_name}!')",
        },
        estimated_minutes: 35,
      },
      {
        name: "String methods (.upper, .lower, .strip)",
        topic: "Built-in string operations",
        objectives: [
          "Use .upper(), .lower(), .title() to standardize case",
          "Use .strip() to remove leading/trailing whitespace",
          "Chain methods: name.strip().title()",
        ],
        capstone_step: {
          title: "Normalize the player's name",
          description:
            "If the player types '  amelia ' or 'AMELIA', your game should still greet them as 'Amelia'.",
          deliverable:
            "sariroquest.py with input().strip().title() applied to player_name",
          starter_hint: "player_name = input('Name: ').strip().title()",
        },
        estimated_minutes: 35,
      },
      {
        name: "String slicing",
        topic: "Extracting substrings with [start:stop]",
        objectives: [
          "Slice strings with [start:stop]",
          "Use negative indices ([-1] for last char)",
          "Reverse a string with [::-1]",
        ],
        capstone_step: {
          title: "Generate a player ID",
          description:
            "Generate a player ID from their name: first 3 letters + last 2 letters, uppercased. e.g. 'Amelia' → 'AMEIA'.",
          deliverable:
            "sariroquest.py with player_id derived from name slicing — printed to the player",
          starter_hint:
            "player_id = (player_name[:3] + player_name[-2:]).upper()",
        },
        estimated_minutes: 40,
      },
      {
        name: "Mad-libs project",
        topic: "Mini-project: string formatting + input combined",
        objectives: [
          "Combine input() + f-strings into a complete program",
          "Practice variable naming and program flow",
          "Ship a small, complete artifact",
        ],
        capstone_step: {
          title: "Add a 'campfire story' moment to SariroQuest",
          description:
            "After the intro, ask the player 3 questions (favorite color, animal, fear) and weave them into the opening story.",
          deliverable:
            "sariroquest.py with a 3-question prompt and a generated intro story using the player's answers",
          starter_hint:
            "color = input('Favorite color? ')\nanimal = input('Favorite animal? ')\nprint(f'A {color} {animal} appears...')",
        },
        estimated_minutes: 50,
      },
    ],

    /* ─────────── Module 03: Making Decisions ─────────── */
    "03": [
      {
        name: "if / else statements",
        topic: "Branching code based on a condition",
        objectives: [
          "Write if / else syntax with correct indentation",
          "Understand truthy vs falsy values",
          "Use comparison operators (==, !=, <, >, <=, >=)",
        ],
        capstone_step: {
          title: "Branching story paths",
          description:
            "Add a fork in the road: ask 'left or right?' and print a different scene based on the answer.",
          deliverable:
            "sariroquest.py with an if/else branch that prints different story based on player's choice",
          starter_hint:
            "choice = input('Left or right? ').lower().strip()\nif choice == 'left':\n    print('You enter a dark cave...')\nelse:\n    print('You find a sunny meadow...')",
        },
        estimated_minutes: 45,
      },
      {
        name: "Comparison operators",
        topic: "==, !=, <, >, <=, >=",
        objectives: [
          "Distinguish = (assignment) from == (comparison)",
          "Compare numbers and strings",
          "Build compound conditions with comparisons",
        ],
        capstone_step: {
          title: "Health check branch",
          description:
            "If health_points <= 0, print 'Game Over'. Otherwise, continue the adventure.",
          deliverable: "sariroquest.py with a health-points check that prints Game Over when HP hits 0",
          starter_hint:
            "if health_points <= 0:\n    print('Game Over')\nelse:\n    print('You press on...')",
        },
        estimated_minutes: 35,
      },
      {
        name: "elif chains",
        topic: "Multi-way branching with elif",
        objectives: [
          "Write if / elif / else chains",
          "Understand that only the first matching branch runs",
          "Choose elif over nested if when branches are mutually exclusive",
        ],
        capstone_step: {
          title: "Multiple choice dialogue",
          description:
            "Add an NPC who offers 3 options (1: ask for help, 2: trade, 3: leave). Each prints a different response.",
          deliverable:
            "sariroquest.py with an NPC scene using elif chain for 3+ dialogue options",
          starter_hint:
            "choice = input('1=help 2=trade 3=leave: ')\nif choice == '1':\n    print('The old sage gives you a map.')\nelif choice == '2':\n    print('Nothing to trade today.')\nelse:\n    print('You walk away.')",
        },
        estimated_minutes: 40,
      },
      {
        name: "Boolean logic (and / or / not)",
        topic: "Combining conditions",
        objectives: [
          "Use `and`, `or`, `not` to combine booleans",
          "Understand operator precedence (not > and > or)",
          "Build complex conditions like (hp > 0 and has_sword)",
        ],
        capstone_step: {
          title: "Locked door puzzle",
          description:
            "A locked door requires the player to have a key AND have spoken to the NPC. If both conditions are met, the door opens.",
          deliverable:
            "sariroquest.py with a door puzzle using `and` to check two conditions",
          starter_hint:
            "has_key = True\nspoken_to_npc = True\nif has_key and spoken_to_npc:\n    print('The door creaks open.')\nelse:\n    print('The door won't budge.')",
        },
        estimated_minutes: 40,
      },
      {
        name: "Random numbers (random module)",
        topic: "Generating random values for games and simulations",
        objectives: [
          "Import the random module",
          "Use random.randint(a, b) for integer ranges",
          "Use random.choice(list) to pick from a list",
        ],
        capstone_step: {
          title: "Random encounter",
          description:
            "When the player explores, randomly decide if they meet a friend, a foe, or find treasure (1/3 chance each).",
          deliverable:
            "sariroquest.py with random.choice() picking from 3 outcomes when exploring",
          starter_hint:
            "import random\nencounter = random.choice(['friend', 'foe', 'treasure'])\nprint(f'You encounter a {encounter}!')",
        },
        estimated_minutes: 40,
      },
      {
        name: "Guessing game project",
        topic: "Mini-project: combine if/else + random + input",
        objectives: [
          "Build a complete guessing game loop",
          "Combine random + input + if/elif/else",
          "Add a win/lose condition",
        ],
        capstone_step: {
          title: "Add a 'guess the number' minigame",
          description:
            "An old wizard challenges you to guess a number 1-10 in 3 tries. Win = +50 score. Lose = -10 HP.",
          deliverable:
            "sariroquest.py with a working number-guessing minigame that affects score and HP",
          starter_hint:
            "secret = random.randint(1, 10)\nfor attempt in range(3):\n    guess = int(input('Guess 1-10: '))\n    if guess == secret:\n        print('Correct! +50 score')\n        score += 50\n        break\n    elif guess < secret:\n        print('Higher...')\n    else:\n        print('Lower...')\nelse:\n    print('Wrong! -10 HP')\n    health_points -= 10",
        },
        estimated_minutes: 60,
      },
    ],

    /* ─────────── Module 04: Loops + Repetition ─────────── */
    "04": [
      {
        name: "for loops with range()",
        topic: "Repeating code a fixed number of times",
        objectives: [
          "Write `for i in range(n):` syntax",
          "Use range(start, stop, step) for custom ranges",
          "Apply the accumulator pattern (sum += value)",
        ],
        capstone_step: {
          title: "Repeating encounters",
          description:
            "Use a for loop to spawn 3 enemies in a row, each with a random name. Player must survive all 3.",
          deliverable:
            "sariroquest.py with a for loop spawning 3 sequential encounters",
          starter_hint:
            "for i in range(3):\n    enemy = f'Goblin #{i+1}'\n    print(f'A wild {enemy} appears!')",
        },
        estimated_minutes: 40,
      },
      {
        name: "while loops",
        topic: "Repeating code until a condition is false",
        objectives: [
          "Write `while condition:` syntax",
          "Avoid infinite loops with a clear exit condition",
          "Choose while vs for based on whether count is known",
        ],
        capstone_step: {
          title: "Main game loop",
          description:
            "Wrap your entire game in a while loop that keeps running until the player types 'quit' or HP hits 0.",
          deliverable:
            "sariroquest.py with a `while playing:` loop wrapping the main game flow",
          starter_hint:
            "playing = True\nwhile playing:\n    cmd = input('> ')\n    if cmd == 'quit':\n        playing = False\n    elif health_points <= 0:\n        playing = False\n    else:\n        print('...')",
        },
        estimated_minutes: 45,
      },
      {
        name: "break and continue",
        topic: "Early exit and skip-to-next-iteration",
        objectives: [
          "Use break to exit a loop early",
          "Use continue to skip to the next iteration",
          "Recognize when break/continue improves readability vs nested if",
        ],
        capstone_step: {
          title: "Flee from combat",
          description:
            "During combat, the player can type 'flee' to break out of the encounter loop. They lose 5 HP for fleeing.",
          deliverable:
            "sariroquest.py with a combat loop that breaks on 'flee' input",
          starter_hint:
            "while True:\n    action = input('fight/flee: ')\n    if action == 'flee':\n        health_points -= 5\n        print('You flee! -5 HP')\n        break\n    print('You fight...')",
        },
        estimated_minutes: 35,
      },
      {
        name: "Nested loops",
        topic: "Loops inside loops",
        objectives: [
          "Write a loop inside another loop",
          "Understand total iterations = outer × inner",
          "Use nested loops for grids and 2D structures",
        ],
        capstone_step: {
          title: "Dungeon map grid",
          description:
            "Print a 3x3 dungeon map using nested loops. Each cell shows a symbol (· for empty, X for player, T for treasure).",
          deliverable:
            "sariroquest.py with a nested for loop printing a 3x3 grid representing the dungeon",
          starter_hint:
            "for row in range(3):\n    for col in range(3):\n        print('·', end=' ')\n    print()  # newline after each row",
        },
        estimated_minutes: 45,
      },
      {
        name: "Accumulator pattern",
        topic: "Building up a value across loop iterations",
        objectives: [
          "Initialize an accumulator before the loop",
          "Update it inside the loop body",
          "Use it after the loop for the final result",
        ],
        capstone_step: {
          title: "Damage over time",
          description:
            "A poison trap deals 5 HP damage per turn for 4 turns. Use an accumulator to track total damage and apply it.",
          deliverable:
            "sariroquest.py with a poison-trap loop using an accumulator",
          starter_hint:
            "total_damage = 0\nfor turn in range(4):\n    total_damage += 5\n    print(f'Turn {turn+1}: -5 HP (total: {total_damage})')\nhealth_points -= total_damage",
        },
        estimated_minutes: 40,
      },
      {
        name: "Table generator project",
        topic: "Mini-project: combine loops + formatting",
        objectives: [
          "Generate formatted output with loops",
          "Combine f-strings + range + nested loops",
          "Ship a clean, readable artifact",
        ],
        capstone_step: {
          title: "Inventory display grid",
          description:
            "Show the player's inventory in a 2-column table (item name | quantity). Use a for loop to print each row.",
          deliverable:
            "sariroquest.py with a print_inventory() function that loops through items and prints a formatted table",
          starter_hint:
            "def print_inventory(items):\n    print('ITEM          QTY')\n    print('-' * 20)\n    for name, qty in items.items():\n        print(f'{name:14} {qty}')",
        },
        estimated_minutes: 50,
      },
    ],

    /* ─────────── Module 05: Lists + Tuples ─────────── */
    "05": [
      {
        name: "Creating lists",
        topic: "Ordered, mutable collections",
        objectives: [
          "Create a list with [] or list()",
          "Access elements by index (0-based)",
          "Check membership with `in`",
        ],
        capstone_step: {
          title: "Inventory system v1",
          description:
            "Create an inventory list. Start it with ['map', 'torch']. The player can collect more items as they explore.",
          deliverable:
            "sariroquest.py with an `inventory = [...]` list that tracks collected items",
          starter_hint: "inventory = ['map', 'torch']\nprint('Inventory:', inventory)",
        },
        estimated_minutes: 35,
      },
      {
        name: "Indexing and slicing",
        topic: "Accessing subsets of a list",
        objectives: [
          "Access single elements with [i]",
          "Slice sublists with [start:stop]",
          "Use negative indices for end-relative access",
        ],
        capstone_step: {
          title: "Show first 3 inventory items",
          description:
            "When the player has 4+ items, only show the first 3 in the quick view (the rest go in '...and N more').",
          deliverable:
            "sariroquest.py with inventory slicing for the quick-view display",
          starter_hint:
            "if len(inventory) > 3:\n    quick = inventory[:3]\n    print(f'{quick} ...and {len(inventory)-3} more')",
        },
        estimated_minutes: 35,
      },
      {
        name: "append / insert / remove",
        topic: "Modifying list contents",
        objectives: [
          "Use .append() to add to the end",
          "Use .insert(i, x) to add at a position",
          "Use .remove(x) or .pop(i) to delete",
        ],
        capstone_step: {
          title: "Pick up and drop items",
          description:
            "When the player finds a sword, inventory.append('sword'). When they drop something, inventory.remove('sword').",
          deliverable:
            "sariroquest.py with `take` and `drop` commands that append/remove from inventory",
          starter_hint:
            "if cmd == 'take sword':\n    inventory.append('sword')\n    print('Picked up sword.')\nelif cmd == 'drop sword':\n    if 'sword' in inventory:\n        inventory.remove('sword')",
        },
        estimated_minutes: 45,
      },
      {
        name: "Looping through lists",
        topic: "for item in list: pattern",
        objectives: [
          "Iterate directly: `for item in list:`",
          "Iterate with index: `for i, item in enumerate(list):`",
          "Choose direct iteration when index isn't needed",
        ],
        capstone_step: {
          title: "List inventory command",
          description:
            "Add a `bag` command that loops through inventory and numbers each item: `1. map`, `2. torch`, etc.",
          deliverable:
            "sariroquest.py with a `bag` command using enumerate() to list items",
          starter_hint:
            "if cmd == 'bag':\n    if not inventory:\n        print('Your bag is empty.')\n    else:\n        for i, item in enumerate(inventory, 1):\n            print(f'{i}. {item}')",
        },
        estimated_minutes: 35,
      },
      {
        name: "Tuples (immutable)",
        topic: "Fixed, ordered collections",
        objectives: [
          "Create tuples with () or comma-separated values",
          "Understand why tuples are immutable",
          "Use tuples for fixed records (coordinates, RGB colors)",
        ],
        capstone_step: {
          title: "Player position as a tuple",
          description:
            "Track player position as a tuple (x, y). Update it by creating a new tuple (tuples can't be modified in place).",
          deliverable:
            "sariroquest.py with player_pos as a tuple, updated by reassignment on move commands",
          starter_hint:
            "player_pos = (0, 0)\nif cmd == 'north':\n    player_pos = (player_pos[0], player_pos[1] + 1)\nprint(f'Position: {player_pos}')",
        },
        estimated_minutes: 35,
      },
      {
        name: "Shopping list project",
        topic: "Mini-project: build a full CRUD list manager",
        objectives: [
          "Combine append/remove/loop into one program",
          "Build a command-driven interface",
          "Handle invalid input gracefully",
        ],
        capstone_step: {
          title: "Shopkeeper scene",
          description:
            "Add a shopkeeper NPC. Player can `buy sword`, `buy potion`, see their inventory, and see their gold decrease.",
          deliverable:
            "sariroquest.py with a shopkeeper scene: list of items for sale, buy command, gold tracking",
          starter_hint:
            "shop = [('sword', 50), ('potion', 20)]\ngold = 100\nif cmd == 'buy sword':\n    if gold >= 50:\n        gold -= 50\n        inventory.append('sword')",
        },
        estimated_minutes: 60,
      },
    ],

    /* ─────────── Module 06: Dictionaries + Sets ─────────── */
    "06": [
      {
        name: "Key-value pairs",
        topic: "Storing data by name instead of position",
        objectives: [
          "Create a dict with {} or dict()",
          "Access values by key with d[key]",
          "Distinguish keys (unique identifiers) from values",
        ],
        capstone_step: {
          title: "Player stats as a dict",
          description:
            "Replace individual variables (hp, level, score) with a single `player = {'hp': 100, 'level': 1, 'score': 0}` dict.",
          deliverable:
            "sariroquest.py with player stats stored in a single dict, accessed as player['hp']",
          starter_hint:
            "player = {'hp': 100, 'level': 1, 'score': 0, 'gold': 50}\nprint(f\"HP: {player['hp']}\")",
        },
        estimated_minutes: 40,
      },
      {
        name: "Adding + updating entries",
        topic: "d[key] = value (insert or update)",
        objectives: [
          "Add a new key with d[key] = value",
          "Update an existing key the same way",
          "Use d.get(key, default) for safe access",
        ],
        capstone_step: {
          title: "Track quests as a dict",
          description:
            "Add a `quests = {}` dict. When player starts a quest, quests['find_map'] = 'in_progress'. When done, quests['find_map'] = 'complete'.",
          deliverable:
            "sariroquest.py with a quests dict tracking status of each quest",
          starter_hint:
            "quests = {}\nquests['find_map'] = 'in_progress'\n# later...\nquests['find_map'] = 'complete'",
        },
        estimated_minutes: 40,
      },
      {
        name: "Looping dicts (.items)",
        topic: "Iterating keys, values, or both",
        objectives: [
          "Use `for k in d:` to iterate keys",
          "Use `for k, v in d.items():` to iterate both",
          "Choose .keys() / .values() / .items() based on need",
        ],
        capstone_step: {
          title: "Quest log command",
          description:
            "Add a `quests` command that loops through the quests dict and prints each quest with its status.",
          deliverable:
            "sariroquest.py with a quest log display using .items()",
          starter_hint:
            "if cmd == 'quests':\n    if not quests:\n        print('No active quests.')\n    else:\n        for name, status in quests.items():\n            print(f'  {name}: {status}')",
        },
        estimated_minutes: 35,
      },
      {
        name: "Nested dictionaries",
        topic: "Dicts inside dicts for structured data",
        objectives: [
          "Access nested values with d[outer][inner]",
          "Build structured data (e.g. player['stats']['hp'])",
          "Update nested values step by step",
        ],
        capstone_step: {
          title: "NPC dialogue database",
          description:
            "Create an `npcs` dict where each NPC has their own dict of dialogue lines. e.g. npcs['sage']['greeting'] = 'Welcome, traveler.'",
          deliverable:
            "sariroquest.py with at least 3 NPCs, each with a nested dict of dialogue options",
          starter_hint:
            "npcs = {\n    'sage': {'greeting': 'Welcome.', 'hint': 'Try the cave.'},\n    'merchant': {'greeting': 'Wares for sale!', 'hint': '50 gold for a sword.'}\n}",
        },
        estimated_minutes: 45,
      },
      {
        name: "Sets (unique items)",
        topic: "Unordered collections of unique elements",
        objectives: [
          "Create a set with {} or set()",
          "Add elements with .add(), remove with .discard()",
          "Use sets to dedupe lists: set(list)",
        ],
        capstone_step: {
          title: "Track visited rooms",
          description:
            "Add a `visited = set()` and add room names as the player enters them. Prevent revisiting the same scene twice.",
          deliverable:
            "sariroquest.py with a visited set that tracks entered rooms",
          starter_hint:
            "visited = set()\nif room not in visited:\n    visited.add(room)\n    print('You enter a new room...')\nelse:\n    print('You've been here before.')",
        },
        estimated_minutes: 35,
      },
      {
        name: "Contact book project",
        topic: "Mini-project: build a dict-based lookup system",
        objectives: [
          "Combine dict + input + conditional logic",
          "Build a search interface",
          "Handle missing keys gracefully with .get()",
        ],
        capstone_step: {
          title: "Spellbook system",
          description:
            "Add a spellbook dict: spells = {'fireball': 30, 'heal': -20, 'lightning': 25}. Player can `cast fireball` to deal damage or `cast heal` to restore HP.",
          deliverable:
            "sariroquest.py with a spells dict + cast command that affects HP",
          starter_hint:
            "spells = {'fireball': 30, 'heal': -20, 'lightning': 25}\nif cmd.startswith('cast '):\n    spell = cmd[5:]\n    if spell in spells:\n        dmg = spells[spell]\n        if dmg < 0:\n            player['hp'] -= dmg  # heal\n            print(f'Healed {-dmg} HP!')\n        else:\n            print(f'You cast {spell} for {dmg} damage!')",
        },
        estimated_minutes: 55,
      },
    ],

    /* ─────────── Module 07: Functions + Modules ─────────── */
    "07": [
      {
        name: "Defining functions",
        topic: "Reusable blocks of code with def",
        objectives: [
          "Define a function with `def name():`",
          "Call a function with name()",
          "Understand the difference between defining and calling",
        ],
        capstone_step: {
          title: "Wrap intro screen in a function",
          description:
            "Move the title + intro code into `def show_intro():`. Call it once at the start of the game.",
          deliverable:
            "sariroquest.py with show_intro() function called at game start",
          starter_hint:
            "def show_intro():\n    print('=== SARIRO QUEST ===')\n    print('Welcome, adventurer!')\n\nshow_intro()",
        },
        estimated_minutes: 35,
      },
      {
        name: "Parameters + return values",
        topic: "Passing data in and out of functions",
        objectives: [
          "Define functions with parameters",
          "Return values with `return`",
          "Use returned values in the caller",
        ],
        capstone_step: {
          title: "Combat function",
          description:
            "Write `def attack(attacker, defender):` that takes two stats dicts, calculates damage, updates defender HP, and returns the new HP.",
          deliverable:
            "sariroquest.py with an attack() function that takes parameters and returns updated HP",
          starter_hint:
            "def attack(attacker, defender):\n    damage = attacker['atk'] - defender.get('def', 0)\n    defender['hp'] -= damage\n    return defender['hp']",
        },
        estimated_minutes: 45,
      },
      {
        name: "Default + keyword args",
        topic: "Flexible function signatures",
        objectives: [
          "Define parameters with default values",
          "Call functions with keyword arguments",
          "Choose defaults that make the common case easy",
        ],
        capstone_step: {
          title: "Damage roll function",
          description:
            "Write `def roll_damage(min_dmg=5, max_dmg=15, crit_chance=0.1):` that returns a damage number, occasionally critting for 2x.",
          deliverable:
            "sariroquest.py with roll_damage() using 3 default parameters",
          starter_hint:
            "import random\ndef roll_damage(min_dmg=5, max_dmg=15, crit_chance=0.1):\n    dmg = random.randint(min_dmg, max_dmg)\n    if random.random() < crit_chance:\n        return dmg * 2  # crit!\n    return dmg",
        },
        estimated_minutes: 40,
      },
      {
        name: "Importing modules (math, random)",
        topic: "Using Python's standard library",
        objectives: [
          "Import a module with `import module`",
          "Access functions with module.function()",
          "Use `from module import thing` for direct access",
        ],
        capstone_step: {
          title: "Use math for damage calc",
          description:
            "Import math and use math.floor() to round down damage. Use math.ceil() for healing (always round up favorably).",
          deliverable:
            "sariroquest.py with math.floor() / math.ceil() applied to damage/heal calculations",
          starter_hint:
            "import math\nfinal_damage = math.floor(base_damage * 1.5)\nheal_amount = math.ceil(base_heal * 1.1)",
        },
        estimated_minutes: 35,
      },
      {
        name: "Writing your own module",
        topic: "Splitting code into multiple files",
        objectives: [
          "Create a .py file that can be imported",
          "Use `from mymodule import myfunc` to use it",
          "Understand why splitting code improves organization",
        ],
        capstone_step: {
          title: "Split game into modules",
          description:
            "Create `enemies.py` with enemy data and `combat.py` with combat functions. Import them into sariroquest.py.",
          deliverable:
            "sariroquest.py + enemies.py + combat.py — the main file imports from both",
          starter_hint:
            "# enemies.py\nGoblin = {'name': 'Goblin', 'hp': 20, 'atk': 5}\n\n# combat.py\nfrom enemies import Goblin\n\ndef fight_goblin(player):\n    player['hp'] -= Goblin['atk']",
        },
        estimated_minutes: 50,
      },
      {
        name: "Calculator project",
        topic: "Mini-project: build a complete utility",
        objectives: [
          "Combine functions + input + conditionals",
          "Build a command loop with multiple operations",
          "Handle errors gracefully (try/except preview)",
        ],
        capstone_step: {
          title: "Stats calculator command",
          description:
            "Add a `stats` command that calls a calculate_stats() function returning a formatted string of all player stats + level progress.",
          deliverable:
            "sariroquest.py with calculate_stats() function + stats command that uses it",
          starter_hint:
            "def calculate_stats(player):\n    return f\"\"\"═══ STATS ═══\nHP: {player['hp']}/100\nLevel: {player['level']}\nScore: {player['score']}\nGold: {player['gold']}\"\"\"",
        },
        estimated_minutes: 55,
      },
    ],

    /* ─────────── Module 08: File I/O + Capstone ─────────── */
    "08": [
      {
        name: "Reading text files",
        topic: "Loading data from disk with open()",
        objectives: [
          "Open a file with `with open(path) as f:`",
          "Read all content with f.read()",
          "Read lines with f.readlines()",
        ],
        capstone_step: {
          title: "Load story from file",
          description:
            "Move your story text into story.txt. The game reads it on startup so you can edit the story without touching code.",
          deliverable:
            "sariroquest.py + story.txt — game reads the story file on start",
          starter_hint:
            "with open('story.txt') as f:\n    story = f.read()\nprint(story)",
        },
        estimated_minutes: 40,
      },
      {
        name: "Writing text files",
        topic: "Saving data to disk",
        objectives: [
          "Open a file for writing with `open(path, 'w')`",
          "Use 'a' mode to append without overwriting",
          "Always close files (use `with` to auto-close)",
        ],
        capstone_step: {
          title: "Save game state",
          description:
            "Add a `save` command that writes player stats (hp, level, score, gold) to savegame.txt.",
          deliverable:
            "sariroquest.py with save command that writes player stats to savegame.txt",
          starter_hint:
            "if cmd == 'save':\n    with open('savegame.txt', 'w') as f:\n        f.write(f\"{player['hp']}\\n\")\n        f.write(f\"{player['level']}\\n\")\n    print('Game saved.')",
        },
        estimated_minutes: 40,
      },
      {
        name: "JSON basics (json module)",
        topic: "Structured data persistence with json",
        objectives: [
          "Serialize a dict to JSON string with json.dumps()",
          "Write JSON to a file with json.dump()",
          "Load JSON from a file with json.load()",
        ],
        capstone_step: {
          title: "Save + load full game state as JSON",
          description:
            "Replace the text save with JSON. Save player stats, inventory, quests, and visited rooms all in one savegame.json file. Add a `load` command to restore it.",
          deliverable:
            "sariroquest.py with save + load commands using json for full state persistence",
          starter_hint:
            "import json\nstate = {'player': player, 'inventory': inventory, 'quests': quests}\nwith open('savegame.json', 'w') as f:\n    json.dump(state, f)\n# load:\nwith open('savegame.json') as f:\n    state = json.load(f)",
        },
        estimated_minutes: 50,
      },
      {
        name: "Error handling (try/except)",
        topic: "Graceful failure when things go wrong",
        objectives: [
          "Wrap risky code in try/except",
          "Catch specific exceptions (FileNotFoundError, ValueError)",
          "Use try/except/else/finally for full control",
        ],
        capstone_step: {
          title: "Handle missing save file",
          description:
            "Wrap the load command in try/except. If savegame.json doesn't exist, print 'No save found' instead of crashing.",
          deliverable:
            "sariroquest.py with try/except around the load command",
          starter_hint:
            "if cmd == 'load':\n    try:\n        with open('savegame.json') as f:\n            state = json.load(f)\n        print('Game loaded.')\n    except FileNotFoundError:\n        print('No save file found.')",
        },
        estimated_minutes: 45,
      },
      {
        name: "Quiz app capstone",
        topic: "Capstone mini-project: combine all module 8 skills",
        objectives: [
          "Read questions from a JSON file",
          "Track score across multiple questions",
          "Save high score to disk",
        ],
        capstone_step: {
          title: "SariroQuest v1.0 — final boss + ending",
          description:
            "Add the final boss encounter (uses everything: combat, items, spells, RNG). On victory, save the final state and show one of two endings based on player choices throughout the game.",
          deliverable:
            "Complete sariroquest.py with final boss + 2 endings + save/load. This is your shippable capstone!",
          starter_hint:
            "# Final boss\ndef final_boss(player):\n    boss_hp = 100\n    while boss_hp > 0 and player['hp'] > 0:\n        action = input('attack/cast/heal: ')\n        # ... full combat logic\n    return player['hp'] > 0  # True = won",
        },
        estimated_minutes: 90,
      },
      {
        name: "Showcase + next steps",
        topic: "Ship it, share it, plan what's next",
        objectives: [
          "Push the final project to GitHub or Replit",
          "Write a 3-sentence README explaining the game",
          "Identify what you'd build next with Intermediate Python",
        ],
        capstone_step: {
          title: "Publish SariroQuest + write README",
          description:
            "Push your finished game to GitHub or share a Replit link. Write a short README: what the game is, how to run it, what you'd add next.",
          deliverable:
            "GitHub/Replit link + README.md with 3+ sentences describing your game and a 'next steps' section",
          starter_hint:
            "# README.md\n# SariroQuest\nA text-adventure game built during Sariro's Python Elementary course.\n\n## How to run\npython sariroquest.py\n\n## Next steps\n- Add graphics with Pygame\n- Add multiplayer",
        },
        estimated_minutes: 60,
      },
    ],
  },
  // Other 29 courses' enriched lessons will be added in Phase 8 batches.
};

/* ─────────────────────── Helper functions ─────────────────────── */

/**
 * Extract the lesson name from either a string or a LessonObject.
 * Use this everywhere the old code expected a string.
 *
 * Example:
 *   const name = lessonName(mod.lessons[i]);  // works for both shapes
 */
export function lessonName(lesson: string | LessonObject): string {
  return typeof lesson === "string" ? lesson : lesson.name;
}

/**
 * Get the enriched LessonObject for a specific lesson, if it exists.
 * Returns null for lessons that haven't been enriched yet (most courses).
 *
 * @param courseId  e.g. "python-elem"
 * @param moduleNum e.g. "01" (string to match syllabus shape)
 * @param lessonIndex 0-based index within the module
 */
export function getEnrichedLesson(
  courseId: string,
  moduleNum: string,
  lessonIndex: number
): LessonObject | null {
  const courseLessons = ENRICHED_LESSONS[courseId]?.[moduleNum];
  if (!courseLessons) return null;
  if (lessonIndex < 0 || lessonIndex >= courseLessons.length) return null;
  return courseLessons[lessonIndex] ?? null;
}

/**
 * Find the enriched lesson by name (used when joining with lesson_progress
 * rows, which store the lesson_name as a string).
 *
 * Returns null if not found or not enriched.
 */
export function findEnrichedLessonByName(
  courseId: string,
  moduleNum: string,
  lessonNameStr: string
): LessonObject | null {
  const courseLessons = ENRICHED_LESSONS[courseId]?.[moduleNum];
  if (!courseLessons) return null;
  return (
    courseLessons.find((l) => l.name === lessonNameStr) ?? null
  );
}

/**
 * Get the capstone project for a course. Returns null if not yet defined.
 */
export function getCapstone(courseId: string): CapstoneProject | null {
  return COURSE_CAPSTONES[courseId] ?? null;
}

/**
 * Count how many of a course's lessons have been enriched so far.
 * Used by the student dashboard to show "X of Y lessons have detailed plans".
 */
export function countEnrichedLessons(courseId: string): number {
  const courseLessons = ENRICHED_LESSONS[courseId];
  if (!courseLessons) return 0;
  return Object.values(courseLessons).reduce(
    (sum, lessons) => sum + lessons.length,
    0
  );
}
