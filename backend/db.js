import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = process.env.PERSISTENT_DIR || __dirname;

// Ensure persistent directory exists if specified
if (process.env.PERSISTENT_DIR && !fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'database.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
}

function readData() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Database read error, returning default structure:", err);
    return { users: {} };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Database write error:", err);
  }
}

// SHA-256 Hashing helper
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate a random 6-character sync code
function generateSyncCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed confusing characters like I, O, 0, 1
  let code = '';
  const data = readData();
  const existingCodes = new Set(
    Object.values(data.users).map(u => u.syncCode)
  );

  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingCodes.has(code));

  return code;
}

// Helper to resolve canonical user ID (handling linked profiles)
function resolveCanonicalId(userId, users) {
  let currentId = userId;
  let visited = new Set();
  
  while (users[currentId] && users[currentId].canonicalId && users[currentId].canonicalId !== currentId) {
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);
    currentId = users[currentId].canonicalId;
  }
  return currentId;
}

export const db = {
  // Create a new user profile
  createUser() {
    const data = readData();
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const syncCode = generateSyncCode();
    
    const newUser = {
      id,
      syncCode,
      username: null,
      passwordHash: null,
      score: 0,
      streak: 0,
      lastCompletedDate: null,
      completedChallenges: [],
      completionHistory: {},
      preferredLanguage: 'python',
      canonicalId: id,
      createdAt: new Date().toISOString()
    };

    data.users[id] = newUser;
    writeData(data);
    return newUser;
  },

  // Get user profile by ID, resolving any link redirections
  getUser(userId) {
    const data = readData();
    const canonicalId = resolveCanonicalId(userId, data.users);
    
    if (!data.users[canonicalId]) {
      return null;
    }
    
    return {
      ...data.users[canonicalId],
      resolvedId: canonicalId,
      originalId: userId
    };
  },

  // Get user by sync code
  getUserBySyncCode(syncCode) {
    const data = readData();
    const normalizedCode = syncCode.trim().toUpperCase();
    const user = Object.values(data.users).find(u => u.syncCode === normalizedCode);
    if (!user) return null;
    
    const canonicalId = resolveCanonicalId(user.id, data.users);
    return data.users[canonicalId] ? { ...data.users[canonicalId], resolvedId: canonicalId } : null;
  },

  // Update user progress
  updateProgress(userId, progress) {
    const data = readData();
    const canonicalId = resolveCanonicalId(userId, data.users);
    
    if (!data.users[canonicalId]) {
      return null;
    }

    const user = data.users[canonicalId];
    
    // Merge completed challenges arrays
    const existingCompleted = new Set(user.completedChallenges);
    if (Array.isArray(progress.completedChallenges)) {
      progress.completedChallenges.forEach(date => existingCompleted.add(date));
    }
    user.completedChallenges = Array.from(existingCompleted).sort();

    // Merge score
    if (typeof progress.score === 'number') {
      user.score = Math.max(user.score, progress.score);
    }

    // Merge streak
    if (typeof progress.streak === 'number') {
      user.streak = Math.max(user.streak, progress.streak);
    }

    // Update last completed date
    if (progress.lastCompletedDate) {
      if (!user.lastCompletedDate || progress.lastCompletedDate > user.lastCompletedDate) {
        user.lastCompletedDate = progress.lastCompletedDate;
      }
    }

    // Merge completion history details
    if (progress.completionHistory) {
      user.completionHistory = {
        ...user.completionHistory,
        ...progress.completionHistory
      };
    }

    user.updatedAt = new Date().toISOString();
    data.users[canonicalId] = user;
    writeData(data);
    
    return { ...user, resolvedId: canonicalId };
  },

  // Link two profiles together using a sync code
  linkProfiles(currentUserId, targetSyncCode) {
    const data = readData();
    const currentCanonicalId = resolveCanonicalId(currentUserId, data.users);
    
    const targetUser = Object.values(data.users).find(
      u => u.syncCode === targetSyncCode.trim().toUpperCase()
    );
    
    if (!targetUser) {
      throw new Error("Invalid sync code");
    }

    const targetCanonicalId = resolveCanonicalId(targetUser.id, data.users);

    if (currentCanonicalId === targetCanonicalId) {
      return data.users[currentCanonicalId];
    }

    const primary = data.users[targetCanonicalId];
    const secondary = data.users[currentCanonicalId];
    if (!secondary) {
      throw new Error("Active device profile session not found on server. Please restart/reload app.");
    }

    const mergedCompleted = Array.from(new Set([
      ...primary.completedChallenges,
      ...secondary.completedChallenges
    ])).sort();

    const mergedHistory = {
      ...secondary.completionHistory,
      ...primary.completionHistory
    };

    const mergedScore = Math.max(primary.score, secondary.score);
    const mergedStreak = Math.max(primary.streak, secondary.streak);

    const mergedLastCompleted = (primary.lastCompletedDate && secondary.lastCompletedDate)
      ? (primary.lastCompletedDate > secondary.lastCompletedDate ? primary.lastCompletedDate : secondary.lastCompletedDate)
      : (primary.lastCompletedDate || secondary.lastCompletedDate);

    primary.completedChallenges = mergedCompleted;
    primary.completionHistory = mergedHistory;
    primary.score = mergedScore;
    primary.streak = mergedStreak;
    primary.lastCompletedDate = mergedLastCompleted;
    primary.updatedAt = new Date().toISOString();

    secondary.canonicalId = targetCanonicalId;
    secondary.updatedAt = new Date().toISOString();

    Object.keys(data.users).forEach(id => {
      if (data.users[id].canonicalId === currentCanonicalId) {
        data.users[id].canonicalId = targetCanonicalId;
      }
    });

    writeData(data);
    return primary;
  },

  // Register account (attaches username/password to user, or registers new user if not found)
  registerAccount(userId, username, password) {
    const data = readData();
    const lowerUsername = username.trim().toLowerCase();
    
    // Check uniqueness
    const exists = Object.values(data.users).some(
      u => u.username && u.username.toLowerCase() === lowerUsername
    );
    if (exists) {
      throw new Error("Username already taken");
    }

    const canonicalId = userId ? resolveCanonicalId(userId, data.users) : null;
    let user = data.users[canonicalId];

    if (!user) {
      // Create fresh user profile with account details
      const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const syncCode = generateSyncCode();
      user = {
        id: newId,
        syncCode,
        username: username.trim(),
        passwordHash: hashPassword(password),
        score: 0,
        streak: 0,
        lastCompletedDate: null,
        completedChallenges: [],
        completionHistory: {},
        preferredLanguage: 'python',
        canonicalId: newId,
        createdAt: new Date().toISOString()
      };
      data.users[newId] = user;
    } else {
      // Attach credentials to existing profile
      user.username = username.trim();
      user.passwordHash = hashPassword(password);
      user.updatedAt = new Date().toISOString();
    }

    writeData(data);
    return user;
  },

  // Authenticate user login
  login(username, password) {
    const data = readData();
    const lowerUsername = username.trim().toLowerCase();
    const hash = hashPassword(password);

    const user = Object.values(data.users).find(
      u => u.username && u.username.toLowerCase() === lowerUsername
    );

    if (!user || user.passwordHash !== hash) {
      throw new Error("Invalid username or password");
    }

    const canonicalId = resolveCanonicalId(user.id, data.users);
    return {
      ...data.users[canonicalId],
      resolvedId: canonicalId
    };
  },

  // Update user's preferred language
  updateLanguage(userId, language) {
    const data = readData();
    const canonicalId = resolveCanonicalId(userId, data.users);
    if (!data.users[canonicalId]) {
      return null;
    }

    data.users[canonicalId].preferredLanguage = language;
    data.users[canonicalId].updatedAt = new Date().toISOString();
    writeData(data);

    return {
      ...data.users[canonicalId],
      resolvedId: canonicalId
    };
  }
};
