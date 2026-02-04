import { NextResponse } from "next/server";

/**
 * Apple App Site Association (AASA) for iOS Universal Links.
 * Served at /.well-known/apple-app-site-association via rewrite in next.config.
 * Replace APPLE_TEAM_ID with your Apple Developer Team ID (e.g. from App Store Connect or EAS build output).
 */
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || "Q834NS68MG";
const BUNDLE_ID = "me.ringtap.app";

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: `${APPLE_TEAM_ID}.${BUNDLE_ID}`,
        paths: [
          "/activate",
          "/activate?*",
          "/activate/*",
          "/profile",
          "/profile/*",
        ],
      },
    ],
  },
  webcredentials: {
    apps: [`${APPLE_TEAM_ID}.${BUNDLE_ID}`],
  },
};

export async function GET() {
  return new NextResponse(JSON.stringify(aasa), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
