# PetMe

PetMe is a React + TypeScript + Vite app for tracking check-ins, browsing body systems, and viewing a "future self" reflection based on recent activity.

## Setup

1. Install a recent version of Node.js that includes `npm`.
2. Install project dependencies:

```bash
npm install
```

3. Optional: create a `.env.local` file if you want AI-generated future-self messages while running locally:

```bash
VITE_OPENAI_API_KEY=your_api_key_here
```

If this variable is not set, the app still runs and falls back to built-in messaging.

4. Start the development server:

```bash
npm run dev
```

5. Open the local URL shown by Vite, usually `http://localhost:5173`.

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates a production build.
- `npm run preview` serves the production build locally for testing.
- `npm run lint` runs ESLint across the project.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Three.js / React Three Fiber
