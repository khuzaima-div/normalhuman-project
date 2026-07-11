
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** normalhuman
- **Date:** 2026-07-09
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Authenticate and reach the mail experience
- **Test Code:** [TC001_Authenticate_and_reach_the_mail_experience.py](./TC001_Authenticate_and_reach_the_mail_experience.py)
- **Test Error:** TEST FAILURE

The Sign in page did not present the required sign-in form controls, so the sign-in flow could not be performed.

Observations:
- The /sign-in page shows marketing content ('Email, reimagined.') but no email or password input fields or a 'Sign in' button were visible.
- Only non-form interactive elements were present (logo SVG and a Notifications section) according to the page interactive element list.
- Automated searches for input/button/form elements and for the labels 'Email', 'Password', and 'Sign in' returned 0 matches.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/73616b3c-b763-476e-ac1f-94e00d86ca79
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Open the inbox after linking a Google account
- **Test Code:** [TC002_Open_the_inbox_after_linking_a_Google_account.py](./TC002_Open_the_inbox_after_linking_a_Google_account.py)
- **Test Error:** TEST BLOCKED

The Google account linking flow could not be completed — Google blocked sign-in from this browser/app due to security restrictions.

Observations:
- The Google page displayed: "Couldn't sign you in" with the message "This browser or app may not be secure."
- The page only shows a 'Try again' button and links to Help/Privacy/Terms; no password or consent screens are available to continue linking.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/6c646506-0e70-4407-83a4-f3a8cfd20c84
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Protect the mail experience from unauthenticated access
- **Test Code:** [TC003_Protect_the_mail_experience_from_unauthenticated_access.py](./TC003_Protect_the_mail_experience_from_unauthenticated_access.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the /mail page could not be reached on localhost, so the sign-in experience could not be verified.

Observations:
- The browser displayed an error page: 'This page isn’t working' with 'localhost didn’t send any data.' and 'ERR_EMPTY_RESPONSE'.
- The page shows only a 'Reload' button; no sign-in UI elements (for example, 'Email, reimagined.' or 'Secure sign-in powered by Clerk') are visible, so the redirect-to-sign-in behavior cannot be confirmed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/ff17230c-15ae-442d-95bd-49aa1b22cde0
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Show the onboarding state for a signed-in user without a linked inbox
- **Test Code:** [TC004_Show_the_onboarding_state_for_a_signed_in_user_without_a_linked_inbox.py](./TC004_Show_the_onboarding_state_for_a_signed_in_user_without_a_linked_inbox.py)
- **Test Error:** TEST BLOCKED

The sign-in form could not be reached — the Sign-in page does not display the email/password fields required to sign in.

Observations:
- The page shows only the 'Normal Human' logo and a 'Notifications' section; no sign-in inputs are visible.
- No email or password input fields or sign-in/submit button are present on the page.
- Clicking the site logo did not reveal any sign-in form or additional sign-in options.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/86ec0825-22b5-4e49-ac13-53df51d31aba
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Compose a new email and send it successfully
- **Test Code:** [TC005_Compose_a_new_email_and_send_it_successfully.py](./TC005_Compose_a_new_email_and_send_it_successfully.py)
- **Test Error:** TEST BLOCKED

The sign-in widget did not render — the Clerk sign-in form is not reachable in the UI, so authentication and the subsequent mail-sending flow cannot be tested.

Observations:
- The sign-in page displays marketing text and 'Secure sign-in powered by Clerk' but no email or password input fields are visible.
- Navigation to /login redirected to /sign-in and multiple waits/reloads were performed without the sign-in widget appearing.
- The page's interactive elements do not include form fields or controls needed to sign in, preventing the test from proceeding.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/4185f199-34c4-466e-bb64-c95df2e60022
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Open and read an email thread
- **Test Code:** [TC006_Open_and_read_an_email_thread.py](./TC006_Open_and_read_an_email_thread.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the verification code (OTP) required to complete sign-in is not available, preventing access to the Mail view and thread list.

Observations:
- The page displays a 6-digit verification code input and a 'Continue' button requiring the OTP.
- No verification code or in-UI bypass was provided, and the resend option is currently disabled.
- The 'Use another method' option leads to external OAuth methods (GitHub/Google) which are not usable in this test context.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/e77959a7-71e8-4416-bd39-262e4f216202
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Browse folders in the three-pane inbox
- **Test Code:** [TC007_Browse_folders_in_the_three_pane_inbox.py](./TC007_Browse_folders_in_the_three_pane_inbox.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/dc931915-f9b9-4f05-b16a-8ad98bf5effa
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Search finds matching emails
- **Test Code:** [TC008_Search_finds_matching_emails.py](./TC008_Search_finds_matching_emails.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/8b80fb7c-4178-44cc-a42b-e7e9464070a9
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Reply to an existing thread and send the response
- **Test Code:** [TC009_Reply_to_an_existing_thread_and_send_the_response.py](./TC009_Reply_to_an_existing_thread_and_send_the_response.py)
- **Test Error:** TEST BLOCKED

The test could not be run because the application running on localhost did not respond and the login page failed to load.

Observations:
- The browser shows: "This page isn’t working — localhost didn’t send any data. ERR_EMPTY_RESPONSE".
- The only interactive control visible is a "Reload" button; the login form (email/password fields) never appeared.

Details:
- Multiple navigation attempts to http://localhost:3000 and /login were made but the SPA did not render due to the server returning no data.
- Because the application is unreachable, the required flows (sign-in, opening mailbox, composing and sending a reply) could not be exercised.

Suggested next actions to unblock the test:
- Ensure the local application/server is running (start the dev server), then reload the page and re-run the test.
- Alternatively, provide a reachable test environment URL so the UI can be exercised.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/dad0ae92-7e91-4095-9353-71dc783e71de
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Search synced mail and return to the normal thread list
- **Test Code:** [TC010_Search_synced_mail_and_return_to_the_normal_thread_list.py](./TC010_Search_synced_mail_and_return_to_the_normal_thread_list.py)
- **Test Error:** TEST BLOCKED

The sign-in feature could not be reached — the sign-in form did not render on the expected page.

Observations:
- The /sign-in page displays only marketing content, a logo/SVG, and a 'Notifications' section; no email or password input fields are present.
- A DOM scan returned 0 <input> elements and waiting 2 seconds did not change the page state or reveal the sign-in widget.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/e7987c9c-5044-4e2b-a92e-f893433f79f0
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Account switching updates the inbox view
- **Test Code:** [TC011_Account_switching_updates_the_inbox_view.py](./TC011_Account_switching_updates_the_inbox_view.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/26a95115-5cbb-491f-a69c-fc7fe8406ec5
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Mark a thread as done and move it back to inbox
- **Test Code:** [TC012_Mark_a_thread_as_done_and_move_it_back_to_inbox.py](./TC012_Mark_a_thread_as_done_and_move_it_back_to_inbox.py)
- **Test Error:** TEST BLOCKED

The test could not be run — sign-in requires a one-time verification code that is not available via the UI, so the mailbox could not be reached.

Observations:
- The page displays a one-time verification code input and a 'Continue' button.
- 'Use another method' only exposed OAuth options (GitHub/Google) during earlier interactions; no password fallback or visible OTP was available.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/87af644d-29d1-45c2-bfa6-a892a3c92b3e
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Search can be cleared to return to the inbox list
- **Test Code:** [TC013_Search_can_be_cleared_to_return_to_the_inbox_list.py](./TC013_Search_can_be_cleared_to_return_to_the_inbox_list.py)
- **Test Error:** TEST BLOCKED

The test could not be run — signing in to the app requires a one-time verification code that is not available in this session, so the mail UI could not be reached.

Observations:
- The sign-in flow progressed to a one-time verification code (MFA) screen requiring a 6-digit code.
- The current UI shows alternative methods (GitHub, Google) but they do not allow completing sign-in in this test environment.
- Without a completed sign-in, the mail UI (search input and thread list) cannot be accessed to perform the search/clear verification.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/39820e62-8ebf-4c6b-983a-608da2a29bb2
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Use AI assistance to draft a new email
- **Test Code:** [TC014_Use_AI_assistance_to_draft_a_new_email.py](./TC014_Use_AI_assistance_to_draft_a_new_email.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/923bbda5-f627-470b-b854-6d586f2f9f86
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Keyboard shortcut opens search
- **Test Code:** [TC015_Keyboard_shortcut_opens_search.py](./TC015_Keyboard_shortcut_opens_search.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the authentication provider page failed to load so the mail UI and search interface could not be reached.

Observations:
- Navigation to http://localhost:3000/mail timed out with ERR_TIMED_OUT from solid-labrador-40.clerk.accounts.dev
- The sign-in tab rendered an empty page with 0 interactive elements and no visible sign-in form
- Reload attempts also timed out and the page did not load
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7cb0b585-59c7-4354-8856-be0ae384dce9/db66c1dc-5fa3-4bfc-9ea0-3643f839337b
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **26.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---