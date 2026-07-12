package com.dailycoding.challenge.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dailycoding.challenge.data.model.Challenge
import com.dailycoding.challenge.ui.theme.*
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArenaScreen(
    challenge: Challenge,
    onAbort: () -> Unit,
    onSubmitSolution: (Any) -> Unit, // submission can be List<String> or Int
    modifier: Modifier = Modifier
) {
    // Timer state
    var timeLeft by remember { mutableStateOf(600) }
    // Challenge type specific states
    var codeContent by remember { mutableStateOf(challenge.starterCode ?: "") }
    
    // Parsons lines (shuffled with indices)
    var parsonsLines by remember {
        mutableStateOf(
            (challenge.lines ?: emptyList())
                .mapIndexed { idx, line -> idx to line }
                .shuffled()
        )
    }
    
    // Bug hunt state
    var selectedBugIndex by remember { mutableStateOf(-1) }

    // Multiple Choice state
    var selectedChoiceIndex by remember { mutableStateOf(-1) }

    // Timer coroutine
    LaunchedEffect(key1 = true) {
        while (timeLeft > 0) {
            delay(1000)
            timeLeft--
        }
        onAbort() // Timeout fallback
    }

    val minutes = timeLeft / 60
    val seconds = timeLeft % 60
    val timerString = String.format("%02d:%02d", minutes, seconds)

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BgDarker)
            .padding(16.dp)
    ) {
        // Arena Top Header
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .background(NeonCyan.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                        .border(1.dp, NeonCyan.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(text = challenge.type.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = NeonCyan)
                }
                Text(text = challenge.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }

            Box(
                modifier = Modifier
                    .background(
                        if (timeLeft < 60) NeonRose.copy(alpha = 0.1f) else NeonCyan.copy(alpha = 0.05f),
                        RoundedCornerShape(6.dp)
                    )
                    .border(
                        1.dp,
                        if (timeLeft < 60) NeonRose.copy(alpha = 0.4f) else NeonCyan.copy(alpha = 0.2f),
                        RoundedCornerShape(6.dp)
                    )
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = timerString,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = if (timeLeft < 60) NeonRose else NeonCyan
                )
            }
        }

        Divider(color = Color.White.copy(alpha = 0.08f))

        Spacer(modifier = Modifier.height(16.dp))

        // Mission briefing
        Text(
            text = "MISSION BRIEFING",
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = TextMuted,
            letterSpacing = 0.5.sp
        )
        Text(
            text = challenge.description,
            fontSize = 13.sp,
            color = TextSecondary,
            lineHeight = 18.sp,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "WORKSPACE CONSOLE",
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = TextMuted,
            letterSpacing = 0.5.sp
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Workspace layouts based on challenge type
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(BgCard)
                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                .padding(12.dp)
        ) {
            when (challenge.type) {
                "coding" -> {
                    OutlinedTextField(
                        value = codeContent,
                        onValueChange = { codeContent = it },
                        modifier = Modifier.fillMaxSize(),
                        textStyle = TextStyle(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp,
                            color = Color(0xFFE5E7EB)
                        ),
                        singleLine = false,
                        colors = TextFieldDefaults.outlinedTextFieldColors(
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent
                        )
                    )
                }

                "parsons" -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        itemsIndexed(parsonsLines) { idx, linePair ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(8.dp))
                                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = linePair.second,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 12.sp,
                                    color = Color(0xFFE5E7EB),
                                    modifier = Modifier.weight(1f)
                                )

                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    IconButton(
                                        onClick = {
                                            if (idx > 0) {
                                                val list = parsonsLines.toMutableList()
                                                val temp = list[idx]
                                                list[idx] = list[idx - 1]
                                                list[idx - 1] = temp
                                                parsonsLines = list
                                            }
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Text(text = "▲", fontSize = 10.sp, color = TextSecondary)
                                    }

                                    IconButton(
                                        onClick = {
                                            if (idx < parsonsLines.size - 1) {
                                                val list = parsonsLines.toMutableList()
                                                val temp = list[idx]
                                                list[idx] = list[idx + 1]
                                                list[idx + 1] = temp
                                                parsonsLines = list
                                            }
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Text(text = "▼", fontSize = 10.sp, color = TextSecondary)
                                    }
                                }
                            }
                        }
                    }
                }

                "bug_hunt" -> {
                    val scrollState = rememberScrollState()
                    Column(
                        modifier = Modifier.fillMaxSize().verticalScroll(scrollState),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        val codeLines = challenge.lines ?: emptyList()
                        codeLines.forEachIndexed { idx, line ->
                            val isSelected = selectedBugIndex == idx
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        if (isSelected) NeonPurple.copy(alpha = 0.12f)
                                        else Color.Transparent,
                                        RoundedCornerShape(4.dp)
                                    )
                                    .border(
                                        1.dp,
                                        if (isSelected) NeonPurple.copy(alpha = 0.4f)
                                        else Color.Transparent,
                                        RoundedCornerShape(4.dp)
                                    )
                                    .clickable { selectedBugIndex = idx }
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = String.format("%2d", idx + 1),
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = TextMuted,
                                    modifier = Modifier.width(24.dp)
                                )
                                Text(
                                    text = line,
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = Color(0xFFE5E7EB)
                                )
                            }
                        }
                    }
                }

                "multiple_choice" -> {
                    val scrollState = rememberScrollState()
                    Column(
                        modifier = Modifier.fillMaxSize().verticalScroll(scrollState),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        val codeSnippet = challenge.codeSnippet
                        if (codeSnippet != null) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(BgDarker, RoundedCornerShape(8.dp))
                                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                                    .padding(12.dp)
                            ) {
                                Text(
                                    text = codeSnippet,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 12.sp,
                                    color = Color(0xFFF3F4F6)
                                )
                            }
                        }

                        val options = challenge.options ?: emptyList()
                        options.forEachIndexed { idx, opt ->
                            val isSelected = selectedChoiceIndex == idx
                            val optionLetter = ('A' + idx).toString()
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(
                                        if (isSelected) NeonCyan.copy(alpha = 0.08f)
                                        else Color.White.copy(alpha = 0.01f),
                                        RoundedCornerShape(10.dp)
                                    )
                                    .border(
                                        1.dp,
                                        if (isSelected) NeonCyan
                                        else Color.White.copy(alpha = 0.05f),
                                        RoundedCornerShape(10.dp)
                                    )
                                    .clickable { selectedChoiceIndex = idx }
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(
                                            if (isSelected) NeonCyan else Color.White.copy(alpha = 0.05f),
                                            RoundedCornerShape(50.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = optionLetter,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) BgDarker else TextSecondary
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Text(
                                    text = opt,
                                    fontSize = 13.sp,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Abort / Submit action panel
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Button(
                onClick = onAbort,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.05f)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(text = "ABORT MISSION", color = TextPrimary, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = {
                    when (challenge.type) {
                        "coding" -> {
                            onSubmitSolution(codeContent)
                        }
                        "parsons" -> {
                            onSubmitSolution(parsonsLines.map { it.second })
                        }
                        "bug_hunt" -> {
                            if (selectedBugIndex != -1) {
                                onSubmitSolution(selectedBugIndex)
                            }
                        }
                        "multiple_choice" -> {
                            if (selectedChoiceIndex != -1) {
                                onSubmitSolution(selectedChoiceIndex)
                            }
                        }
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                shape = RoundedCornerShape(10.dp),
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
                        text = "SUBMIT VECTOR",
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
