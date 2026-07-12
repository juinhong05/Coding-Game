package com.dailycoding.challenge.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dailycoding.challenge.data.model.User
import com.dailycoding.challenge.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountScreen(
    user: User,
    onLogin: (String, String) -> Unit,
    onRegister: (String, String) -> Unit,
    onLogout: () -> Unit,
    onLinkProfile: (String) -> Unit,
    authStatus: Pair<String, String>, // Type (success/error/loading) to Message
    syncStatus: Pair<String, String>,
    modifier: Modifier = Modifier
) {
    var usernameInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var isRegisterMode by remember { mutableStateOf(false) }
    var syncInput by remember { mutableStateOf("") }
    
    val clipboardManager = LocalClipboardManager.current
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BgDarker)
            .padding(16.dp)
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "PROFILE & DATA SECURE",
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Color.White,
            modifier = Modifier.padding(vertical = 4.dp)
        )

        // Card 1: Account credentials panel
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFF2E303A).copy(alpha = 0.4f), RoundedCornerShape(14.dp)),
            colors = CardDefaults.cardColors(containerColor = BgCard)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                if (user.username != null) {
                    // Logged In Status view
                    Text(
                        text = "CONNECTED ACCOUNT",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = NeonCyan
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(10.dp))
                                .padding(12.dp)
                        ) {
                            Column {
                                Text(text = "USERNAME", fontSize = 9.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                                Text(text = user.username, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(10.dp))
                                .padding(12.dp)
                        ) {
                            Column {
                                Text(text = "CONNECTION VECTOR CODE", fontSize = 9.sp, color = TextMuted, fontWeight = FontWeight.Bold)
                                Text(text = user.syncCode, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = NeonPurple, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }

                    Button(
                        onClick = onLogout,
                        modifier = Modifier.fillMaxWidth().height(44.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.05f)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(text = "LOG OUT OF ACCOUNT", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                } else {
                    // Guest Registration / Sign In view
                    Text(
                        text = if (isRegisterMode) "CREATE CLOUD PROFILE" else "SIGN IN TO SYNAPSE",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = NeonPurple
                    )

                    Text(
                        text = if (isRegisterMode) 
                            "Secure your guest progress (Score: ${user.score}, Streak: ${user.streak}) by registering a unique cloud account."
                            else "Sign in with your credentials to sync progress onto this device.",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )

                    OutlinedTextField(
                        value = usernameInput,
                        onValueChange = { usernameInput = it },
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = TextStyle(color = Color.White, fontSize = 14.sp),
                        placeholder = { Text(text = "Enter username", color = TextMuted, fontSize = 14.sp) },
                        singleLine = true,
                        colors = TextFieldDefaults.outlinedTextFieldColors(
                            focusedBorderColor = NeonPurple,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f)
                        )
                    )

                    OutlinedTextField(
                        value = passwordInput,
                        onValueChange = { passwordInput = it },
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = TextStyle(color = Color.White, fontSize = 14.sp),
                        placeholder = { Text(text = "Enter password", color = TextMuted, fontSize = 14.sp) },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = TextFieldDefaults.outlinedTextFieldColors(
                            focusedBorderColor = NeonPurple,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f)
                        )
                    )

                    Button(
                        onClick = {
                            if (usernameInput.isNotEmpty() && passwordInput.isNotEmpty()) {
                                if (isRegisterMode) {
                                    onRegister(usernameInput, passwordInput)
                                } else {
                                    onLogin(usernameInput, passwordInput)
                                }
                            }
                        },
                        enabled = usernameInput.isNotEmpty() && passwordInput.isNotEmpty() && authStatus.first != "loading",
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = NeonPurple,
                            disabledContainerColor = NeonPurple.copy(alpha = 0.2f)
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = if (authStatus.first == "loading") "WAITING..." else (if (isRegisterMode) "REGISTER SECURE VECTOR" else "SIGN IN / SYNC"),
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    TextButton(
                        onClick = {
                            isRegisterMode = !isRegisterMode
                            usernameInput = ""
                            passwordInput = ""
                        },
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text(
                            text = if (isRegisterMode) "Already have an account? Sign In" else "Create a new account? Register Here",
                            fontSize = 12.sp,
                            color = NeonCyan,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                if (authStatus.second.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                when (authStatus.first) {
                                    "success" -> NeonEmerald.copy(alpha = 0.1f)
                                    "error" -> NeonRose.copy(alpha = 0.1f)
                                    else -> Color.White.copy(alpha = 0.02f)
                                },
                                RoundedCornerShape(8.dp)
                            )
                            .border(
                                1.dp,
                                when (authStatus.first) {
                                    "success" -> NeonEmerald.copy(alpha = 0.3f)
                                    "error" -> NeonRose.copy(alpha = 0.3f)
                                    else -> Color.White.copy(alpha = 0.1f)
                                },
                                RoundedCornerShape(8.dp)
                            )
                            .padding(10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = authStatus.second,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (authStatus.first) {
                                "success" -> NeonEmerald
                                "error" -> NeonRose
                                else -> TextSecondary
                            },
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }

        // Card 2: Link device via sync codes (legacy)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Color(0xFF2E303A).copy(alpha = 0.4f), RoundedCornerShape(14.dp)),
            colors = CardDefaults.cardColors(containerColor = BgCard)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "SYNC DEVICE GUEST CODES",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = NeonCyan
                )

                Text(
                    text = "Alternatively, input the 6-digit sync vector from another device to merge local statistics.",
                    fontSize = 12.sp,
                    color = TextSecondary
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(10.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "THIS CODE VECTOR", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        Text(
                            text = user.syncCode,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = NeonCyan,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Button(
                        onClick = { clipboardManager.setText(AnnotatedString(user.syncCode)) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.05f)),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp)
                    ) {
                        Text(text = "COPY CODE", fontSize = 10.sp, color = TextPrimary)
                    }
                }

                OutlinedTextField(
                    value = syncInput,
                    onValueChange = { if (it.length <= 6) syncInput = it.uppercase() },
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = TextStyle(
                        fontFamily = FontFamily.Monospace,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    ),
                    placeholder = {
                        Text(
                            text = "ENTER 6-DIGIT CODE",
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.Center,
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                    },
                    singleLine = true,
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedBorderColor = NeonCyan,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f)
                    )
                )

                Button(
                    onClick = { if (syncInput.length == 6) onLinkProfile(syncInput) },
                    enabled = syncInput.length == 6 && syncStatus.first != "loading",
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = NeonCyan,
                        disabledContainerColor = NeonCyan.copy(alpha = 0.2f)
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = if (syncStatus.first == "loading") "LINKING..." else "LINK DEVICE VECTOR",
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                }

                if (syncStatus.second.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                when (syncStatus.first) {
                                    "success" -> NeonEmerald.copy(alpha = 0.1f)
                                    "error" -> NeonRose.copy(alpha = 0.1f)
                                    else -> Color.White.copy(alpha = 0.02f)
                                },
                                RoundedCornerShape(8.dp)
                            )
                            .border(
                                1.dp,
                                when (syncStatus.first) {
                                    "success" -> NeonEmerald.copy(alpha = 0.3f)
                                    "error" -> NeonRose.copy(alpha = 0.3f)
                                    else -> Color.White.copy(alpha = 0.1f)
                                },
                                RoundedCornerShape(8.dp)
                            )
                            .padding(10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = syncStatus.second,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (syncStatus.first) {
                                "success" -> NeonEmerald
                                "error" -> NeonRose
                                else -> TextSecondary
                            },
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}
