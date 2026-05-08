# FahadTradeX Backend

Production-style backend architecture for FahadTradeX — a real-time paper trading platform supporting NSE, BSE, and MCX virtual trading workflows.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Firebase Firestore
- Firebase Admin SDK
- JWT Authentication
- 5paisa APIs
- WebSocket Market Feed
- Render Deployment

## Features

- JWT-secured authentication
- Real-time portfolio management
- BUY / SELL trading engine
- MCX derivatives margin simulation
- OrderBook architecture
- AI-powered stock analysis APIs
- Historical candle APIs
- PostgreSQL stock database
- NSE integrations
- Real-time WebSocket workflows

## Architecture

Route → Controller → Service architecture with scalable modular backend design.

## Environment Variables

Create `.env` file:

```env
PORT=
JWT_SECRET=

DATABASE_URL=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## Run Locally

```bash
npm install
npm run dev
```

## Deployment

Hosted on Render using PostgreSQL + Firebase integrations.