package com.dailycoding.challenge

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.dailycoding.challenge.data.api.RetrofitInstance
import com.dailycoding.challenge.data.model.*
import com.dailycoding.challenge.ui.screens.*
import com.dailycoding.challenge.ui.theme.*
import com.google.gson.Gson
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import retrofit2.HttpException

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        RetrofitInstance.initialize(this)

        setContent {
            SynapseTheme {
                var userState by remember { mutableStateOf<User?>(null) }
                var challengeState by remember { mutableStateOf<Challenge?>(null) }
                var leaderboardState by remember { mutableStateOf<List<LeaderboardItem>>(emptyList()) }
                var miniGamesState by remember { mutableStateOf<MiniGamesResponse?>(null) }
                var miniGamesLoading by remember { mutableStateOf(false) }
                var miniGamesError by remember { mutableStateOf<String?>(null) }
                var activeMiniGame by remember { mutableStateOf<MiniGame?>(null) }
                var miniGameFeedback by remember { mutableStateOf<Pair<Boolean, String>?>(null) }
                var miniGameSubmitting by remember { mutableStateOf(false) }
                
                var activeTab by remember { mutableStateOf("dashboard") } // dashboard, minigames, leaderboard, account
                var isPlaying by remember { mutableStateOf(false) }
                var isLoading by remember { mutableStateOf(true) }
                var networkError by remember { mutableStateOf<String?>(null) }

                // Auth & Sync status callbacks
                var authStatus by remember { mutableStateOf("" to "") }
                var syncStatus by remember { mutableStateOf("" to "") }

                // Dialog stats summary
                var showSuccessDialog by remember { mutableStateOf(false) }
                var scoreDetail by remember { mutableStateOf(mapOf<String, Int>()) }
                var explanationText by remember { mutableStateOf("") }

                // Initialize: Load profile from local storage or register
                LaunchedEffect(key1 = true) {
                    val sharedPref = getPreferences(Context.MODE_PRIVATE)
                    val savedUserId = sharedPref.getString("user_id", null)
                    
                    try {
                        // 1. Fetch or Register User
                        val user = if (savedUserId != null && RetrofitInstance.hasSession()) {
                            try {
                                RetrofitInstance.api.getUser(savedUserId)
                            } catch (e: Exception) {
                                if (e is HttpException && (e.code() == 404 || e.code() == 401)) {
                                    RetrofitInstance.clearSession(this@MainActivity)
                                    val freshUser = RetrofitInstance.api.registerUser()
                                    RetrofitInstance.saveSession(this@MainActivity, freshUser)
                                    sharedPref.edit().putString("legacy_user_id", savedUserId).apply()
                                    sharedPref.edit().putString("user_id", freshUser.id).apply()
                                    activeTab = "account"
                                    authStatus = "error" to "Session expired. Sign in to your account or link your old profile with its sync code."
                                    freshUser
                                } else {
                                    throw e
                                }
                            }
                        } else {
                            if (savedUserId != null) {
                                sharedPref.edit().putString("legacy_user_id", savedUserId).apply()
                                activeTab = "account"
                                authStatus = "error" to "Security update: sign in or link your old profile with its sync code."
                            }
                            RetrofitInstance.clearSession(this@MainActivity)
                            val freshUser = RetrofitInstance.api.registerUser()
                            RetrofitInstance.saveSession(this@MainActivity, freshUser)
                            sharedPref.edit().putString("user_id", freshUser.id).apply()
                            freshUser
                        }
                        userState = user

                        // 2. Fetch Challenge passing user ID for progression curriculum
                        val challenge = RetrofitInstance.api.getDailyChallenge(userId = user.id)
                        challengeState = challenge

                        // 3. Fetch Leaderboard
                        val leaderboard = RetrofitInstance.api.getLeaderboard()
                        leaderboardState = leaderboard

                        isLoading = false
                    } catch (e: Exception) {
                        networkError = "Could not load your game: ${e.localizedMessage}"
                        isLoading = false
                    }
                }

                LaunchedEffect(activeTab, userState?.id, userState?.preferredLanguage) {
                    val currentUser = userState
                    if (activeTab == "minigames" && currentUser != null) {
                        miniGamesLoading = true
                        miniGamesError = null
                        try {
                            miniGamesState = RetrofitInstance.api.getMiniGames(currentUser.id, currentUser.preferredLanguage)
                        } catch (e: Exception) {
                            miniGamesError = e.localizedMessage ?: "Could not load mini games"
                        } finally {
                            miniGamesLoading = false
                        }
                    }
                }

                // Helper to reload leaderboard
                val refreshLeaderboard: () -> Unit = {
                    lifecycleScope.launch {
                        try {
                            leaderboardState = RetrofitInstance.api.getLeaderboard()
                        } catch (e: Exception) {
                            // Silently ignore
                        }
                    }
                }

                // Login Handler
                val handleLogin: (String, String) -> Unit = { username, password ->
                    lifecycleScope.launch {
                        authStatus = "loading" to "Authenticating..."
                        try {
                            val user = RetrofitInstance.api.loginUser(LoginRequest(username, password))
                            RetrofitInstance.saveSession(this@MainActivity, user)
                            getPreferences(Context.MODE_PRIVATE).edit().putString("user_id", user.id).remove("legacy_user_id").apply()
                            userState = user
                            activeMiniGame = null
                            miniGameFeedback = null
                            miniGamesState = null
                            authStatus = "success" to "Signed in as ${user.username}"
                            
                            // Reload challenge & leaderboard for this account
                            challengeState = RetrofitInstance.api.getDailyChallenge(userId = user.id)
                            refreshLeaderboard()
                        } catch (e: Exception) {
                            authStatus = "error" to (e.localizedMessage ?: "Login failed")
                        }
                    }
                }

                // Registration Handler
                val handleRegister: (String, String) -> Unit = { username, password ->
                    lifecycleScope.launch {
                        authStatus = "loading" to "Securing profile..."
                        try {
                            val currentUser = userState
                            val user = RetrofitInstance.api.registerAccount(
                                RegisterAccountRequest(
                                    userId = currentUser?.id,
                                    username = username,
                                    password = password
                                )
                            )
                            RetrofitInstance.saveSession(this@MainActivity, user)
                            getPreferences(Context.MODE_PRIVATE).edit().putString("user_id", user.id).apply()
                            userState = user
                            activeMiniGame = null
                            miniGameFeedback = null
                            miniGamesState = null
                            authStatus = "success" to "Profile secured!"
                            
                            // Reload challenge & leaderboard
                            challengeState = RetrofitInstance.api.getDailyChallenge(userId = user.id)
                            refreshLeaderboard()
                        } catch (e: Exception) {
                            authStatus = "error" to (e.localizedMessage ?: "Registration failed")
                        }
                    }
                }

                // Logout Handler
                val handleLogout: () -> Unit = {
                    lifecycleScope.launch {
                        isLoading = true
                        try {
                            getPreferences(Context.MODE_PRIVATE).edit().remove("user_id").remove("legacy_user_id").apply()
                            RetrofitInstance.clearSession(this@MainActivity)
                            // Register fresh guest
                            val guestUser = RetrofitInstance.api.registerUser()
                            RetrofitInstance.saveSession(this@MainActivity, guestUser)
                            getPreferences(Context.MODE_PRIVATE).edit().putString("user_id", guestUser.id).apply()
                            userState = guestUser
                            activeMiniGame = null
                            miniGameFeedback = null
                            miniGamesState = null
                            
                            // Reload challenge & leaderboard for guest
                            challengeState = RetrofitInstance.api.getDailyChallenge(userId = guestUser.id)
                            refreshLeaderboard()
                            authStatus = "" to ""
                            isLoading = false
                        } catch (e: Exception) {
                            networkError = "Logout registration failed: ${e.localizedMessage}"
                            isLoading = false
                        }
                    }
                }

                // Profile Link Sync Handler
                val handleLinkProfile: (String) -> Unit = { code ->
                    lifecycleScope.launch {
                        syncStatus = "loading" to "Connecting..."
                        try {
                            val user = userState
                            if (user != null) {
                                val legacyId = getPreferences(Context.MODE_PRIVATE).getString("legacy_user_id", null)
                                val mergedUser = RetrofitInstance.api.linkProfile(user.id, LinkRequest(code, legacyId))
                                RetrofitInstance.saveSession(this@MainActivity, mergedUser)
                                getPreferences(Context.MODE_PRIVATE).edit().putString("user_id", mergedUser.id).remove("legacy_user_id").apply()
                                userState = mergedUser
                                activeMiniGame = null
                                miniGameFeedback = null
                                miniGamesState = null
                                syncStatus = "success" to "Sync complete! Connected as ${mergedUser.nickname}"
                                
                                // Reload challenge
                                challengeState = RetrofitInstance.api.getDailyChallenge(userId = mergedUser.id)
                                refreshLeaderboard()
                            }
                        } catch (e: Exception) {
                            syncStatus = "error" to (e.localizedMessage ?: "Sync link failed")
                        }
                    }
                }

                // Language Preference update handler
                val handleLanguageSelected: (String) -> Unit = { lang ->
                    lifecycleScope.launch {
                        val user = userState
                        if (user != null) {
                            try {
                                val updatedUser = RetrofitInstance.api.updateLanguage(user.id, LanguageRequest(lang))
                                userState = updatedUser
                                challengeState = RetrofitInstance.api.getDailyChallenge(userId = updatedUser.id)
                                activeMiniGame = null
                                miniGameFeedback = null
                                miniGamesState = null
                            } catch (e: Exception) {
                                // ignore
                            }
                        }
                    }
                }

                val refreshMiniGames: () -> Unit = {
                    val currentUser = userState
                    if (currentUser != null) {
                        lifecycleScope.launch {
                            miniGamesLoading = true
                            miniGamesError = null
                            try {
                                miniGamesState = RetrofitInstance.api.getMiniGames(currentUser.id, currentUser.preferredLanguage)
                            } catch (e: Exception) {
                                miniGamesError = e.localizedMessage ?: "Could not load mini games"
                            } finally {
                                miniGamesLoading = false
                            }
                        }
                    }
                }

                val submitMiniGame: (String) -> Unit = { code ->
                    val currentUser = userState
                    val game = activeMiniGame
                    if (currentUser != null && game != null && !miniGameSubmitting) {
                        miniGameSubmitting = true
                        miniGameFeedback = null
                        lifecycleScope.launch {
                            try {
                                val result = RetrofitInstance.api.verifyMiniGame(
                                    MiniGameVerifyRequest(game.id, code, currentUser.id, currentUser.preferredLanguage)
                                )
                                if (result.success) {
                                    miniGameFeedback = true to if (result.awardedPoints > 0) {
                                        "Code accepted! +${result.awardedPoints} points."
                                    } else {
                                        "Code accepted! Replay complete; points were already awarded."
                                    }
                                    userState = currentUser.copy(score = currentUser.score + result.awardedPoints)
                                    try {
                                        userState = RetrofitInstance.api.getUser(currentUser.id)
                                        miniGamesState = RetrofitInstance.api.getMiniGames(currentUser.id, currentUser.preferredLanguage)
                                    } catch (_: Exception) {
                                        // The server accepted the solution; profile refresh can retry later.
                                    }
                                    refreshLeaderboard()
                                } else {
                                    miniGameFeedback = false to (result.explanation ?: "That code does not match the target yet.")
                                }
                            } catch (e: Exception) {
                                miniGameFeedback = false to (e.localizedMessage ?: "Could not check your code")
                            } finally {
                                miniGameSubmitting = false
                            }
                        }
                    }
                }

                // Solution Verification & Scoring logic
                val submitSolution: (Any) -> Unit = { submission ->
                    lifecycleScope.launch {
                        val user = userState ?: return@launch
                        val challenge = challengeState ?: return@launch
                        val language = user.preferredLanguage
                        if (challenge.id in user.completedChallenges.forLanguage(language)) return@launch
                        
                        try {
                            var isCorrect = false
                            var explanation = ""
                            
                            if (challenge.type == "coding") {
                                isCorrect = true
                            } else {
                                val verifyRes = RetrofitInstance.api.verifySolution(
                                    VerifyRequest(
                                        challengeId = challenge.id,
                                        submission = submission,
                                        date = challenge.assignedDate
                                    )
                                )
                                isCorrect = verifyRes.success
                                explanation = verifyRes.explanation ?: ""
                            }
                            
                            if (isCorrect) {
                                explanationText = explanation
                                
                                val basePoints = 100
                                val timeBonus = 40
                                val streakMultiplier = (1.0 + (user.streak * 0.05)).coerceAtMost(1.5)
                                val totalScoreEarned = ((basePoints + timeBonus) * streakMultiplier).toInt()

                                val updatedScore = user.score + totalScoreEarned
                                val todayStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
                                
                                val (newStreak, recoveryLevelPasses) = calculateStreakState(
                                    user.lastCompletedDate, todayStr, user.streak, user.recoveryLevelPasses
                                )
                                val updatedHistory = user.completionHistory.deepCopy().apply {
                                    add(challenge.id, Gson().toJsonTree(CompletionDetail(
                                        scoreEarned = totalScoreEarned,
                                        timeSpentSeconds = 120,
                                        completedAt = java.time.Instant.now().toString()
                                    )))
                                }

                                val progressRequest = ProgressUpdateRequest(
                                    score = updatedScore,
                                    streak = newStreak,
                                    recoveryLevelPasses = recoveryLevelPasses,
                                    lastCompletedDate = todayStr,
                                    completedChallenges = user.completedChallenges.withCompleted(language, challenge.id),
                                    completionHistory = updatedHistory
                                )

                                val updatedUser = RetrofitInstance.api.updateProgress(user.id, progressRequest)
                                if (challenge.id !in updatedUser.completedChallenges.forLanguage(language)) {
                                    throw IllegalStateException("The server did not save this level. Please try again.")
                                }
                                userState = updatedUser
                                
                                scoreDetail = mapOf(
                                    "base" to basePoints,
                                    "timeBonus" to timeBonus,
                                    "streakBonus" to (totalScoreEarned - (basePoints + timeBonus)),
                                    "total" to totalScoreEarned
                                )
                                showSuccessDialog = true
                            } else {
                                // Incorrect solution
                            }
                        } catch (e: Exception) {
                            networkError = "Could not save level: ${e.localizedMessage}"
                        }
                    }
                }

                // UI Rendering
                if (isLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(BgDarker),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            CircularProgressIndicator(color = NeonCyan)
                            Text(text = "CONNECTING VECTOR MESH...", fontSize = 12.sp, color = NeonCyan)
                        }
                    }
                } else if (networkError != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(BgDarker)
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            Text(text = "❌ COULD NOT LOAD GAME", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = NeonRose)
                            Text(text = networkError ?: "", fontSize = 13.sp, color = TextSecondary, textAlign = TextAlign.Center)
                            Button(
                                onClick = {
                                    isLoading = true
                                    networkError = null
                                    relaunchConnection()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = NeonPurple)
                            ) {
                                Text(text = "RETRY ACCESS")
                            }
                        }
                    }
                } else {
                    val user = userState
                    val challenge = challengeState

                    if (user != null && challenge != null) {
                        if (isPlaying) {
                            ArenaScreen(
                                challenge = challenge,
                                onAbort = { isPlaying = false },
                                onSubmitSolution = { submission ->
                                    submitSolution(submission)
                                }
                            )
                        } else {
                            Scaffold(
                                bottomBar = {
                                    NavigationBar(
                                        containerColor = BgDark,
                                        tonalElevation = 8.dp
                                    ) {
                                        NavigationBarItem(
                                            selected = activeTab == "dashboard",
                                            onClick = { activeTab = "dashboard" },
                                            icon = { Text(text = "🎮", fontSize = 18.sp) },
                                            label = { Text("Arena") },
                                            colors = NavigationBarItemDefaults.colors(
                                                selectedIconColor = NeonCyan,
                                                indicatorColor = NeonCyan.copy(alpha = 0.1f)
                                            )
                                        )
                                        NavigationBarItem(
                                            selected = activeTab == "minigames",
                                            onClick = { activeTab = "minigames" },
                                            icon = { Text(text = "🕹️", fontSize = 18.sp) },
                                            label = { Text("Games") },
                                            colors = NavigationBarItemDefaults.colors(
                                                selectedIconColor = NeonPurple,
                                                indicatorColor = NeonPurple.copy(alpha = 0.12f)
                                            )
                                        )
                                        NavigationBarItem(
                                            selected = activeTab == "leaderboard",
                                            onClick = { activeTab = "leaderboard"; refreshLeaderboard() },
                                            icon = { Text(text = "📊", fontSize = 18.sp) },
                                            label = { Text("Leaderboard") },
                                            colors = NavigationBarItemDefaults.colors(
                                                selectedIconColor = NeonCyan,
                                                indicatorColor = NeonCyan.copy(alpha = 0.1f)
                                            )
                                        )
                                        NavigationBarItem(
                                            selected = activeTab == "account",
                                            onClick = { activeTab = "account" },
                                            icon = { Text(text = "👤", fontSize = 18.sp) },
                                            label = { Text("Account") },
                                            colors = NavigationBarItemDefaults.colors(
                                                selectedIconColor = NeonCyan,
                                                indicatorColor = NeonCyan.copy(alpha = 0.1f)
                                            )
                                        )
                                    }
                                }
                            ) { paddingValues ->
                                Box(modifier = Modifier.padding(paddingValues)) {
                                    when (activeTab) {
                                        "dashboard" -> DashboardScreen(
                                            user = user,
                                            challenge = challenge,
                                            onStartChallenge = { isPlaying = true },
                                            onLanguageSelected = handleLanguageSelected
                                        )
                                        "minigames" -> MiniGamesScreen(
                                            user = user,
                                            response = miniGamesState,
                                            loading = miniGamesLoading,
                                            error = miniGamesError,
                                            activeGame = activeMiniGame,
                                            feedback = miniGameFeedback,
                                            submitting = miniGameSubmitting,
                                            onLanguageSelected = handleLanguageSelected,
                                            onRetry = refreshMiniGames,
                                            onPlay = { game -> activeMiniGame = game; miniGameFeedback = null },
                                            onBack = { activeMiniGame = null; miniGameFeedback = null },
                                            onCodeChanged = { miniGameFeedback = null },
                                            onSubmit = submitMiniGame
                                        )
                                        "leaderboard" -> LeaderboardScreen(
                                            leaderboard = leaderboardState,
                                            currentUserNickname = user.nickname
                                        )
                                        "account" -> AccountScreen(
                                            user = user,
                                            onLogin = handleLogin,
                                            onRegister = handleRegister,
                                            onLogout = handleLogout,
                                            onLinkProfile = handleLinkProfile,
                                            authStatus = authStatus,
                                            syncStatus = syncStatus
                                        )
                                    }
                                }
                            }
                        }

                        // Success Dialog
                        if (showSuccessDialog) {
                            AlertDialog(
                                onDismissRequest = {
                                    showSuccessDialog = false
                                    isPlaying = false
                                    refreshLeaderboard()
                                },
                                title = {
                                    Text(
                                        text = "🏆 CHALLENGE CLEARED!",
                                        fontWeight = FontWeight.Bold,
                                        color = NeonAmber,
                                        fontSize = 20.sp
                                    )
                                },
                                text = {
                                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        if (explanationText.isNotEmpty()) {
                                            Text(
                                                text = "DEBRIEF: $explanationText",
                                                fontSize = 12.sp,
                                                color = TextSecondary
                                            )
                                        }
                                        Divider(color = Color.White.copy(alpha = 0.08f))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(text = "Base Score:", fontSize = 12.sp, color = TextSecondary)
                                            Text(text = "+${scoreDetail["base"]} PTS", fontSize = 12.sp, color = Color.White)
                                        }
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(text = "Time Bonus:", fontSize = 12.sp, color = TextSecondary)
                                            Text(text = "+${scoreDetail["timeBonus"]} PTS", fontSize = 12.sp, color = Color.White)
                                        }
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(text = "Streak Bonus:", fontSize = 12.sp, color = TextSecondary)
                                            Text(text = "+${scoreDetail["streakBonus"]} PTS", fontSize = 12.sp, color = Color.White)
                                        }
                                        Divider(color = Color.White.copy(alpha = 0.08f))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(text = "TOTAL SCORED:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NeonCyan)
                                            Text(text = "+${scoreDetail["total"]} PTS", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NeonCyan)
                                        }
                                    }
                                },
                                confirmButton = {
                                    Button(
                                        onClick = {
                                            showSuccessDialog = false
                                            isPlaying = false
                                            refreshLeaderboard()
                                            
                                            // Pre-fetch next progressive challenge details immediately
                                            lifecycleScope.launch {
                                                try {
                                                    challengeState = RetrofitInstance.api.getDailyChallenge(userId = user.id)
                                                } catch (e: Exception) {}
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = NeonCyan)
                                    ) {
                                        Text(text = "CONTINUE JOURNEY", color = Color.Black, fontWeight = FontWeight.Bold)
                                    }
                                },
                                containerColor = BgDark,
                                tonalElevation = 16.dp
                            )
                        }
                    }
                }
            }
        }
    }

    private fun relaunchConnection() {
        recreate()
    }

    private fun calculateStreakState(
        lastCompleted: String?, today: String, currentStreak: Int, recoveryPasses: Int
    ): Pair<Int, Int> {
        if (lastCompleted == null) return 1 to 0
        return try {
            val lastDate = LocalDate.parse(lastCompleted)
            val currentDate = LocalDate.parse(today)
            val diffDays = java.time.temporal.ChronoUnit.DAYS.between(lastDate, currentDate)
            when {
                diffDays >= 3L -> 1 to 0
                diffDays == 2L -> currentStreak to 1
                recoveryPasses > 0 -> (currentStreak + 1) to 0
                diffDays == 1L -> (currentStreak + 1) to 0
                else -> currentStreak to 0
            }
        } catch (e: Exception) {
            1 to 0
        }
    }
}
