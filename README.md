# MafatMusic

MafatMusic is an open-source, local-first music library and player. It is designed for music you are authorized to access: files imported from your computer, public-domain recordings, and other permitted sources.

## Current foundation

- React + TypeScript + Vite frontend
- Express + TypeScript REST API
- SQLite persistence with foreign keys
- MafatMusic branding and responsive dark UI
- Track library, search, liked songs, playlists foundation, and persistent player shell
- Localhost-only server by default

## Windows quick start

Prerequisite: Node.js 22.x or newer.

```powershell
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:5173. Run `npm run build` for a production build and `npm test` for tests.

The first phase intentionally keeps external providers out of the core app. Do not add copyrighted music or credentials to the repository. Local imports must be authorized by the user.

