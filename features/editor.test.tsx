import { it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LinkForm,
  LinkCard,
  SectionList,
  ProfileForm,
  OnboardingForm,
  PublicLinkButton,
} from './editor';
const link = {
  id: 'a',
  title: 'Portfolio',
  url: 'https://example.com',
  description: 'My work',
  icon: null,
  isVisible: true,
  sectionId: null,
  position: 0,
  userId: 'u',
  createdAt: new Date(),
};
it('shows an accessible external public link', () => {
  render(<PublicLinkButton link={link} />);
  expect(screen.getByRole('link', { name: /Portfolio/ })).toHaveAttribute('href', '/r/a');
  expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
});
it('validates link title before saving', async () => {
  const save = vi.fn();
  render(<LinkForm onSave={save} sections={[]} />);
  await userEvent.click(screen.getByRole('button', { name: 'Save link' }));
  expect(await screen.findByText('Title is required')).toBeVisible();
  expect(save).not.toHaveBeenCalled();
});
it('submits normalized URLs', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<LinkForm onSave={save} sections={[]} />);
  await userEvent.type(screen.getByLabelText('Title'), 'Hello 🌱');
  await userEvent.type(screen.getByLabelText('URL'), 'example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Save link' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Hello 🌱', url: 'https://example.com/' }),
    ),
  );
});
it('exposes link edit and visibility controls', async () => {
  const edit = vi.fn();
  render(<LinkCard link={link} onEdit={edit} onDelete={vi.fn()} onToggle={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Edit Portfolio' }));
  expect(edit).toHaveBeenCalled();
});
it('shows a useful empty state', () => {
  render(<SectionList sections={[]} links={[]} />);
  expect(screen.getByText('Your next chapter starts with a link.')).toBeVisible();
});
it('rejects oversized profile biographies', async () => {
  const save = vi.fn();
  render(
    <ProfileForm
      profile={{ username: 'alex', displayName: 'Alex', bio: '', avatarUrl: '' }}
      onSave={save}
    />,
  );
  await userEvent.type(screen.getByLabelText('Bio'), 'a'.repeat(161));
  await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(save).not.toHaveBeenCalled();
});
it('checks only the final username after typing', async () => {
  const check = vi
    .fn()
    .mockResolvedValue({ available: true, message: 'This username is available' });
  render(<OnboardingForm check={check} submit={vi.fn()} />);
  await userEvent.type(screen.getByLabelText('Username'), 'finalname');
  expect(await screen.findByText('This username is available')).toBeVisible();
  expect(check).toHaveBeenCalledTimes(1);
  expect(check).toHaveBeenCalledWith('finalname');
});
it('renders ungrouped links before populated sections and omits empty sections', () => {
  render(
    <SectionList
      sections={[
        { id: 's', title: 'Social' },
        { id: 'empty', title: 'Empty' },
      ]}
      links={[link, { ...link, id: 'b', title: 'GitHub', sectionId: 's' }]}
    />,
  );
  expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual([
    'PortfolioMy work',
    'GitHubMy work',
  ]);
  expect(screen.getByRole('heading', { name: 'Social' })).toBeVisible();
  expect(screen.queryByText('Empty')).not.toBeInTheDocument();
});
it('disables onboarding submission until a username is available', async () => {
  const check = vi.fn().mockResolvedValue({ available: false, message: 'This username is taken' });
  render(<OnboardingForm check={check} submit={vi.fn()} />);
  await userEvent.type(screen.getByLabelText('Username'), 'taken');
  expect(await screen.findByText('This username is taken')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Create my page' })).toBeDisabled();
});
