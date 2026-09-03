# UniFit Mobile App — Universal Fitness

> **Brand Name:** UniFit  
> **Primary Tagline:** UNIVERSAL FITNESS  
> **Secondary Tagline:** FITNESS WITHOUT BARRIERS, PROGRESS WITHOUT LIMITS  

A production-quality mobile application built with **Expo**, **React Native**, **TypeScript**, **Expo Router**, and **Supabase Authentication**.

---

## Key Features

1. **Personalized Fitness Plans** — Workouts tailored to your goals, fitness level, preferences, and abilities.
2. **Dietary Personalization** — Food recommendations based on Vegetarian, Vegan, Eggetarian, or Non-Vegetarian preferences.
3. **Exercise Coach** — Tracks exercises like squats, lunges, push-ups, and rows with real-time form feedback.
4. **Adaptive Progression** — Weekly plans automatically adjust based on your performance, consistency, and form.
5. **Inclusive & Accessible Fitness** — Audio guidance for visually impaired users and captions/visual feedback for deaf or hard-of-hearing users.
6. **Multi-Activity Tracking** — Track walking, running, cycling, swimming, and strength workouts with personalized progress insights.

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
