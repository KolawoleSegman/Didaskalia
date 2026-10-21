import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.didaskalia.app",
  appName: "Didaskalia",
  webDir: "dist",
  backgroundColor: "#1c1915",
  android: {
    // Android 15 draws apps edge-to-edge; this keeps the game clear of the status and navigation bars.
    adjustMarginsForEdgeToEdge: "force",
  },
};

export default config;
