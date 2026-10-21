import express from 'express';
import cors from 'cors';
import { db, initDb } from './db.js';
import { CHALLENGE_BANK, getChallengeForDate } from './challenges.js';
import { MINI_GAME_BANK, verifyMiniGameCode } from './miniGames.js';
import { decodeToken, issueToken, verifyToken } from './auth.js';

const app = express();
const PORT = process.env.PORT || 5000;
app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGINS || 'https://coding-game-theta.vercel.app,http://localhost:5173').split(',').map(value => value.trim());
app.use(cors({ origin(origin, callback) {
  callback(null, !origin || allowedOrigins.includes(origin));
} }));
app.use(express.json({ limit: '32kb' }));
app.set('trust proxy', 1);
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const attempts = new Map();
function limitSensitive(maxAttempts, windowMs) {
  return (req, res, next) => {
    const key = `${req.route.path}:${req.ip}`;
    const now = Date.now();
    const state = attempts.get(key);
    if (attempts.size > 10000) for (const [oldKey, oldState] of attempts) if (oldState.until < now) attempts.delete(oldKey);
    if (!state || state.until < now) {
      attempts.set(key, { count: 1, until: now + windowMs });
      return next();
    }
    if (++state.count > maxAttempts) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    next();
  };
}

const publicRoutes = new Set(['/version', '/leaderboard', '/user/register', '/user/register-account', '/user/login', '/user/forgot-password']);
app.use('/api', async (req, res, next) => {
  if (publicRoutes.has(req.path)) return next();
  const match = /^Bearer (\S+)$/.exec(req.get('authorization') || '');
  if (!match) return res.status(401).json({ error: 'Sign in or recover this profile to continue.' });
  try {
    const payload = decodeToken(match[1]);
    if (!payload) throw new Error('Invalid token');
    const user = await db.getUser(payload.id);
    if (!user || user.id !== payload.id || !verifyToken(match[1], user)) throw new Error('Invalid token');
    req.authUser = user;
    const requestedIds = [/^\/user\/([^/]+)/.exec(req.path)?.[1], req.query.userId, req.body?.userId].filter(Boolean);
    if (requestedIds.some(id => id !== user.id)) return res.status(403).json({ error: 'This profile belongs to another user.' });
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
});

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper for display nicknames
function getNickname(user) {
  if (user.username) return user.username;
  return user.nickname || `Coder_${user.id.slice(0, 6)}`;
}

// Helper to build the public user profile payload
function userPayload(user, includeToken = false) {
  return {
    id: user.resolvedId || user.canonicalId || user.id,
    syncCode: user.syncCode,
    username: user.username,
    nickname: getNickname(user),
    score: user.score,
    streak: user.streak,
    recoveryLevelPasses: user.recoveryLevelPasses ?? 0,
    preferredLanguage: user.preferredLanguage,
    lastCompletedDate: user.lastCompletedDate,
    completedChallenges: user.completedChallenges,
    completionHistory: user.completionHistory,
    miniGamesCompleted: user.miniGamesCompleted,
    ...(includeToken ? { token: issueToken(user) } : {})
  };
}

// Root status page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Synapse Server Status</title>
        <style>
          body {
            background-color: #030712;
            color: #f3f4f6;
            font-family: system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            max-width: 400px;
          }
          h1 {
            color: #06b6d4;
            font-size: 28px;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .status {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid #10b981;
            color: #10b981;
            padding: 6px 16px;
            border-radius: 50px;
            display: inline-block;
            font-weight: bold;
            font-size: 13px;
            margin-top: 16px;
          }
          p {
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>SYNAPSE</h1>
          <p>The daily coding challenges data vector mesh is active. Connecting Web clients and Android clients globally.</p>
          <div class="status">● ONLINE</div>
        </div>
      </body>
    </html>
  `);
});

// Lets deployments confirm that the API supports per-language progress.
app.get('/api/version', (req, res) => {
  res.json({ apiVersion: 3, progressFormat: 'per-language', miniGamesFormat: 'code-writing' });
});

// 1. Get Daily / Progressive Challenge
app.get('/api/challenges/daily', async (req, res) => {
  const { userId } = req.query;

  try {
    let challenge;
    let language = req.query.language || 'python';

    if (userId) {
      const user = await db.getUser(userId);
      if (user) {
        // Resolve active language
        if (!req.query.language && user.preferredLanguage) {
          language = user.preferredLanguage;
        }

        // Level index is per-language: Python progress doesn't affect C++ level
        const bank = CHALLENGE_BANK[language] || CHALLENGE_BANK.python;
        const langCompleted = user.completedChallenges?.[language] || [];
        const index = langCompleted.length % bank.length;
        challenge = {
          ...bank[index],
          assignedDate: new Date().toISOString().split('T')[0]
        };
      }
    }

    // Fallback to Date Hash if userId is missing or invalid
    if (!challenge) {
      const dateStr = req.query.date || new Date().toISOString().split('T')[0];
      challenge = getChallengeForDate(dateStr, language);
    }

    // Strip answers from the payload
    const cleanChallenge = { ...challenge };
    if (cleanChallenge.type === 'bug_hunt') {
      delete cleanChallenge.bugLineIndex;
      delete cleanChallenge.explanation;
    } else if (cleanChallenge.type === 'multiple_choice') {
      delete cleanChallenge.correctOptionIndex;
    }

    res.json(cleanChallenge);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve challenge" });
  }
});


// 2. Validate Challenge Solution
app.post('/api/challenges/verify', (req, res) => {
  const { challengeId, submission } = req.body;
  
  try {
    // Find challenge inside either python or cpp bank
    const challenge = CHALLENGE_BANK.python.find(c => c.id === challengeId) ||
                      CHALLENGE_BANK.cpp.find(c => c.id === challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found in core bank" });
    }

    let success = false;
    let explanation = "";

    if (challenge.type === 'bug_hunt') {
      success = parseInt(submission) === challenge.bugLineIndex;
      explanation = challenge.explanation;
    } else if (challenge.type === 'parsons') {
      if (Array.isArray(submission)) {
        success = submission.length === challenge.lines.length &&
                  submission.every((line, idx) => line.trim() === challenge.lines[idx].trim());
      }
    } else if (challenge.type === 'coding') {
      success = true;
    } else if (challenge.type === 'multiple_choice') {
      success = parseInt(submission) === challenge.correctOptionIndex;
      explanation = "Great job! You analyzed the code correctly.";
    }

    res.json({ success, explanation });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify solution" });
  }
});

// 3. Register Anonymous Profile
app.post('/api/user/register', limitSensitive(20, 60 * 60 * 1000), async (req, res) => {
  try {
    const newUser = await db.createUser();
    res.status(201).json(userPayload(newUser, true));
  } catch (err) {
    res.status(500).json({ error: "Failed to register user" });
  }
});

// 4. Create Credentialed Account
app.post('/api/user/register-account', limitSensitive(10, 60 * 60 * 1000), async (req, res) => {
  const { userId, username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  if (typeof username !== 'string' || username.length > 50 || typeof password !== 'string' || password.length < 8 || password.length > 256) {
    return res.status(400).json({ error: 'Use a username under 50 characters and a password of 8 to 256 characters.' });
  }
  try {
    if (userId) {
      const match = /^Bearer (\S+)$/.exec(req.get('authorization') || '');
      const current = await db.getUser(userId);
      if (!match || !current || current.id !== userId || !verifyToken(match[1], current)) {
        return res.status(403).json({ error: 'Sign in to this profile before creating an account.' });
      }
      if (current.username) return res.status(409).json({ error: 'This profile already has an account.' });
    }
    const user = await db.registerAccount(userId, username, password);
    res.status(200).json(userPayload(user, true));
  } catch (err) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});

// 5. Account Sign In / Login
app.post('/api/user/login', limitSensitive(15, 15 * 60 * 1000), async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  try {
    const user = await db.login(username, password);
    res.status(200).json(userPayload(user, true));
  } catch (err) {
    res.status(401).json({ error: err.message || "Invalid credentials" });
  }
});

// 5b. Forgot / Reset Password
app.post('/api/user/forgot-password', limitSensitive(5, 60 * 60 * 1000), async (req, res) => {
  const { username, syncCode, newPassword, legacyUserId } = req.body;
  if (!username || !syncCode || !newPassword) {
    return res.status(400).json({ error: "Username, syncCode, and newPassword are required" });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 256) {
    return res.status(400).json({ error: "New password must be 8 to 256 characters long" });
  }

  try {
    const updated = await db.resetPassword(username, syncCode, newPassword, legacyUserId);
    res.status(200).json(userPayload(updated, true));
  } catch (err) {
    res.status(400).json({ error: 'Invalid account or recovery code' });
  }
});

// 6. Set User Preferred Language
app.post('/api/user/:id/language', async (req, res) => {
  const { language } = req.body;
  if (!language || (language !== 'python' && language !== 'cpp')) {
    return res.status(400).json({ error: "Language must be 'python' or 'cpp'" });
  }
  try {
    const updated = await db.updateLanguage(req.params.id, language);
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(userPayload(updated));
  } catch (err) {
    res.status(500).json({ error: "Failed to update language" });
  }
});

// 7. Get User Profile
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await db.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(userPayload(user));
  } catch (err) {
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// 8. Update Progress / Sync State
app.post('/api/user/:id/progress', async (req, res) => {
  const { score, streak, recoveryLevelPasses, lastCompletedDate, completedChallenges, completionHistory, miniGamesCompleted } = req.body;
  try {
    const updated = await db.updateProgress(req.params.id, {
      score, streak, recoveryLevelPasses, lastCompletedDate, completedChallenges, completionHistory, miniGamesCompleted
    });
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(userPayload(updated));
  } catch (err) {
    console.error('Progress update failed:', err);
    res.status(500).json({ error: "Failed to update user progress" });
  }
});

// 9. Link Devices / Profiles
app.post('/api/user/:id/sync/link', limitSensitive(5, 60 * 60 * 1000), async (req, res) => {
  const { syncCode, legacyUserId } = req.body;
  if (!syncCode) return res.status(400).json({ error: "Sync code is required" });
  try {
    const merged = await db.linkProfiles(req.params.id, syncCode, legacyUserId);
    res.json(userPayload(merged, true));
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to link profiles" });
  }
});

// 10. Get Leaderboard (Top 10 players)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const rawLeaderboard = await db.getLeaderboard();
    const leaderboard = rawLeaderboard.map(user => ({
      nickname: getNickname(user),
      score: user.score,
      streak: user.streak,
      lastCompleted: user.lastCompletedDate
    }));
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

// 11. Get Available Mini-Games for a User (filtered by unlock level per language)
app.get('/api/minigames', async (req, res) => {
  const { userId, language } = req.query;
  const lang = language || 'python';
  const bank = MINI_GAME_BANK[lang] || [];

  try {
    let completedLevel = 0;
    let completedMiniGameIds = [];

    if (userId) {
      const user = await db.getUser(userId);
      if (user) {
        completedLevel = (user.completedChallenges?.[lang] || []).length;
        completedMiniGameIds = user.miniGamesCompleted?.[lang] || [];
      }
    }

    // Filter to unlocked games only, strip server-side solutions.
    const available = bank
      .filter(game => completedLevel >= game.unlockLevel)
      .map(game => {
        const clean = { ...game };
        delete clean.solution;
        clean.completed = completedMiniGameIds.includes(game.id);
        return clean;
      });

    res.json({
      language: lang,
      unlockedCount: available.length,
      totalCount: bank.length,
      games: available
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve mini-games" });
  }
});

// 12. Verify Mini-Game Solution
app.post('/api/minigames/verify', async (req, res) => {
  const { gameId, submission, userId, language } = req.body;
  const lang = language || 'python';
  const bank = MINI_GAME_BANK[lang] || [];

  const game = bank.find(g => g.id === gameId);
  if (!game) {
    return res.status(404).json({ error: "Mini-game not found" });
  }

  try {
    if (!userId) return res.status(400).json({ error: 'A user is required to play a mini game' });
    const user = await db.getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if ((user.completedChallenges?.[lang] || []).length < game.unlockLevel) {
      return res.status(403).json({ error: 'This mini game is still locked' });
    }

    const success = verifyMiniGameCode(game, submission);
    if (!success) {
      return res.json({ success: false, explanation: game.hint });
    }

    const existingMiniGames = user.miniGamesCompleted || { python: [], cpp: [] };
    const alreadyCompleted = (existingMiniGames[lang] || []).includes(gameId);
    let awardedPoints = 0;
    if (!alreadyCompleted) {
      const updated = await db.updateProgress(userId, {
        miniGamesCompleted: {
          ...existingMiniGames,
          [lang]: [...(existingMiniGames[lang] || []), gameId]
        },
        score: (user.score || 0) + 10
      });
      if (!(updated?.miniGamesCompleted?.[lang] || []).includes(gameId)) {
        throw new Error('Mini-game completion was not saved');
      }
      awardedPoints = 10;
    }

    res.json({ success: true, explanation: 'Your code completes the challenge.', output: game.expectedOutput, awardedPoints });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify mini-game solution" });
  }
});

// Initialize database connection then start listener
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daily Challenge Server running on http://localhost:${PORT}`);
  });
});
