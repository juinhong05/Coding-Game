# ⚡ Synapse - Daily Coding Curriculum

Synapse is an interactive, zero-typing daily coding game designed to teach programming principles to absolute beginners. It features a progressive syllabus, interactive tutorials, drag-and-drop Parsons puzzles, and multiple-choice questions to build coding familiarity from scratch.

---

## 🚀 Key Features

* **Dual Curriculum Track**: Learn either **Python** or **C++** with a single click. The tasks, code snippets, block structures, and tutorials adapt dynamically to your chosen language.
* **Progressive Learning Syllabus**: Levels unlock sequentially based on completion count:
  - **Level 1**: Printing Text (`print()` / `std::cout`)
  - **Level 2**: Declaring Variables (Assignments & Datatypes)
  - **Level 3**: Swapping Variables (Temporary storage logic)
  - **Level 4**: Conditional Decisions (`if-else` branching)
  - **Level 5**: Loops & Counters (`while` loops)
  - **Level 6**: Array/List Indexing (Accessing indices)
  - **Level 7**: Summing Arrays (Iterative accumulation)
* **Concept Tutorials**: Integrated sidebar guides explaining active level logic, formatting rules, and code patterns.
* **Cloud Progress Sync**: Secure guest stats (Scores & Streaks) with a cloud login account to play seamlessly across Web browser clients and native Android Mobile clients.

---

## 🛠️ Project Structure

* `/backend` - Express API server managing progress syncing, credential authentication, and solution check routines.
* `/web` - React static client styled with custom dark/neon glassmorphism aesthetics.
* `/android` - Native Kotlin Jetpack Compose mobile app connecting to the local server mesh.

---

## ⚙️ Getting Started & Local Runs

### 1. Run the Backend Server
```bash
cd backend
npm install
npm start
```
*The local API server runs on `http://localhost:5000`.*

### 2. Run the Web Client
```bash
cd web
npm install
npm run dev
```
*The React app starts on `http://localhost:5173`.*

### 3. Run the Android Client
1. Open **Android Studio**.
2. Select **Open Project** and choose the `android/` directory.
3. Select an emulator or connected phone, and press **Run** (`Shift + F10`).
