import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import AuthSplit from "@/components/auth/AuthSplit";

export default function DriverLoginPage() {
  return (
    <AuthSplit
      headline="Room for one more."
      detail="See nearby requests and share a seat on your next trip."
    >
      <Link href="/login" className="auth-back">
        ← Choose another role
      </Link>
      <AuthForm
        role="driver"
        title="Driver access"
        subtitle="Sign in or create an account to accept ride requests."
        accentClass="bg-emerald-500"
      />
    </AuthSplit>
  );
}
