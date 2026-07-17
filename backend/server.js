import express from 'express';
import cors from 'cors';
import { db, initDb } from './db.js';
import { CHALLENGE_BANK, getChallengeForDate } from './challenges.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper for display nicknames
function getNickname(user) {
  if (user.username) return user.username;
  return user.nickname || `Coder_${user.syncCode}`;
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

// 1. Get Daily / Progressive Challenge
app.get('/api/challenges/daily', async (req, res) => {
  const { userId } = req.query;
  
  try {
    let challenge;
    let index = 0;
    let language = req.query.language || 'python';
    
    if (userId) {
      const user = await db.getUser(userId);
      if (user) {
        // Resolve active language if not explicitly set in query
        if (!req.query.language && user.preferredLanguage) {
          language = user.preferredLanguage;
        }
        
        // Progressive Level Index is determined by completion count
        const bank = CHALLENGE_BANK[language] || CHALLENGE_BANK.python;
        index = user.completedChallenges.length % bank.length;
        challenge = { 
          ...bank[index],
          assignedDate: new Date().toISOString().split('T')[0] // current date label
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
app.post('/api/user/register', async (req, res) => {
  try {
    const newUser = await db.createUser();
    res.status(201).json({
      id: newUser.id,
      syncCode: newUser.syncCode,
      username: newUser.username,
      nickname: getNickname(newUser),
      score: newUser.score,
      streak: newUser.streak,
      preferredLanguage: newUser.preferredLanguage,
      lastCompletedDate: newUser.lastCompletedDate,
      completedChallenges: newUser.completedChallenges,
      completionHistory: newUser.completionHistory
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to register user" });
  }
});

// 4. Create Credentialed Account
app.post('/api/user/register-account', async (req, res) => {
  const { userId, username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await db.registerAccount(userId, username, password);
    res.status(200).json({
      id: user.canonicalId,
      syncCode: user.syncCode,
      username: user.username,
      nickname: getNickname(user),
      score: user.score,
      streak: user.streak,
      preferredLanguage: user.preferredLanguage,
      lastCompletedDate: user.lastCompletedDate,
      completedChallenges: user.completedChallenges,
      completionHistory: user.completionHistory
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});

// 5. Account Sign In / Login
app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await db.login(username, password);
    res.status(200).json({
      id: user.resolvedId,
      syncCode: user.syncCode,
      username: user.username,
      nickname: getNickname(user),
      score: user.score,
      streak: user.streak,
      preferredLanguage: user.preferredLanguage,
      lastCompletedDate: user.lastCompletedDate,
      completedChallenges: user.completedChallenges,
      completionHistory: user.completionHistory
    });
  } catch (err) {
    res.status(401).json({ error: err.message || "Invalid credentials" });
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
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: updated.resolvedId,
      syncCode: updated.syncCode,
      username: updated.username,
      nickname: getNickname(updated),
      score: updated.score,
      streak: updated.streak,
      preferredLanguage: updated.preferredLanguage,
      lastCompletedDate: updated.lastCompletedDate,
      completedChallenges: updated.completedChallenges,
      completionHistory: updated.completionHistory
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update language" });
  }
});

// 7. Get User Profile
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await db.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.resolvedId,
      syncCode: user.syncCode,
      username: user.username,
      nickname: getNickname(user),
      score: user.score,
      streak: user.streak,
      preferredLanguage: user.preferredLanguage,
      lastCompletedDate: user.lastCompletedDate,
      completedChallenges: user.completedChallenges,
      completionHistory: user.completionHistory
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

// 8. Update Progress / Sync State
app.post('/api/user/:id/progress', async (req, res) => {
  const { score, streak, lastCompletedDate, completedChallenges, completionHistory } = req.body;
  try {
    const updated = await db.updateProgress(req.params.id, {
      score,
      streak,
      lastCompletedDate,
      completedChallenges,
      completionHistory
    });

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: updated.resolvedId,
      syncCode: updated.syncCode,
      username: updated.username,
      nickname: getNickname(updated),
      score: updated.score,
      streak: updated.streak,
      preferredLanguage: updated.preferredLanguage,
      lastCompletedDate: updated.lastCompletedDate,
      completedChallenges: updated.completedChallenges,
      completionHistory: updated.completionHistory
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user progress" });
  }
});

// 9. Link Devices / Profiles
app.post('/api/user/:id/sync/link', async (req, res) => {
  const { syncCode } = req.body;
  if (!syncCode) {
    return res.status(400).json({ error: "Sync code is required" });
  }

  try {
    const merged = await db.linkProfiles(req.params.id, syncCode);
    res.json({
      id: merged.canonicalId,
      syncCode: merged.syncCode,
      username: merged.username,
      nickname: getNickname(merged),
      score: merged.score,
      streak: merged.streak,
      preferredLanguage: merged.preferredLanguage,
      lastCompletedDate: merged.lastCompletedDate,
      completedChallenges: merged.completedChallenges,
      completionHistory: merged.completionHistory
    });
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

// Initialize database connection then start listener
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daily Challenge Server running on http://localhost:${PORT}`);
  });
});
