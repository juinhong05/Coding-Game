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

// MongoDB Connection State
let dbClient = null;
let usersCollection = null;
let isMongo = false;

// Async Database Initializer
export async function initDb() {
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import('mongodb');
      console.log("Connecting to Cloud MongoDB database...");
      dbClient = new MongoClient(process.env.MONGODB_URI);
      await dbClient.connect();
      const dbInstance = dbClient.db('synapse');
      usersCollection = dbInstance.collection('users');
      
      // Ensure index on id and syncCode for fast lookups
      await usersCollection.createIndex({ id: 1 }, { unique: true });
      await usersCollection.createIndex({ syncCode: 1 });
      
      isMongo = true;
      console.log("Connected successfully to Cloud MongoDB Database.");
    } catch (err) {
      console.error("Failed to connect to MongoDB, falling back to local file database:", err);
      isMongo = false;
    }
  } else {
    console.log("No MONGODB_URI detected. Using local filesystem database.json.");
    isMongo = false;
  }
}

// Local File Read/Write Helpers
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
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Database write error:", err);
  }
}

// Password hashing helper
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Resolves canonical user ID (handling linked profiles) in Local memory
function resolveCanonicalIdLocal(userId, users) {
  let currentId = userId;
  let visited = new Set();
  while (users[currentId] && users[currentId].canonicalId && users[currentId].canonicalId !== currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    currentId = users[currentId].canonicalId;
  }
  return currentId;
}

// Resolves canonical user ID asynchronously in MongoDB
async function resolveCanonicalIdMongo(userId) {
  let currentId = userId;
  let visited = new Set();
  
  while (true) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    
    const user = await usersCollection.findOne({ id: currentId });
    if (user && user.canonicalId && user.canonicalId !== currentId) {
      currentId = user.canonicalId;
    } else {
      break;
    }
  }
  return currentId;
}

// Helper to generate a unique 6-character alphanumeric sync code
async function generateSyncCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  if (isMongo) {
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await usersCollection.findOne({ syncCode: code });
      if (!existing) break;
    } while (true);
  } else {
    const data = readData();
    const existingCodes = new Set(Object.values(data.users).map(u => u.syncCode));
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (existingCodes.has(code));
  }
  
  return code;
}

