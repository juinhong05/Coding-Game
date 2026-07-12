// Programmatic curriculum generator for Synapse.
// Generates 200 progressive levels for Python and C++ respectively.

const CHALLENGE_BANK = {
  python: [],
  cpp: []
};

// Seed arrays of text variations to generate unique problems
const VAR_NAMES = ["points", "apples", "score", "count", "speed", "health", "energy", "level", "coins", "ammo"];
const MSG_TEXTS = [
  ["Pass", "Fail"],
  ["Drive", "Walk"],
  ["Hot", "Cold"],
  ["Fast", "Slow"],
  ["High", "Low"],
  ["Safe", "Danger"],
  ["Open", "Closed"],
  ["Win", "Lose"],
  ["Online", "Offline"],
  ["Active", "Idle"]
];
const FRUITS_LIST = [
  ["Apple", "Banana", "Cherry"],
  ["Red", "Green", "Blue"],
  ["Car", "Bike", "Train"],
  ["Cat", "Dog", "Bird"],
  ["Sun", "Moon", "Star"]
];

function generateCurriculum() {
  for (let lvl = 1; lvl <= 200; lvl++) {
    const topic = (lvl - 1) % 10;
    const varIndex = (lvl - 1) % VAR_NAMES.length;
    const varName = VAR_NAMES[varIndex];
    const msgPair = MSG_TEXTS[(lvl - 1) % MSG_TEXTS.length];
    
    // Topic 0: Printing Text (Parsons)
    if (topic === 0) {
      const textMsg = `Greeting from level ${lvl}!`;
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `Printing Text (Level ${lvl})`,
        type: "parsons",
        description: `Reorder the code blocks to print "${textMsg}" to the screen in Python.`,
        tutorial: "In programming, we communicate with the computer by outputting text. In Python, we print messages using the `print()` function. \n\n**Key Rules:**\n• Text must be enclosed in quotes like `\"Hello\"`.\n• The text is placed inside the parentheses `()`.\n• Python lines do NOT end with a semicolon `;`!",
        lines: [
          "print(",
          `  "${textMsg}"`,
          ")"
        ]
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Printing Text (Level ${lvl})`,
        type: "parsons",
        description: `Reorder the lines of code to print "${textMsg}" in C++.`,
        tutorial: "In C++, we output text to the screen using `std::cout` and the insertion operator `<<`. All executable code must go inside a `main()` function block, and lines end with semicolons `;`.",
        lines: [
          "#include <iostream>",
          "int main() {",
          `  std::cout << "${textMsg}";`,
          "  return 0;",
          "}"
        ]
      });
    }
    
    // Topic 1: Declaring Variables (Multiple Choice)
    else if (topic === 1) {
      const initVal = ((lvl * 3) % 15) + 2;
      const addVal = ((lvl * 2) % 7) + 1;
      const correctVal = initVal + addVal;
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `Declaring Variables (Level ${lvl})`,
        type: "multiple_choice",
        description: "Analyze this Python script. What value is printed to the screen?",
        codeSnippet: `${varName} = ${initVal}\n${varName} = ${varName} + ${addVal}\nprint(${varName})`,
        options: [initVal.toString(), addVal.toString(), correctVal.toString(), (initVal - addVal).toString()],
        correctOptionIndex: 2,
        tutorial: "Variables store data. In Python, we declare variables by simply giving them a name and assigning a value with `=`. We do not need helper type keywords (like let or int)!\n\n**Example:**\n`score = 10` creates a variable. `score = score + 5` updates it. `print(score)` outputs the value."
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Declaring Variables (Level ${lvl})`,
        type: "multiple_choice",
        description: "Analyze this C++ program snippet. What value is printed to the screen?",
        codeSnippet: `int ${varName} = ${initVal};\n${varName} = ${varName} + ${addVal};\nstd::cout << ${varName};`,
        options: [initVal.toString(), addVal.toString(), correctVal.toString(), (initVal - addVal).toString()],
        correctOptionIndex: 2,
        tutorial: "C++ is strongly typed: you must declare the variable type (like `int` for integers, `double` for decimals) when creating variables!\n\n**Example:**\n`int score = 10;` declares score. We output it using `std::cout << score;`."
      });
    }
    
    // Topic 2: Swapping Variables (Parsons)
    else if (topic === 2) {
      const labelFirst = `val_${varName}`;
      const labelSecond = `val_other`;
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `Swapping Variables (Level ${lvl})`,
        type: "parsons",
        description: `Reorder the lines to swap the values of ${labelFirst} and ${labelSecond} using a temp variable in Python.`,
        tutorial: "To swap two variables x and y in Python, we use a third temporary helper variable temp.\n\n**Python Steps:**\n1. Store x: `temp = x`\n2. Overwrite x with y: `x = y`\n3. Overwrite y with temp: `y = temp`",
        lines: [
          `temp = ${labelFirst}`,
          `${labelFirst} = ${labelSecond}`,
          `${labelSecond} = temp`
        ]
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Swapping Variables (Level ${lvl})`,
        type: "parsons",
        description: `Reorder the lines to swap the values of integers ${labelFirst} and ${labelSecond} in C++.`,
        tutorial: "To swap values of integer variables x and y in C++, declare a temporary helper integer `temp` first.\n\n**C++ Steps:**\n1. Store x: `int temp = x;`\n2. Set x to y: `x = y;`\n3. Set y to temp: `y = temp;`",
        lines: [
          `int temp = ${labelFirst};`,
          `${labelFirst} = ${labelSecond};`,
          `${labelSecond} = temp;`
        ]
      });
    }
    
    // Topic 3: Conditional Decisions (Multiple Choice)
    else if (topic === 3) {
      const threshold = ((lvl * 4) % 25) + 15;
      const testVal = (lvl % 2 === 0) ? (threshold + 5) : (threshold - 5);
      const expectedOutput = (testVal >= threshold) ? msgPair[0] : msgPair[1];
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `Conditional Decisions (Level ${lvl})`,
        type: "multiple_choice",
        description: "What message will be printed when this Python script runs?",
        codeSnippet: `${varName} = ${testVal}\nif ${varName} >= ${threshold}:\n    print("${msgPair[0]}")\nelse:\n    print("${msgPair[1]}")`,
        options: [msgPair[0], msgPair[1], "Nothing", "Error"],
        correctOptionIndex: (testVal >= threshold) ? 0 : 1,
        tutorial: "In Python, `if` and `else` statements are followed by a colon `:` and the next lines MUST be indented (spaced to the right)!\n\n**Keywords:**\n• `if condition:`: Checks condition.\n• `else:`: fallback block."
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Conditional Decisions (Level ${lvl})`,
        type: "multiple_choice",
        description: "What will be printed when this C++ code runs?",
        codeSnippet: `int ${varName} = ${testVal};\nif (${varName} >= ${threshold}) {\n  std::cout << "${msgPair[0]}";\n} else {\n  std::cout << "${msgPair[1]}";\n}`,
        options: [msgPair[0], msgPair[1], "Nothing", "Error"],
        correctOptionIndex: (testVal >= threshold) ? 0 : 1,
        tutorial: "In C++, conditions must be wrapped inside parentheses `()`. The code block that executes is placed inside curly braces `{}`.\n\n**Keywords:**\n• `if (condition)`: runs check.\n• `else`: fallback code block."
      });
    }
    
    // Topic 4: Loops & Counters (Parsons)
    else if (topic === 4) {
      const loopBound = ((lvl - 1) % 3) + 2; // loops bounds: 2, 3, 4
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `Loops & Counters (Level ${lvl})`,
        type: "parsons",
        description: `Reorder the blocks of code to print numbers from 1 to ${loopBound} using a while loop in Python.`,
        tutorial: "A `while` loop runs code repeatedly while its condition is true. The loop block must be indented under the `while` line.",
        lines: [
          "count = 1",
          `while count <= ${loopBound}:`,
          "    print(count)",
          "    count = count + 1"
        ]
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Loops & Counters (Level ${lvl})`,
        type: "parsons",
        description: `Reorder the blocks of code to print numbers from 1 to ${loopBound} using a while loop in C++.`,
        tutorial: "A `while` loop checks its condition inside parentheses. The loop body repeats as long as the check is true. We use `count++` to increment the counter.",
        lines: [
          "int count = 1;",
          `while (count <= ${loopBound}) {`,
          "  std::cout << count;",
          "  count++;",
          "}"
        ]
      });
    }
    
    // Topic 5: List/Array Indexing (Multiple Choice)
    else if (topic === 5) {
      const currentList = FRUITS_LIST[(lvl - 1) % FRUITS_LIST.length];
      const targetIndex = (lvl - 1) % 3;
      const correctItem = currentList[targetIndex];
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `List Indexing (Level ${lvl})`,
        type: "multiple_choice",
        description: "What is output by this list indexing Python snippet?",
        codeSnippet: `items = ["${currentList[0]}", "${currentList[1]}", "${currentList[2]}"]\nprint(items[${targetIndex}])`,
        options: [currentList[0], currentList[1], currentList[2], targetIndex.toString()],
        correctOptionIndex: targetIndex,
        tutorial: "In Python, lists are defined with brackets `[]`. Index counting starts at **0**:\n• `items[0]` accesses the 1st item.\n• `items[1]` accesses the 2nd item.\n• `items[2]` accesses the 3rd item."
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Array Indexing (Level ${lvl})`,
        type: "multiple_choice",
        description: "What does this C++ array program print?",
        codeSnippet: `std::string items[] = {"${currentList[0]}", "${currentList[1]}", "${currentList[2]}"};\nstd::cout << items[${targetIndex}];`,
        options: [currentList[0], currentList[1], currentList[2], targetIndex.toString()],
        correctOptionIndex: targetIndex,
        tutorial: "In C++, arrays store multiple items of the same type. Array indexing starts at **0**:\n• `items[0]` accesses the 1st item.\n• `items[1]` accesses the 2nd item.\n• `items[2]` accesses the 3rd item."
      });
    }
    
    // Topic 6: Summing Arrays (Parsons)
    else if (topic === 6) {
      const numA = ((lvl * 3) % 9) + 2;
      const numB = ((lvl * 4) % 11) + 3;
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `Summing Lists (Level ${lvl})`,
        type: "parsons",
        description: `Reorder the code to sum elements of the Python list numbers containing values [${numA}, ${numB}].`,
        tutorial: "To sum elements of a Python list, we use a while loop with an index pointer `i`. We check if `i < len(numbers)` and add `numbers[i]` to `sum_val`.",
        lines: [
          `numbers = [${numA}, ${numB}]`,
          "sum_val = 0",
          "i = 0",
          "while i < len(numbers):",
          "    sum_val = sum_val + numbers[i]",
          "    i = i + 1"
        ]
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Summing Arrays (Level ${lvl})`,
        type: "parsons",
        description: `Reorder the lines of code to sum elements of the C++ array numbers containing values [${numA}, ${numB}].`,
        tutorial: "To sum elements of a C++ array, we use index variable `i`. We check if `i` is less than array size and add `numbers[i]` to `sum` inside the loop body.",
        lines: [
          `int numbers[] = {${numA}, ${numB}};`,
          "int sum = 0;",
          "int i = 0;",
          "while (i < 2) {",
          "  sum = sum + numbers[i];",
          "  i++;",
          "}"
        ]
      });
    }
    
    // Topic 7: String Concatenation (Multiple Choice)
    else if (topic === 7) {
      const wordA = (lvl % 2 === 0) ? "Code" : "Vect";
      const wordB = (lvl % 2 === 0) ? "Flow" : "Mesh";
      const combined = `${wordA} ${wordB}`;
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `String Concatenation (Level ${lvl})`,
        type: "multiple_choice",
        description: "What does this Python string concatenation code output?",
        codeSnippet: `first = "${wordA}"\nsecond = "${wordB}"\ncombined = first + " " + second\nprint(combined)`,
        options: [wordA, wordB, combined, wordA + wordB],
        correctOptionIndex: 2,
        tutorial: "In programming, combining two strings is called concatenation. In Python, we use the `+` operator to merge strings together."
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `String Concatenation (Level ${lvl})`,
        type: "multiple_choice",
        description: "What does this C++ string concatenation code output?",
        codeSnippet: `std::string first = "${wordA}";\nstd::string second = "${wordB}";\nstd::string combined = first + " " + second;\nstd::cout << combined;`,
        options: [wordA, wordB, combined, wordA + wordB],
        correctOptionIndex: 2,
        tutorial: "In C++, we can merge strings using the `+` operator, provided we are dealing with variables of type `std::string`."
      });
    }
    
    // Topic 8: Compound Logical Checks (Multiple Choice)
    else if (topic === 8) {
      const booleanCondition = (lvl % 2 === 0);
      const ticketValPython = booleanCondition ? "True" : "False";
      const idValPython = "True";
      const ticketValCpp = booleanCondition ? "true" : "false";
      const idValCpp = "true";
      const expectedOutput = booleanCondition ? "Enter" : "Reject";
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `Logical Operators (Level ${lvl})`,
        type: "multiple_choice",
        description: "Analyze the conditional Python code. What is printed to the screen?",
        codeSnippet: `has_ticket = ${ticketValPython}\nhas_id = ${idValPython}\nif has_ticket and has_id:\n    print("Enter")\nelse:\n    print("Reject")`,
        options: ["Enter", "Reject", "Error", "Nothing"],
        correctOptionIndex: booleanCondition ? 0 : 1,
        tutorial: "Logical operators combine multiple conditions:\n• `and`: returns true only if BOTH check conditions are true.\n• `or`: returns true if at least ONE condition is true."
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Logical Operators (Level ${lvl})`,
        type: "multiple_choice",
        description: "Analyze the C++ logic script. What is output to the screen?",
        codeSnippet: `bool hasTicket = ${ticketValCpp};\nbool hasId = ${idValCpp};\nif (hasTicket && hasId) {\n  std::cout << "Enter";\n} else {\n  std::cout << "Reject";\n}`,
        options: ["Enter", "Reject", "Error", "Nothing"],
        correctOptionIndex: booleanCondition ? 0 : 1,
        tutorial: "C++ uses specific operators for logical checks:\n• `&&`: represents AND (both must be true).\n• `||`: represents OR (any can be true)."
      });
    }
    
    // Topic 9: Simple Function Returns (Multiple Choice)
    else if (topic === 9) {
      const aVal = ((lvl * 3) % 5) + 2;
      const bVal = ((lvl * 2) % 4) + 2;
      const product = aVal * bVal;
      
      CHALLENGE_BANK.python.push({
        id: `python_challenge_${lvl}`,
        title: `Function Returns (Level ${lvl})`,
        type: "multiple_choice",
        description: "Analyze this Python script. What value is printed?",
        codeSnippet: `def multiply(a, b):\n    return a * b\n\nresult = multiply(${aVal}, ${bVal})\nprint(result)`,
        options: [aVal.toString(), bVal.toString(), product.toString(), (aVal + bVal).toString()],
        correctOptionIndex: 2,
        tutorial: "Functions are reusable blocks of code. The `return` keyword sends a calculated result value back to where the function was called."
      });

      CHALLENGE_BANK.cpp.push({
        id: `cpp_challenge_${lvl}`,
        title: `Function Returns (Level ${lvl})`,
        type: "multiple_choice",
        description: "Analyze this C++ program. What value is printed?",
        codeSnippet: `int multiply(int a, int b) {\n  return a * b;\n}\nint main() {\n  int result = multiply(${aVal}, ${bVal});\n  std::cout << result;\n}`,
        options: [aVal.toString(), bVal.toString(), product.toString(), (aVal + bVal).toString()],
        correctOptionIndex: 2,
        tutorial: "In C++, you must declare the function's return datatype (like `int`) and parameter datatypes. The `return` keyword sends a value back."
      });
    }
  }
}

// Generate the 200 progressive levels during module load
generateCurriculum();

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
