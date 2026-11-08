# Campus Ride

Campus Ride helps students request or offer rides and compare estimated fares. Start at the homepage to choose a role, or open the demo to see both sides of the ride flow with sample data.

| Page | Purpose |
| --- | --- |
| `/` | Public homepage and project overview |
| `/login` | Choose passenger or driver, then sign in or create an account |
| `/dashboard` | Signed-in ride requests, driver tools, and fare estimates |
| `/demo` | Explore sample passenger and driver views without an account |
| `/profile` | Manage your profile and verification |

## Run locally

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The public pages and demo work without credentials. For real accounts and ride data, copy `.env.example` to `.env.local`, fill in your Supabase settings, and apply the SQL migrations in `supabase/migrations/` to your development database. Add the Google Maps server key for route lookup and fare estimates. Keep the Supabase service role key on the server.

Enable the Google provider in Supabase if you want Google sign-in. Allow the site's `/auth/callback` URL in Supabase's redirect settings, including the role or recovery query used by the app. Keep `NEXT_PUBLIC_SITE_URL` consistent with the site where sign-in starts.

## Where the code lives

| Folder | What's inside |
| --- | --- |
| `src/app/` | Pages and server endpoints |
| `src/components/` | Interface, forms, and ride panels |
| `src/lib/` | Database access, fare estimates, maps, and the escrow boundary |
| `supabase/migrations/` | Database tables, rules, and realtime configuration |
| `smart_contracts/` | Canonical Algorand contract source, deployment code, and generated artifacts |
| `tests/` | Contract tests, including a suite that requires Algorand LocalNet |

Older local copies in `ride-escrow/` and `ride-escrow-backup/` are ignored. Contract work belongs in `smart_contracts/`. See [DESIGN.md](DESIGN.md) for the contract lifecycle.

Fare comparisons use sample pricing formulas. The website's escrow payments are disabled until the frontend calls the contract's deposit and release methods and verifies their confirmations. A database ride status does not prove that a payment settled.

Run `npm run build` to check the website. The contract tests have separate Python and LocalNet requirements.

## Project credit

Campus Ride was created by **Madhur Gupta**, including the website, the ride coordination flow, and the Algorand escrow contract.
