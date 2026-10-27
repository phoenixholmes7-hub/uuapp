#!/usr/bin/env bash
# Usage: smoke.sh <apk> <out-dir>
# Launches the app, waits, and records whether it is still running.
set -u
APK="$1"; OUT="$2"; PKG=com.phoenixholmes.unionhub
mkdir -p "$OUT"
adb install -r "$APK"
adb logcat -c
adb shell am start -W -n "$PKG/.MainActivity"
sleep 30
if adb shell pidof "$PKG" >/dev/null; then echo alive > "$OUT/status.txt"; else echo crashed > "$OUT/status.txt"; fi
adb exec-out screencap -p > "$OUT/screen.png"
adb logcat -d -b crash > "$OUT/crash.txt"
adb logcat -d -v time > "$OUT/logcat-full.txt"
grep -E "AndroidRuntime|ReactNativeJS|ReactNative|FATAL|Exception|unionhub|chromium|WebView" "$OUT/logcat-full.txt" | tail -400 > "$OUT/logcat.txt"
cat "$OUT/status.txt"
exit 0
