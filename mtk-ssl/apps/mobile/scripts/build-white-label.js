#!/usr/bin/env node

/**
 * Script to build white-label mobile apps for Enterprise tenants
 * Usage: node scripts/build-white-label.js <tenantId>
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const tenantId = process.argv[2];

if (!tenantId) {
  console.error("Error: Tenant ID required");
  console.log("Usage: node scripts/build-white-label.js <tenantId>");
  process.exit(1);
}

async function buildWhiteLabelApp() {
  console.log(`Building white-label app for tenant: ${tenantId}`);

  try {
    // Fetch tenant branding
    const apiUrl = process.env.API_URL || "http://localhost:4000";
    const response = await fetch(`${apiUrl}/tenants/${tenantId}/branding`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tenant branding: ${response.statusText}`);
    }

    const branding = await response.json();

    if (!branding || branding.plan !== "enterprise") {
      throw new Error("White-label builds are only available for Enterprise tenants");
    }

    // Set environment variables
    process.env.EXPO_PUBLIC_TENANT_ID = tenantId;
    process.env.EXPO_PUBLIC_PLAN = "enterprise";
    process.env.EXPO_PUBLIC_APP_NAME = branding.appName || "Shakir Super League";

    // Build iOS app
    console.log("Building iOS app...");
    execSync(
      `eas build --platform ios --profile production --non-interactive`,
      { stdio: "inherit", env: { ...process.env } }
    );

    // Build Android app
    console.log("Building Android app...");
    execSync(
      `eas build --platform android --profile production --non-interactive`,
      { stdio: "inherit", env: { ...process.env } }
    );

    console.log("✅ White-label app build completed successfully!");
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }
}

buildWhiteLabelApp();

