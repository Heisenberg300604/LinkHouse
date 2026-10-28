import { ClerkFailed, ClerkLoaded, ClerkLoading, SignUp } from '@clerk/nextjs';
import { AuthFormFailed, AuthFormLoading, AuthShell } from '@/components/auth-shell';

export default function Page() {
  return (
    <AuthShell
      eyebrow="YOUR LINKHOUSE AWAITS"
      title="Make a home for what matters."
      description="Create one beautiful page for your links, work, and the things you want people to find."
    >
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <>
          <ClerkLoading>
            <AuthFormLoading />
          </ClerkLoading>
          <ClerkLoaded>
            <SignUp />
          </ClerkLoaded>
          <ClerkFailed><AuthFormFailed /></ClerkFailed>
        </>
      ) : (
        <div className="panel">
          <h1>Create your account</h1>
          <p>Connect your Clerk keys in .env.local to enable secure sign-up.</p>
        </div>
      )}
    </AuthShell>
  );
}
