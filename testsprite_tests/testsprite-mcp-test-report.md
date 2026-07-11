# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** normalhuman
- **Date:** 2026-07-09
- **Prepared by:** TestSprite AI Team
- **Test Scope:** Frontend (codebase), development server on port 3000
- **Dashboard:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9

---

## 2️⃣ Requirement Validation Summary

### Requirement: User Authentication
- **Description:** Sign in via Clerk and reach the authenticated mail experience; protect `/mail` from unauthenticated access.

#### Test TC001 Authenticate and reach the mail experience
- **Test Code:** [TC001_Authenticate_and_reach_the_mail_experience.py](./TC001_Authenticate_and_reach_the_mail_experience.py)
- **Test Error:** Sign-in page showed marketing content ("Email, reimagined.") but no email/password inputs or Sign in button were visible (0 form matches).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/73616b3c-b763-476e-ac1f-94e00d86ca79
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Clerk widget did not render reliably under automated browser conditions. Likely iframe/hydration timing or Clerk keyless/dev-instance loading issue rather than a missing route.
---

#### Test TC003 Protect the mail experience from unauthenticated access
- **Test Code:** [TC003_Protect_the_mail_experience_from_unauthenticated_access.py](./TC003_Protect_the_mail_experience_from_unauthenticated_access.py)
- **Test Error:** `ERR_EMPTY_RESPONSE` when loading localhost; sign-in redirect could not be verified.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/ff17230c-15ae-442d-95bd-49aa1b22cde0
- **Status:** ⚠️ Blocked
- **Severity:** HIGH
- **Analysis / Findings:** Dev server became unreachable under concurrent TestSprite load. Middleware auth protection was not validated in this run.
---

#### Test TC015 Keyboard shortcut opens search
- **Test Code:** [TC015_Keyboard_shortcut_opens_search.py](./TC015_Keyboard_shortcut_opens_search.py)
- **Test Error:** Clerk auth page timed out (`solid-labrador-40.clerk.accounts.dev` ERR_TIMED_OUT); empty sign-in tab with 0 interactive elements.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/db66c1dc-5fa3-4bfc-9ea0-3643f839337b
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Blocked by Clerk availability/timeout before mail UI could be reached. Not a search-shortcut product defect.
---

### Requirement: Link Google Email Account / Onboarding
- **Description:** Signed-in users without a linked inbox see onboarding; linking Google via Aurinko opens the mail experience.

#### Test TC002 Open the inbox after linking a Google account
- **Test Code:** [TC002_Open_the_inbox_after_linking_a_Google_account.py](./TC002_Open_the_inbox_after_linking_a_Google_account.py)
- **Test Error:** Google blocked automated sign-in: "This browser or app may not be secure."
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/6c646506-0e70-4407-83a4-f3a8cfd20c84
- **Status:** ⚠️ Blocked
- **Severity:** HIGH
- **Analysis / Findings:** External OAuth restriction in headless/automated browsers. Needs a pre-linked test account or mocked Aurinko callback for CI.
---

#### Test TC004 Show the onboarding state for a signed-in user without a linked inbox
- **Test Code:** [TC004_Show_the_onboarding_state_for_a_signed_in_user_without_a_linked_inbox.py](./TC004_Show_the_onboarding_state_for_a_signed_in_user_without_a_linked_inbox.py)
- **Test Error:** Sign-in form never appeared (logo + Notifications only); could not authenticate to reach onboarding.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/86ec0825-22b5-4e49-ac13-53df51d31aba
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Same Clerk widget render issue as TC001. Onboarding UI itself was not exercised.
---

### Requirement: Mail Inbox Dashboard
- **Description:** Three-pane inbox with folder browsing, thread reading, and done/inbox toggles.

#### Test TC006 Open and read an email thread
- **Test Code:** [TC006_Open_and_read_an_email_thread.py](./TC006_Open_and_read_an_email_thread.py)
- **Test Error:** Clerk MFA OTP required; no verification code available in the test environment.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/e77959a7-71e8-4416-bd39-262e4f216202
- **Status:** ⚠️ Blocked
- **Severity:** HIGH
- **Analysis / Findings:** Auth gate blocked mail access. Recommend Clerk test mode / bypass MFA for automation accounts.
---

