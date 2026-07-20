plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "in.reimburser.capture"
    compileSdk = 35

    defaultConfig {
        applicationId = "in.reimburser.capture"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.0-dev"
    }

    buildTypes {
        release { isMinifyEnabled = false }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    // Trusted Web Activity — shows the real site full-screen, no browser bar.
    // Pin androidx.browser to a stable build compatible with AGP 8.5 / SDK 35.
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
    implementation("androidx.browser:browser:1.8.0")
}
