package com.dailycoding.challenge.data.model

data class MiniGame(
    val id: String,
    val title: String,
    val type: String,
    val unlockLevel: Int,
    val description: String,
    val expectedOutput: String,
    val before: String?,
    val after: String?,
    val hint: String?,
    val completed: Boolean
)

data class MiniGamesResponse(
    val language: String,
    val unlockedCount: Int,
    val totalCount: Int,
    val games: List<MiniGame>
)

data class MiniGameVerifyRequest(
    val gameId: String,
    val submission: String,
    val userId: String,
    val language: String
)

data class MiniGameVerifyResponse(
    val success: Boolean,
    val explanation: String?,
    val output: String?,
    val awardedPoints: Int
)
