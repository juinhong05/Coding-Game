import express from 'express';
import cors from 'cors';
import { db } from './db.js';
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
            background: rgba(17, 24, 39, 0.7);
            border: 1px solid rgba(6, 182, 212, 0.3);
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 0 25px rgba(6, 182, 212, 0.25);
          }
          h1 { color: #06b6d4; margin-top: 0; }
          p { color: #9ca3af; font-size: 14px; }
          .badge {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">ONLINE</div>
          <h1>⚡ SYNAPSE SERVER</h1>
          <p>The daily coding challenges data vector mesh is active.</p>
          <p style="font-family: monospace; font-size: 11px; margin-top: 24px; color: #6b7280;">PORT: 5000 | HOST: LOCALHOST</p>
        </div>
      </body>
    </html>
  `);
});

// Helper to generate username from syncCode
function getNickname(user) {
  if (user.username) {
    return user.username;
  }
  return `Coder_${user.syncCode}`;
}

// 1. Get Challenge (Support Progressive Level mapping & active language selection)
app.get('/api/challenges/daily', (req, res) => {
  const { userId } = req.query;
  
  try {
    let challenge;
    let index = 0;
    let language = req.query.language || 'python';
    
    if (userId) {
      const user = db.getUser(userId);
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
app.post('/api/user/register', (req, res) => {
  try {
    const newUser = db.createUser();
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
app.post('/api/user/register-account', (req, res) => {
  const { userId, username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = db.registerAccount(userId, username, password);
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
app.post('/api/user/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = db.login(username, password);
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
app.post('/api/user/:id/language', (req, res) => {
  const { language } = req.body;
  if (!language || (language !== 'python' && language !== 'cpp')) {
    return res.status(400).json({ error: "Language must be 'python' or 'cpp'" });
  }

  try {
    const updated = db.updateLanguage(req.params.id, language);
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
app.get('/api/user/:id', (req, res) => {
  try {
    const user = db.getUser(req.params.id);
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
app.post('/api/user/:id/progress', (req, res) => {
  const { score, streak, lastCompletedDate, completedChallenges, completionHistory } = req.body;
  try {
    const updated = db.updateProgress(req.params.id, {
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
app.post('/api/user/:id/sync/link', (req, res) => {
  const { syncCode } = req.body;
  if (!syncCode) {
    return res.status(400).json({ error: "Sync code is required" });
  }

  try {
    const merged = db.linkProfiles(req.params.id, syncCode);
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
app.get('/api/leaderboard', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(new URL('./database.json', import.meta.url), 'utf8'));
    
    const uniqueUsers = {};
    Object.keys(data.users).forEach(id => {
      const canonicalId = db.getUser(id)?.id;
      if (canonicalId && !uniqueUsers[canonicalId]) {
        uniqueUsers[canonicalId] = data.users[canonicalId];
      }
    });

    const leaderboard = Object.values(uniqueUsers)
      .map(user => ({
        nickname: getNickname(user),
        score: user.score,
        streak: user.streak,
        lastCompleted: user.lastCompletedDate
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

// Start Server
import fs from 'fs';
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Daily Challenge Server running on http://localhost:${PORT}`);
});
