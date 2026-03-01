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
| AI fields (read) | `{ state, value, isStale }` — extract `.value` before rendering |

WRONG: `{ 'Session': [{ id: recordId }] }` → INVALID_RECORD_ID error
RIGHT: `{ 'Session': [recordId] }` — plain string inside the array

WRONG: `r.fields['Session']?.some(s => s.id === id)` → never matches (s is a string, not {id})
RIGHT: `r.fields['Session']?.some(s => (typeof s === 'string' ? s : s.id) === id)` — handles both formats

WRONG: `{record.fields['Interview Brief']}` → React error #31 (renders an object)
WRONG: `record.fields['Interview Brief']?.value ?? record.fields['Interview Brief']` → React error #31 when `.value` is null (falls back to the raw object)
RIGHT: `getFieldValue(record.fields['Interview Brief'])` from `src/utils/airtable.js` — handles all cases safely

## Airtable Field Access — Hard Rule

**NEVER access `record.fields['X']` directly in JSX or conditions.**

Always use helpers from `src/utils/airtable.js`:

| Helper | Use for |
|--------|---------|
| `getFieldValue(field)` | Extracting any field value for rendering or logic |
| `isFieldReady(field)` | Checking if an AI field has generated a value |
| `isFieldGenerating(field)` | Checking if an AI field is still computing |

A pre-commit hook (`.git/hooks/pre-commit`) enforces this — any commit with a raw `fields['` access not wrapped in `getFieldValue` will fail. Run the grep check manually:

```bash
grep -n "fields\['" src/App.jsx | grep -v getFieldValue
# Must be zero results
```

**Root cause of React error #31:** AI fields return `{state, value, isStale}` instead of a plain string. The `?.value ?? field` fallback pattern renders the raw object when `value` is null (field not yet computed). `getFieldValue()` handles this safely.

## React Import Rule

**Never import React explicitly in this project.**

`@vitejs/plugin-react` handles the JSX transform — an explicit `import React from 'react'` is unused and will fail lint with `no-unused-vars`.

```js
// ✅ correct for Vite web apps
import { useState, useEffect } from 'react';

// ❌ wrong — triggers no-unused-vars lint error
import React, { useState, useEffect } from 'react';
```

This is the opposite of Airtable extensions, which require `import React from 'react'` explicitly (classic JSX transform). Do not apply extension rules here.

## PasscodeGate

App is wrapped with `PasscodeGate` in `main.jsx`. Default passcode: `"airtable"`. Checks `sessionStorage` — no re-prompt within the same browser session. Component lives at `src/components/PasscodeGate.jsx` (copied from `~/.claude/templates/PasscodeGate.jsx`).

## Known Lint Warnings

- [2026-02-28] `react-hooks/exhaustive-deps` — missing `permStatus` in useEffect deps (App.jsx:763) — pre-existing, not introduced by ESLint setup

## Current State

- [2026-03-01] Released: Fix RecapScreen response cards not showing (linked record IDs are plain strings in REST API); add matchesRecordId utility with pre-commit enforcement
- ThankYouScreen: green checkmark, "You're all set, [name].", "We'll be in touch soon." — no buttons
- IntroScreen tagline: dynamically reflects Speak/Type mode selection
- Per-question mode override (switch speak↔type mid-interview)
- Global input mode toggle on IntroScreen
- PasscodeGate wraps root — passcode: `"airtable"`
