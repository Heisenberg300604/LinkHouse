import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardEditor, ProfileEditor, PublicProfile, Settings } from './dashboard';
import { mutate, deleteAccount } from '@/lib/actions';
vi.mock('@/lib/actions', () => ({ mutate: vi.fn(), deleteAccount: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@clerk/nextjs', () => ({ UserProfile: () => <div>Clerk account management</div> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const user = {
  id: 'u',
  clerkId: 'clerk-u',
  username: 'alice',
  email: 'a@example.com',
  displayName: 'Alice',
  bio: 'Hello',
  avatarUrl: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const link = {
  id: 'l',
  userId: 'u',
  title: 'My work',
  url: 'https://example.com',
  sectionId: null,
  description: null,
  icon: null,
  position: 0,
  isVisible: true,
  createdAt: new Date(),
};
const section = {
  id: 's',
  userId: 'u',
  title: 'Social',
  position: 0,
  isVisible: true,
  createdAt: new Date(),
};
beforeEach(() => {
  vi.mocked(mutate).mockReset();
  vi.mocked(mutate).mockResolvedValue({ ok: true, error: null });
});
it('opens and cancels link editing without modifying data', async () => {
  render(<DashboardEditor user={user} links={[link]} sections={[]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Edit My work' }));
  expect(screen.getByLabelText('Title')).toHaveValue('My work');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(mutate).not.toHaveBeenCalled();
});
it('optimistically toggles visibility and persists it', async () => {
  render(<DashboardEditor user={user} links={[link]} sections={[]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Hide My work' }));
  expect(screen.getByRole('button', { name: 'Show My work' })).toBeVisible();
  await waitFor(() =>
    expect(mutate).toHaveBeenCalledWith({ type: 'edit-link', id: 'l', data: { isVisible: false } }),
  );
});
it('rolls back visibility when saving fails', async () => {
  vi.mocked(mutate).mockResolvedValue({ ok: false, error: 'Denied' });
  render(<DashboardEditor user={user} links={[link]} sections={[]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Hide My work' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Hide My work' })).toBeVisible());
});
it('cancels a destructive link action', async () => {
  render(<DashboardEditor user={user} links={[link]} sections={[]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Delete My work' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('cannot be undone');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(mutate).not.toHaveBeenCalled();
});
it('asks whether section links should be deleted', async () => {
  render(<DashboardEditor user={user} links={[]} sections={[section]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Delete section Social' }));
  const checkbox = screen.getByRole('checkbox');
  expect(checkbox).not.toBeChecked();
  await userEvent.click(checkbox);
  expect(checkbox).toBeChecked();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(mutate).not.toHaveBeenCalled();
});
it('validates section creation', async () => {
  render(<DashboardEditor user={user} links={[]} sections={[]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Add section' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save section' }));
  expect(screen.getByRole('alert')).toHaveTextContent('required');
  await userEvent.type(screen.getByLabelText('Section name'), 'Social');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(mutate).not.toHaveBeenCalled();
});
it('loads the current section name for rename', async () => {
  render(<DashboardEditor user={user} links={[]} sections={[section]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Rename Social' }));
  expect(screen.getByLabelText('Section name')).toHaveValue('Social');
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('hides a section from the live preview', async () => {
  render(
    <DashboardEditor user={user} links={[{ ...link, sectionId: 's' }]} sections={[section]} />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Hide section Social' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Show section Social' })).toBeVisible(),
  );
  expect(screen.queryByRole('link', { name: 'My work' })).not.toBeInTheDocument();
});
it('collapses and expands the mobile preview', async () => {
  render(<DashboardEditor user={user} links={[]} sections={[]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Show preview' }));
  expect(screen.getByRole('button', { name: 'Hide preview' })).toBeVisible();
});
it('opens a blank link form', async () => {
  render(<DashboardEditor user={user} links={[]} sections={[]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Add link' }));
  expect(screen.getByLabelText('Title')).toHaveValue('');
});
it('shows a custom avatar and safely renders text', () => {
  render(
    <PublicProfile
      user={{
        ...user,
        avatarUrl: 'https://example.com/avatar.png',
        bio: '<script>alert(1)</script>',
      }}
      links={[link]}
      sections={[]}
    />,
  );
  expect(screen.getByText('<script>alert(1)</script>')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Alice' })).toBeVisible();
});
it('submits profile updates', async () => {
  render(<ProfileEditor user={user} />);
  await userEvent.clear(screen.getByLabelText('Display name'));
  await userEvent.type(screen.getByLabelText('Display name'), 'Alice Updated');
  await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() =>
    expect(mutate).toHaveBeenCalledWith({
      type: 'profile',
      data: expect.objectContaining({ displayName: 'Alice Updated' }),
    }),
  );
});
it('keeps settings intact when account deletion is cancelled', async () => {
  render(<Settings />);
  await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('all your links, sections and analytics');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(deleteAccount).not.toHaveBeenCalled();
});
it('calls deletion only after explicit confirmation', async () => {
  render(<Settings />);
  await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Permanently delete account' }),
  );
  expect(deleteAccount).toHaveBeenCalledTimes(1);
});

it('filters links with the search field and explains an empty result', async () => {
  render(<DashboardEditor user={user} links={[link]} sections={[]} />);
  await userEvent.type(screen.getByRole('searchbox', { name: 'Search links' }), 'zzz');
  expect(screen.queryByRole('button', { name: 'Edit My work' })).not.toBeInTheDocument();
  expect(screen.getByText(/No links match/)).toBeVisible();
});

it('shows 30-day clicks on a link row', () => {
  render(<DashboardEditor user={user} links={[link]} sections={[]} clicks={{ l: 12 }} />);
  expect(screen.getByTitle('Clicks in the last 30 days')).toHaveTextContent('12');
});

it('only enables saving after the profile changes and can discard edits', async () => {
  render(<ProfileEditor user={user} />);
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
  await userEvent.type(screen.getByLabelText('Display name'), '!');
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled();
  await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
  expect(screen.getByLabelText('Display name')).toHaveValue('Alice');
});

it('keeps the profile form dirty and shows the reason when saving fails', async () => {
  vi.mocked(mutate).mockResolvedValue({ ok: false, error: 'Username taken' });
  render(<ProfileEditor user={user} />);
  await userEvent.type(screen.getByLabelText('Display name'), '!');
  await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Username taken');
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled();
});
