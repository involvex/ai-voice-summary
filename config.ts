// IMPORTANT: These variables must be set for Google Drive and Sign-In integration to work.
// You can get them from the Google Cloud Console: https://console.cloud.google.com/
//
// --- INSTRUCTIONS ---
// 1. Create a new project in the Google Cloud Console.
// 2. Go to "APIs & Services" > "Library" and enable the following APIs:
//    - Google Picker API
//    - Google Drive API
// 3. Go to "APIs & Services" > "Credentials".
// 4. Click "+ CREATE CREDENTIALS" and select "OAuth 2.0 Client ID".
//    - Application type: Web application
//    - Name: Audio Summarizer App (or any name)
//    - Under "Authorized JavaScript origins", add the URLs where your app will run.
//      - For local development: http://localhost:5173 (or your dev port)
//      - For GitHub Pages: https://involvex.github.io
//    - Click "CREATE".
//    - Copy the "Client ID" and paste it into GOOGLE_CLIENT_ID below.
// 5. Back on the "Credentials" page, click "+ CREATE CREDENTIALS" again and select "API key".
//    - Copy the key and paste it into GOOGLE_DEVELOPER_KEY below.
//    - IMPORTANT: Restrict this key to only be used with the "Google Picker API". This is a crucial security step.

export const GOOGLE_CLIENT_ID = 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID';
export const GOOGLE_DEVELOPER_KEY = 'REPLACE_WITH_YOUR_GOOGLE_DEVELOPER_KEY';