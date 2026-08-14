# Project Memory

A personal project memory & management PWA. Capture now, organize later.

## Stack

- Vite + React + TypeScript + Tailwind CSS
- Firebase (Firestore + Google Sign-In), offline-persistent
- Cloudflare Worker (proxy) + Groq (Whisper transcription + Llama classification/summaries)
- Deployed as a static PWA on GitHub Pages

## One-time setup

### 1. Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Firestore Database** → Create database (production mode, any region).
3. **Build → Authentication → Sign-in method** → enable **Google**.
4. **Project settings → General → Your apps** → add a Web app → copy the config values.
5. Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values.
6. Deploy security rules + indexes once you have the Firebase CLI logged in
   (`npx firebase login`, then `npx firebase use --add` to pick this project):
   ```
   npx firebase deploy --only firestore:rules,firestore:indexes
   ```

### 2. Cloudflare Worker (voice transcription + AI assist)

1. Get a free API key at [console.groq.com](https://console.groq.com).
2. `cd worker && npm install`
3. `npx wrangler login`
4. Edit `worker/wrangler.toml`: set `FIREBASE_PROJECT_ID` (from step 1) and
   `ALLOWED_ORIGIN` (your GitHub Pages origin, e.g. `https://USERNAME.github.io`).
5. `npx wrangler secret put GROQ_API_KEY` (paste your Groq key).
6. `npm run deploy` — note the `*.workers.dev` URL it prints.
7. Put that URL in the app's **Settings** page (or as `VITE_WORKER_URL` in `.env.local` / GH secrets).

### 3. GitHub Pages

1. Repo Settings → Pages → Source: **GitHub Actions**.
2. Repo Settings → Secrets and variables → Actions → add the `VITE_FIREBASE_*`
   secrets (same values as `.env.local`) and `VITE_WORKER_URL`.
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys.

## Local development

```
npm install
npm run dev
```

## Data model

See `src/types/index.ts`. Memory is the base capture object (voice/text, optional
project); Task is a separate entity with a status workflow. Idea/Issue/Decision/Note
are just a `type` on Memory, not separate collections — everything starts as a
Memory and gets progressively organized.
