import { NextResponse } from "next/server";

export const revalidate = 300; // Cache on edge/server for 5 minutes

const GITHUB_REPO = "AsifZaman777/datakarkhana-desktop";
const DEFAULT_VERSION = "2.1.2";

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubReleaseResponse {
  tag_name: string;
  name: string;
  assets: GitHubAsset[];
  published_at: string;
}

export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DataKarkhana-Web",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub API returned status ${res.status}`);
    }

    const data: GitHubReleaseResponse = await res.json();
    const cleanVersion = data.tag_name
      ? data.tag_name.replace(/^v/, "")
      : DEFAULT_VERSION;

    // Find Windows installer (.exe, prioritizing Setup installer)
    const winAsset =
      data.assets.find(
        (a) => a.name.endsWith(".exe") && a.name.toLowerCase().includes("setup")
      ) || data.assets.find((a) => a.name.endsWith(".exe"));

    // Find macOS installer (.dmg)
    const macAsset =
      data.assets.find((a) => a.name.endsWith(".dmg")) ||
      data.assets.find(
        (a) => a.name.endsWith(".zip") && !a.name.includes(".blockmap")
      );

    const winSizeMb = winAsset ? Math.round(winAsset.size / (1024 * 1024)) : 185;
    const macSizeMb = macAsset ? Math.round(macAsset.size / (1024 * 1024)) : 196;

    return NextResponse.json({
      success: true,
      version: cleanVersion,
      tag: data.tag_name || `v${DEFAULT_VERSION}`,
      windows: {
        url:
          winAsset?.browser_download_url ||
          `https://github.com/${GITHUB_REPO}/releases/download/v${DEFAULT_VERSION}/DataKarkhana-Desktop-Setup-${DEFAULT_VERSION}.exe`,
        filename: winAsset?.name || `DataKarkhana-Desktop-Setup-${DEFAULT_VERSION}.exe`,
        sizeMb: winSizeMb,
      },
      mac: {
        url:
          macAsset?.browser_download_url ||
          `https://github.com/${GITHUB_REPO}/releases/download/v${DEFAULT_VERSION}/DataKarkhana-Desktop-${DEFAULT_VERSION}-arm64.dmg`,
        filename: macAsset?.name || `DataKarkhana-Desktop-${DEFAULT_VERSION}-arm64.dmg`,
        sizeMb: macSizeMb,
      },
      publishedAt: data.published_at,
    });
  } catch (error) {
    console.warn("Could not fetch latest release from GitHub, using default fallback:", error);
    return NextResponse.json({
      success: false,
      version: DEFAULT_VERSION,
      tag: `v${DEFAULT_VERSION}`,
      windows: {
        url: `https://github.com/${GITHUB_REPO}/releases/download/v${DEFAULT_VERSION}/DataKarkhana-Desktop-Setup-${DEFAULT_VERSION}.exe`,
        filename: `DataKarkhana-Desktop-Setup-${DEFAULT_VERSION}.exe`,
        sizeMb: 185,
      },
      mac: {
        url: `https://github.com/${GITHUB_REPO}/releases/download/v${DEFAULT_VERSION}/DataKarkhana-Desktop-${DEFAULT_VERSION}-arm64.dmg`,
        filename: `DataKarkhana-Desktop-${DEFAULT_VERSION}-arm64.dmg`,
        sizeMb: 196,
      },
    });
  }
}
