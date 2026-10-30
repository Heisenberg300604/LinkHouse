import type { Appearance } from '@clerk/ui';

/**
 * One Clerk theme for every prebuilt component, expressed through Clerk's supported
 * `variables` and `elements` appearance API. Colors reference the app's CSS tokens, so
 * light/dark mode and any future palette change flow through without extra overrides.
 */
const field = {
  minHeight: '2.5rem',
  borderRadius: 'var(--radius-md)',
  borderColor: 'var(--border-strong)',
  boxShadow: 'var(--shadow-xs)',
};

const sharedElements = {
  rootBox: { width: '100%' },
  cardBox: { width: '100%', boxShadow: 'none', border: '0', backgroundColor: 'transparent' },
  card: {
    width: '100%',
    boxShadow: 'none',
    border: '0',
    backgroundColor: 'transparent',
    padding: '0',
    gap: '1.5rem',
  },
  headerTitle: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em' },
  headerSubtitle: { fontSize: '0.875rem' },
  socialButtonsBlockButton: {
    ...field,
    backgroundColor: 'var(--surface)',
    fontWeight: 500,
  },
  socialButtonsBlockButtonText: { fontWeight: 500 },
  dividerLine: { backgroundColor: 'var(--border)' },
  dividerText: { fontSize: '0.75rem', color: 'var(--muted)' },
  formFieldLabel: { fontSize: '0.8125rem', fontWeight: 500 },
  formFieldInput: { ...field, backgroundColor: 'var(--surface)' },
  formFieldInputShowPasswordButton: { color: 'var(--muted)' },
  formFieldErrorText: { fontSize: '0.75rem', fontWeight: 500 },
  formFieldHintText: { fontSize: '0.75rem' },
  alert: { borderRadius: 'var(--radius-md)' },
  formButtonPrimary: {
    minHeight: '2.5rem',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-xs)',
    fontSize: '0.875rem',
    fontWeight: 500,
    textTransform: 'none' as const,
  },
  footer: { backgroundColor: 'transparent' },
  footerActionLink: { color: 'var(--accent-text)', fontWeight: 500 },
  identityPreview: { borderRadius: 'var(--radius-md)', borderColor: 'var(--border-strong)' },
  otpCodeFieldInput: { ...field },
};

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#4F46E5',
    colorPrimaryForeground: '#ffffff',
    colorBackground: 'var(--surface)',
    colorForeground: 'var(--text)',
    colorNeutral: 'var(--text)',
    colorBorder: 'var(--border)',
    colorInput: 'var(--surface)',
    colorInputForeground: 'var(--text)',
    colorMuted: 'var(--soft)',
    colorMutedForeground: 'var(--muted)',
    colorDanger: 'var(--danger)',
    colorSuccess: 'var(--success)',
    colorRing: 'var(--ring)',
    colorModalBackdrop: 'rgb(12 10 9 / 0.55)',
    borderRadius: '0.5rem',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize: '0.875rem',
  },
  signIn: { elements: sharedElements },
  signUp: { elements: sharedElements },
  userProfile: {
    elements: {
      rootBox: { width: '100%', maxWidth: '100%' },
      cardBox: {
        width: '100%',
        maxWidth: '100%',
        boxShadow: 'none',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      },
      card: { width: '100%', minWidth: '0', boxShadow: 'none' },
      navbar: { flex: '0 0 11.5rem' },
      profilePageContent: { minWidth: '0' },
      formFieldInput: { ...field },
      formButtonPrimary: sharedElements.formButtonPrimary,
    },
  },
  userButton: {
    elements: { userButtonAvatarBox: { width: '2rem', height: '2rem' } },
  },
};
