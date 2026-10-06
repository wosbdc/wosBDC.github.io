# Implementation Plan: Live Countdown Timer for Verification Rate Limits (Cooldown)

## Problem Statement
When players request or verify in-game codes too frequently, Century Games returns error `101031018` ("Too many requests. Please wait about 30–60 seconds and try again").
Currently, the website displays this as an error message or toast, leaving the user guessing when they can retry. The user requested:
*"can we build a count down if we get the cooldown msg somewhere there"* (showing the modal feedback box and action buttons).

## Solution Architecture
1. **Helper Functions**:
   - `window.isWosRateLimitError(err, data)`: Robust check for rate limit error codes (`101031018`, `40001`, `40003`, or `"too many requests"` / `"rate limit"` strings).
   - `window.startVerificationCooldownTimer({ durationSec = 60, feedbackEl, buttons = [], onComplete })`:
     - Updates `feedbackEl` live every second with an amber countdown badge: `⏳ [Code 101031018] Too many requests. Cooldown remaining: <span ...>Xs</span>`.
     - Disables action buttons (such as `Send Code`, `Verify & Bind`, `Resend`) and sets their text to `⏳ Wait Xs...`.
     - When countdown reaches 0s, clears timer, restores original button states/HTML, and displays `✅ Cooldown complete! You may now request or verify a code.`.
2. **Integration Surfaces**:
   - **Account Hub 30-Day Sync Modal** (`openAccountHubVerifyModal`):
     - `sendBtn` catch block: triggers cooldown timer for `[sendBtn, submitCodeBtn]` if rate limited.
     - `submitCodeBtn` catch block: triggers cooldown timer for `[submitCodeBtn, sendBtn]` if rate limited.
   - **Alt Character 30-Day Sync Modal** (`openAltVerifyModal`):
     - `sendBtn` catch block: triggers cooldown timer for `[sendBtn, submitCodeBtn]` if rate limited.
     - `submitCodeBtn` catch block: triggers cooldown timer for `[submitCodeBtn, sendBtn]` if rate limited.
   - **Account Settings / Verification Fallback Modal** (lines ~12340–12460):
     - `resendBtn` and `submitBtn` catch blocks: triggers cooldown timer on `feedback`.
   - **Auth / Register Page In-Game Verification Box** (lines ~28210–28350):
     - `resendBtn`, `confirmBtn`, and `verifyBtn`: triggers cooldown timer on `feedback` / `verificationArea`.
   - **Alt Auto Link Modal** (lines ~37690–37770):
     - `altAutoSendCodeBtn` and `altAutoConfirmCodeBtn`: triggers cooldown timer on `altAutoFeedback`.
3. **Automated Verification**:
   - Dedicated headless test script (`tools/test_cooldown_countdown.cjs`) simulating rate limit response (`101031018`), verifying timer starts, updates DOM every second, disables buttons, and restores on completion.
   - Run full website build and test suite (`npm run build`).
4. **App Store Style Changelog & Version Bump**:
   - Bump version to `3.3.88` across `package.json`, `version.json`, and `public/version.json`.
   - Add App Store style bullets in `CHANGELOG.md` & `public/CHANGELOG.md` (strictly $\le 10$ words per bullet).
5. **Git Commit & Push**:
   - Title: `v3.3.88 : Added live countdown timer for in-game verification rate limits`
   - Include multi-line `Mini Summary:` bullets.
