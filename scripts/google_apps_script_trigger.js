/**
 * MBBS Resource Library - Google Apps Script Calendar Sync Trigger
 * 
 * This Google Apps Script connects your Google Calendar to GitHub Actions.
 * Whenever you add, edit, or delete ANY event in your college Google Calendar,
 * this script triggers the GitHub Actions workflow immediately, deploying your
 * changes to the website within ~30 seconds with ZERO manual interaction.
 * 
 * SETUP INSTRUCTIONS (Takes ~2 minutes):
 * -----------------------------------------------------------------------------
 * 1. Open Google Apps Script:
 *    Visit https://script.google.com/home/start and click "+ New project".
 * 
 * 2. Paste this code:
 *    Replace everything in Code.gs with this entire file.
 * 
 * 3. Add your GitHub Personal Access Token (PAT):
 *    - In GitHub: Settings -> Developer Settings -> Personal access tokens -> Tokens (classic)
 *      or Fine-grained tokens.
 *    - Grant: `repo` and `workflow` permissions.
 *    - In your Apps Script project: Project Settings (gear icon) -> "Script Properties"
 *      -> Click "Add script property":
 *         Property: GITHUB_PAT
 *         Value:    ghp_your_actual_token_here
 * 
 * 4. Add the Trigger:
 *    - On the left sidebar, click Triggers (clock icon) -> "+ Add Trigger".
 *    - Choose which function to run: `syncTimetableToGitHub`
 *    - Select event source: `From calendar`
 *    - Enter Calendar owner email: `harshsaw01@gmail.com`
 *    - Event type: `Calendar updated`
 *    - Click Save!
 * 
 * Optional Backup Trigger:
 *    - Add a second trigger: `Time-driven` -> `Minutes timer` -> `Every 10 minutes`
 *      to ensure guaranteed periodic sync even if an event notification drops.
 * -----------------------------------------------------------------------------
 */

function syncTimetableToGitHub() {
  const GITHUB_OWNER = "HarshKumarSaw";
  const GITHUB_REPO = "mbbs-library";
  const WORKFLOW_ID = "sync-timetable.yml";

  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty("GITHUB_PAT");

  if (!token) {
    Logger.log("❌ Error: GITHUB_PAT is not configured in Script Properties.");
    return;
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`;

  const payload = {
    ref: "main"
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "MBBS-Calendar-Sync-Trigger/1.0"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    if (responseCode === 204) {
      Logger.log("✅ Success! GitHub Actions workflow 'sync-timetable.yml' triggered immediately.");
    } else {
      Logger.log(`⚠️ GitHub API returned status code ${responseCode}: ${response.getContentText()}`);
    }
  } catch (err) {
    Logger.log(`❌ Network error triggering GitHub Action: ${err.message}`);
  }
}
