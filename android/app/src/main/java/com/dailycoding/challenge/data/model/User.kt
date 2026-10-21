package com.dailycoding.challenge.data.model

import com.google.gson.JsonObject

data class CompletedChallenges(
    val python: List<String> = emptyList(),
    val cpp: List<String> = emptyList()
) {
    fun forLanguage(language: String): List<String> = if (language == "cpp") cpp else python

    fun withCompleted(language: String, challengeId: String): CompletedChallenges =
        if (language == "cpp") copy(cpp = (cpp + challengeId).distinct())
        else copy(python = (python + challengeId).distinct())
}

data class User(
    val id: String,
    val token: String? = null,
    val syncCode: String,
    val username: String?,
    val nickname: String,
    val score: Int,
    val streak: Int,
    val recoveryLevelPasses: Int,
    val preferredLanguage: String,
    val lastCompletedDate: String?,
    val completedChallenges: CompletedChallenges,
    val completionHistory: JsonObject
)

data class CompletionDetail(
    val scoreEarned: Int,
    val timeSpentSeconds: Int,
    val completedAt: String
)

data class ProgressUpdateRequest(
    val score: Int,
    val streak: Int,
    val recoveryLevelPasses: Int,
    val lastCompletedDate: String?,
    val completedChallenges: CompletedChallenges,
    val completionHistory: JsonObject
)

data class LinkRequest(
    val syncCode: String,
    val legacyUserId: String? = null
)

data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterAccountRequest(
    val userId: String?,
    val username: String,
    val password: String
)

data class LanguageRequest(
    val language: String
)

data class LeaderboardItem(
    val nickname: String,
    val score: Int,
    val streak: Int,
    val lastCompleted: String?
)
