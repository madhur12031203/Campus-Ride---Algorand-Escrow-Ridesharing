import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

export default function PassengerLoginPage() {
  return (
    <main id="main-content" className="auth-page flex flex-col items-center justify-center">

      <div className="auth-shell"><Link href="/login" className="auth-back">← Choose another role</Link>
        <AuthForm
          role="passenger"
          title="Passenger"
          subtitle="Sign in or create an account to request rides, book seats, and pay through escrow."
          accentClass="bg-emerald-400"
        />
      </div>
    </main>
  );
}
