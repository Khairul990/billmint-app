# BillQyro Android APK Build Guide

> [!WARNING]
> **APK Build is currently PAUSED/DISABLED.** 
> The GitHub Actions workflow for building the Android APK has been disabled as of now. The existing Vercel web app and PWA remain fully functional. This guide is retained for future reference if APK building is re-enabled.

This guide will explain how to generate and download the native Android APK for BillQyro using GitHub Actions, without needing to install Android Studio on your PC!

## 1. Pushing Changes to GitHub
Whenever you make updates to the web app, simply push your code to your GitHub repository (main/master branch). The GitHub Action is configured to automatically trigger a new Android build whenever you push code.

If using git:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

## 2. Opening GitHub Actions
1. Open your web browser and go to your BillQyro GitHub repository.
2. Click on the **"Actions"** tab near the top of the repository page.

## 3. Running the APK Build
- The build should start automatically if you just pushed code.
- To **manually trigger** a build without pushing new code:
  1. Click on **"Build Android APK"** on the left sidebar.
  2. Click the **"Run workflow"** dropdown button on the right side.
  3. Click the green **"Run workflow"** button.

## 4. Downloading the APK Artifact
1. Wait for the workflow run to finish (it will show a green checkmark).
2. Click on the completed workflow run.
3. Scroll down to the bottom of the page to the **Artifacts** section.
4. Click on **"BillQyro-Android-APK"** to download the ZIP file.
5. Extract the ZIP file on your PC or phone to find your `app-debug.apk`.

## 5. Installing the APK on your Android Phone
1. Transfer the `app-debug.apk` file to your Android phone (e.g., via USB, WhatsApp, or Google Drive).
2. Open your File Manager app and tap on the APK file.
3. If prompted, grant permission to "Install unknown apps" from your File Manager or browser.
4. Click **Install**. You will now have the native BillQyro app with the correct icon and splash screen installed!

## Future Steps (Play Store AAB)
Right now, this Action generates a **Debug APK**, which is perfect for direct sharing. When you are ready to upload to the Google Play Store, you will need a signed **Android App Bundle (.aab)**.
To do this in the future:
1. Generate a keystore file.
2. Add the keystore file and passwords as GitHub Repository Secrets.
3. Update the `.github/workflows/build-android-apk.yml` file to run `./gradlew bundleRelease` and sign the output using your secrets.
