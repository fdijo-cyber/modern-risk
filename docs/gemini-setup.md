# Connect Gemini on your Mac

You need Node.js 24+ and a Gemini API key created in Google AI Studio. Do not send your key in chat or put it in GitHub. This guide does not create or upgrade a billing account.

1. Stop the running game in Terminal with **Control+C**.
2. In your existing `modern-risk` folder, update:

   ```sh
   git pull --ff-only
   ```

3. Open the private configuration file:

   ```sh
   nano .env
   ```

4. Add or replace these three settings. Replace the placeholder with your actual key, and keep each setting on its own line. Do not duplicate existing settings. Preserve your other settings, including `DB_PATH`, so existing matches stay available.

   ```dotenv
   AI_PROVIDER=gemini
   GEMINI_API_KEY=PASTE_YOUR_KEY_HERE
   GEMINI_MODEL=gemini-3.1-flash-lite
   ```

5. Save with **Control+O**, press **Return**, then exit with **Control+X**.
6. Test the connection:

   ```sh
   npm run ai:check
   ```

   Expected output includes **AI connection successful**. This sends one small test request to the selected provider. It never prints your key.
7. Start the game for your Mac and devices on the same Wi-Fi:

   ```sh
   HOST=0.0.0.0 npm start
   ```

8. Refresh the browser. On the Mac, open http://localhost:3000. On the same Wi-Fi, use your Mac's current local IP and port, for example http://192.168.8.101:3000. In Foreign Affairs, the status should say **Gemini configured**; successfully generated replies are labeled **live AI**. A configuration badge alone does not prove a successful request; the connection test and reply labels do.

## If the check fails

- **Not configured**: save `.env` in the project root, next to `package.json`; use the exact variable names above.
- **API key rejected**: check that the key belongs to the intended Google AI Studio project and has Gemini API access. Do not share the key or full `.env` when asking for help.
- **Quota or rate limit reached**: check the project's quotas in AI Studio and wait for the relevant limit to reset. The game uses its clearly labeled local fallback meanwhile; it does not switch to another paid provider automatically.
- **Model not available**: choose an available text model from your project's AI Studio model list and update `GEMINI_MODEL`; run the check again.
- **Connection failed**: confirm that the Mac has Internet access. Keep the Mac awake while serving the game.

Google currently lists a free input/output tier for `gemini-3.1-flash-lite`; model availability, country/project eligibility and quotas can change. Stay on a free-tier project to use that allowance. Free-tier data handling differs from paid usage; see Google's current terms before sending sensitive content.

Official references: https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/api/generate-content

The game still validates funds, ownership, unit inventory and legal actions. Connecting a model improves language interpretation and conversation; it does not add every imaginable simulation mechanic. No new match is required for this provider update. Existing sessions pick up the configuration after the server restarts and the page refreshes.
