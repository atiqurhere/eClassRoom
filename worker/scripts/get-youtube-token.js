/**
 * worker/scripts/get-youtube-token.js
 * One-time script to generate a YouTube OAuth 2.0 refresh_token.
 *
 * Usage:
 *   1. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in your environment
 *   2. node worker/scripts/get-youtube-token.js
 *   3. Open the URL printed to the console
 *   4. Authorise the app and copy the code from the redirect URL
 *   5. Paste the code when prompted
 *   6. Copy the printed refresh_token to YOUTUBE_REFRESH_TOKEN env var
 */

require('dotenv').config({ path: '../.env' })

const { google } = require('googleapis')
const readline   = require('readline')

const CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
const REDIRECT_URI  = 'urn:ietf:wg:oauth:2.0:oob'  // Desktop app flow

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET first')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope:       ['https://www.googleapis.com/auth/youtube.upload'],
  prompt:      'consent',   // Force prompt to always get refresh_token
})

console.log('\n📺 YouTube OAuth Token Generator')
console.log('=================================\n')
console.log('1. Open this URL in your browser:\n')
console.log('  ', authUrl)
console.log('\n2. Authorise the app with the institutional YouTube account')
console.log('3. Copy the authorisation code\n')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('  Paste the code here: ', async (code) => {
  rl.close()
  try {
    const { tokens } = await oauth2Client.getToken(code.trim())
    console.log('\n✅ Success! Add this to your .env / Railway:\n')
    console.log(`  YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log('\n(Keep this secret — it grants upload access to your YouTube channel)\n')
  } catch (err) {
    console.error('❌ Token exchange failed:', err.message)
    process.exit(1)
  }
})
