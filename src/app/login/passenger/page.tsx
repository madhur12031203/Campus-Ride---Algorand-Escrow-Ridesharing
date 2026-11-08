import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import AuthSplit from "@/components/auth/AuthSplit";

export default function PassengerLoginPage() {
  return (
    <AuthSplit
      headline="A seat awaits."
      detail="Plan the pickup and follow your ride as it comes together."
    >
      <Link href="/login" className="auth-back">
        ← Choose another role
      </Link>
      <AuthForm
        role="passenger"
        title="Passenger access"
        subtitle="Sign in or create an account to request a ride."
        accentClass="bg-emerald-500"
      />
    </AuthSplit>
  );
}
