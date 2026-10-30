import { ClerkFailed, ClerkLoaded, ClerkLoading, SignIn } from '@clerk/nextjs';
import { AuthFormFailed, AuthFormLoading, AuthShell } from '@/components/auth-shell';

export const metadata = { title: 'Sign in' };

export default function Page() {
  return (
    <AuthShell>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <>
          <ClerkLoading>
            <AuthFormLoading />
          </ClerkLoading>
          <ClerkLoaded>
            <SignIn />
          </ClerkLoaded>
          <ClerkFailed>
            <AuthFormFailed />
          </ClerkFailed>
        </>
      ) : (
        <div className="card card-body">
          <h2>Sign-in isn’t configured</h2>
          <p>Add your Clerk keys to .env.local to enable secure sign-in.</p>
        </div>
      )}
    </AuthShell>
  );
}
