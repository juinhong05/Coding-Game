# ⚡ Synapse - Daily Coding Curriculum

Synapse is an interactive, zero-typing daily coding game designed to teach programming principles to absolute beginners. It features a progressive 200-level syllabus, interactive tutorials, drag-and-drop Parsons puzzles, and multiple-choice questions to build coding familiarity from scratch.

### 🌐 Live Production Link
Play the live web application here: **[https://coding-game-theta.vercel.app/](https://coding-game-theta.vercel.app/)**

---

## 🚀 Key Features

* **Dual Curriculum Track**: Learn either **Python** or **C++** with a single click. The tasks, code snippets, block structures, and tutorials adapt dynamically to your chosen language.
* **200 Progressive Learning Levels**: Levels unlock sequentially based on completion count. The syllabus revolves around 10 repeating core programming concepts:
  - **Topic 0**: Printing Text (`print()` / `std::cout` outputs)
  - **Topic 1**: Declaring Variables (assignments, values, and calculations)
  - **Topic 2**: Swapping Variables (swapping variable references using a temp)
  - **Topic 3**: Conditional Decisions (`if-else` branching)
  - **Topic 4**: Loops & Counters (`while` loop boundaries)
  - **Topic 5**: Array/List Indexing (referencing zero-based list offsets)
  - **Topic 6**: Summing Lists (iterative sum accumulation checks)
  - **Topic 7**: String Concatenation (combining string outputs)
  - **Topic 8**: Logical Operators (evaluating compound conditions using `and`/`or`/`&&`/`||`)
  - **Topic 9**: Function Returns (defining functions and returning results)
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

---

## ☁️ Production Deployment Configuration

### Backend Deployment (e.g. Render)
* Link your GitHub repository to a new Render **Web Service**.
* Set **Root Directory** to `backend`.
* Start command: `node server.js`.
* Configure the following Environment Variable for database persistence:
  - **Key**: `MONGODB_URI`
  - **Value**: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/synapse?retryWrites=true&w=majority` *(Create a free M0 Shared Cluster on MongoDB Atlas to get your URI)*
* *Note: If MONGODB_URI is not set, the server will gracefully fallback to using local file database.json storage.*

### Frontend Deployment (e.g. Vercel)
* Link the repository to a new Vercel project.
* Set **Framework Preset** to `Vite`.
* Set **Root Directory** to `web`.
* Configure the following Environment Variable:
  - **Key**: `VITE_API_BASE`
  - **Value**: `https://YOUR-RENDER-BACKEND-URL.onrender.com/api`
