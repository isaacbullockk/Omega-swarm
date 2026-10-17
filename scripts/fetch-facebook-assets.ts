/**
 * FETCH FACEBOOK ASSETS — KYAKUWA CONTENT LIBRARY
 *
 * Doel: haal alle echte foto's, video's en posts op van Kyakuwa's
 * Facebook Page, zodat Omega ze kan hergebruiken in plaats van
 * generieke AI-beelden te genereren.
 *
 * Gebruik:
 *   npx tsx scripts/fetch-facebook-assets.ts
 *
 * Wat het doet:
 *   1. Lijst alle Facebook Pages van de gebruiker op
 *   2. Vindt Kyakuwa's page
 *   3. Haalt albums + foto's op
 *   4. Haalt video's op
 *   5. Haalt gepubliceerde posts op (met captions)
 *   6. Downloadt alle media naar /tmp/fb-assets/
 *   7. Genereert een JSON-catalogus voor de Autopilot
 *
 * Vereisten:
 *   - INSTAGRAM_ACCESS_TOKEN (Facebook token met pages_read_engagement scope)
 *   - META_APP_ID + META_APP_SECRET (voor debug_token & lange-termijn tokens)
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { finished } from "stream/promises";

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v20.0";
const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const OUTPUT_DIR = "/tmp/fb-assets";
const FETCH_TIMEOUT_MS = 30_000;

interface FbPhoto {
  id: string;
  url: string;
  caption?: string;
  created_time: string;
  album?: string;
}

interface FbVideo {
  id: string;
  source: string;
  title?: string;
  description?: string;
  created_time: string;
}

interface FbPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  attachments?: { data: Array<{ type: string; url?: string; media?: { image?: { src: string } } }> };
}

interface ContentLibrary {
  pageName: string;
  pageId: string;
  fetchedAt: string;
  photos: FbPhoto[];
  videos: FbVideo[];
  posts: FbPost[];
  stats: { photos: number; videos: number; posts: number };
}

async function fetchJson(url: string, opts?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadFile(url: string, destPath: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok || !res.body) return false;
    const fileStream = createWriteStream(destPath);
    await finished(Readable.fromWeb(res.body as any).pipe(fileStream));
    return true;
  } catch {
    return false;
  }
}

async function getPageAccessToken(userToken: string, pageId: string): Promise<string | null> {
  const url = `${META_GRAPH}/me/accounts?access_token=${encodeURIComponent(userToken)}`;
  const res = await fetchJson(url);
  if (!res.ok || !res.data?.data) return null;

  const page = res.data.data.find((p: any) => p.id === pageId);
  return page?.access_token || null;
}

async function fetchAllPhotos(pageToken: string, pageId: string): Promise<FbPhoto[]> {
  const photos: FbPhoto[] = [];
  let url: string | null = `${META_GRAPH}/${pageId}/photos?fields=id,images,created_time,name,album&limit=100&access_token=${encodeURIComponent(pageToken)}`;

  while (url) {
    const res = await fetchJson(url);
    if (!res.ok || !res.data?.data) break;

    for (const photo of res.data.data) {
      const img = photo.images?.[0]; // highest resolution
      if (img?.source) {
        photos.push({
          id: photo.id,
          url: img.source,
          caption: photo.name || undefined,
          created_time: photo.created_time,
          album: photo.album?.name || undefined,
        });
      }
    }

    url = res.data.paging?.next || null;
  }

  return photos;
}

async function fetchAllVideos(pageToken: string, pageId: string): Promise<FbVideo[]> {
  const videos: FbVideo[] = [];
  let url: string | null = `${META_GRAPH}/${pageId}/videos?fields=id,source,created_time,title,description&limit=50&access_token=${encodeURIComponent(pageToken)}`;

  while (url) {
    const res = await fetchJson(url);
    if (!res.ok || !res.data?.data) break;

    for (const vid of res.data.data) {
      if (vid.source) {
        videos.push({
          id: vid.id,
          source: vid.source,
          title: vid.title || undefined,
          description: vid.description || undefined,
          created_time: vid.created_time,
        });
      }
    }

    url = res.data.paging?.next || null;
  }

  return videos;
}

async function fetchAllPosts(pageToken: string, pageId: string): Promise<FbPost[]> {
  const posts: FbPost[] = [];
  let url: string | null = `${META_GRAPH}/${pageId}/posts?fields=id,message,created_time,permalink_url,attachments&limit=100&access_token=${encodeURIComponent(pageToken)}`;

  while (url) {
    const res = await fetchJson(url);
    if (!res.ok || !res.data?.data) break;

    for (const post of res.data.data) {
      if (post.message) {
        posts.push({
          id: post.id,
          message: post.message,
          created_time: post.created_time,
          permalink_url: post.permalink_url,
          attachments: post.attachments,
        });
      }
    }

    url = res.data.paging?.next || null;
  }

  return posts;
}

async function main() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const envAccountId = process.env.INSTAGRAM_ACCOUNT_ID;

  console.log("\n=== FETCH FACEBOOK ASSETS — KYAKUWA CONTENT LIBRARY ===\n");

  if (!token) {
    console.error("❌ FAIL: INSTAGRAM_ACCESS_TOKEN ontbreekt");
    process.exit(1);
  }

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  // Stap 1: Vind Facebook Pages
  console.log("Stap 1: Facebook Pages ophalen...");
  const pagesRes = await fetchJson(`${META_GRAPH}/me/accounts?fields=name,id,instagram_business_account&access_token=${encodeURIComponent(token)}`);

  if (!pagesRes.ok || pagesRes.data.error) {
    console.error("❌ FAIL:", pagesRes.data.error?.message || pagesRes.data);
    process.exit(1);
  }

  const pages = pagesRes.data.data || [];
  if (pages.length === 0) {
    console.error("❌ FAIL: Geen Facebook Pages gevonden");
    process.exit(1);
  }

  console.log(`   ${pages.length} page(s) gevonden:`);
  for (const p of pages) {
    const ig = p.instagram_business_account;
    console.log(`   • ${p.name} (ID: ${p.id})${ig ? ` [IG: ${ig.id}]` : ""}`);
  }

  // Vind de page die gekoppeld is aan het IG account in env
  let targetPage = pages.find((p: any) => p.instagram_business_account?.id === envAccountId);
  if (!targetPage) {
    // Fallback: vraag gebruiker welke page
    console.log("\n⚠️  Kon niet automatisch de juiste page koppelen.");
    console.log("   Gebruik de eerste page of pas het script aan.");
    targetPage = pages[0];
  }

  console.log(`\n   ✅ Geselecteerd: ${targetPage.name} (${targetPage.id})`);

  // Stap 2: Haal page access token op (nodig voor albums/photos)
  console.log("\nStap 2: Page access token ophalen...");
  const pageToken = await getPageAccessToken(token, targetPage.id);
  if (!pageToken) {
    console.error("❌ FAIL: Kan geen page access token krijgen");
    console.error("   Zorg dat de token 'pages_read_engagement' scope heeft");
    process.exit(1);
  }
  console.log("   ✅ Page token verkregen");

  // Stap 3: Foto's
  console.log("\nStap 3: Foto's ophalen...");
  const photos = await fetchAllPhotos(pageToken, targetPage.id);
  console.log(`   ${photos.length} foto's gevonden`);

  const photoDir = `${OUTPUT_DIR}/photos`;
  if (!existsSync(photoDir)) mkdirSync(photoDir, { recursive: true });

  let downloadedPhotos = 0;
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const ext = photo.url.split("?")[0].split(".").pop() || "jpg";
    const cleanExt = ext.match(/^(jpg|jpeg|png|gif|webp)$/i) ? ext : "jpg";
    const dest = `${photoDir}/${photo.id}.${cleanExt}`;
    const ok = await downloadFile(photo.url, dest);
    if (ok) downloadedPhotos++;
    if ((i + 1) % 10 === 0) process.stdout.write(`\r   Downloaded: ${downloadedPhotos}/${i + 1}`);
  }
  console.log(`\r   ✅ ${downloadedPhotos}/${photos.length} foto's gedownload naar ${photoDir}`);

  // Stap 4: Video's
  console.log("\nStap 4: Video's ophalen...");
  const videos = await fetchAllVideos(pageToken, targetPage.id);
  console.log(`   ${videos.length} video's gevonden`);

  const videoDir = `${OUTPUT_DIR}/videos`;
  if (!existsSync(videoDir)) mkdirSync(videoDir, { recursive: true });

  let downloadedVideos = 0;
  for (let i = 0; i < videos.length; i++) {
    const vid = videos[i];
    const dest = `${videoDir}/${vid.id}.mp4`;
    const ok = await downloadFile(vid.source, dest);
    if (ok) downloadedVideos++;
    if ((i + 1) % 5 === 0) process.stdout.write(`\r   Downloaded: ${downloadedVideos}/${i + 1}`);
  }
  console.log(`\r   ✅ ${downloadedVideos}/${videos.length} video's gedownload naar ${videoDir}`);

  // Stap 5: Posts (tekst)
  console.log("\nStap 5: Gepubliceerde posts ophalen...");
  const posts = await fetchAllPosts(pageToken, targetPage.id);
  console.log(`   ${posts.length} posts met tekst gevonden`);

  // Stap 6: Genereer catalogus
  console.log("\nStap 6: Content catalogus genereren...");
  const library: ContentLibrary = {
    pageName: targetPage.name,
    pageId: targetPage.id,
    fetchedAt: new Date().toISOString(),
    photos,
    videos,
    posts,
    stats: { photos: photos.length, videos: videos.length, posts: posts.length },
  };

  const catalogPath = `${OUTPUT_DIR}/catalog.json`;
  writeFileSync(catalogPath, JSON.stringify(library, null, 2));

  // Genereer ook een "mission-ready" import bestand
  const missionPosts = photos.slice(0, 15).map((photo, i) => ({
    id: `fb-photo-${i + 1}`,
    date: new Date(Date.now() + i * 2 * 24 * 60 * 60 * 1000).toISOString(),
    platform: "instagram" as const,
    imagePath: `photos/${photo.id}.jpg`,
    originalCaption: photo.caption || "",
    suggestedCaption: photo.caption
      ? `Rework this original post for a fresh audience:\n\nOriginal: "${photo.caption}"\n\nRewrite with Isaac's voice: hook first, short paragraphs, no em-dashes, humble authority, end with a clear ask.`
      : "Write a caption about this moment using Isaac's voice.",
    topic: photo.album || "From the archive",
  }));

  const missionPath = `${OUTPUT_DIR}/mission-import.json`;
  writeFileSync(missionPath, JSON.stringify(missionPosts, null, 2));

  // Summary
  console.log("\n🎉 KLAAR! Content library opgebouwd.\n");
  console.log(`   📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`   📸 Foto's: ${downloadedPhotos}/${photos.length}`);
  console.log(`   🎥 Video's: ${downloadedVideos}/${videos.length}`);
  console.log(`   📝 Posts: ${posts.length}`);
  console.log(`   📊 Catalog: ${catalogPath}`);
  console.log(`   📋 Mission import: ${missionPath}\n`);

  console.log("Gebruik in de Autopilot:");
  console.log("   - Photos: gebruik als echte afbeeldingen in plaats van AI-generated");
  console.log("   - Posts: herschrijf bestaande captions met Isaac's voice rules");
  console.log("   - Videos: herpost of maak Reels van bestaande content\n");
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
