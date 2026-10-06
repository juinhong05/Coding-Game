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

// Initialize local database file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
}

// Supabase State
let supabase = null;
let isSupabase = false;

// Async Database Initializer
export async function initDb() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      console.log("Connecting to Supabase Cloud Database at:", supabaseUrl);
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
      
      // Test query to check if users table exists and is accessible
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        console.error("Supabase table query error:", error.message);
        console.warn("⚠️ Make sure you have created the 'users' table in Supabase. Falling back to local database.json.");
        isSupabase = false;
      } else {
        isSupabase = true;
        console.log("Connected successfully to Supabase Cloud Database.");
      }
    } catch (err) {
      console.error("Failed to initialize Supabase client, falling back to local file database:", err.message);
      isSupabase = false;
    }
  } else {
    console.log("No SUPABASE_URL / SUPABASE_KEY detected. Using local filesystem database.json.");
    isSupabase = false;
  }
}

// Helpers to map between DB row (snake_case) and App Model (camelCase)
function mapRowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    syncCode: row.sync_code || row.syncCode || '',
    username: row.username || null,
    passwordHash: row.password_hash || row.passwordHash || null,
    score: typeof row.score === 'number' ? row.score : 0,
    streak: typeof row.streak === 'number' ? row.streak : 0,
    lastCompletedDate: row.last_completed_date || row.lastCompletedDate || null,
    completedChallenges: row.completed_challenges || row.completedChallenges || [],
    completionHistory: row.completion_history || row.completionHistory || {},
    preferredLanguage: row.preferred_language || row.preferredLanguage || 'python',
    canonicalId: row.canonical_id || row.canonicalId || row.id,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString()
  };
}