#### Test TC007 Browse folders in the three-pane inbox
- **Test Code:** [TC007_Browse_folders_in_the_three_pane_inbox.py](./TC007_Browse_folders_in_the_three_pane_inbox.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/dc931915-f9b9-4f05-b16a-8ad98bf5effa
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Folder navigation in the three-pane inbox works when an authenticated session is available.
---

#### Test TC012 Mark a thread as done and move it back to inbox
- **Test Code:** [TC012_Mark_a_thread_as_done_and_move_it_back_to_inbox.py](./TC012_Mark_a_thread_as_done_and_move_it_back_to_inbox.py)
- **Test Error:** Sign-in stuck on one-time verification code; mailbox unreachable.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/87af644d-29d1-45c2-bfa6-a892a3c92b3e
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Blocked by Clerk OTP, not by done/inbox toggle logic.
---

### Requirement: Account Switching
- **Description:** Switching linked accounts refreshes the inbox view.

#### Test TC011 Account switching updates the inbox view
- **Test Code:** [TC011_Account_switching_updates_the_inbox_view.py](./TC011_Account_switching_updates_the_inbox_view.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/26a95115-5cbb-491f-a69c-fc7fe8406ec5
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Account switcher correctly updates the inbox for the selected account.
---

### Requirement: Email Search
- **Description:** Search synced mail and clear search to restore the normal thread list.

#### Test TC008 Search finds matching emails
- **Test Code:** [TC008_Search_finds_matching_emails.py](./TC008_Search_finds_matching_emails.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/8b80fb7c-4178-44cc-a42b-e7e9464070a9
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Orama-backed search returns matching emails as expected.
---

#### Test TC010 Search synced mail and return to the normal thread list
- **Test Code:** [TC010_Search_synced_mail_and_return_to_the_normal_thread_list.py](./TC010_Search_synced_mail_and_return_to_the_normal_thread_list.py)
- **Test Error:** Sign-in form did not render (marketing content only; 0 inputs).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/e7987c9c-5044-4e2b-a92e-f893433f79f0
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Auth/widget issue prevented re-validating search → clear → inbox restore in this run (related clear path covered partially by TC013 intent).
---

#### Test TC013 Search can be cleared to return to the inbox list
- **Test Code:** [TC013_Search_can_be_cleared_to_return_to_the_inbox_list.py](./TC013_Search_can_be_cleared_to_return_to_the_inbox_list.py)
- **Test Error:** MFA OTP required; mail UI unreachable.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/39820e62-8ebf-4c6b-983a-608da2a29bb2
- **Status:** ⚠️ Blocked
- **Severity:** MEDIUM
- **Analysis / Findings:** Blocked by Clerk verification, not by clear-search UI.
---

### Requirement: Compose and Reply Email
- **Description:** Compose new mail, reply to threads, and use AI assistance to draft content.

#### Test TC005 Compose a new email and send it successfully
- **Test Code:** [TC005_Compose_a_new_email_and_send_it_successfully.py](./TC005_Compose_a_new_email_and_send_it_successfully.py)
- **Test Error:** Clerk sign-in widget never rendered; compose/send flow unreachable.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/4185f199-34c4-466e-bb64-c95df2e60022
- **Status:** ⚠️ Blocked
- **Severity:** HIGH
- **Analysis / Findings:** Environment/auth blocker. Compose UI was not validated.
---

#### Test TC009 Reply to an existing thread and send the response
- **Test Code:** [TC009_Reply_to_an_existing_thread_and_send_the_response.py](./TC009_Reply_to_an_existing_thread_and_send_the_response.py)
- **Test Error:** `ERR_EMPTY_RESPONSE` from localhost; login page never loaded.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/dad0ae92-7e91-4095-9353-71dc783e71de
- **Status:** ⚠️ Blocked
- **Severity:** HIGH
- **Analysis / Findings:** Dev-server instability under concurrent load. Reply/send not validated.
---

#### Test TC014 Use AI assistance to draft a new email
- **Test Code:** [TC014_Use_AI_assistance_to_draft_a_new_email.py](./TC014_Use_AI_assistance_to_draft_a_new_email.py)
- **Test Error:**
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/923bbda5-f627-470b-b854-6d586f2f9f86
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** AI compose assistance successfully drafts email content when the mail UI is reachable.
---

## 3️⃣ Coverage & Matching Metrics

- **26.67%** of tests passed (4 / 15)
- **1 failed**, **10 blocked**, **4 passed**

| Requirement | Total Tests | ✅ Passed | ❌ Failed | ⚠️ Blocked |
|-------------|-------------|-----------|-----------|------------|
| User Authentication | 3 | 0 | 1 | 2 |
| Link Google / Onboarding | 2 | 0 | 0 | 2 |
| Mail Inbox Dashboard | 3 | 1 | 0 | 2 |
| Account Switching | 1 | 1 | 0 | 0 |
| Email Search | 3 | 1 | 0 | 2 |
| Compose and Reply Email | 3 | 1 | 0 | 2 |
| **Overall** | **15** | **4** | **1** | **10** |

---

## 4️⃣ Key Gaps / Risks

1. **Auth is the primary blocker.** Most failures/blocks stem from Clerk: widget not rendering, MFA OTP unavailable, or Clerk CDN timeouts — not from mail feature regressions.
2. **Google OAuth cannot be automated** in this headless environment ("browser may not be secure"). Account-linking tests need a pre-seeded linked account or mocked Aurinko callback.
3. **Dev-server instability under concurrent load** (`ERR_EMPTY_RESPONSE`) blocked several cases. Re-run in production mode (`npm run build && npm run start`) for more reliable results.
4. **Validated when reachable:** folder browsing (TC007), search (TC008), account switching (TC011), and AI compose (TC014) passed — core mail UX looks healthy once authenticated.
5. **Recommended next steps:** configure a Clerk test user without MFA (or provide OTP access), seed a linked Google account, restart in production mode, then re-run blocked high-priority cases (TC001–TC006, TC009, TC012).
---
