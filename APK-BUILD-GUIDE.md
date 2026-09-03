# 📱 Expo অ্যাপ থেকে লোকালি APK বিল্ড গাইড (Windows)
### — সম্পূর্ণ বাংলা গাইড, একবার পড়লেই বুঝবে —

---

## 🧠 এটা কী এবং কেন করবো?

Expo দিয়ে বানানো React Native অ্যাপকে Android ফোনে ইন্সটল করতে হলে `.apk` ফাইল দরকার।  
দুটো উপায় আছে:

| পদ্ধতি | কোথায় বিল্ড হয় | সময় | সমস্যা |
|---|---|---|---|
| **EAS Cloud Build** | Expo-র সার্ভারে | ১৫-৬০ মিনিট (queue) | ফ্রি tier-এ লাইনে অপেক্ষা |
| **Local Build** ✅ | তোমার নিজের PC-তে | ১৫-২০ মিনিট (১ম বার) | Windows-এ কিছু সেটআপ লাগে |

**আমরা Local Build করবো** — কারণ এটা দ্রুত, কোনো কিউ নেই, এবং ইন্টারনেট কানেকশন কম লাগে।

---

## 🛠️ একবার করার সেটআপ (Prerequisite)

এই কাজগুলো শুধু **প্রথমবার** করতে হবে। পরে আর লাগবে না।

---

### ধাপ ১ — JDK 17 ইন্সটল করো

**কেন লাগবে?** Android অ্যাপ বিল্ড করতে Java লাগে। Gradle (Android-এর বিল্ড সিস্টেম) Java 17 সবচেয়ে ভালো সাপোর্ট করে।

> ⚠️ **গুরুত্বপূর্ণ:** Java 21+ বা Java 25 ইন্সটল থাকলেও হবে না। Gradle-এর সাথে `Unsupported class file major version` এরর আসবে। **শুধু JDK 17 ব্যবহার করো।**

**ডাউনলোড লিংক:**  
👉 https://adoptium.net/temurin/releases/?version=17&os=windows&arch=x64&package=jdk

- `.msi` ফাইলটি ডাউনলোড করো
- ইন্সটলের সময় এই দুটো চেকবক্স অবশ্যই টিক দাও:
  - ✅ `Set JAVA_HOME variable`
  - ✅ `Add to PATH`

---

### ধাপ ২ — Android Studio ইন্সটল করো

**কেন লাগবে?** Android SDK, NDK, এবং Build Tools এর জন্য। Gradle এগুলো ব্যবহার করে অ্যাপ কম্পাইল করে।

**ডাউনলোড লিংক:**  
👉 https://developer.android.com/studio

ইন্সটলের পর Android Studio একবার ওপেন করো এবং SDK ডাউনলোড করতে দাও।

---

### ধাপ ৩ — NDK ইন্সটল করো (Android Studio থেকে)

**কেন লাগবে?** React Native অ্যাপে C/C++ কোড (native modules) থাকে। NDK ছাড়া সেগুলো কম্পাইল হয় না।

1. Android Studio ওপেন করো
2. উপরে `Tools` → `SDK Manager`
3. `SDK Tools` ট্যাবে যাও
4. `NDK (Side by side)` এর পাশে ✅ টিক দাও
5. `Apply` → `OK`

---

### ধাপ ৪ — Environment Variables সেটআপ করো

**কেন লাগবে?** PowerShell বা টার্মিনাল `java` এবং `android` কমান্ড খুঁজে পায় না যদি পাথ সেট না থাকে।

**PowerShell-এ একবার এই কমান্ডটি রান করো (স্থায়ীভাবে সেট হয়ে যাবে):**

```powershell
# PowerShell Profile-এ স্থায়ীভাবে সেট করো
$addContent = @'

# Java and Android SDK (Permanent Setup)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools;$env:PATH"
'@
if (!(Test-Path $PROFILE)) { New-Item -Path $PROFILE -ItemType File -Force | Out-Null }
Add-Content -Path $PROFILE -Value $addContent
Write-Host "Done! Restart PowerShell to apply."
```

> **এরপর PowerShell বন্ধ করে নতুন করে খোলো।**

**যাচাই করো:**
```powershell
java -version     # "openjdk version 17.x.x" দেখালে সফল
echo $env:ANDROID_HOME  # SDK পাথ দেখালে সফল
```

---

## 🚀 APK বিল্ড করার প্রক্রিয়া

সেটআপ একবার হয়ে গেলে, **প্রতিবার APK বানাতে** শুধু এই ধাপগুলো অনুসরণ করো।

---

### ধাপ ১ — Android Native ফোল্ডার তৈরি করো

```powershell
cd "C:\Users\Khaled\Khaled Dask\app\joeysass25-app"
npx expo prebuild -p android --clean
```

