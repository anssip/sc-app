#!/usr/bin/env node

/**
 * Migration script to upload indicator schema JSON files to Firestore
 * Uploads schemas from firestore-data/indicators/ to the /indicators collection
 *
 * Uses Firebase Admin SDK to bypass security rules
 *
 * Usage:
 *   Production: node scripts/upload-indicator-schemas.cjs
 *   Emulator:   node scripts/upload-indicator-schemas.cjs --emulator
 *   Or set:     USE_EMULATOR=true node scripts/upload-indicator-schemas.cjs
 */

const { readdir, readFile } = require("fs/promises");
const { join } = require("path");
const admin = require("firebase-admin");
const { readFileSync } = require("fs");

// Check if we should use emulator
const useEmulator =
  process.argv.includes("--emulator") ||
  process.env.USE_EMULATOR === "true" ||
  process.env.FIRESTORE_EMULATOR_HOST;

// Initialize Firebase Admin with service account
if (admin.apps.length === 0) {
  const serviceAccountPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json";

  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  console.log(
    `Initialized Firebase Admin for project: ${serviceAccount.project_id}`
  );
}

const db = admin.firestore();

// Connect to emulator if requested
if (useEmulator) {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8090";
  const [host, port] = emulatorHost.split(":");
  db.settings({
    host: `${host}:${port}`,
    ssl: false,
  });
  console.log(`🔧 Connected to Firestore Emulator at ${emulatorHost}`);
} else {
  console.log(`☁️  Connected to Production Firestore`);
}

async function uploadIndicatorSchemas() {
  console.log("📊 Uploading Indicator Schemas to Firestore");
  console.log("=".repeat(50));

  try {
    // Path to the schemas directory
    const schemasDir = join(process.cwd(), "firestore-data", "indicators");

    // Read all JSON files from the directory
    const files = await readdir(schemasDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    if (jsonFiles.length === 0) {
      console.log(
        "⚠️  No JSON schema files found in firestore-data/indicators/"
      );
      process.exit(1);
    }

    console.log(`\n📝 Found ${jsonFiles.length} schema files to upload...`);

    for (const file of jsonFiles) {
      const filePath = join(schemasDir, file);
      const fileContent = await readFile(filePath, "utf-8");
      const schema = JSON.parse(fileContent);

      console.log(`  Uploading schema: ${schema.name} (${schema.id})`);

      // Upload to Firestore using Admin SDK
      const schemaRef = db.collection("indicators").doc(schema.id);
      await schemaRef.set(schema);

      console.log(`  ✅ Uploaded: ${schema.name}`);
    }

    console.log("\n🎉 All indicator schemas uploaded successfully!");
    console.log("\nUploaded schemas:");
    for (const file of jsonFiles) {
      const filePath = join(schemasDir, file);
      const fileContent = await readFile(filePath, "utf-8");
      const schema = JSON.parse(fileContent);
      console.log(`  • ${schema.name} (${schema.category})`);
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error uploading schemas:", error);
    process.exit(1);
  }
}

// Run the script
uploadIndicatorSchemas().catch(console.error);
