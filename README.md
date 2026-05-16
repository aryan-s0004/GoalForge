# GoalForge - Goal Setting & Tracking Portal

GoalForge is a demo-ready goal setting and approval portal for employees, managers, and admins.

## Run locally

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

The backend runs with in-memory demo data by default. Your Supabase URL and publishable key are already stored in `backend/.env`.

## Demo users

- `john.employee@atomberg.com`
- `jane.employee@atomberg.com`
- `mike.manager@atomberg.com`
- `admin@atomberg.com`

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `backend/.env.example` to `backend/.env`.
4. Set `USE_SUPABASE=true` in `backend/.env`.
5. Restart the backend.

If direct SQL connection is unavailable from your machine, open the Supabase dashboard, go to SQL Editor, paste `supabase/schema.sql`, and run it.
