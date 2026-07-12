// Beginner-friendly Curriculum Dataset for Synapse (Python & C++ variants)

const CHALLENGE_BANK = {
  python: [
    {
      id: "python_challenge_1",
      title: "Printing Text (Python)",
      type: "parsons",
      description: "Reorder the blocks of code so they correctly print \"Hello, World!\" to the screen in Python.",
      tutorial: "In programming, we communicate with the computer by outputting text. In Python, we print messages to the screen using the `print()` function. \n\n**Key Rules:**\n• Text must be enclosed in quotes like `\"Hello, World!\"`.\n• The text is placed inside the parentheses `()`.\n• Python statements do NOT end with a semicolon `;`!",
      lines: [
        "print(",
        "  \"Hello, World!\"",
        ")"
      ]
    },
    {
      id: "python_challenge_2",
      title: "Declaring Variables (Python)",
      type: "multiple_choice",
      description: "Analyze the Python script below. What value is printed to the screen?",
      codeSnippet: "count = 5\ncount = count + 2\nprint(count)",
      options: ["5", "2", "7", "count + 2"],
      correctOptionIndex: 2,
      tutorial: "Variables are containers used to store data values. In Python, we create a variable by simply giving it a name and assigning a value with `=`. We do NOT need helper type keywords (like let or int)!\n\n**Example:**\n`score = 10` creates a variable.\n`score = score + 5` updates it to 15. Calling `print(score)` prints the current value."
    },
    {
      id: "python_challenge_3",
      title: "Swapping Variables (Python)",
      type: "parsons",
      description: "Reorder the lines of code to swap the values of variables `x` and `y` using a temporary variable `temp` in Python.",
      tutorial: "To swap two variables `x` and `y` in Python, we use a third temporary helper variable `temp` to avoid losing their values.\n\n**Python Steps:**\n1. Store x: `temp = x`\n2. Overwrite x with y: `x = y`\n3. Overwrite y with temp: `y = temp`",
      lines: [
        "temp = x",
        "x = y",
        "y = temp"
      ]
    },
    {
      id: "python_challenge_4",
      title: "Conditional Decisions (Python)",
      type: "multiple_choice",
      description: "What message will be printed when this Python script runs?",
      codeSnippet: "age = 16\nif age >= 18:\n    print(\"Drive\")\nelse:\n    print(\"Walk\")",
      options: ["Drive", "Walk", "age >= 18", "Nothing"],
      correctOptionIndex: 1,
      tutorial: "In Python, `if` and `else` statements check conditions. They are followed by a colon `:` and the next lines MUST be indented (spaced to the right)!\n\n**Keywords:**\n• `if condition:`: checks condition.\n• `else:`: fallback block if check fails."
    },
    {
      id: "python_challenge_5",
      title: "Loops & Counters (Python)",
      type: "parsons",
      description: "Reorder the blocks of code to print numbers from 1 to 3 using a while loop in Python.",
      tutorial: "A loop repeats code while a condition is true. In Python, the code inside the loop must be indented.\n\n**Loop Execution:**\n`while count <= 3:` repeats as long as count is 3 or less.\nInside the loop, `count = count + 1` increments count so the loop doesn't run forever!",
      lines: [
        "count = 1",
        "while count <= 3:",
        "    print(count)",
        "    count = count + 1"
      ]
    },
    {
      id: "python_challenge_6",
      title: "List Indexing (Python)",
      type: "multiple_choice",
      description: "What is printed by this list indexing Python snippet?",
      codeSnippet: "fruits = [\"Apple\", \"Banana\", \"Cherry\"]\nprint(fruits[1])",
      options: ["Apple", "Banana", "Cherry", "1"],
      correctOptionIndex: 1,
      tutorial: "In Python, lists are defined with brackets `[]`. Index counting starts at **0**:\n• `fruits[0]` accesses the 1st item (\"Apple\").\n• `fruits[1]` accesses the 2nd item (\"Banana\").\n• `fruits[2]` accesses the 3rd item (\"Cherry\")."
    },
    {
      id: "python_challenge_7",
      title: "Summing Lists (Python)",
      type: "parsons",
      description: "Reorder the lines of code to sum all elements of the Python list `numbers` into the variable `sum_val`.",
      tutorial: "To sum elements of a list, we use a while loop with an index pointer `i` that iterates while `i < len(numbers)` (where `len()` yields list size) and adds `numbers[i]` to `sum_val`.",
      lines: [
        "numbers = [5, 10]",
        "sum_val = 0",
        "i = 0",
        "while i < len(numbers):",
        "    sum_val = sum_val + numbers[i]",
        "    i = i + 1"
      ]
    }
  ],

  cpp: [
    {
      id: "cpp_challenge_1",
      title: "Printing Text (C++)",
      type: "parsons",
      description: "Reorder the lines of code so they correctly print \"Hello, World!\" in C++.",
      tutorial: "In C++, we output text to the screen using `std::cout` and the insertion operator `<<`. All executables must be housed inside a `main()` block and lines end with semicolons `;`.",
      lines: [
        "#include <iostream>",
        "int main() {",
        "  std::cout << \"Hello, World!\";",
        "  return 0;",
        "}"
      ]
    },
    {
      id: "cpp_challenge_2",
      title: "Declaring Variables (C++)",
      type: "multiple_choice",
      description: "Analyze the C++ script. What value is printed to the screen?",
      codeSnippet: "int count = 5;\ncount = count + 2;\nstd::cout << count;",
      options: ["5", "2", "7", "count + 2"],
      correctOptionIndex: 2,
      tutorial: "C++ is strongly typed: you must declare the variable type (like `int` for integers, `double` for decimals) when creating variables!\n\n**Example:**\n`int score = 10;` declares score. We output it using `std::cout << score;`."
    },
    {
      id: "cpp_challenge_3",
      title: "Swapping Variables (C++)",
      type: "parsons",
      description: "Reorder the lines of code to swap variables `x` and `y` using a temporary variable `temp` in C++.",
      tutorial: "To swap values of integer variables `x` and `y` in C++, we declare a temporary helper integer `temp` first.\n\n**C++ Steps:**\n1. Store x: `int temp = x;`\n2. Set x to y: `x = y;`\n3. Set y to temp: `y = temp;`",
      lines: [
        "int temp = x;",
        "x = y;",
        "y = temp;"
      ]
    },
    {
      id: "cpp_challenge_4",
      title: "Conditional Decisions (C++)",
      type: "multiple_choice",
      description: "What will be printed when this C++ code runs?",
      codeSnippet: "int age = 16;\nif (age >= 18) {\n  std::cout << \"Drive\";\n} else {\n  std::cout << \"Walk\";\n}",
      options: ["Drive", "Walk", "age >= 18", "Nothing"],
      correctOptionIndex: 1,
      tutorial: "In C++, conditions must be wrapped inside parentheses `()`. The code block that executes is placed inside curly braces `{}`.\n\n**Keywords:**\n• `if (condition)`: runs check.\n• `else`: fallback code block."
    },
    {
      id: "cpp_challenge_5",
      title: "Loops & Counters (C++)",
      type: "parsons",
      description: "Reorder the blocks of code to print numbers from 1 to 3 using a while loop in C++.",
      tutorial: "A `while` loop runs code inside curly braces as long as the parenthesis condition is true. We use `count++` to increment the integer.",
      lines: [
        "int count = 1;",
        "while (count <= 3) {",
        "  std::cout << count;",
        "  count++;",
        "}"
      ]
    },
    {
      id: "cpp_challenge_6",
      title: "Array Indexing (C++)",
      type: "multiple_choice",
      description: "What is printed by this C++ array snippet?",
      codeSnippet: "std::string fruits[] = {\"Apple\", \"Banana\", \"Cherry\"};\nstd::cout << fruits[1];",
      options: ["Apple", "Banana", "Cherry", "1"],
      correctOptionIndex: 1,
      tutorial: "In C++, arrays store multiple items of the same type. Array indexing starts at **0**:\n• `fruits[0]` is \"Apple\"\n• `fruits[1]` is \"Banana\"\n• `fruits[2]` is \"Cherry\""
    },
    {
      id: "cpp_challenge_7",
      title: "Summing Arrays (C++)",
      type: "parsons",
      description: "Reorder the lines of code to sum the C++ array elements into variable `sum` using a while loop.",
      tutorial: "To sum elements of a C++ array, we use index variable `i`. We check if `i` is less than array size and add `numbers[i]` to `sum` inside the loop body.",
      lines: [
        "int numbers[] = {5, 10};",
        "int sum = 0;",
        "int i = 0;",
        "while (i < 2) {",
        "  sum = sum + numbers[i];",
        "  i++;",
        "}"
      ]
    }
  ]
};

// retrieves consistent date mapping
function getChallengeForDate(dateStr, language = 'python') {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const bank = CHALLENGE_BANK[language] || CHALLENGE_BANK.python;
  const index = Math.abs(hash) % bank.length;
  
  return {
    ...bank[index],
    assignedDate: dateStr
  };
}

export { CHALLENGE_BANK, getChallengeForDate };
