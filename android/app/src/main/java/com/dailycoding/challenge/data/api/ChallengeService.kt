package com.dailycoding.challenge.data.api

import com.dailycoding.challenge.data.model.*
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
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
}

object RetrofitInstance {
    private const val BASE_URL = "http://10.0.2.2:5000/api/"

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
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
