# WEconnect

WEconnect is a platform built for the Würth Electronics student-connection track. It
brings together four independent modules, each built by a different team member. This
repository is a **monorepo**: every module lives in its own top-level folder with its
own dependencies and is run independently.

## Modules

| Folder | Name | Stack | What it does |
|---|---|---|---|
| [`network/`](network/) | `network-module` | Vite + React + Supabase | The platform shell — login → role-based profile → "build your network" matching flow. |
| [`analysis/`](analysis/) | `weconnect-analysis` | Next.js + Supabase + Leaflet + Recharts | Event ROI analytics dashboard: a map of Europe with per-event/per-region ROI scoring. |
| [`qrcode/`](qrcode/) | `weconnect-qrcode` | Vite + React + Supabase | Event QR registration + slide-deck unlock; admin tools for Würth employees. |
| [`simulation/`](simulation/) | `weconnect-simulation` | Next.js + React-Three-Fiber + Gemini | 3D component simulator over the WE component library. |

## Running a module

Each module is self-contained. From the repo root:

```bash
cd <module>          # network | analysis | qrcode | simulation
npm install
cp .env.example .env # (or .env.local for the Next.js modules) and fill in the values
npm run dev
```

- **Vite modules** (`network`, `qrcode`) serve on `http://localhost:5173`.
- **Next.js modules** (`analysis`, `simulation`) serve on `http://localhost:3000`.

See each module's own `README.md` for module-specific setup (Supabase schema/migrations,
API keys, etc.).

## Notes

- `network` and `qrcode` are both Vite/React apps with overlapping concerns but separate
  histories; they are kept as distinct modules here and can be unified later if desired.
- Each module ships its own Supabase migrations under `<module>/supabase/`.
