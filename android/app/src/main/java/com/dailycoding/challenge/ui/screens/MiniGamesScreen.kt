package com.dailycoding.challenge.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dailycoding.challenge.data.model.MiniGame
import com.dailycoding.challenge.data.model.MiniGamesResponse
import com.dailycoding.challenge.data.model.User
import com.dailycoding.challenge.ui.theme.*

@Composable
fun MiniGamesScreen(
    user: User,
    response: MiniGamesResponse?,
    loading: Boolean,
    error: String?,
    activeGame: MiniGame?,
    feedback: Pair<Boolean, String>?,
    submitting: Boolean,
    onLanguageSelected: (String) -> Unit,
    onRetry: () -> Unit,
    onPlay: (MiniGame) -> Unit,
    onBack: () -> Unit,
    onCodeChanged: () -> Unit,
    onSubmit: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDarker)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        if (activeGame == null) {
            Text("🕹️ MINI GAMES", fontSize = 23.sp, fontWeight = FontWeight.Bold, color = NeonCyan)
            Text("Write code to clear each game. First clears earn 10 points; replays are practice.", color = TextSecondary, fontSize = 13.sp)

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("python" to "🐍 Python", "cpp" to "⚙️ C++").forEach { (language, label) ->
                    val selected = user.preferredLanguage == language
                    OutlinedButton(
                        onClick = { if (!selected) onLanguageSelected(language) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = if (selected) NeonCyan else TextSecondary)
                    ) { Text(label, fontSize = 12.sp) }
                }
            }

            when {
                loading -> CircularProgressIndicator(color = NeonCyan)
                error != null -> {
                    Text(error, color = NeonRose, fontSize = 13.sp)
                    Button(onClick = onRetry) { Text("RETRY") }
                }
                response?.games.isNullOrEmpty() -> {
                    Card(colors = CardDefaults.cardColors(containerColor = BgCard)) {
                        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("🔒 Mini Games Locked", color = TextPrimary, fontWeight = FontWeight.Bold)
                            Text("Complete level 1 in ${if (user.preferredLanguage == "cpp") "C++" else "Python"} to unlock Christmas Tree Builder.", color = TextSecondary, fontSize = 13.sp)
                        }
                    }
                }
                else -> response!!.games.forEach { game ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = BgCard),
                        modifier = Modifier.fillMaxWidth().border(1.dp, if (game.completed) NeonEmerald.copy(alpha = 0.4f) else NeonPurple.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("LEVEL ${game.unlockLevel}+", color = NeonAmber, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text(if (game.completed) "✓ CLEARED" else "⚡ READY", color = if (game.completed) NeonEmerald else NeonCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Text(game.title, color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text(game.description, color = TextSecondary, fontSize = 13.sp)
                            Button(
                                onClick = { onPlay(game) },
                                colors = ButtonDefaults.buttonColors(containerColor = NeonPurple)
                            ) { Text(if (game.completed) "PLAY AGAIN" else "PLAY NOW", color = Color.White) }
                        }
                    }
                }
            }
        } else {
            var code by remember(activeGame.id) { mutableStateOf("") }

            TextButton(onClick = onBack) { Text("← ALL MINI GAMES", color = NeonCyan) }
            Text(activeGame.title, fontSize = 23.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text(activeGame.description, color = TextSecondary, fontSize = 13.sp)

            Text("STARTER CODE", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            if (!activeGame.before.isNullOrEmpty()) CodePanel(activeGame.before)

            Text("WRITE THE MISSING CODE", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            OutlinedTextField(
                value = code,
                onValueChange = { code = it; onCodeChanged() },
                modifier = Modifier.fillMaxWidth().heightIn(min = 140.dp),
                placeholder = { Text(if (user.preferredLanguage == "cpp") "// Your C++ line(s)" else "# Your Python line(s)", color = TextMuted) },
                textStyle = androidx.compose.ui.text.TextStyle(fontFamily = FontFamily.Monospace, fontSize = 13.sp, color = TextPrimary),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.None, autoCorrect = false),
                minLines = 4
            )
            if (!activeGame.after.isNullOrEmpty()) CodePanel(activeGame.after)

            Text("TARGET OUTPUT", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            CodePanel(activeGame.expectedOutput)

            if (feedback != null) {
                Text(feedback.second, color = if (feedback.first) NeonEmerald else NeonRose, fontSize = 13.sp)
            }
            Button(
                onClick = { onSubmit(code) },
                enabled = code.isNotBlank() && !submitting,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = NeonPurple)
            ) { Text(if (submitting) "CHECKING..." else "CHECK CODE", color = Color.White) }
        }
    }
}

@Composable
private fun CodePanel(code: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(BgDark, RoundedCornerShape(10.dp))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
            .horizontalScroll(rememberScrollState())
            .padding(14.dp)
    ) {
        Text(code, color = TextPrimary, fontFamily = FontFamily.Monospace, fontSize = 13.sp, softWrap = false)
    }
}
