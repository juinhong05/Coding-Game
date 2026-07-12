package com.dailycoding.challenge.data.model

data class User(
    val id: String,
    val syncCode: String,
    val username: String?,
    val nickname: String,
    val score: Int,
    val streak: Int,
    val preferredLanguage: String,
    val lastCompletedDate: String?,
    val completedChallenges: List<String>,
    val completionHistory: Map<String, CompletionDetail>
)

data class CompletionDetail(
    val scoreEarned: Int,
    val timeSpentSeconds: Int,
    val completedAt: String
)

data class ProgressUpdateRequest(
    val score: Int,
    val streak: Int,
    val lastCompletedDate: String?,
    val completedChallenges: List<String>,
    val completionHistory: Map<String, CompletionDetail>
)

data class LinkRequest(
    val syncCode: String
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
