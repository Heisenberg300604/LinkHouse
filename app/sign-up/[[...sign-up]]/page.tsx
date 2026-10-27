import { ClerkFailed, ClerkLoaded, SignUp } from '@clerk/nextjs';
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
          <AuthFormLoading />
          <ClerkLoaded>
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'clerk-root', card: 'clerk-card', headerTitle: 'clerk-title', headerSubtitle: 'clerk-subtitle',
                  socialButtonsBlockButton: 'clerk-social-button', dividerLine: 'clerk-divider-line', dividerText: 'clerk-divider-text',
                  formFieldLabel: 'clerk-field-label', formFieldInput: 'clerk-field-input', formButtonPrimary: 'clerk-primary-button',
                  footerActionLink: 'clerk-footer-link',
                },
              }}
            />
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
