import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.f49caf5d9c0f4fe08dd133ce70bc9f97",
  appName: "voxel",
  webDir: "dist",
  server: {
    url: "https://f49caf5d-9c0f-4fe0-8dd1-33ce70bc9f97.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "password"],
    },
    GoogleAuth: {
      androidClientId:
        "1034342406554-00p4h18soh6sfvusi4sa2pvhnc120ja6.apps.googleusercontent.com",
      scopes: ["profile", "email"],
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
