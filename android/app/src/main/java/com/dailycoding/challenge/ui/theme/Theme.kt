package com.dailycoding.challenge.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val BgDarker = Color(0xFF030712)
val BgDark = Color(0xFF0B0F19)
val BgCard = Color(0xFF111827)
val NeonCyan = Color(0xFF06B6D4)
val NeonPurple = Color(0xFFA855F7)
val NeonPink = Color(0xFFEC4899)
val NeonAmber = Color(0xFFF59E0B)
val NeonEmerald = Color(0xFF10B981)
val NeonRose = Color(0xFFF43F5E)

val TextPrimary = Color(0xFFF3F4F6)
val TextSecondary = Color(0xFF9CA3AF)
val TextMuted = Color(0xFF6B7280)

private val DarkColorScheme = darkColorScheme(
    primary = NeonCyan,
    secondary = NeonPurple,
    tertiary = NeonAmber,
    background = BgDarker,
    surface = BgDark,
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun SynapseTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
