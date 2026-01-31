# VocabSync: Daily Vocabulary Wallpaper Generator

A backend service that generates daily iPhone wallpapers featuring 3 sophisticated English words with definitions and examples. Designed for iOS Shortcuts automation.

## Features

- **Daily Rotation**: Automatically generates new wallpaper at 00:00 GMT+4 (Asia/Dubai)
- **Rich Data**: Includes Word, Part of Speech, Definition, and Example sentence
- **Mobile Optimized**: Rendered at `1290 × 2796` resolution (9:16 aspect ratio)
- **Static URL**: Exposes `/daily.png` endpoint for easy fetching

## Deployment (Coolify)

### Prerequisites
- Coolify instance
- Git repository

### Setup Steps

1. **Connect Repository**
   - Create new application in Coolify
   - Connect your Git repository
   - Select branch to deploy

2. **Configure Build**
   - Build Pack: `Docker`
   - Dockerfile Path: `Dockerfile` (root directory)
   - Port: `3000`

3. **Environment Variables**
   ```
   PORT=3000
   TZ=Asia/Dubai
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy" and wait for build to complete
   - Verify health check passes

## Endpoints

### Public Endpoint
- `GET /daily.png` - Returns the current daily wallpaper image
  - Content-Type: `image/png`
  - Cache-Control: `no-cache`
  - Use this URL in your iOS Shortcut

## iOS Shortcut Setup

1. Open **Shortcuts** app
2. Create new shortcut:
   - Action 1: **URL** → `https://your-domain.com/daily.png`
   - Action 2: **Get Contents of URL**
   - Action 3: **Set Wallpaper Photo** → Select "Lock Screen"
   - Toggle **OFF** "Show Preview"
3. Create Automation:
   - **Time of Day** → Set to your preferred time
   - Select **Run Immediately**
   - Connect to your shortcut

## Technical Details

- **Runtime**: Node.js 20
- **Image Generation**: Puppeteer (headless Chrome)
- **Scheduling**: node-cron (runs daily at midnight GMT+4)
- **Image Format**: PNG, 1290×2796px
- **Dictionary API**: DictionaryAPI.dev

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Server runs on http://localhost:3000
# Access image at http://localhost:3000/daily.png
```

## Project Structure

```
vocab/
├── backend/
│   ├── server.ts          # Express server & cron job
│   └── public/            # Generated images storage
├── services/
│   ├── words.ts           # Word selection logic
│   └── dictionary.ts      # Dictionary API client
├── types.ts               # TypeScript definitions
├── Dockerfile             # Docker configuration
└── package.json           # Dependencies
```

## License

MIT