function mapUserToRow(user) {
  return {
    id: user.id,
    sync_code: user.syncCode,
    username: user.username,
    password_hash: user.passwordHash,
    score: user.score,
    streak: user.streak,
    last_completed_date: user.lastCompletedDate,
    completed_challenges: user.completedChallenges,
    completion_history: user.completionHistory,
    preferred_language: user.preferredLanguage,
    canonical_id: user.canonicalId,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
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

// Resolves canonical user ID asynchronously in Supabase
async function resolveCanonicalIdSupabase(userId) {
  let currentId = userId;
  let visited = new Set();
  
  while (true) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    
    const { data: user } = await supabase
      .from('users')
      .select('id, canonical_id')
      .eq('id', currentId)
      .maybeSingle();
      
    if (user && user.canonical_id && user.canonical_id !== currentId) {
      currentId = user.canonical_id;
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
  
  if (isSupabase) {
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const { data } = await supabase.from('users').select('id').eq('sync_code', code).maybeSingle();
      if (!data) break;
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
  // Create a new anonymous user profile
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabase) {
      const row = mapUserToRow(newUser);
      const { error } = await supabase.from('users').insert(row);
      if (error) {
        console.error("Supabase createUser error:", error);
        throw new Error("Failed to create user in database");
      }
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
    if (isSupabase) {
      const canonicalId = await resolveCanonicalIdSupabase(userId);
      const { data: row } = await supabase
        .from('users')
        .select('*')
        .eq('id', canonicalId)
        .maybeSingle();
      return row ? { ...mapRowToUser(row), resolvedId: canonicalId } : null;
    } else {
      const data = readData();
      const canonicalId = resolveCanonicalIdLocal(userId, data.users);
      const user = data.users[canonicalId];
      return user ? { ...user, resolvedId: canonicalId } : null;
    }
  },

  // Update user's progress statistics
  async updateProgress(userId, progress) {
    if (isSupabase) {
      const canonicalId = await resolveCanonicalIdSupabase(userId);
      const { data: row } = await supabase
        .from('users')
        .select('*')
        .eq('id', canonicalId)
        .maybeSingle();
      if (!row) return null;

      const user = mapRowToUser(row);

      // Merge completed list
      const existingCompleted = new Set(user.completedChallenges || []);
      if (Array.isArray(progress.completedChallenges)) {
        progress.completedChallenges.forEach(c => existingCompleted.add(c));
      }
      const mergedCompleted = Array.from(existingCompleted).sort();
      
      const updatePayload = {
        completed_challenges: mergedCompleted,
        updated_at: new Date().toISOString()
      };
      
      if (typeof progress.score === 'number') {
        updatePayload.score = Math.max(user.score || 0, progress.score);
      }
      if (typeof progress.streak === 'number') {
        updatePayload.streak = Math.max(user.streak || 0, progress.streak);
      }
      if (progress.lastCompletedDate) {
        if (!user.lastCompletedDate || progress.lastCompletedDate > user.lastCompletedDate) {
          updatePayload.last_completed_date = progress.lastCompletedDate;
        }
      }
      if (progress.completionHistory) {
        updatePayload.completion_history = {
          ...(user.completionHistory || {}),
          ...progress.completionHistory
        };
      }

      await supabase.from('users').update(updatePayload).eq('id', canonicalId);
      const { data: updatedRow } = await supabase.from('users').select('*').eq('id', canonicalId).maybeSingle();
      return { ...mapRowToUser(updatedRow), resolvedId: canonicalId };

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

    if (isSupabase) {
      const currentCanonicalId = await resolveCanonicalIdSupabase(currentUserId);
      const { data: targetRow } = await supabase
        .from('users')
        .select('*')
        .eq('sync_code', codeKey)
        .maybeSingle();

      if (!targetRow) {
        throw new Error("Invalid sync code");
      }

      const targetCanonicalId = await resolveCanonicalIdSupabase(targetRow.id);
      if (currentCanonicalId === targetCanonicalId) {
        const { data: userRow } = await supabase.from('users').select('*').eq('id', currentCanonicalId).maybeSingle();
        return { ...mapRowToUser(userRow), canonicalId: currentCanonicalId };
      }

      const { data: primaryRow } = await supabase.from('users').select('*').eq('id', targetCanonicalId).maybeSingle();
      const { data: secondaryRow } = await supabase.from('users').select('*').eq('id', currentCanonicalId).maybeSingle();
      if (!secondaryRow) {
        throw new Error("Active device profile session not found on server. Please restart/reload app.");
      }

      const primary = mapRowToUser(primaryRow);
      const secondary = mapRowToUser(secondaryRow);

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

      // Update primary
      await supabase.from('users').update({
        completed_challenges: mergedCompleted,
        completion_history: mergedHistory,
        score: mergedScore,
        streak: mergedStreak,
        last_completed_date: mergedLastCompleted,
        updated_at: new Date().toISOString()
      }).eq('id', targetCanonicalId);

      // Update secondary to point to targetCanonicalId
      await supabase.from('users').update({
        canonical_id: targetCanonicalId,
        updated_at: new Date().toISOString()
      }).eq('id', currentCanonicalId);

      // Cascade any profiles pointing to currentCanonicalId
      await supabase.from('users').update({
        canonical_id: targetCanonicalId,
        updated_at: new Date().toISOString()
      }).eq('canonical_id', currentCanonicalId);

      const { data: finalRow } = await supabase.from('users').select('*').eq('id', targetCanonicalId).maybeSingle();
      return { ...mapRowToUser(finalRow), canonicalId: targetCanonicalId };

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

    if (isSupabase) {
      // Check username uniqueness (case-insensitive)
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .ilike('username', lowerUsername)
        .maybeSingle();

      if (existing) {
        throw new Error("Username already taken");
      }

      const canonicalId = userId ? await resolveCanonicalIdSupabase(userId) : null;
      let { data: userRow } = canonicalId 
        ? await supabase.from('users').select('*').eq('id', canonicalId).maybeSingle() 
        : { data: null };

      if (!userRow) {
        const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const syncCode = await generateSyncCode();
        const newUser = {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await supabase.from('users').insert(mapUserToRow(newUser));
        return { ...newUser, canonicalId: newId };
      } else {
        await supabase.from('users').update({
          username: username.trim(),
          password_hash: hashPassword(password),
          updated_at: new Date().toISOString()
        }).eq('id', canonicalId);

        const { data: updated } = await supabase.from('users').select('*').eq('id', canonicalId).maybeSingle();
        return { ...mapRowToUser(updated), canonicalId };
      }

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

    if (isSupabase) {
      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .ilike('username', lowerUsername)
        .maybeSingle();

      if (!userRow || userRow.password_hash !== hash) {
        throw new Error("Invalid username or password");
      }

      const canonicalId = await resolveCanonicalIdSupabase(userRow.id);
      const { data: canonicalRow } = await supabase.from('users').select('*').eq('id', canonicalId).maybeSingle();
      return { ...mapRowToUser(canonicalRow), resolvedId: canonicalId };

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
    if (isSupabase) {
      const canonicalId = await resolveCanonicalIdSupabase(userId);
      const { data: row } = await supabase.from('users').select('id').eq('id', canonicalId).maybeSingle();
      if (!row) return null;

      await supabase.from('users').update({
        preferred_language: language,
        updated_at: new Date().toISOString()
      }).eq('id', canonicalId);

      const { data: updated } = await supabase.from('users').select('*').eq('id', canonicalId).maybeSingle();
      return { ...mapRowToUser(updated), resolvedId: canonicalId };

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
    if (isSupabase) {
      const { data: rows } = await supabase
        .from('users')
        .select('*')
        .gt('score', 0)
        .order('score', { ascending: false })
        .limit(10);
      return (rows || []).map(mapRowToUser);
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
