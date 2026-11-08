import WalletPanel from "@/components/WalletPanel";
import RideIcon from "@/components/RideIcon";

export default function WalletPage() {
  return (
    <>
      <header className="workspace-heading">
        <p className="workspace-kicker">PAYMENTS</p>
        <h1>Your wallet.</h1>
        <p>
          Connect or disconnect Pera Wallet and see the current payment status.
        </p>
      </header>
      <div className="workspace-book-grid">
        <WalletPanel />
        <aside className="workspace-book-guide">
          <RideIcon name="shield" />
          <h2>Testnet only</h2>
          <p>
            Ride payments are disabled while escrow is being connected. You can
            request and accept rides without a wallet.
          </p>
        </aside>
      </div>
    </>
  );
}
