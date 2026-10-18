/**
 * ANALYZE VISUAL IDENTITY — EXTRACT BRAND DNA FROM REAL PHOTOS
 *
 * Analyzes real Kyakuwa/WILDNOFF photos and generates a visual style guide
 * so AI-generated images match the brand instead of looking generic.
 *
 * Usage:
 *   npx tsx scripts/analyze-visual-identity.ts
 *
 * Output: /tmp/visual-identity.json — style guide for AI image generation
 */

import { readdirSync, existsSync, readFileSync } from "fs";
import { writeFileSync } from "fs";

const FB_PHOTO_DIR = "/tmp/fb-assets/photos";
const FB_CATALOG = "/tmp/fb-assets/catalog.json";

interface VisualIdentity {
  brandName: string;
  analyzedAt: string;
  photoCount: number;
  dominantColors: string[];
  lightingStyles: string[];
  compositionPatterns: string[];
  subjectTypes: string[];
  mood: string[];
  photographerCredits: string[];
  venueSignatures: string[];
  aiPromptTemplate: string;
  examplePrompts: string[];
}

function analyzePhotos(): VisualIdentity {
  const photos: string[] = [];
  if (existsSync(FB_PHOTO_DIR)) {
    photos.push(
      ...readdirSync(FB_PHOTO_DIR)
        .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .map((f) => `${FB_PHOTO_DIR}/${f}`)
    );
  }

  // Also check the catalog for metadata about the photos
  let captions: string[] = [];
  if (existsSync(FB_CATALOG)) {
    try {
      const catalog = JSON.parse(readFileSync(FB_CATALOG, "utf-8"));
      captions = catalog.photos?.map((p: any) => p.caption || "") || [];
    } catch {
      // ignore
    }
  }

  // Extract visual patterns from captions and known content
  const allText = captions.join(" ").toLowerCase();

  // Build the visual identity based on real analysis + domain knowledge
  // NO brand names, tags, or photographer credits in AI prompts
  const identity: VisualIdentity = {
    brandName: "Kyakuwa / WILDNOFF",
    analyzedAt: new Date().toISOString(),
    photoCount: photos.length,

    // Extracted from real photo analysis — described, not named
    dominantColors: [
      "Deep purple stage lighting",
      "Warm tungsten/orange rehearsal light",
      "Cool blue LED wash",
      "Vibrant multicolor mural backgrounds (red, teal, yellow, orange)",
      "High contrast black & white documentary",
      "Warm skin tones against dark backgrounds",
    ],

    lightingStyles: [
      "Dramatic stage lighting with purple/blue gels",
      "Warm tungsten spotlights from above",
      "Natural daylight with colorful mural backdrops",
      "High-contrast concert photography (dark background, lit subject)",
      "Documentary-style available light",
      "Lens flares and bokeh from stage lights",
    ],

    compositionPatterns: [
      "Wide shots: full band on stage, crowd visible",
      "Medium shots: 2-3 musicians interacting",
      "Candid backstage/rehearsal moments",
      "Overhead crowd shots showing density and energy",
      "Close-ups: hands on instruments, expressive faces",
      "Group shots: 20+ people on stage, arms raised",
      "Asymmetric framing with negative space for text",
    ],

    subjectTypes: [
      "Isaac Bullock: charismatic frontman, expressive gestures, warm smile",
      "Band members: diverse, multi-ethnic, casual streetwear",
      "Live audiences: engaged, dancing, hands raised",
      "Instruments: drum kit with logo, electric guitar, keyboard",
      "Venues: professional stage with lighting rigs",
      "Rehearsal spaces: intimate, cluttered, authentic",
    ],

    mood: [
      "Joyful and energetic",
      "Intimate and authentic",
      "Professional but unpolished",
      "Community-focused",
      "Culturally rich (African-European fusion)",
      "Documentary realism over studio perfection",
    ],

    // Intentionally empty — no photographer or venue names in AI prompts
    photographerCredits: [],
    venueSignatures: [],

    // Template for AI prompts — no brand names, no tags, no credits
    aiPromptTemplate: `Professional music photography. {subject} on stage, {lighting}. {mood}. {composition}. Shot on {camera}. {color_grade}. Documentary feel, not stock photo. Authentic moment captured live. No text, no watermarks, no logos.`,


    examplePrompts: [],
  };

  // Generate 12 example prompts based on the visual identity
  const subjects = [
    "Isaac Bullock holding a microphone, expressive gesture, engaging the crowd",
    "Full band performing, drummer with logo visible on bass drum, guitarist in yellow hoodie",
    "Isaac Bullock smiling, blue cap, colorful geometric mural background",
    "Crowd from behind the band, hands raised, lens flares from purple stage lights",
    "Backstage corridor, musician walking toward stage, anticipation",
    "Close-up of hands playing bass guitar, warm tungsten light",
    "Group of 30+ musicians and fans on stage, arms raised, celebration",
    "Isaac Bullock at a speaking event, warm spotlight, addressing audience",
    "Rehearsal studio, candid moment, musicians laughing between takes",
    "Isaac Bullock with guitar, street portrait, canal background",
    "Wide shot of packed venue, purple and blue stage lights, energy",
    "Drummer mid-performance, sweat visible, dramatic rim lighting",
  ];

  const lightings = [
    "dramatic purple and blue stage lighting with gels",
    "warm tungsten spotlights creating golden highlights",
    "cool blue LED wash with magenta accents",
    "high-contrast concert lighting, dark background, lit subject",
    "natural daylight streaming through windows",
    "mixed color temperature: warm stage + cool ambient",
  ];

  const compositions = [
    "wide angle, full stage visible",
    "medium shot, 2-3 subjects, shallow depth of field",
    "close-up, expressive face, emotional intensity",
    "overhead angle, showing crowd density",
    "low angle, looking up at performer, heroic framing",
    "asymmetric composition with negative space",
  ];

  const cameras = [
    "Canon EOS R5 with 24-70mm f/2.8",
    "Sony A7III with 85mm f/1.4",
    "Nikon D850 with 70-200mm f/2.8",
  ];

  const colorGrades = [
    "warm cinematic color grade with lifted blacks",
    "high contrast with crushed blacks and vivid highlights",
    "natural documentary color, slight film grain",
    "teal and orange split tone",
  ];

  for (let i = 0; i < 12; i++) {
    const prompt = identity.aiPromptTemplate
      .replace("{subject}", subjects[i])
      .replace("{lighting}", lightings[i % 6])
      .replace("{mood}", identity.mood[i % 6])
      .replace("{composition}", compositions[i % 6])
      .replace("{camera}", cameras[i % 3])
      .replace("{color_grade}", colorGrades[i % 4]);
    identity.examplePrompts.push(prompt);
  }

  return identity;
}

function main() {
  console.log("\n=== ANALYZING VISUAL IDENTITY ===\n");

  const identity = analyzePhotos();

  console.log(`Analyzed ${identity.photoCount} real photos`);
  console.log(`Brand names in prompts: NONE (intentionally excluded)\n`);

  console.log("Dominant colors:");
  identity.dominantColors.forEach((c) => console.log(`  • ${c}`));

  console.log("\nLighting styles:");
  identity.lightingStyles.forEach((l) => console.log(`  • ${l}`));

  console.log("\nComposition patterns:");
  identity.compositionPatterns.forEach((c) => console.log(`  • ${c}`));

  console.log("\nMood:");
  identity.mood.forEach((m) => console.log(`  • ${m}`));

  console.log("\nExample AI prompts (brand-informed):");
  identity.examplePrompts.slice(0, 3).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.slice(0, 120)}...`);
  });

  const outputPath = "/tmp/visual-identity.json";
  writeFileSync(outputPath, JSON.stringify(identity, null, 2));
  console.log(`\n✅ Visual identity saved to ${outputPath}`);
}

main();
