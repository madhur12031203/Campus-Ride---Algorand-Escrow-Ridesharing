# Campus Ride — Algorand Escrow Ridesharing Platform

A trustless, mobile-first campus ridesharing platform built with **Next.js**, **Supabase Realtime**, and **Algorand Smart Contracts**. Campus Ride connects students and campus drivers with real-time matching while securing trip payments inside an immutable Algorand escrow smart contract that automatically settles funds upon verified ride completion.

---

## Overview & Problem Statement

Intra-campus ride coordination is typically fragmented across ad-hoc messaging groups, social channels, and cash transactions. This creates persistent challenges:
- **Lack of Trust & Safety:** Unknown identities, unverified drivers, and no accountability for no-shows or cancellations.
- **Payment Friction & Risk:** Passengers risk prepayment scams; drivers risk non-payment after drop-off.
- **No Coordinated Dispatch:** Inefficient manual chats without real-time proximity matching or live ride status.

**Campus Ride solves this by integrating:**
1. **Realtime Matching & Presence:** Supabase Postgres and Realtime WebSocket channels coordinate passenger ride requests, nearby driver acceptance (within 8 km), and live ride tracking.
2. **Cryptographic Identity & Trust:** Student profiles with Pera Wallet authentication ensure non-repudiable wallet-based accountability.
3. **Trustless On-Chain Escrow:** Smart contract escrow on Algorand locks the fare and minimum balance requirements (MBR) at booking, enforces timeout and dispute guardrails, and releases funds automatically upon completed transit.

---

## Smart Contract Architecture (`RideEscrow`)

The smart contract is implemented in **Algorand Python (ARC-4)** and compiled using **Puya / AlgoKit**. It is deployed as an immutable contract (`allow_update=False`, `allow_delete=False`) with zero administrative override on ride escrow funds.

### Key Escrow Specifications
- **Box Storage Model:** Every ride is allocated a dedicated storage box keyed by `sha256(rider_address || ride_id)` (32 bytes). This guarantees that different accounts cannot squat on or overwrite another rider's ride identifier.
- **Deterministic Record Size:** Exact 81-byte payload storing:
  - `status: UInt8` (0: `BOOKED`, 1: `STARTED`, 2: `DROPPED`, 3: `COMPLETED`, 4: `DISPUTED`)
  - `fare: UInt64` (in microAlgos; `MIN_FARE = 100,000 µALGO`)
  - `created_round: UInt64`
  - `dropped_round: UInt64`
  - `disputed_round: UInt64`
  - `rider: Address` (32 bytes)
  - `driver: Address` (32 bytes)
- **Minimum Balance Requirement (MBR):** Exactly `47,700 µALGO` derived directly from Algorand box storage formulas (`2,500 + 400 * (32 + 81)`). The box is created upon booking and deleted upon payout or cancellation, maintaining complete conservation of funds in the contract.
- **Security & Zero-Rekey Enforcements:** `book_trip` enforces that `pay.close_remainder_to`, `pay.rekey_to`, and `Txn.rekey_to` are strictly the zero address, preventing rekeying vulnerabilities.
- **ARC-28 Event Logging:** Emits auditable events on every lifecycle change:
  - `Booked(ride_id, rider, amount)`
  - `Started(ride_id, rider, driver)`
  - `Dropped(ride_id, rider, driver)`
  - `Completed(ride_id, rider, driver, amount)`
  - `Cancelled(ride_id, rider, amount)`
  - `Claimed(ride_id, rider, driver, amount)`
  - `Disputed(ride_id, rider, driver, amount)`
  - `Resolved(ride_id, rider, driver, amount, pay_driver)`
- **Dispute & Timeout Mechanisms:**
  - `claim_after_timeout`: Driver can claim fare if rider does not confirm within `timeout_rounds`.
  - `reclaim_after_dispute_timeout`: Rider can reclaim escrowed funds if a dispute remains unresolved past `dispute_timeout_rounds`.
  - `resolve_dispute`: Designated admin address can arbitrate disputes in favor of the driver or refund the rider.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend / Realtime Database:** Supabase (Auth, PostgreSQL, Realtime WebSocket Broadcasts, Row Level Security)
