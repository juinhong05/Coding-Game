# ⚡ Synapse - Daily Coding Curriculum

Synapse is an interactive daily coding game designed to teach programming principles to beginners. It features a progressive 200-level syllabus, tutorials, Parsons puzzles, multiple-choice questions, and short code-writing mini games.

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
* **Per-language progression and scoring**: Python and C++ levels advance independently. A completed level is recorded once, so replaying a level does not award its score again.
* **Streak recovery**: Missing one day turns the streak indicator gray; complete two levels to recover the streak. Missing two or more days resets it.
* **Forgot password**: Reset an account password with its username and recovery code. New codes are 16 characters; legacy six-character codes also require the original profile ID saved on the same device.
* **Code-writing mini games**: Eight games per language replace the old debugging and multiple-choice mini games: Christmas Tree Builder, Pattern Printer, Robot Maze, Text Adventure, Mini Shop Checkout, Secret Message Decoder, Scoreboard Builder, and Drawing with Coordinates. Write the missing Python or C++ lines to make the target output. Games unlock at levels 1, 3, 5, 8, 10, 15, 20, and 25. The API checks the submitted lines against each puzzle's solution without executing user code. Each game awards 10 points once; replays award no additional points.
* **Concept Tutorials**: Integrated sidebar guides explaining active level logic, formatting rules, and code patterns.
* **Cloud Progress Sync**: Account login and guest sessions use signed bearer tokens. Private profile reads and writes require the owning token. Device linking uses a recovery code; new codes are generated with a cryptographic random source.

---

## 🛠️ Project Structure

* `/backend` - Express API server managing progress syncing, credential authentication, and solution check routines.
* `/web` - React static client styled with custom dark/neon glassmorphism aesthetics.
* `/android` - Native Kotlin Jetpack Compose mobile app connected to the deployed API, including the Arena, code-writing Mini Games, Leaderboard, and Account tabs.

---

## ⚙️ Getting Started & Local Runs

### 1. Run the Backend Server
```bash
cd backend
npm install
npm start
```
Set `AUTH_SECRET` to a random value of at least 32 bytes before starting a local API without Supabase. The local API server runs on `http://localhost:5000`.

### 2. Run the Web Client
```bash
cd web
npm install
npm run dev
```
*The React app starts on `http://localhost:5173`.*

### 3. Run the Android Client
1. Open **Android Studio**.
2. Select **Open** and choose the repository's `android/` directory (the folder containing `settings.gradle`), not the repository root.
3. Let Gradle sync finish. The Gradle 8.2 wrapper is included in the repository; set **Gradle JDK** to Android Studio's embedded JDK if Studio asks. Install Android SDK Platform 34 in SDK Manager if it is missing.
4. Select an emulator or connected phone, then press **Run** (`Shift + F10`).

If Studio says it cannot find `org.gradle.wrapper.GradleWrapperMain`, update your checkout: older revisions omitted `android/gradle/wrapper/gradle-wrapper.jar`. On Windows, `android\gradlew.bat assembleDebug` checks that the project can build.

If the Android app opens but shows `Expected BEGIN_ARRAY but was BEGIN_OBJECT at $.completedChallenges`, rebuild and reinstall it from the latest source. The API now returns separate Python and C++ completion lists; older APKs expect a flat list. The current Android client reads the per-language progress, preserves completion metadata, and only creates a new guest when the saved profile genuinely returns 404.

The Android **Games** tab loads the same unlocked Python and C++ mini games as the web app. Complete level 1 in a language to unlock Christmas Tree Builder. Enter the missing lines and tap **Check Code**; points are awarded only on the first clear of each game. Rebuild and reinstall the APK after pulling Android changes, since web deployments do not update installed Android apps.

After the security update, older installed Android builds cannot send authenticated requests. Rebuild and reinstall the Android app. Existing account owners should sign in again. Existing guest profiles can be recovered on the original device using its displayed sync code; the app retains the old profile ID for that recovery. Keep the new 16-character code private because it grants access to that profile when linking devices.

