import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <AuthScreen
      heading="Welcome back"
      sub="Log in to manage your page."
      redirectTo="/dashboard"
      altPrompt="New here?"
      altHref="/signup"
      altLabel="Create your page"
    />
  );
}
