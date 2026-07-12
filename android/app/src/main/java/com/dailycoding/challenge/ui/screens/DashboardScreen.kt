package com.dailycoding.challenge.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dailycoding.challenge.data.model.Challenge
import com.dailycoding.challenge.data.model.User
import com.dailycoding.challenge.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    user: User,
    challenge: Challenge,
    onStartChallenge: () -> Unit,
    onLanguageSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val isCompletedToday = user.completedChallenges.contains(challenge.id)
    val currentLevelIndex = user.completedChallenges.size + 1

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BgDarker)
            .padding(16.dp)
    ) {
        // App Title Section
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "SYNAPSE",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = NeonCyan
                )
                Text(
                    text = "Daily Coding Arena",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextSecondary,
                    letterSpacing = 1.sp
                )
            }
            Text(
                text = user.nickname,
                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                fontSize = 12.sp,
                color = NeonCyan,
                modifier = Modifier
                    .border(1.dp, NeonCyan.copy(alpha = 0.3f), RoundedCornerShape(50.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Language selector selector bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            val languages = listOf("python" to "🐍 Python Curriculum", "cpp" to "⚙️ C++ Curriculum")
            languages.forEach { (langKey, label) ->
                val isSelected = user.preferredLanguage == langKey
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            if (isSelected) NeonCyan.copy(alpha = 0.08f)
                            else Color.White.copy(alpha = 0.01f)
                        )
                        .border(
                            1.dp,
                            if (isSelected) NeonCyan
                            else Color.White.copy(alpha = 0.05f),
                            RoundedCornerShape(10.dp)
                        )
                        .clickable { onLanguageSelected(langKey) }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = label,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) NeonCyan else TextSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Main Daily Challenge Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1.1f)
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, NeonPurple.copy(alpha = 0.2f), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = BgCard)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(18.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .background(
                                    when (challenge.type) {
                                        "multiple_choice" -> NeonCyan.copy(alpha = 0.15f)
                                        "parsons" -> NeonPurple.copy(alpha = 0.15f)
                                        else -> NeonRose.copy(alpha = 0.15f)
                                    },
                                    RoundedCornerShape(6.dp)
                                )
                                .border(
                                    1.dp,
                                    when (challenge.type) {
                                        "multiple_choice" -> NeonCyan.copy(alpha = 0.4f)
                                        "parsons" -> NeonPurple.copy(alpha = 0.4f)
                                        else -> NeonRose.copy(alpha = 0.4f)
                                    },
                                    RoundedCornerShape(6.dp)
                                )
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = challenge.type.replace("_", " ").uppercase(),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = when (challenge.type) {
                                    "multiple_choice" -> NeonCyan
                                    "parsons" -> NeonPurple
                                    else -> NeonRose
                                }
                            )
                        }

                        Text(
                            text = "LEVEL $currentLevelIndex",
                            fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeonAmber
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = challenge.title,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = challenge.description,
                        fontSize = 13.sp,
                        color = TextSecondary,
                        lineHeight = 18.sp
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (isCompletedToday) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(NeonEmerald.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            .border(1.dp, NeonEmerald.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✓ LEVEL COMPLETED",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeonEmerald,
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    Button(
                        onClick = onStartChallenge,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues()
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.horizontalGradient(listOf(NeonPurple, NeonPink))
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "LAUNCH PLAY ARENA",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Row of Stats (Score & Streak)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, varBorderLight(), RoundedCornerShape(12.dp)),
                colors = CardDefaults.cardColors(containerColor = BgCard)
            ) {
                Column(
                    modifier = Modifier.padding(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = user.score.toString(),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = NeonAmber
                    )
                    Text(text = "SCORE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                }
            }

            Card(
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, varBorderLight(), RoundedCornerShape(12.dp)),
                colors = CardDefaults.cardColors(containerColor = BgCard)
            ) {
                Column(
                    modifier = Modifier.padding(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "${user.streak} 🔥",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = NeonRose
                    )
                    Text(text = "STREAK", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Concept Tutorial Guide Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.9f)
                .border(1.dp, varBorderLight(), RoundedCornerShape(12.dp)),
            colors = CardDefaults.cardColors(containerColor = BgCard)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Text(
                    text = "📖 CONCEPT TUTORIAL",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = NeonCyan,
                    letterSpacing = 0.5.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                val tutorialText = challenge.tutorial ?: "No concept details loaded for this level."
                val scrollState = rememberScrollState()

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    tutorialText.split("\n\n").forEach { paragraph ->
                        Text(
                            text = paragraph.replace("**", "").replace("`", ""),
                            fontSize = 13.sp,
                            color = TextSecondary,
                            lineHeight = 18.sp
                        )
                    }
                }
            }
        }
    }
}

private fun varBorderLight(): Color {
    return Color(0xFF2E303A).copy(alpha = 0.4f)
}
