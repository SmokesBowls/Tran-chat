# Tran-chat

Real-time multilingual chat app with audio + translation support.

## Current MVP in this repo
- Simple room-based text chat over Socket.IO
- Join a room name and exchange messages with other clients in the same room

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open two browser sessions to `http://localhost:3000`, enter the same room name, and send messages.

## Next goals
- Add persistent message storage
- Add UI themes and mobile layout
- Add translation and audio streaming features
