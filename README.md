# NormalHuman AI

An AI-powered email client built with Next.js that combines email management, AI assistance, semantic search, and modern authentication into one application.

## Features

- 📧 Gmail integration using Aurinko
- 🔐 Clerk Authentication
- 🤖 AI Email Assistant
- ✍️ AI Inline Reply (Ctrl + J)
- 🔍 Full-text Email Search (Orama)
- 📂 Inbox, Sent & Draft folders
- 💬 AI RAG Chat with your emails
- 💳 Stripe Subscription
- 🌙 Modern Responsive UI
- ⚡ Fast Next.js App Router architecture

---

## Tech Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- TipTap Editor
- TanStack Query
- Jotai
- Framer Motion

### Backend

- tRPC
- Prisma ORM
- PostgreSQL
- Clerk Authentication
- Aurinko Email API
- Orama Search
- OpenAI
- Stripe

---

## Screenshots

Add screenshots here after deployment.

Example:

```
/public/screenshots/home.png
/public/screenshots/inbox.png
/public/screenshots/chat.png
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/khuzaima-div/normalhuman-project
```

Go into the project

```bash
cd normalhuman
```

Install packages

```bash
npm install
```

Create environment file

```bash
cp .env.example .env
```

Run Prisma

```bash
npx prisma generate
npx prisma db push
```

Start development server

```bash
npm run dev
```

---

## Environment Variables

Configure these variables inside `.env`

```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

AURINKO_CLIENT_ID=
AURINKO_CLIENT_SECRET=

OPENAI_API_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

PORTFOLIO_MODE=true
```

---

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run start
```

---

## Production Build

```bash
npm run build
npm run start
```

---

## Portfolio Mode

For demonstration purposes the application can run in Portfolio Mode.

- Only the latest emails are displayed
- Search indexes only portfolio emails
- Faster syncing
- Better performance during demos

Enable with

```
PORTFOLIO_MODE=true
```

---

## Deployment

Recommended platform:

- Vercel

Required services:

- Neon PostgreSQL
- Clerk
- Aurinko
- OpenAI
- Stripe

---

## Author

Khuzaima

GitHub:
https://github.com/khuzaima-div

LinkedIn:
www.linkedin.com/in/khuzaima-ramzan-9420743a4
