# Google Apps Script setup — Kempenfelt Service Issues

This is **separate** from the Kempenfelt Business Hub. The production site is unchanged until the form is connected and tested.

## One-time setup (free for normal internal usage)

1. Open the existing [Service / Install Issue Tracker](https://docs.google.com/spreadsheets/d/1x7CJaqFkMLOB4i5pdkY34N8OasFZ90hRX27m3k4I-kg/edit).
2. Select **Extensions → Apps Script**. Delete the default `myFunction` and paste the contents of [Code.gs](./Code.gs).
3. Save the script as `Kempenfelt Service Intake`.
4. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Authorize requested spreadsheet access. If your Google account restricts anonymous web apps, this option may not appear.
5. Copy the Web app URL ending in **/exec**. Share **only that URL** here; do not share credentials, JSON keys, or account passwords.
6. We will connect the **service-issues website only**, run a test, verify that its unique ID appears in column S, then publish the frontend change.

## Design

- Anonymous reps POST to Apps Script. The script writes into the existing `Form Responses 1` tab.
- Columns A-N contain timestamp and the original 13 report fields. Existing manager columns O-R are left blank for office use. Column S stores a generated report ID.
- The frontend **must not** interpret iframe loading or a POST response as success. It should poll the /exec endpoint via JSONP `?reportId=UUID&callback=uniqueCallback` and only display success once `{saved:true}` is returned.
- A repeated POST with the same UUID is idempotent. The rep's input should be preserved on ambiguous failures.
- Google Forms remains an emergency backup, but it does not create a matching report ID.

## Security / limits

The web app must be public for login-free rep access. This means its endpoint is publicly callable and may attract spam. Keep the URL reasonably private, avoid exposing customer details in verification GET URLs, and consider a stronger authenticated API if abuse or high volume emerges. Apps Script quotas and Google policy limits apply. This endpoint does **not** provide a strong user identity guarantee.

## Important

The Apps Script code is **staged**, not deployed to Google. The public site still uses Google Forms until the Apps Script web-app URL is provided and the frontend is changed and tested. No Business Hub files or Render services are involved.
