# DochGames publisher registration

Standalone publisher registration page. The DochGames team manually emails each publisher their widget embed script and installation instructions.

## Hosting

Serve the repository root as a static website. No dependencies or build command are required. The entry point is `index.html`; use `.` as the output directory if your host requires one. Connect the `main` branch to your hosting provider for deployment on pushes.

## Google Sheets integration: deployment required

The Apps Script links to its containing spreadsheet when `setup` runs. Its destination ID is stored in private Apps Script properties, not in this repository. The destination tab is `Sheet1`.

The website's `config.js` still contains an endpoint placeholder. Submissions are not saved until the Google web app is deployed and its URL is added.

1. Open your destination spreadsheet in Google Sheets.
2. Choose **Extensions → Apps Script**.
3. Paste `google-apps-script/Code.gs` into the editor and save.
4. Select the `setup` function, click **Run**, and authorise access. It creates the headers only if `Sheet1` is empty; it refuses to overwrite a different existing header layout.
5. Select **Deploy → New deployment → Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone**, then deploy.
7. Copy the web app URL ending in `/exec` into the `endpoint` value in `config.js`, commit and redeploy the site.
8. Submit a test registration. Verify one row appears in the Sheet and the website shows confirmation. Repeat the same email to verify duplicate handling.

The script validates required fields, checks a honeypot, prevents duplicate email entries, serialises writes and protects against spreadsheet formula injection. It does not send emails or generate widget scripts. Email delivery remains a manual team task.

Keep the spreadsheet private; only the web app endpoint needs public access.

## Local preview

Run `python3 -m http.server 8000` in the repository root, then visit `http://localhost:8000`.

## Branding

The Giga logo and live-widget screenshot were supplied by Dochase. CSS displays the monochrome logo as black artwork on white. The favicon is the Dochase mark from dochaseadx.com. Page typography uses Google Fonts.
