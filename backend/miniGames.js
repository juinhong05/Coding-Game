// Code-writing mini games. The editable gap is checked on the server without
// executing untrusted Python or C++ on the API host.
const puzzles = [
  {
    key: 'christmas_tree', title: 'Christmas Tree Builder', unlockLevel: 1,
    description: 'Write the missing line to print four centered rows of stars and a trunk.',
    expectedOutput: '   *\n  ***\n *****\n*******\n   |',
    python: {
      before: 'for row in range(1, 5):',
      after: 'print("   |")',
      solution: '    print(" " * (4 - row) + "*" * (2 * row - 1))',
      hint: 'Use string repetition for spaces and stars.'
    },
    cpp: {
      before: 'for (int row = 1; row <= 4; row++) {',
      after: '}\nstd::cout << "   |\\n";',
      solution: "    std::cout << std::string(4 - row, ' ') << std::string(2 * row - 1, '*') << '\\n';",
      hint: 'Use std::string(count, character) twice.'
    }
  },
  {
    key: 'pattern_printer', title: 'Pattern Printer', unlockLevel: 3,
    description: 'Complete the loop to print a growing staircase of four hash marks.',
    expectedOutput: '#\n##\n###\n####',
    python: {
      before: 'for row in range(1, 5):', after: '',
      solution: '    print("#" * row)', hint: 'Repeat # by the current row number.'
    },
    cpp: {
      before: 'for (int row = 1; row <= 4; row++) {', after: '}',
      solution: "    std::cout << std::string(row, '#') << '\\n';",
      hint: 'Construct a string with row copies of #.'
    }
  },
  {
    key: 'robot_maze', title: 'Robot Maze', unlockLevel: 5,
    description: 'Guide the robot from (0,0) to (2,2): print two right moves, then two down moves.',
    expectedOutput: 'RRDD',
    python: {
      before: 'right = "R"\ndown = "D"', after: '',
      solution: 'print(right * 2 + down * 2)', hint: 'Combine repeated right and down commands.'
    },
    cpp: {
      before: "char right = 'R';\nchar down = 'D';", after: '',
      solution: 'std::cout << right << right << down << down;',
      hint: 'Send each move to std::cout in the correct order.'
    }
  },
  {
    key: 'text_adventure', title: 'Text Adventure', unlockLevel: 8,
    description: 'The player chose the cave. Write the missing branch that reveals the treasure.',
    expectedOutput: 'You found treasure!',
    python: {
      before: 'choice = "cave"', after: '',
      solution: 'if choice == "cave":\n    print("You found treasure!")',
      hint: 'Check choice with if, then indent the print call.'
    },
    cpp: {
      before: 'std::string choice = "cave";', after: '',
      solution: 'if (choice == "cave") {\n    std::cout << "You found treasure!";\n}',
      hint: 'Use an if block and std::cout.'
    }
  },
  {
    key: 'mini_shop', title: 'Mini Shop Checkout', unlockLevel: 10,
    description: 'Three items cost 7 points each. Calculate and print the total.',
    expectedOutput: '21',
    python: {
      before: 'price = 7\nquantity = 3', after: '',
      solution: 'total = price * quantity\nprint(total)',
      hint: 'Multiply price by quantity, then print total.'
    },
    cpp: {
      before: 'int price = 7;\nint quantity = 3;', after: '',
      solution: 'int total = price * quantity;\nstd::cout << total;',
      hint: 'Declare total as an int, then send it to std::cout.'
    }
  },
  {
    key: 'secret_decoder', title: 'Secret Message Decoder', unlockLevel: 15,
    description: 'The secret is written backwards. Print the decoded message.',
    expectedOutput: 'CODE',
    python: {
      before: 'secret = "EDOC"', after: '',
      solution: 'print(secret[::-1])', hint: 'A slice with step -1 reverses a string.'
    },
    cpp: {
      before: 'std::string secret = "EDOC";', after: '',
      solution: 'std::reverse(secret.begin(), secret.end());\nstd::cout << secret;',
      hint: 'Use std::reverse, then print the changed string.'
    }
  },
  {
    key: 'scoreboard', title: 'Scoreboard Builder', unlockLevel: 20,
    description: 'Print the player name and score together as Ada: 42.',
    expectedOutput: 'Ada: 42',
    python: {
      before: 'name = "Ada"\nscore = 42', after: '',
      solution: 'print(f"{name}: {score}")', hint: 'Use an f-string to combine text and values.'
    },
    cpp: {
      before: 'std::string name = "Ada";\nint score = 42;', after: '',
      solution: 'std::cout << name << ": " << score;',
      hint: 'Chain name, a colon and space, and score to std::cout.'
    }
  },
  {
    key: 'coordinate_drawing', title: 'Drawing with Coordinates', unlockLevel: 25,
    description: 'Draw a dot at x=2 on a five-cell row. Empty cells use a dash.',
    expectedOutput: '--●--',
    python: {
      before: 'target_x = 2', after: '',
      solution: 'print("-" * target_x + "●" + "-" * (4 - target_x))',
      hint: 'Print dashes before and after the dot.'
    },
    cpp: {
      before: 'int target_x = 2;', after: '',
      solution: "std::cout << std::string(target_x, '-') << \"●\" << std::string(4 - target_x, '-');",
      hint: 'Use std::string for the dashes on each side.'
    }
  }
];

export const MINI_GAME_BANK = Object.fromEntries(['python', 'cpp'].map(language => [
  language,
  puzzles.map(({ key, title, unlockLevel, description, expectedOutput, ...variants }) => ({
    id: `${language === 'python' ? 'py' : 'cpp'}_mini_${key}`,
    title, type: 'mini_code', unlockLevel, description, expectedOutput,
    ...variants[language]
  }))
]));

export function verifyMiniGameCode(game, submission) {
  if (typeof submission !== 'string' || submission.length > 2000) return false;
  const normalize = code => code.replace(/\r\n/g, '\n').split('\n').map(line => line.trim()).filter(Boolean).join('\n');
  return normalize(submission) === normalize(game.solution);
}
