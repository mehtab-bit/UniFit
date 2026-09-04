# UniFit Mobile App — Universal Fitness

> **Brand Name:** UniFit  
> **Primary Tagline:** UNIVERSAL FITNESS  
> **Secondary Tagline:** FITNESS WITHOUT BARRIERS, PROGRESS WITHOUT LIMITS  

A production-quality mobile application built with **Expo**, **React Native**, **TypeScript**, **Expo Router**, and **Supabase Authentication**.

## Documentation

This repo is a **full-stack app**: the Expo frontend, a FastAPI backend wrapping the `vijul` Python fitness engine, Supabase persistence, and an on-device computer-vision coach. Start here:

- [docs/architecture.md](docs/architecture.md) — how all the pieces connect
- [docs/engine.md](docs/engine.md) — the Python fitness engine (plans, nutrition, progression)
- [docs/cv-coach.md](docs/cv-coach.md) — camera pose tracking, calibration, rep counting, form feedback
- [docs/setup.md](docs/setup.md) — running it on your laptop and phone
- [docs/performance.md](docs/performance.md) — measured timings and what to profile next
- [docs/audit.md](docs/audit.md) — over-engineering audit findings

> Note: `graphify-out/` is a locally generated code-map produced by the
> graphify tool. It is not part of the repository and is not required to
> build or run UniFit.

---

## Key Features

1. **Personalized Fitness Plans** — Workouts tailored to your goals, fitness level, preferences, and abilities.
2. **Dietary Personalization** — Food recommendations based on Vegetarian, Vegan, Eggetarian, or Non-Vegetarian preferences.
3. **Exercise Coach** — Tracks exercises like squats, lunges, push-ups, and rows with real-time form feedback.
4. **Adaptive Progression** — Weekly plans automatically adjust based on your performance, consistency, and form.
5. **Inclusive & Accessible Fitness** — Audio guidance for visually impaired users and captions/visual feedback for deaf or hard-of-hearing users.
6. **Multi-Activity Tracking** — Track walking, running, cycling, swimming, and strength workouts with personalized progress insights.
7. **Pose Engine Selection** — Profile → Camera Engine lets users pick Auto, MediaPipe (development builds), or MoveNet (Expo Go / fallback), persisted per device.

## Demo / Staging Deployment

This repository is intended for **staging/demo deployment, not production**.
Keep the existing development configuration: placeholder Supabase values enable
the resilient local auth + offline demo mode, and demo credentials
(`demo@unifit.app`) are intentionally part of the app. For a hosted demo,
point `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` at a real
Supabase project and `EXPO_PUBLIC_API_URL` at the deployed FastAPI backend,
then export the web app with `npx expo export -p web`.

---

## Screen Flow Architecture

```
First Launch:
Splash Screen (Navy Deep, UniFit Logo, Subtle Geometric Waves)
      ↓
Onboarding Tour (Key Features Showcase & One-Time Local Storage Persistence)
      ↓
Login Screen (Email / Password / Forgot Password / Sign Up Navigation)
      ↓
Dashboard Screen (User Greetings, Personalized Plan, Activity Tracking, Accessibility Toggles, Sign Out)

Returning Launch:
Splash Screen → Login Screen (or Directly to Dashboard if Session Active)
```

---

## Quick Start & Running the App

### 1. Install Dependencies (Already Completed)
```bash
npm install
```

### 2. Start Expo Development Server
```bash
# Start default Expo bundler (Scan QR with Expo Go on iOS / Android)
npm start

# Or run directly on Web browser:
npm run web

# Or run on Android Emulator / iOS Simulator:
npm run android
npm run ios
```

---

## Supabase Authentication Setup

The application comes pre-configured with a resilient fallback authentication provider for instant local testing out-of-the-box.

To connect your live Supabase project:
1. Copy `.env.example` to `.env` (if not already done).
2. Open `.env` and fill in your Supabase project URL and Anon Public Key:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```
3. Restart your Expo bundler: `npx expo start -c`.

---

## Design & Accessibility Guidelines

- **Zero Emojis**: Replaced with clean, minimal vector line icons (`@expo/vector-icons` Feather).
- **Official Brand Assets**: The official UniFit logo is strictly preserved in `assets/images/unifit-logo.png`.
- **Accessibility**: Complete `accessibilityLabel`, `accessibilityHint`, minimum 48x48 touch targets, and WCAG AA contrast compliance.
- **Mobile First**: `SafeAreaView`, `KeyboardAvoidingView`, and responsive scroll containers to prevent any keyboard clipping.
