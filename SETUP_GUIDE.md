# RenoBudget Setup Guide

## Quick Start (Local Only Mode)

1. Open the app in your browser
2. Complete the welcome setup
3. Start adding expenses!

Your data will be stored locally in your browser. Use Export/Import in Settings for backups.

---

## Full Setup with Google Sheets Sync

### Prerequisites
- A Google account
- Access to Google Sheets and Google Apps Script

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "RenoBudget" or any name you prefer
4. Note the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### Step 2: Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of the `Code.gs` file (found in `public/apps-script/Code.gs`)
4. Paste it into the Apps Script editor
5. Click **Save** (Ctrl+S or Cmd+S)
6. Name the project "RenoBudget Backend"

### Step 3: Deploy as Web App

1. In Apps Script, click **Deploy → New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Fill in the settings:
   - **Description**: RenoBudget API v1.0
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts
6. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/.../exec`)

### Step 4: Configure RenoBudget

1. Open RenoBudget in your browser
2. Go to **Settings**
3. Scroll to "Google Sheets Configuration"
4. Paste the Web App URL
5. Optionally add your Spreadsheet ID
6. Click **Save Configuration**

### Step 5: Sign In

1. Click **Sign in with Google** in Settings
2. Authorize the app
3. Your data will now sync with Google Sheets!

---

## Setting Up Google OAuth (Optional - For Developers)

If you want to deploy your own instance with Google Sign-In:

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the following APIs:
   - Google Sheets API
   - Google Identity Services

### Step 2: Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Select **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
5. Copy the **Client ID**

### Step 3: Configure Environment

Create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

---

## Troubleshooting

### "Failed to connect to Google Sheets"
- Check that the Apps Script Web App URL is correct
- Ensure the deployment settings are "Anyone" for access
- Try redeploying the Apps Script

### "Not authenticated"
- Sign in with Google in Settings
- Check browser popup blockers

### "Sync failed"
- Check your internet connection
- Try clicking "Sync Now" manually
- Check the Apps Script execution logs

### Data not appearing
- The app syncs automatically every 5 minutes
- Click "Sync Now" to force sync
- Check the Google Sheet to verify data is saved

---

## Data Backup

### Export Local Data
1. Go to Settings
2. Click "Export Backup"
3. A JSON file will download

### Import Data
1. Go to Settings
2. Click "Import Backup"
3. Select your backup JSON file

---

## Support

For issues or questions, please check the documentation or create an issue on GitHub.
