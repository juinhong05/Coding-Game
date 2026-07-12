package com.dailycoding.challenge.data.model

data class Challenge(
    val id: String,
    val title: String,
    val type: String, // "coding" | "parsons" | "bug_hunt" | "multiple_choice"
    val description: String,
    val tutorial: String?,
    val codeSnippet: String?,
    val starterCode: String?,
    val testCases: List<TestCase>?,
    val lines: List<String>?,
    val bugLineIndex: Int?,
    val options: List<String>?,
    val correctOptionIndex: Int?,
    val explanation: String?,
    val assignedDate: String
)

data class TestCase(
    val input: String,
    val expected: String
)

data class VerifyRequest(
    val challengeId: String,
    val submission: Any, // List<String> or Int
    val date: String
)

data class VerifyResponse(
    val success: Boolean,
    val explanation: String?
)