export const db = {
  // Create a new user profile
  async createUser() {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const syncCode = await generateSyncCode();
    
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

    if (isMongo) {
      await usersCollection.insertOne(newUser);
      return newUser;
    } else {
      const data = readData();
      data.users[id] = newUser;
      writeData(data);
      return newUser;
    }
  },

  // Get user profile (resolving linked profiles)
  async getUser(userId) {
    if (isMongo) {
      const canonicalId = await resolveCanonicalIdMongo(userId);
      const user = await usersCollection.findOne({ id: canonicalId });
      return user ? { ...user, resolvedId: canonicalId } : null;
    } else {
      const data = readData();
      const canonicalId = resolveCanonicalIdLocal(userId, data.users);
      const user = data.users[canonicalId];
      return user ? { ...user, resolvedId: canonicalId } : null;
    }
  },

  // Update user's progress statistics
  async updateProgress(userId, progress) {
    if (isMongo) {
      const canonicalId = await resolveCanonicalIdMongo(userId);
      const user = await usersCollection.findOne({ id: canonicalId });
      if (!user) return null;

      // Merge arrays
      const existingCompleted = new Set(user.completedChallenges || []);
      if (Array.isArray(progress.completedChallenges)) {
        progress.completedChallenges.forEach(c => existingCompleted.add(c));
      }
      const mergedCompleted = Array.from(existingCompleted).sort();
      
      // Calculate updates
      const updatedFields = {
        completedChallenges: mergedCompleted,
        updatedAt: new Date().toISOString()
      };
      
      if (typeof progress.score === 'number') {
        updatedFields.score = Math.max(user.score || 0, progress.score);
      }
      if (typeof progress.streak === 'number') {
        updatedFields.streak = Math.max(user.streak || 0, progress.streak);
      }
      if (progress.lastCompletedDate) {
        if (!user.lastCompletedDate || progress.lastCompletedDate > user.lastCompletedDate) {
          updatedFields.lastCompletedDate = progress.lastCompletedDate;
        }
      }
      if (progress.completionHistory) {
        updatedFields.completionHistory = {
          ...(user.completionHistory || {}),
          ...progress.completionHistory
        };
      }

      await usersCollection.updateOne({ id: canonicalId }, { $set: updatedFields });
      const updatedUser = await usersCollection.findOne({ id: canonicalId });
      return { ...updatedUser, resolvedId: canonicalId };

    } else {
      const data = readData();
      const canonicalId = resolveCanonicalIdLocal(userId, data.users);
      const user = data.users[canonicalId];
      if (!user) return null;

      const existingCompleted = new Set(user.completedChallenges);
      if (Array.isArray(progress.completedChallenges)) {
        progress.completedChallenges.forEach(c => existingCompleted.add(c));
      }
      user.completedChallenges = Array.from(existingCompleted).sort();

      if (typeof progress.score === 'number') {
        user.score = Math.max(user.score, progress.score);
      }
      if (typeof progress.streak === 'number') {
        user.streak = Math.max(user.streak, progress.streak);
      }
      if (progress.lastCompletedDate) {
        if (!user.lastCompletedDate || progress.lastCompletedDate > user.lastCompletedDate) {
          user.lastCompletedDate = progress.lastCompletedDate;
        }
      }
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
    }
  },

  // Link two profiles together using a sync code
  async linkProfiles(currentUserId, targetSyncCode) {
    const codeKey = targetSyncCode.trim().toUpperCase();

    if (isMongo) {
      const currentCanonicalId = await resolveCanonicalIdMongo(currentUserId);
      const targetUser = await usersCollection.findOne({ syncCode: codeKey });
      if (!targetUser) {
        throw new Error("Invalid sync code");
      }

      const targetCanonicalId = await resolveCanonicalIdMongo(targetUser.id);
      if (currentCanonicalId === targetCanonicalId) {
        const user = await usersCollection.findOne({ id: currentCanonicalId });
        return { ...user, canonicalId: currentCanonicalId };
      }

      const primary = await usersCollection.findOne({ id: targetCanonicalId });
      const secondary = await usersCollection.findOne({ id: currentCanonicalId });
      if (!secondary) {
        throw new Error("Active device profile session not found on server. Please restart/reload app.");
      }

      // Merge progress
      const mergedCompleted = Array.from(new Set([
        ...(primary.completedChallenges || []),
        ...(secondary.completedChallenges || [])
      ])).sort();

      const mergedHistory = {
        ...(secondary.completionHistory || {}),
        ...(primary.completionHistory || {})
      };

      const mergedScore = Math.max(primary.score || 0, secondary.score || 0);
      const mergedStreak = Math.max(primary.streak || 0, secondary.streak || 0);
      const mergedLastCompleted = (primary.lastCompletedDate && secondary.lastCompletedDate)
        ? (primary.lastCompletedDate > secondary.lastCompletedDate ? primary.lastCompletedDate : secondary.lastCompletedDate)
        : (primary.lastCompletedDate || secondary.lastCompletedDate);

      // Update primary document
      await usersCollection.updateOne(
        { id: targetCanonicalId },
        {
          $set: {
            completedChallenges: mergedCompleted,
            completionHistory: mergedHistory,
            score: mergedScore,
            streak: mergedStreak,
            lastCompletedDate: mergedLastCompleted,
            updatedAt: new Date().toISOString()
          }
        }
      );

      // Update secondary canonical mapping pointing to primary canonical
      await usersCollection.updateOne(
        { id: currentCanonicalId },
        {
          $set: {
            canonicalId: targetCanonicalId,
            updatedAt: new Date().toISOString()
          }
        }
      );

      // Cascade any profiles pointing to currentCanonicalId to targetCanonicalId
      await usersCollection.updateMany(
        { canonicalId: currentCanonicalId },
        {
          $set: {
            canonicalId: targetCanonicalId,
            updatedAt: new Date().toISOString()
          }
        }
      );

      const finalUser = await usersCollection.findOne({ id: targetCanonicalId });
      return { ...finalUser, canonicalId: targetCanonicalId };

    } else {
      const data = readData();
      const currentCanonicalId = resolveCanonicalIdLocal(currentUserId, data.users);
      
      const targetUser = Object.values(data.users).find(u => u.syncCode === codeKey);
      if (!targetUser) {
        throw new Error("Invalid sync code");
      }

      const targetCanonicalId = resolveCanonicalIdLocal(targetUser.id, data.users);
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
    }
  },

  // Register account credentials
  async registerAccount(userId, username, password) {
    const lowerUsername = username.trim().toLowerCase();

    if (isMongo) {
      const exists = await usersCollection.findOne({ 
        username: { $regex: new RegExp(`^${lowerUsername}$`, 'i') } 
      });
      if (exists) {
        throw new Error("Username already taken");
      }

      const canonicalId = userId ? await resolveCanonicalIdMongo(userId) : null;
      let user = canonicalId ? await usersCollection.findOne({ id: canonicalId }) : null;

      if (!user) {
        const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const syncCode = await generateSyncCode();
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
        await usersCollection.insertOne(user);
      } else {
        await usersCollection.updateOne(
          { id: canonicalId },
          {
            $set: {
              username: username.trim(),
              passwordHash: hashPassword(password),
              updatedAt: new Date().toISOString()
            }
          }
        );
        user = await usersCollection.findOne({ id: canonicalId });
      }

      return { ...user, canonicalId: user.canonicalId };

    } else {
      const data = readData();
      const exists = Object.values(data.users).some(
        u => u.username && u.username.toLowerCase() === lowerUsername
      );
      if (exists) {
        throw new Error("Username already taken");
      }

      const canonicalId = userId ? resolveCanonicalIdLocal(userId, data.users) : null;
      let user = data.users[canonicalId];

      if (!user) {
        const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const syncCode = await generateSyncCode();
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
        user.username = username.trim();
        user.passwordHash = hashPassword(password);
        user.updatedAt = new Date().toISOString();
      }

      writeData(data);
      return user;
    }
  },

  // Authenticate credentials
  async login(username, password) {
    const lowerUsername = username.trim().toLowerCase();
    const hash = hashPassword(password);

    if (isMongo) {
      const user = await usersCollection.findOne({
        username: { $regex: new RegExp(`^${lowerUsername}$`, 'i') }
      });
      if (!user || user.passwordHash !== hash) {
        throw new Error("Invalid username or password");
      }

      const canonicalId = await resolveCanonicalIdMongo(user.id);
      const canonicalUser = await usersCollection.findOne({ id: canonicalId });
      return { ...canonicalUser, resolvedId: canonicalId };

    } else {
      const data = readData();
      const user = Object.values(data.users).find(
        u => u.username && u.username.toLowerCase() === lowerUsername
      );

      if (!user || user.passwordHash !== hash) {
        throw new Error("Invalid username or password");
      }

      const canonicalId = resolveCanonicalIdLocal(user.id, data.users);
      return {
        ...data.users[canonicalId],
        resolvedId: canonicalId
      };
    }
  },

  // Update preferred language
  async updateLanguage(userId, language) {
    if (isMongo) {
      const canonicalId = await resolveCanonicalIdMongo(userId);
      const user = await usersCollection.findOne({ id: canonicalId });
      if (!user) return null;

      await usersCollection.updateOne(
        { id: canonicalId },
        {
          $set: {
            preferredLanguage: language,
            updatedAt: new Date().toISOString()
          }
        }
      );
      const updatedUser = await usersCollection.findOne({ id: canonicalId });
      return { ...updatedUser, resolvedId: canonicalId };

    } else {
      const data = readData();
      const canonicalId = resolveCanonicalIdLocal(userId, data.users);
      const user = data.users[canonicalId];
      if (!user) return null;

      user.preferredLanguage = language;
      user.updatedAt = new Date().toISOString();
      data.users[canonicalId] = user;
      writeData(data);
      return { ...user, resolvedId: canonicalId };
    }
  },

  // Get high score leaderboard
  async getLeaderboard() {
    if (isMongo) {
      const list = await usersCollection
        .find({ score: { $gt: 0 } })
        .sort({ score: -1 })
        .limit(10)
        .toArray();
      return list;
    } else {
      const data = readData();
      const list = Object.values(data.users)
        .filter(u => u.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      return list;
    }
  }
};