**কী হয়:** এই কমান্ড তোমার Expo প্রজেক্টের ভেতরে `android/` নামে একটি ফোল্ডার তৈরি করে।  
এই ফোল্ডারে থাকে Android-এর সব native কোড, কনফিগারেশন, এবং Gradle ফাইল।

> ⏱️ সময়: ১-২ মিনিট  
> `--clean` দিলে আগের `android/` ফোল্ডার মুছে নতুন করে তৈরি করে।

---

### ধাপ ২ — APK বিল্ড করো

```powershell
cd android
.\gradlew assembleRelease
```

**কী হয়:** Gradle তোমার সব কোড কম্পাইল করে একটি `.apk` ফাইল তৈরি করে।

> ⏱️ প্রথমবার: ১৫-২০ মিনিট (অনেক কিছু ডাউনলোড করে)  
> ⏱️ পরের বার: ৩-৫ মিনিট (ক্যাশ থেকে বিল্ড হয়)

---

### ধাপ ৩ — APK খুঁজে নাও

বিল্ড শেষে `BUILD SUCCESSFUL` দেখালে APK পাবে এখানে:

```
android\app\build\outputs\apk\release\app-release.apk
```

File Explorer-এ সরাসরি যেতে এটি পেস্ট করো:
```
C:\Users\Khaled\Khaled Dask\app\joeysass25-app\android\app\build\outputs\apk\release
```

---

## 📱 ফোনে ইন্সটল করার উপায়

### পদ্ধতি ১ — USB Cable (সবচেয়ে দ্রুত)
1. USB দিয়ে ফোন PC-তে কানেক্ট করো
2. `app-release.apk` ফাইলটি ফোনে কপি করো
3. ফোনে File Manager দিয়ে ফাইলটি খুঁজে ট্যাপ করো
4. Install করো

### পদ্ধতি ২ — Google Drive / WhatsApp
1. `app-release.apk` ফাইলটি নিজের Google Drive বা WhatsApp-এ পাঠাও
2. ফোনে ডাউনলোড করো
3. Install করো

> ⚠️ **প্রথমবার ইন্সটল করার সময়:** ফোন "Unknown Sources থেকে ইন্সটলের অনুমতি" চাইবে।  
> Settings → Install Unknown Apps → Allow করতে হবে।

---

## 🔄 পরের বার কোড পরিবর্তনের পর কী করবো?

কোডে পরিবর্তন করার পর নতুন APK বানাতে শুধু এই দুটো কমান্ড দিলেই হবে:

```powershell
cd "C:\Users\Khaled\Khaled Dask\app\joeysass25-app\android"
.\gradlew assembleRelease
```

> `prebuild` আর করতে হবে না — শুধু নতুন native module যোগ করলে আবার করতে হবে।

---

## ❓ সাধারণ এরর এবং সমাধান

| এরর | কারণ | সমাধান |
|---|---|---|
| `JAVA_HOME is not set` | Java PATH সেট নেই | PowerShell Profile সেটআপ করো (ধাপ ৪) |
| `Unsupported class file major version 69` | Java 25 ব্যবহার করছো | JDK 17 ইন্সটল করো |
| `Failed to install NDK` | NDK ইন্সটল নেই | Android Studio → SDK Tools → NDK ইন্সটল করো |
| `command not found: ./gradlew` | Git Bash ব্যবহার করছো | PowerShell ব্যবহার করো |
| `BUILD FAILED` | বিভিন্ন কারণ | এরর মেসেজের শেষ অংশটি দেখো |

---

## 📁 ফাইল স্ট্রাকচার (বোঝার জন্য)

```
joeysass25-app/
├── android/                    ← prebuild-এ তৈরি হয়
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/
│   │               └── release/
│   │                   └── app-release.apk  ← তোমার APK!
│   └── gradlew                 ← বিল্ড কমান্ড
├── app/                        ← তোমার React Native কোড
├── components/
└── package.json
```

---

## ✅ Quick Reference (সংক্ষিপ্ত চিট শিট)

```powershell
# ১ম বার সেটআপ (শুধু একবার)
# JDK 17 ইন্সটল করো → NDK ইন্সটল করো → Environment Variables সেট করো

# প্রতিবার নতুন APK বানাতে
cd "C:\Users\Khaled\Khaled Dask\app\joeysass25-app"
npx expo prebuild -p android --clean   # শুধু প্রথমবার বা নতুন package যোগ করলে
cd android
.\gradlew assembleRelease              # এটাই মূল বিল্ড কমান্ড

# APK পাবে এখানে
# android\app\build\outputs\apk\release\app-release.apk
```

---

*তৈরি: ৫ আগস্ট ২০২৬ | প্রজেক্ট: joeysass25-app*
