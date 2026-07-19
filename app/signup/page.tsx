import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default async function SignupPage() {
  if (await getSession()) redirect("/onboarding");
  return (
    <AuthScreen
      heading="Claim your page"
      sub="Sign up, pick a username, and share your first expense in minutes."
      redirectTo="/onboarding"
      altPrompt="Already have a page?"
      altHref="/login"
      altLabel="Log in"
    />
  );
}
