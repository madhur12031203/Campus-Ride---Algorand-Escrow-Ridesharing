import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

export default function DriverLoginPage() {
  return (
    <main id="main-content" className="auth-page flex flex-col items-center justify-center">

      <div className="auth-shell"><Link href="/login" className="auth-back">← Choose another role</Link>
        <AuthForm
          role="driver"
          title="Driver"
          subtitle="Sign in or create an account to accept requests and manage your ride availability."
          accentClass="bg-cyan-400"
        />
      </div>
    </main>
  );
}