- **Blockchain:** Algorand (ARC-4 Smart Contracts, ARC-32 / ARC-56 Specifications)
- **Algorand Tooling:** AlgoKit, Puya Python, Pytest, `algokit-utils`
- **Wallet Integration:** Pera Wallet (`@perawallet/connect`)

---

## Repository Structure

```
Campus-Ride---Algorand-Escrow-Ridesharing/
├── public/                     # Static media and assets
├── smart_contracts/            # Algorand ARC-4 Smart Contracts
│   ├── artifacts/ride_escrow/  # Compiled TEAL, ARC-32, ARC-56, typed Python client
│   └── ride_escrow/
│       ├── contract.py         # Production RideEscrow box-storage contract
│       └── deploy_config.py    # Immutable deployment and account funding config
├── src/                        # Next.js frontend application
│   ├── app/                    # App Router pages and API routes
│   ├── components/             # UI components, ride panels, driver/passenger views
│   ├── hooks/                  # Wallet and custom React hooks
│   ├── lib/                    # Supabase client, Algorand SDK, pricing logic
│   └── types/                  # TypeScript interface definitions
├── supabase/                   # Database migrations and schema definitions
├── tests/                      # Smart contract automated test suite
│   ├── test_contract.py        # 21 mock unit tests (guards, boundaries, MBR)
│   └── test_localnet_integration.py # 10 real-chain LocalNet integration tests
├── .algokit.toml               # AlgoKit project configuration
├── DESIGN.md                   # Full smart contract technical specification
├── package.json                # Frontend dependencies and scripts
└── pyproject.toml              # Python dependencies and build settings
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.12 or higher with [Poetry](https://python-poetry.org/)
- **AlgoKit**: Installed via `pipx install algokit` or native installer
- **Docker Desktop**: Running (required for LocalNet integration tests)

---

### 1. Frontend Setup

Clone the repository and install web dependencies:

```bash
git clone https://github.com/madhur12031203/Campus-Ride---Algorand-Escrow-Ridesharing.git
cd Campus-Ride---Algorand-Escrow-Ridesharing
npm install
```

Create a `.env.local` file in the root directory:

```env
# Algorand Testnet Escrow Configuration
NEXT_PUBLIC_RIDE_ESCROW_APP_ID=755776791
NEXT_PUBLIC_RIDE_ESCROW_APP_ADDRESS=GLYCD2SYQTCIBJFCCHBFDFLILGB5YLV5DNLOPOFKVYSJ7A67UCNJJTTQ2Q

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application Settings
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=admin@example.com

# Optional Integrations
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

Run the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

### 2. Smart Contract Development & Testing

Install Python dependencies:

```bash
poetry install
```

#### Run Unit Tests (Mocks)
Executes 21 unit tests validating contract assertions, MBR derivations, zero-rekey guards, and state transitions:

```bash
poetry run pytest tests/test_contract.py -v
```

#### Run LocalNet Integration Tests (Real-Chain)
Executes 10 end-to-end integration tests on real Algorand nodes (verifying balance deltas, fee outer budgets, box MBR tracking, round advancing, and conservation of funds across 5 distinct ride lifecycle endings):

```bash
# Start Algorand LocalNet
algokit localnet start

# Run live on-chain integration tests
poetry run pytest tests/test_localnet_integration.py -v --durations=0
```

#### Build Smart Contract Artifacts
Compiles the contract to TEAL bytecode and regenerates ARC-32/ARC-56 specifications and typed clients:

```bash
algokit project run build
```

---

## Author & Project Ownership

Developed as a solo project by **Madhur Gupta**:
- Architecture, design, and implementation of the Algorand ARC-4 `RideEscrow` smart contract.
- LocalNet and unit automated testing suites.
- Fullstack Next.js web application, Supabase database schemas, Realtime synchronization, and Pera Wallet integration.
