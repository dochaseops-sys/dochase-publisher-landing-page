const SHEET_NAME = "Sheet1";
const HEADERS = ["Submitted at", "Full name", "Work email", "Publication / company", "Website URL", "Consent", "Marketing updates", "Status", "Source", "Notes"];

// Run once in the Apps Script editor to authorise access and prepare the sheet.
function setup() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error("Open the destination Sheet, then Extensions → Apps Script, and run setup there.");
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", active.getId());
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { registrationSheet(); } finally { lock.releaseLock(); }
}

function registrationSheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Run setup from the destination spreadsheet before deployment.");
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Registration tab not found: " + SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
      .setBackground("#17191d").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 180);
    sheet.setColumnWidth(3, 260);
    sheet.setColumnWidth(5, 300);
  } else {
    const existing = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
    if (!HEADERS.every((value, index) => existing[index] === value)) {
      throw new Error("Header mismatch. Existing data was left unchanged.");
    }
  }
  return sheet;
}

function doGet() {
  return HtmlService.createHtmlOutput("DochGames publisher registration endpoint is ready.");
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    const payload = event && event.parameter ? event.parameter : {};

    if (payload.faxNumber) return respond("success");

    const fullName = clean(payload.fullName, 120);
    const email = clean(payload.email, 180).toLowerCase();
    const publication = clean(payload.publication, 180);
    const website = clean(payload.website, 300);
    const consent = payload.consent === "Yes" ? "Yes" : "No";
    const marketing = payload.marketing === "Yes" ? "Yes" : "No";
    const source = clean(payload.source || "publisher-registration", 80);

    if (!fullName || !isEmail(email) || !publication || !isWebsite(website) || consent !== "Yes") {
      return respond("error", "Please check the required fields and try again.");
    }

    const sheet = registrationSheet();

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingEmails = sheet.getRange(2, 3, lastRow - 1, 1).getDisplayValues().flat();
      if (existingEmails.some((value) => String(value).trim().toLowerCase() === email)) {
        return respond("duplicate");
      }
    }

    sheet.appendRow([
      new Date(),
      safeCell(fullName),
      safeCell(email),
      safeCell(publication),
      safeCell(normalizeWebsite(website)),
      consent,
      marketing,
      "New",
      safeCell(source),
      "",
    ]);

    return respond("success");
  } catch (error) {
    console.error(error);
    return respond("error", "We couldn’t save your details. Please try again.");
  } finally {
    try { lock.releaseLock(); } catch (error) { console.error(error); }
  }
}

function clean(value, maxLength) {
  return String(value || "").trim().replace(/[\u0000-\u001F\u007F]/g, "").slice(0, maxLength);
}

function safeCell(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isWebsite(value) {
  return /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(value);
}

function normalizeWebsite(value) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function respond(status, message) {
  const payload = JSON.stringify({
    source: "dochgames-publisher-waitlist",
    status: status,
    message: message || "",
  }).replace(/</g, "\\u003c");

  return HtmlService
    .createHtmlOutput("<script>window.top.postMessage(" + payload + ", '*');</script>")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
