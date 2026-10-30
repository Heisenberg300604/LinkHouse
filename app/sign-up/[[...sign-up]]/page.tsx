import { ClerkFailed, ClerkLoaded, ClerkLoading, SignUp } from '@clerk/nextjs';
import { AuthFormFailed, AuthFormLoading, AuthShell } from '@/components/auth-shell';

export const metadata = { title: 'Create your account' };

export default function Page() {
  return (
    <AuthShell>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <>
          <ClerkLoading>
            <AuthFormLoading />
          </ClerkLoading>
          <ClerkLoaded>
            <SignUp />
          </ClerkLoaded>
          <ClerkFailed>
            <AuthFormFailed />
          </ClerkFailed>
        </>
      ) : (
        <div className="card card-body">
          <h1>Create your account</h1>
          <p>Add your Clerk keys to .env.local to enable secure sign-up.</p>
        </div>
      )}
    </AuthShell>
  );
}
