# DochGames publisher registration

Standalone publisher registration page. Publishers submit their details; the DochGames team manually emails the widget embed script and installation instructions.

## Hosting

Serve the repository root as a static website. No dependencies or build command are required. The entry point is `index.html`. For hosts that require an output directory, use `.`. Connect this repository's `main` branch to your hosting provider to deploy on pushes.

## Current integration status

Google Sheets capture is NOT connected yet. `config.js` contains a placeholder endpoint; the page does not claim a successful registration until the endpoint confirms a saved submission. Configure and test the integration before directing publishers to this page.

## Google Sheets setup

1. Open Google Apps Script with the account that owns the destination Sheet.
2. Create a project and paste `google-apps-script/Code.gs` into the editor.
3. Verify `SPREADSHEET_ID` and `SHEET_NAME`. The existing destination tab is named `Waitlist` for compatibility, though this page now collects registrations.
4. Deploy as a web app, executing as yourself, accessible to Anyone. Authorise the spreadsheet access.
5. Copy the deployed URL ending in `/exec` into the `endpoint` value in `config.js`.
6. Commit the updated configuration and redeploy.
7. Submit a test registration. Confirm one row is written to the Sheet and a confirmation appears on the page. Repeat the email to check duplicate handling.

The script includes required-field validation, a honeypot, duplicate-email checking, a write lock and spreadsheet formula-injection protection. It does not generate or email widget scripts. Script delivery is handled manually by the DochGames team.

## Local preview

Run `python3 -m http.server 8000` from the repository root and open `http://localhost:8000`.

## Assets

The logo and live-widget screenshot were supplied by Dochase. The monochrome logo is displayed as black artwork on white using CSS inversion. Google Fonts provides the page typefaces.
