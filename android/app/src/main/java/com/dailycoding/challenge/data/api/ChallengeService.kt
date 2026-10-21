package com.dailycoding.challenge.data.api

import android.content.Context
import com.dailycoding.challenge.data.model.*
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

interface ChallengeService {
    @GET("challenges/daily")
    suspend fun getDailyChallenge(
        @Query("userId") userId: String? = null,
        @Query("date") date: String? = null
    ): Challenge

    @POST("challenges/verify")
    suspend fun verifySolution(@Body request: VerifyRequest): VerifyResponse

    @POST("user/register")
    suspend fun registerUser(): User

    @POST("user/register-account")
    suspend fun registerAccount(@Body request: RegisterAccountRequest): User

    @POST("user/login")
    suspend fun loginUser(@Body request: LoginRequest): User

    @GET("user/{id}")
    suspend fun getUser(@Path("id") userId: String): User

    @POST("user/{id}/progress")
    suspend fun updateProgress(@Path("id") userId: String, @Body progress: ProgressUpdateRequest): User

    @POST("user/{id}/sync/link")
    suspend fun linkProfile(@Path("id") userId: String, @Body request: LinkRequest): User

    @POST("user/{id}/language")
    suspend fun updateLanguage(@Path("id") userId: String, @Body request: LanguageRequest): User

    @GET("leaderboard")
    suspend fun getLeaderboard(): List<LeaderboardItem>

    @GET("minigames")
    suspend fun getMiniGames(
        @Query("userId") userId: String,
        @Query("language") language: String
    ): MiniGamesResponse

    @POST("minigames/verify")
    suspend fun verifyMiniGame(@Body request: MiniGameVerifyRequest): MiniGameVerifyResponse
}

object RetrofitInstance {
    private const val BASE_URL = "https://coding-game-backend-8g31.onrender.com/api/"

    @Volatile private var sessionToken: String? = null

    fun initialize(context: Context) {
        sessionToken = context.getSharedPreferences("synapse_session", Context.MODE_PRIVATE).getString("token", null)
    }

    fun hasSession(): Boolean = !sessionToken.isNullOrBlank()

    fun saveSession(context: Context, user: User) {
        val token = user.token ?: throw IllegalStateException("The server did not create a secure session")
        sessionToken = token
        context.getSharedPreferences("synapse_session", Context.MODE_PRIVATE).edit().putString("token", token).apply()
    }

    fun clearSession(context: Context) {
        sessionToken = null
        context.getSharedPreferences("synapse_session", Context.MODE_PRIVATE).edit().remove("token").apply()
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val token = sessionToken
            val request = chain.request().newBuilder().apply {
                if (!token.isNullOrBlank()) header("Authorization", "Bearer $token")
            }.build()
            chain.proceed(request)
        }
        .build()

    val api: ChallengeService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(client)
            .build()
            .create(ChallengeService::class.java)
    }
}
