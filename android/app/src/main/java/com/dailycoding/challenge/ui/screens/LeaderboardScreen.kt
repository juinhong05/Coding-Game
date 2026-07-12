package com.dailycoding.challenge.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dailycoding.challenge.data.model.LeaderboardItem
import com.dailycoding.challenge.ui.theme.*

@Composable
fun LeaderboardScreen(
    leaderboard: List<LeaderboardItem>,
    currentUserNickname: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BgDarker)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "GLOBAL LEADERBOARD",
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Color.White,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .border(1.dp, Color(0xFF2E303A).copy(alpha = 0.4f), RoundedCornerShape(14.dp)),
            colors = CardDefaults.cardColors(containerColor = BgCard)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Table Headers
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "RANK", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.width(50.dp))
                    Text(text = "CODER", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.weight(1f))
                    Text(text = "SCORE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.width(80.dp))
                    Text(text = "STREAK", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextMuted, modifier = Modifier.width(60.dp))
                }

                Divider(color = Color.White.copy(alpha = 0.08f), modifier = Modifier.padding(bottom = 8.dp))

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (leaderboard.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier.fillParentMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No traces yet. Set the first highscore!",
                                    fontSize = 13.sp,
                                    color = TextMuted
                                )
                            }
                        }
                    } else {
                        itemsIndexed(leaderboard) { index, item ->
                            val isCurrentUser = item.nickname == currentUserNickname
                            val isRanked = index < 3
                            
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        if (isCurrentUser) NeonCyan.copy(alpha = 0.05f)
                                        else Color.Transparent,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .border(
                                        1.dp,
                                        if (isCurrentUser) NeonCyan.copy(alpha = 0.3f)
                                        else Color.Transparent,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .padding(vertical = 12.dp, horizontal = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Rank
                                Box(
                                    modifier = Modifier
                                        .width(50.dp)
                                        .padding(start = 4.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(24.dp)
                                            .clip(CircleShape)
                                            .background(
                                                when (index) {
                                                    0 -> NeonAmber.copy(alpha = 0.15f)
                                                    1 -> Color.White.copy(alpha = 0.1f)
                                                    2 -> NeonRose.copy(alpha = 0.15f)
                                                    else -> Color.Transparent
                                                }
                                            )
                                            .border(
                                                1.dp,
                                                when (index) {
                                                    0 -> NeonAmber.copy(alpha = 0.4f)
                                                    1 -> Color.White.copy(alpha = 0.3f)
                                                    2 -> NeonRose.copy(alpha = 0.4f)
                                                    else -> Color.Transparent
                                                },
                                                CircleShape
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = when (index) {
                                                0 -> "👑"
                                                else -> (index + 1).toString()
                                            },
                                            fontSize = if (index == 0) 11.sp else 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = when (index) {
                                                0 -> NeonAmber
                                                1 -> Color.White
                                                2 -> NeonRose
                                                else -> TextMuted
                                            }
                                        )
                                    }
                                }

                                // Coder Nickname
                                Text(
                                    text = if (isCurrentUser) "${item.nickname} (YOU)" else item.nickname,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = if (isCurrentUser) NeonCyan else Color.White,
                                    modifier = Modifier.weight(1f)
                                )

                                // Score
                                Text(
                                    text = item.score.toString(),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = NeonAmber,
                                    modifier = Modifier.width(80.dp)
                                )

                                // Streak
                                Text(
                                    text = "${item.streak} 🔥",
                                    fontSize = 12.sp,
                                    color = TextSecondary,
                                    modifier = Modifier.width(60.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
