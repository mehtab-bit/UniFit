---
title: UniFit API
emoji: 🏋️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# UniFit Fitness Engine API

FastAPI service powering the UniFit Expo app: personalized adaptive weekly
plans, nutrition, meals, and progression.

- Health: `/api/v1/health`
- Interactive docs: `/docs`

Runtime configuration arrives as Space secrets/variables:

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — server-side service role key (never client-side)
