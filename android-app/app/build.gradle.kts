plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

fun String.escapeForBuildConfig(): String =
    replace("\\", "\\\\").replace("\"", "\\\"")

val webAppUrl = (project.findProperty("WEB_APP_URL") as String?)?.trim().orEmpty()

android {
    namespace = "com.forgefit.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.forgefit.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Set WEB_APP_URL in gradle.properties to load a hosted app (Replit/GitHub Pages).
        // Keep WEB_APP_URL empty to load bundled index.html from android assets.
        buildConfigField("String", "WEB_APP_URL", "\"${webAppUrl.escapeForBuildConfig()}\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

val syncWebAssets by tasks.registering(Copy::class) {
    from("../../index.html")
    into("src/main/assets/www")
}

tasks.named("preBuild") {
    dependsOn(syncWebAssets)
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
}
