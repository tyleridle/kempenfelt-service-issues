/**
 * Kempenfelt Service / Install Issue Tracker
 * Google Apps Script: bound to the existing spreadsheet.
 * No Google Cloud project, service account, or Business Hub access required.
 *
 * Deploy as Web app: Execute as Me; access Anyone.
 * After deployment, provide the /exec URL to connect the frontend.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: "1x7CJaqFkMLOB4i5pdkY34N8OasFZ90hRX27m3k4I-kg",
  TAB: "Form Responses 1",
  ID_COLUMN: 19,
  MAX_FIELD_LENGTH: 4000
});
const FIELDS = ["repName","custName","custPhone","custEmail","orderNo","product","location","category","details","photos","siteNotes","promised","visit"];
function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const id = String(p.reportId || "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id)) return reply_("Invalid report ID");
    const values = FIELDS.map(k => String(p[k] || "").trim());
    if (!values[0] || !values[1] || !values[8]) return reply_("Required fields missing");
    if (values.some(v => v.length > CONFIG.MAX_FIELD_LENGTH)) return reply_("Field too long");
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.TAB);
      if (!sheet) throw new Error("Response tab not found");
      ensureIdHeader_(sheet);
      if (!findReport_(sheet, id)) {
        // Columns A-N: timestamp and 13 report fields.
        // Columns O-R: existing manager-managed fields, untouched.
        // Column S: unique report ID.
        const row = [new Date()].concat(values).concat(["","","","",id]);
        sheet.appendRow(row);
        SpreadsheetApp.flush();
      }
    } finally { lock.releaseLock(); }
    return reply_("Received");
  } catch (err) {
    console.error("Submission failed: " + err.message);
    return reply_("Unable to save");
  }
}
function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const id = String(p.reportId || "");
  const callback = String(p.callback || "");
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]{0,80}$/.test(callback)) {
    return ContentService.createTextOutput("Invalid callback").setMimeType(ContentService.MimeType.TEXT);
  }
  let saved = false;
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id)) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.TAB);
      saved = !!(sheet && findReport_(sheet, id));
    } catch(err) { console.error("Status check failed: " + err.message); }
  }
  return ContentService.createTextOutput(callback + "(" + JSON.stringify({saved:saved}) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function findReport_(sheet,id) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const finder = sheet.getRange(2,CONFIG.ID_COLUMN,last-1,1)
    .createTextFinder(id).matchEntireCell(true);
  return !!finder.findNext();
}
function ensureIdHeader_(sheet) {
  const cell = sheet.getRange(1,CONFIG.ID_COLUMN);
  if (!cell.getValue()) cell.setValue("Report ID");
}
function reply_(message) {
  // This POST response is NOT a success signal: the browser must call doGet
  // and verify the report ID actually exists in the sheet.
  return ContentService.createTextOutput(message).setMimeType(ContentService.MimeType.TEXT);
}
