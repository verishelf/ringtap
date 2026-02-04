import { NextResponse } from "next/server";

/**
 * Digital Asset Links for Android App Links.
 * Served at /.well-known/assetlinks.json via rewrite in next.config.
 * Replace SHA256_FINGERPRINT with your app's release keystore SHA-256 (colon-separated).
 * Get it: Play Console → Your app → Setup → App signing → App signing key certificate → SHA-256,
 * or: keytool -list -v -keystore your-release-key.keystore
 */
const PACKAGE_NAME = "me.ringtap.app";
const SHA256_FINGERPRINTS = (process.env.ANDROID_SHA256_FINGERPRINTS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const assetlinks =
  SHA256_FINGERPRINTS.length > 0
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: PACKAGE_NAME,
            sha256_cert_fingerprints: SHA256_FINGERPRINTS,
          },
        },
      ]
    : [];

export async function GET() {
  return new NextResponse(JSON.stringify(assetlinks), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