---

## ☁️ Production Deployment Configuration

### Backend Deployment (e.g. Render)
* Link your GitHub repository to a new Render **Web Service**.
* Set **Root Directory** to `backend`.
* Start command: `node server.js`.
* Configure the following Environment Variables in Render for Supabase database persistence:
  - **Key**: `SUPABASE_URL` | **Value**: `https://your-project-id.supabase.co`
  - **Key**: `SUPABASE_SECRET_KEY` | **Value**: a server-only Supabase secret key (`sb_secret_...`), or use `SUPABASE_SERVICE_ROLE_KEY` with the legacy `service_role` key. `SUPABASE_KEY` also works only when it is one of these server-only keys. A publishable or `anon` key is rejected.
  - **Key**: `AUTH_SECRET` | **Value**: optional separate random secret of at least 32 bytes for signing sessions. Without it, the server derives its signing key from the server-only Supabase key. Rotating the signing key signs users out.
  - **Key**: `CORS_ORIGINS` | **Value**: optional comma-separated browser origins; defaults to the production Vercel URL and `http://localhost:5173`.
* Run [`backend/security.sql`](backend/security.sql) in the Supabase SQL Editor **after** configuring the server-only key and **before** deploying this backend. It enables row level security on `public.users` and revokes direct table access from `anon` and `authenticated`. No client-side Supabase key is used by this app. Keep the server-only key out of GitHub, the web bundle, and the Android APK.
* Production refuses to start without Supabase, or if its configured key is public or the database is unavailable. Local development without Supabase uses `database.json`.
* Deploy the **backend** after every backend change. A Vercel web deployment alone does not update the Render API. After deployment, `https://YOUR-RENDER-BACKEND-URL.onrender.com/api/version` should return `apiVersion: 3` and `miniGamesFormat: "code-writing"`.
* Level completion is only shown as successful after the API confirms it was saved. The API awards points only for a newly completed level or mini-game, so repeat submissions cannot raise the score.
* The API returns a signed session token on guest registration, account registration, login, password reset, and device link. Web stores it in local storage; Android stores it in private app preferences. Private endpoints require `Authorization: Bearer <token>` and reject requests for another user ID. Auth attempts and sync code guesses are limited per IP, and passwords are stored with salted scrypt hashes. Existing SHA-256 password hashes are upgraded at the next successful login.

#### Supabase Database Table Setup (Run in Supabase SQL Editor):
```sql
create table if not exists users (
  id text primary key,
  sync_code text not null,
  username text,
  password_hash text,
  score integer default 0,
  streak integer default 0,
  recovery_level_passes integer default 0,
  last_completed_date text,
  completed_challenges jsonb default '{"python":[],"cpp":[]}'::jsonb,
  completion_history jsonb default '{}'::jsonb,
  preferred_language text default 'python',
  canonical_id text,
  created_at text default (now() at time zone 'utc')::text,
  updated_at text default (now() at time zone 'utc')::text
);

-- Optional for older deployments: recovery and mini-game progress are also
-- stored in completion_history so an existing users table works without new columns.
alter table users add column if not exists recovery_level_passes integer default 0;

create index if not exists idx_users_sync_code on users(sync_code);
create index if not exists idx_users_canonical_id on users(canonical_id);
```

Then run [`backend/security.sql`](backend/security.sql). This is required for both new and existing tables; merely deploying the API does not block direct Supabase Data API access.

### Frontend Deployment (e.g. Vercel)
* Link the repository to a new Vercel project.
* Set **Framework Preset** to `Vite`.
* Set **Root Directory** to `web`.
* Configure the following Environment Variable:
  - **Key**: `VITE_API_BASE`
  - **Value**: `https://YOUR-RENDER-BACKEND-URL.onrender.com/api`
