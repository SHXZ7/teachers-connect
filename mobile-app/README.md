## Teachers Connect - Flutter Mobile Starter

This repository contains a minimal Flutter starter implementing a Drawer navigation and placeholder screens based on the Teachers Connect website. It's scaffolded to let you run the app quickly on an Android phone via USB (Windows).

What I added
- `pubspec.yaml` - basic dependencies
- `lib/main.dart` - Flutter app with Drawer sidebar and screens

Prerequisites (Windows)
1. Install Flutter SDK: https://docs.flutter.dev/get-started/install/windows
2. Install Android Studio and the Android SDK with a platform (e.g., Android 13) and the Android SDK Platform Tools.
3. Add Flutter to PATH and run `flutter doctor` to confirm setup.
4. Enable Developer Options and USB Debugging on your Android phone.

Steps to open in Android Studio
1. Open Android Studio -> Open an existing project -> select the folder `teacher_connect_new`.
2. Let Android Studio index and download dependencies.
3. In Android Studio's terminal (or Windows PowerShell), run:

```
flutter pub get
flutter devices
```

You should see your connected device listed.

Run app on a connected Android device (USB)
1. Connect your phone via USB and accept the prompt on the phone (Allow USB debugging).
2. Run from Android Studio by selecting the device in the run configuration and clicking Run.

Or from PowerShell:

```
flutter pub get
flutter devices
flutter run -d <device-id>
```

If you only have one device connected you can just run:

```
flutter run
```

Notes and next steps
- I scaffolded the Drawer navigation and a Dashboard UI placeholder that matches the website's structure (cards, counts, discover section).
- Next I'll implement the Resources screen (tabs for Browse/Upload/My Resources) and polish UI to match the screenshot.

If you'd like, I can now: implement the Resources screen, wire up local state, add sample resource data, or create a small backend mock. Tell me which next step you want.

Build an APK (quick)
1. Make sure Android SDK and build tools are installed.
2. From PowerShell run:

```
flutter build apk --target-platform android-arm,android-arm64,android-x64 --split-per-abi
```

This creates APKs in `build/app/outputs/flutter-apk/`.

For a simple debug APK (no signing needed) you can run:

```
flutter build apk --debug
```

Sharing with judges
- If you need a single universal release APK, use `--release` (you'll need to configure app signing for Play-style release, or share the debug APK for quick testing).
- I can help produce a signed release or prepare an installer and short demo script for the judges.


ADB / USB troubleshooting
- Make sure Android SDK Platform Tools are installed and `adb` is on your PATH. On Windows, `adb` is usually at `%ANDROID_SDK_ROOT%\platform-tools\adb.exe`.
- To check device connectivity from PowerShell run:

```
adb devices
```

You should see your device id with the word "device". If it shows "unauthorized", accept the USB debugging prompt on your phone.

If `adb` isn't found, either add the platform-tools path to PATH or run it with the full path. Also try switching USB modes (File Transfer) on the phone.

