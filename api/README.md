# Verified issue submission API (staged; not live)

Independent of the Kempenfelt Business Hub. The existing public static form stays unchanged until this API is configured and tested.

1. Create a Google Cloud service account with Sheets API enabled. Share the existing issue tracker spreadsheet with its service-account email as Editor.
2. Create a **separate** Render Node web service using this repo, branch `verified-sheet-submissions`, root directory `api`, build command `npm install`, start command `npm start`.
3. Set `GOOGLE_SERVICE_ACCOUNT_JSON` as a secret environment variable to the service account JSON credential. Never commit it to GitHub or send it in chat. Set `PUBLIC_FORM_ORIGIN=https://kempenfelt-service-issues.onrender.com`.
4. Test /health and an end-to-end test report; verify the response is in Form Responses 1 and the ID in column S.
5. Only after verified, update the frontend to call /api/issues and show WhatsApp after HTTP 201; do not use the hidden Google Forms iframe.

**Important:** API schema and column layout must be reviewed against the live form before frontend cutover. Do not switch production while unconfigured. Avoid logging customer PII.
