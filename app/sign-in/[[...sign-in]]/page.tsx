import { ClerkFailed, ClerkLoaded, ClerkLoading, SignIn } from '@clerk/nextjs';
import { AuthFormFailed, AuthFormLoading, AuthShell } from '@/components/auth-shell';

export default function Page() {
  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Pick up where you left off."
      description="Sign in to manage the links, ideas, and work you share with the world."
    >
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <>
          <ClerkLoading>
            <AuthFormLoading />
          </ClerkLoading>
          <ClerkLoaded>
            <SignIn />
          </ClerkLoaded>
          <ClerkFailed><AuthFormFailed /></ClerkFailed>
        </>
      ) : (
        <div className="panel">
          <h1>Sign in</h1>
          <p>Connect your Clerk keys in .env.local to enable secure sign-in.</p>
        </div>
      )}
    </AuthShell>
  );
}
