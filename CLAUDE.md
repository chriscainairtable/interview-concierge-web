# interview-concierge-web

Standalone Vite+React web twin of the interview-concierge Airtable extension. Deployed on Vercel.

## Key Files

| File | What |
|------|------|
| `src/App.jsx` | All UI — IntroScreen, CheckingScreen, BlockedScreen, RecapScreen, ThankYouScreen, InterviewScreen, AdminView |
| `src/airtable.js` | Client-side proxy helpers — calls `/api/airtable`, never Airtable directly |
| `api/airtable.js` | Vercel serverless function — reads PAT from `process.env`, proxies to Airtable REST API |

## Security Rule — Credentials Never Touch the Browser

**NEVER use `VITE_` prefix for credentials.**

- `VITE_` variables are bundled into client JS and visible in browser devtools
- WRONG: `VITE_AIRTABLE_PAT`
- RIGHT: `AIRTABLE_PAT` (server-side only, read by `api/airtable.js` via `process.env`)

All Airtable calls go through `/api/airtable` (serverless proxy). `src/airtable.js` is a thin client that calls that proxy — it never touches credentials.

Vercel env vars to set (server-side, no VITE_ prefix):
- `AIRTABLE_PAT`
- `AIRTABLE_BASE_ID`

## Deployments

| URL | GitHub | Base ID |
|-----|--------|---------|
| https://interview-concierge-web.vercel.app | chriscainairtable/interview-concierge-web | appTPbW2ee7QcgbA1 |

## Dev

```bash
vercel dev   # runs Vite + serverless functions together — use this, NOT vite
```

Requires `.env.local` with:
```
AIRTABLE_PAT=patXXX...
AIRTABLE_BASE_ID=appXXX...
```

## Screens / Flow

```
IntroScreen → [camera/mic check] → CheckingScreen
           → BlockedScreen (if denied)
           → InterviewScreen (4 questions, speak or type)
           → RecapScreen (review + send email)
           → ThankYouScreen (2s after send confirmation)
```

## REST API Field Format (critical — differs from SDK)

| Field Type | REST API format |
|------------|----------------|
| Single select | `"Active"` (plain string) |
| Linked records | `["recXXX"]` (array of ID strings — NOT objects) |
| Checkbox | `true` or `false` |

WRONG: `{ 'Session': [{ id: recordId }] }` → INVALID_RECORD_ID error
RIGHT: `{ 'Session': [recordId] }` — plain string inside the array

## PasscodeGate

App is wrapped with `PasscodeGate` in `main.jsx`. Default passcode: `"airtable"`. Checks `sessionStorage` — no re-prompt within the same browser session. Component lives at `src/components/PasscodeGate.jsx` (copied from `~/.claude/templates/PasscodeGate.jsx`).

## Current State

- ThankYouScreen: green checkmark, "You're all set, [name].", "We'll be in touch soon." — no buttons
- IntroScreen tagline: dynamically reflects Speak/Type mode selection
- Per-question mode override (switch speak↔type mid-interview)
- Global input mode toggle on IntroScreen
- PasscodeGate wraps root — passcode: `"airtable"`
