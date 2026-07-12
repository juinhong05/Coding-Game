import { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

function App() {
  // Navigation & Screen States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'leaderboard' | 'account'
  const [isPlaying, setIsPlaying] = useState(false);
  
  // User & Challenge Data
  const [user, setUser] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Arena State
  const [timer, setTimer] = useState(600); // 10 minutes
  const [editorContent, setEditorContent] = useState('');
  const [parsonsLines, setParsonsLines] = useState([]);
  const [selectedBugIndex, setSelectedBugIndex] = useState(null);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [explanationText, setExplanationText] = useState('');
  
  // Modal / Score summary
  const [showModal, setShowModal] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState({ base: 0, timeBonus: 0, streakBonus: 0, total: 0 });
  
  // Credentials / Auth form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // Device Sync input state
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [syncStatus, setSyncStatus] = useState({ type: '', message: '' });
  
  const timerRef = useRef(null);

  // Initialize: Load User or Register
  useEffect(() => {
    const fetchUser = async (id) => {
      try {
        const res = await fetch(`${API_BASE}/user/${id}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        setUser(data);
        fetchChallenge(data.id);
      } catch (err) {
        console.warn("User ID invalid or not found on server, registering new guest profile.");
        registerNewUser();
      }
    };

    const registerNewUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/register`, { method: 'POST' });
        const data = await res.json();
        localStorage.setItem('synapse_userId', data.id);
        setUser(data);
        fetchChallenge(data.id);
      } catch (err) {
        console.error("Failed to register user:", err);
      }
    };

    const savedId = localStorage.getItem('synapse_userId');
    if (savedId) {
      fetchUser(savedId);
    } else {
      registerNewUser();
    }
  }, []);

  // Fetch Leaderboard
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchChallenge = async (userId) => {
    try {
      const url = userId ? `${API_BASE}/challenges/daily?userId=${userId}` : `${API_BASE}/challenges/daily`;
      const res = await fetch(url);
      const data = await res.json();
      setChallenge(data);
    } catch (err) {
      console.error("Failed to load daily challenge:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    }
  };

  // Timer logic when playing
  useEffect(() => {
    if (isPlaying && timer > 0 && !hasSubmitted) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timer, hasSubmitted]);

  // Shuffle Helper
  const shuffleArray = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Start daily challenge
  const startChallenge = () => {
    if (!challenge) return;
    
    // Check if already completed today's progress level
    // Wait, since we are progressive, completed challenges count determines active level,
    // so we check if challenge.id is already in completed list.
    if (user.completedChallenges.includes(challenge.id)) {
      alert("You have already completed this curriculum level!");
      return;
    }

    setTimer(600); // 10 minutes
    setHasSubmitted(false);
    setIsSuccess(false);
    setExplanationText('');
    setTestResults([]);
    setSelectedChoiceIndex(null);
    setSelectedBugIndex(null);
    
    if (challenge.type === 'coding') {
      setEditorContent(challenge.starterCode);
    } else if (challenge.type === 'parsons') {
      setParsonsLines(shuffleArray(challenge.lines.map((line, idx) => ({ id: idx, content: line }))));
    }
    
    setIsPlaying(true);
  };

  const handleTimeout = () => {
    alert("Time's up!");
    setIsPlaying(false);
  };

  // Drag-and-drop for Parsons Puzzles
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex === targetIndex) return;

    const updated = [...parsonsLines];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setParsonsLines(updated);
  };

  // Coding Challenge - Local Runner
  const runCodeTests = () => {
    if (!challenge || challenge.type !== 'coding') return;
    
    try {
      // eslint-disable-next-line no-new-func
      const userFn = new Function(`return ${editorContent}`)();
      
      const results = challenge.testCases.map((tc) => {
        const args = JSON.parse(tc.input);
        const expected = JSON.parse(tc.expected);
        try {
          const actual = userFn(...args);
          const passed = JSON.stringify(actual) === JSON.stringify(expected);
          return {
            passed,
            input: tc.input,
            expected: tc.expected,
            actual: JSON.stringify(actual)
          };
        } catch (err) {
          return {
            passed: false,
            input: tc.input,
            expected: tc.expected,
            actual: `Execution Error: ${err.message}`
          };
        }
      });

      setTestResults(results);
      return results.every(r => r.passed);
    } catch (err) {
      setTestResults([{
        passed: false,
        input: 'Compilation',
        expected: 'Successful parse',
        actual: `Syntax Error: ${err.message}`
      }]);
      return false;
    }
  };

  // Submit Challenge Solution
  const submitSolution = async () => {
    if (hasSubmitted) return;

    let submissionSuccess = false;
    let explanation = '';

    if (challenge.type === 'coding') {
      submissionSuccess = runCodeTests();
    } else if (challenge.type === 'parsons') {
      const submissionLines = parsonsLines.map(line => line.content);
      const res = await fetch(`${API_BASE}/challenges/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          submission: submissionLines
        })
      });
      const data = await res.json();
      submissionSuccess = data.success;
    } else if (challenge.type === 'bug_hunt') {
      if (selectedBugIndex === null) {
        alert("Please select the line containing the bug first.");
        return;
      }
      const res = await fetch(`${API_BASE}/challenges/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          submission: selectedBugIndex
        })
      });
      const data = await res.json();
      submissionSuccess = data.success;
      explanation = data.explanation;
      setExplanationText(explanation);
    } else if (challenge.type === 'multiple_choice') {
      if (selectedChoiceIndex === null) {
        alert("Please select an option first.");
        return;
      }
      const res = await fetch(`${API_BASE}/challenges/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          submission: selectedChoiceIndex
        })
      });
      const data = await res.json();
      submissionSuccess = data.success;
      explanation = data.explanation;
      setExplanationText(explanation);
    }

    setHasSubmitted(true);
    
    if (submissionSuccess) {
      setIsSuccess(true);
      
      const basePoints = 100;
      const timeBonus = Math.floor(timer / 6); // Up to 100 extra points
      
      const streakMultiplier = Math.min(1.5, 1 + (user.streak * 0.05));
      const subtotal = basePoints + timeBonus;
      const totalScoreGained = Math.round(subtotal * streakMultiplier);

      const newScore = user.score + totalScoreGained;
      const todayStr = new Date().toISOString().split('T')[0];
      const newStreak = calculateNewStreak(user.lastCompletedDate, todayStr, user.streak);

      const progressUpdate = {
        score: newScore,
        streak: newStreak,
        lastCompletedDate: todayStr,
        completedChallenges: [...user.completedChallenges, challenge.id],
        completionHistory: {
          ...user.completionHistory,
          [challenge.id]: {
            scoreEarned: totalScoreGained,
            timeSpentSeconds: 600 - timer,
            completedAt: new Date().toISOString()
          }
        }
      };

      // Push progress to server
      const resUpdate = await fetch(`${API_BASE}/user/${user.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressUpdate)
      });
      const updatedUser = await resUpdate.json();
      setUser(updatedUser);

      setScoreBreakdown({
        base: basePoints,
        timeBonus,
        streakBonus: Math.round(subtotal * (streakMultiplier - 1)),
        total: totalScoreGained
      });
      
      setShowModal(true);
    } else {
      setIsSuccess(false);
      alert("Incorrect solution. Keep debugging!");
      setHasSubmitted(false);
    }
  };

  const calculateNewStreak = (lastCompleted, today, currentStreak) => {
    if (!lastCompleted) return 1;
    
    const lastDate = new Date(lastCompleted);
    const currentDate = new Date(today);
    
    const diffTime = Math.abs(currentDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return currentStreak + 1;
    } else if (diffDays > 1) {
      return 1; // Streak reset
    }
    return currentStreak;
  };

  // Auth: User Account Register
  const handleAuthRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!usernameInput || !passwordInput) return;

    try {
      const res = await fetch(`${API_BASE}/user/register-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, // securing current progress!
          username: usernameInput,
          password: passwordInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      
      setUser(data);
      localStorage.setItem('synapse_userId', data.id);
      setAuthSuccess(`Account created! Welome, ${data.username}`);
      setUsernameInput('');
      setPasswordInput('');
      fetchChallenge(data.id);
      fetchLeaderboard();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Auth: User Account Login
  const handleAuthLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!usernameInput || !passwordInput) return;

    try {
      const res = await fetch(`${API_BASE}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      setUser(data);
      localStorage.setItem('synapse_userId', data.id);
      setAuthSuccess(`Logged in as ${data.username}`);
      setUsernameInput('');
      setPasswordInput('');
      fetchChallenge(data.id);
      fetchLeaderboard();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    localStorage.removeItem('synapse_userId');
    // Register fresh guest profile
    try {
      const res = await fetch(`${API_BASE}/user/register`, { method: 'POST' });
      const data = await res.json();
      localStorage.setItem('synapse_userId', data.id);
      setUser(data);
      fetchChallenge(data.id);
      setAuthSuccess('Logged out successfully.');
    } catch (err) {
      console.error("Logout register error:", err);
    }
  };

  // Update preferred learning language selection
  const updateLanguage = async (lang) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/user/${user.id}/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang })
      });
      const data = await res.json();
      setUser(data);
      fetchChallenge(data.id);
    } catch (err) {
      console.error("Failed to update language:", err);
    }
  };

  // Legacy Device Link Sync Handler
  const handleLinkProfile = async (e) => {
    e.preventDefault();
    if (!syncCodeInput.trim()) return;
    
    setSyncStatus({ type: 'loading', message: 'Linking profiles...' });
    
    try {
      const res = await fetch(`${API_BASE}/user/${user.id}/sync/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncCode: syncCodeInput.trim() })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to link profile');
      }

      const mergedUser = await res.json();
      localStorage.setItem('synapse_userId', mergedUser.id);
      setUser(mergedUser);
      setSyncStatus({ type: 'success', message: `Profiles synced successfully! Connected as ${mergedUser.nickname}` });
      setSyncCodeInput('');
      fetchChallenge(mergedUser.id);
      fetchLeaderboard();
    } catch (err) {
      setSyncStatus({ type: 'error', message: err.message });
    }
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCalendar = () => {
    if (!user) return null;
    
    const dates = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // A challenge is considered completed on a date if completionHistory records exist for it.
    // To map completions correctly, we check if the completionHistory has entries.
    const completedDatesSet = new Set();
    Object.values(user.completionHistory).forEach(history => {
      if (history.completedAt) {
        completedDatesSet.add(history.completedAt.split('T')[0]);
      }
    });

    return (
      <div className="calendar-grid">
        {dates.map((dateStr) => {
          const completed = completedDatesSet.has(dateStr);
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const displayDay = new Date(dateStr).getDate();
          
          return (
            <div 
              key={dateStr} 
              className={`calendar-cell ${completed ? 'completed' : ''} ${isToday ? 'today' : ''}`}
            >
              {displayDay}
              <span className="calendar-cell-tooltip">
                {dateStr} {completed ? '✓ Completed' : 'Unfinished'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!user || !challenge) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(6,182,212,0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>INITIALIZING NEURAL ARENA...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentLevelIndex = user.completedChallenges.length + 1;
  const isCurriculumCompleted = user.completedChallenges.includes(challenge.id);

  return (
    <>
      <header className="app-header">
        <div className="app-container header-content">
          <div className="logo-section">
            <h1 className="logo-title">⚡ SYNAPSE</h1>
            <span className="logo-subtitle">Daily Coding Curriculum</span>
          </div>
          <div className="stats-summary">
            <div className="stat-capsule score">
              <span>🏆</span>
              <span>{user.score.toLocaleString()} PTS</span>
            </div>
            <div className="stat-capsule streak">
              <span>🔥</span>
              <span>{user.streak} DAYS</span>
            </div>
            <span className="profile-badge">{user.nickname}</span>
          </div>
        </div>
      </header>

      <main className="app-container" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {!isPlaying ? (
          <>
            <nav className="nav-tabs">
              <button 
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('dashboard'); setIsPlaying(false); }}
              >
                🎮 ARENA
              </button>
              <button 
                className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('leaderboard'); fetchLeaderboard(); }}
              >
                📊 LEADERBOARD
              </button>
              <button 
                className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('account'); }}
              >
                👤 ACCOUNT
              </button>
            </nav>

            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
              <div className="dashboard-grid">
                <div>
                  <div className="language-selector-container">
                    <button 
                      className={`lang-btn ${user.preferredLanguage === 'python' ? 'active' : ''}`}
                      onClick={() => updateLanguage('python')}
                    >
                      🐍 Python Curriculum
                    </button>
                    <button 
                      className={`lang-btn ${user.preferredLanguage === 'cpp' ? 'active' : ''}`}
                      onClick={() => updateLanguage('cpp')}
                    >
                      ⚙️ C++ Curriculum
                    </button>
                  </div>

                  <div className="glass-card daily-card">
                    <div className="daily-card-header">
                      <span className={`challenge-badge badge-${challenge.type}`}>{challenge.type.replace('_', ' ')}</span>
                      <span className="challenge-date">LEVEL {currentLevelIndex}</span>
                    </div>
                    <div className="challenge-info">
                      <h2>{challenge.title}</h2>
                      <p className="challenge-desc">
                        {challenge.description.split('\n\n')[0]}
                      </p>
                      {isCurriculumCompleted ? (
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px', color: 'var(--neon-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span>✓</span> Curriculum level completed! Secure your code algorithms and load the next challenge tomorrow.
                        </div>
                      ) : (
                        <button className="btn-neon btn-purple pulse-glow-purple" onClick={startChallenge}>
                          LAUNCH PLAY ARENA
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="stats-sidebar">
                  <div className="glass-card small-stat-card">
                    <div className="small-stat-val score">{user.score}</div>
                    <div className="small-stat-lbl">ALL-TIME SCORE</div>
                  </div>

                  <div className="glass-card small-stat-card">
                    <div className="small-stat-val streak">{user.streak} 🔥</div>
                    <div className="small-stat-lbl">CURRENT STREAK</div>
                  </div>

                  <div className="glass-card tutorial-card">
                    <div className="tutorial-title">
                      <span>📖</span> CONCEPT TUTORIAL
                    </div>
                    <div className="tutorial-text">
                      {challenge.tutorial ? (
                        challenge.tutorial.split('\n\n').map((para, idx) => (
                          <p key={idx} dangerouslySetInnerHTML={{
                            __html: para
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/`(.*?)`/g, '<code>$1</code>')
                          }} />
                        ))
                      ) : (
                        <p>No active vector details loaded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard View */}
            {activeTab === 'leaderboard' && (
              <div className="glass-card" style={{ marginBottom: '40px' }}>
                <h2 className="section-title">📊 GLOBAL LEADERBOARD</h2>
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>RANK</th>
                      <th>CODER PROFILE</th>
                      <th>SCORE</th>
                      <th>STREAK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No node traces yet. Be the first to establish connection!</td>
                      </tr>
                    ) : (
                      leaderboard.map((item, index) => {
                        const isRanked = index < 3;
                        const badgeClass = isRanked ? `rank-${index + 1}` : 'rank-other';
                        const isCurrentUser = item.nickname === user.nickname;
                        
                        return (
                          <tr key={index} className="leaderboard-row" style={isCurrentUser ? { background: 'rgba(6,182,212,0.05)', borderLeft: '3px solid var(--neon-cyan)' } : {}}>
                            <td>
                              <span className={`rank-badge ${badgeClass}`}>
                                {isRanked ? (index === 0 ? '👑' : index + 1) : index + 1}
                              </span>
                            </td>
                            <td className="leaderboard-nickname">
                              {item.nickname} {isCurrentUser && <span style={{ color: 'var(--neon-cyan)', fontSize: '11px' }}>(YOU)</span>}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--neon-amber)' }}>{item.score.toLocaleString()}</td>
                            <td>{item.streak} 🔥</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Account / Sync View */}
            {activeTab === 'account' && (
              <div className="sync-layout">
                {/* Account Form */}
                <div className="glass-card sync-card">
                  {user.username ? (
                    <>
                      <h2 className="section-title">👤 PROFILE DETAILS</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>USERNAME</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{user.username}</div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>CONNECTION CODE</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neon-purple)', fontFamily: 'var(--font-mono)' }}>{user.syncCode}</div>
                        </div>

                        <button className="btn-neon btn-secondary" onClick={handleLogout} style={{ marginTop: '12px' }}>
                          LOG OUT OF SYNAPSE
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="section-title">👤 SECURE GUEST PROGRESS</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        You are currently playing on a <strong>Guest profile</strong>. Secure your progress (Score: {user.score}, Level: {currentLevelIndex}) by creating an account.
                      </p>
                      <form onSubmit={isRegisterMode ? handleAuthRegister : handleAuthLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>USERNAME</label>
                          <input 
                            type="text" 
                            className="sync-input" 
                            style={{ letterSpacing: 'normal', fontSize: '14px', padding: '10px', textAlign: 'left' }}
                            placeholder="Enter username" 
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>PASSWORD</label>
                          <input 
                            type="password" 
                            className="sync-input" 
                            style={{ letterSpacing: 'normal', fontSize: '14px', padding: '10px', textAlign: 'left' }}
                            placeholder="Enter password" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                          />
                        </div>

                        <button type="submit" className="btn-neon btn-purple" style={{ marginTop: '8px' }}>
                          {isRegisterMode ? 'CREATE CLOUD ACCOUNT' : 'SIGN IN / SYNC'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '8px' }}>
                          <button 
                            type="button" 
                            style={{ background: 'transparent', border: 'none', color: 'var(--neon-cyan)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => {
                              setIsRegisterMode(!isRegisterMode);
                              setAuthError('');
                              setAuthSuccess('');
                            }}
                          >
                            {isRegisterMode ? 'Already have an account? Sign In' : 'Need an account? Register Here'}
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                  {authError && (
                    <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--neon-rose)', borderRadius: '8px', padding: '10px', fontSize: '13px', textAlign: 'center' }}>
                      {authError}
                    </div>
                  )}
                  {authSuccess && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--neon-emerald)', borderRadius: '8px', padding: '10px', fontSize: '13px', textAlign: 'center' }}>
                      {authSuccess}
                    </div>
                  )}
                </div>

                {/* Legacy Device Link Form */}
                <div className="glass-card sync-card">
                  <h2 className="section-title">🗝️ SYNC OTHER DEVICES</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Alternatively, link a secondary guest device using its 6-digit alphanumeric vector code. Progress will be merged dynamically.
                  </p>
                  <div className="sync-code-display" style={{ padding: '12px' }}>
                    <div>
                      <div className="small-stat-lbl">CONNECTION CODE</div>
                      <div className="sync-code-text" style={{ fontSize: '20px' }}>{user.syncCode}</div>
                    </div>
                    <button 
                      className="btn-neon btn-secondary" 
                      onClick={() => {
                        navigator.clipboard.writeText(user.syncCode);
                        alert("Sync code copied to clipboard!");
                      }}
                    >
                      COPY CODE
                    </button>
                  </div>

                  <form onSubmit={handleLinkProfile} className="sync-input-container">
                    <input 
                      type="text" 
                      className="sync-input" 
                      placeholder="ENTER OTHER DEVICE CODE"
                      value={syncCodeInput}
                      onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
                      maxLength="6"
                      style={{ fontSize: '14px', letterSpacing: '2px', padding: '10px' }}
                    />
                    <button type="submit" className="btn-neon btn-cyan" disabled={syncCodeInput.length !== 6}>
                      LINK DEVICE PROGRESS
                    </button>
                  </form>
                  {syncStatus.message && (
                    <div style={{
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      background: syncStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : syncStatus.type === 'error' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)',
                      color: syncStatus.type === 'success' ? 'var(--neon-emerald)' : syncStatus.type === 'error' ? 'var(--neon-rose)' : 'var(--text-secondary)',
                      border: `1px solid ${syncStatus.type === 'success' ? 'rgba(16,185,129,0.3)' : syncStatus.type === 'error' ? 'rgba(244,63,94,0.3)' : 'var(--border-light)'}`
                    }}>
                      {syncStatus.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Arena (Play Mode) */
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
            <div className="arena-header">
              <div className="arena-title-area">
                <span className={`challenge-badge badge-${challenge.type}`}>{challenge.type.replace('_', ' ')}</span>
                <h2 style={{ fontSize: '22px', margin: 0 }}>{challenge.title}</h2>
              </div>
              <div className={`arena-timer ${timer < 60 ? 'warning' : ''}`}>
                <span>⏱</span>
                <span>{formatTime(timer)}</span>
              </div>
            </div>

            <div className="arena-layout">
              <div className="glass-card problem-details">
                <h3 className="small-stat-lbl">MISSION BRIEFING</h3>
                <div className="problem-desc-md">
                  {challenge.description}
                </div>
                
                {challenge.type === 'coding' && testResults.length > 0 && (
                  <div className="glass-card test-results-card">
                    <h4 className="small-stat-lbl">VALIDATION RUN LOG</h4>
                    <div className="test-results-grid">
                      {testResults.map((tr, idx) => (
                        <div key={idx} className={`test-result-row ${tr.passed ? 'passed' : 'failed'}`}>
                          <div>
                            <div style={{ fontWeight: 600 }}>Test Case #{idx + 1}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Input: {tr.input}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Expected: {tr.expected} | Got: {tr.actual}</div>
                          </div>
                          <span className={`test-status-badge ${tr.passed ? 'passed' : 'failed'}`}>
                            {tr.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card workspace-card">
                <div className="workspace-header">
                  <span>WORKSPACE CONSOLE</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JS COMPATIBLE</span>
                </div>

                {/* Challenge Type Workspaces */}
                {challenge.type === 'coding' && (
                  <div className="coding-editor-container">
                    <textarea
                      className="editor-textarea"
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      spellCheck="false"
                    />
                  </div>
                )}

                {challenge.type === 'parsons' && (
                  <div className="parsons-container">
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Drag and drop the blocks to place them in the correct semantic order:
                    </p>
                    {parsonsLines.map((line, index) => (
                      <div
                        key={line.id}
                        className="parsons-row"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                      >
                        <span className="drag-handle">☰</span>
                        <div className="parsons-code">{line.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                {challenge.type === 'bug_hunt' && (
                  <div className="bughunt-container">
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
                      Select the line that contains the syntax or logic bug:
                    </p>
                    {challenge.lines.map((line, index) => (
                      <div
                        key={index}
                        className={`bughunt-line ${selectedBugIndex === index ? 'selected' : ''}`}
                        onClick={() => setSelectedBugIndex(index)}
                      >
                        <div className="line-number">{index + 1}</div>
                        <div className="line-code">{line}</div>
                      </div>
                    ))}
                  </div>
                )}

                {challenge.type === 'multiple_choice' && (
                  <div className="multiple-choice-container" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    {challenge.codeSnippet && (
                      <pre className="code-preview-block">
                        <code>{challenge.codeSnippet}</code>
                      </pre>
                    )}
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Select the correct output value or block answer:
                    </p>
                    <div className="choice-options-grid">
                      {challenge.options.map((opt, index) => {
                        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
                        const isSelected = selectedChoiceIndex === index;
                        return (
                          <div 
                            key={index} 
                            className={`choice-option-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedChoiceIndex(index)}
                          >
                            <span className="choice-option-badge">{optionLetter}</span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="arena-actions">
                  <button className="btn-neon btn-secondary" onClick={() => setIsPlaying(false)}>
                    ABORT MISSION
                  </button>
                  {challenge.type === 'coding' && (
                    <button className="btn-neon btn-cyan" onClick={runCodeTests}>
                      RUN TESTS
                    </button>
                  )}
                  <button className="btn-neon btn-purple" onClick={submitSolution}>
                    SUBMIT VECTOR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Success Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <span className="success-icon">🏆</span>
            <h2 style={{ fontSize: '28px', color: 'var(--neon-amber)', marginBottom: '8px' }}>CHALLENGE CLEARED!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Your solution successfully resolved the curriculum challenge.
            </p>
            
            {explanationText && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '12px', margin: '16px 0', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.5' }}>
                <strong>DEBRIEFING:</strong> {explanationText}
              </div>
            )}

            <div className="score-details-list">
              <div className="score-detail-row">
                <span style={{ color: 'var(--text-muted)' }}>Base Score:</span>
                <span>+{scoreBreakdown.base} PTS</span>
              </div>
              <div className="score-detail-row">
                <span style={{ color: 'var(--text-muted)' }}>Time Speed Bonus:</span>
                <span>+{scoreBreakdown.timeBonus} PTS</span>
              </div>
              <div className="score-detail-row">
                <span style={{ color: 'var(--text-muted)' }}>Streak Multiplier Bonus:</span>
                <span>+{scoreBreakdown.streakBonus} PTS</span>
              </div>
              <div className="score-detail-row total">
                <span>TOTAL SCORE EARNED:</span>
                <span>+{scoreBreakdown.total} PTS</span>
              </div>
            </div>

            <button 
              className="btn-neon btn-cyan" 
              style={{ width: '100%' }}
              onClick={() => {
                setShowModal(false);
                setIsPlaying(false);
                fetchChallenge(user.id);
                fetchLeaderboard();
              }}
            >
              CONTINUE JOURNEY
            </button>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="app-container">
          SYNAPSE CORE PROTOCOL v1.0.0 • POWERED BY ANTIGRAVITY
        </div>
      </footer>
    </>
  );
}

export default App;
