'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ExternalLink,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Check,
  CircleAlert,
  Code2 as Github,
  Camera as Instagram,
  Play as Youtube,
  AtSign as Twitter,
  BriefcaseBusiness as Linkedin,
} from 'lucide-react';
import type { Link, Section } from '@prisma/client';
import type { z } from 'zod';
import { linkSchema, profileSchema, platformIcon, usernameSchema } from '@/lib/logic/core';
import { Badge } from '@/components/ui/badge';
import { PROFILE_BIO_LIMIT } from '@/lib/logic/limits';

export function PlatformIcon({ url, size = '1.25em' }: { url: string; size?: number | string }) {
  const Icon =
    {
      youtube: Youtube,
      github: Github,
      instagram: Instagram,
      twitter: Twitter,
      linkedin: Linkedin,
      link: LinkIcon,
    }[platformIcon(url)] ?? LinkIcon;
  return <Icon size={size} aria-hidden />;
}

type PublicLink = Pick<Link, 'id' | 'title' | 'description' | 'url' | 'icon'>;

export function PublicLinkButton({
  link,
  onPreviewClick,
}: {
  link: PublicLink;
  /** When set, the link is inert (used by the demo): it never navigates or records a click. */
  onPreviewClick?: (link: PublicLink) => void;
}) {
  return (
    <a
      className="public-link"
      href={onPreviewClick ? '#' : '/r/' + link.id}
      target={onPreviewClick ? undefined : '_blank'}
      rel="noopener noreferrer"
      onClick={
        onPreviewClick
          ? (event) => {
              event.preventDefault();
              onPreviewClick(link);
            }
          : undefined
      }
    >
      <span className="public-link-icon">
        <PlatformIcon url={link.url} />
      </span>
      <span>
        <strong>{link.title}</strong>
        {link.description && <small>{link.description}</small>}
      </span>
      <ExternalLink size="1em" aria-hidden />
    </a>
  );
}

export function LinkForm({
  onSave,
  onCancel,
  sections,
  initial,
}: {
  onSave: (data: z.infer<typeof linkSchema>) => Promise<unknown>;
  onCancel?: () => void;
  sections: Pick<Section, 'id' | 'title'>[];
  initial?: Link;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof linkSchema>, unknown, z.output<typeof linkSchema>>({
    resolver: zodResolver(linkSchema),
    defaultValues: initial
      ? { ...initial, description: initial.description ?? '', icon: initial.icon ?? '' }
      : { title: '', url: '', description: '', sectionId: null, icon: '' },
  });
  return (
    <form className="form-stack" onSubmit={handleSubmit((data) => onSave(data))} noValidate>
      <Field label="Title" error={errors.title?.message}>
        {(c) => (
          <input className="input" placeholder="My latest project" {...c} {...register('title')} />
        )}
      </Field>
      <Field
        label="URL"
        error={errors.url?.message}
        hint="Paste any web address. https:// is added for you."
      >
        {(c) => (
          <input
            className="input"
            placeholder="example.com/my-project"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            {...c}
            {...register('url')}
          />
        )}
      </Field>
      <Field
        label="Description"
        error={errors.description?.message}
        hint="Optional. Shown under the title."
      >
        {(c) => (
          <input
            className="input"
            placeholder="A little more context"
            {...c}
            {...register('description')}
          />
        )}
      </Field>
      <Field label="Section">
        {(c) => (
          <select
            className="select"
            {...c}
            {...register('sectionId', { setValueAs: (v) => v || null })}
          >
            <option value="">Ungrouped</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        )}
      </Field>
      <div className="dialog-foot">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button loading={isSubmitting}>Save link</Button>
      </div>
    </form>
  );
}

export function LinkCard({
  link,
  clicks,
  onEdit,
  onDelete,
  onToggle,
}: {
  link: Link;
  /** Clicks in the last 30 days, when known. */
  clicks?: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <article className="link-card" data-hidden={!link.isVisible}>
      <div className="icon-box">
        <PlatformIcon url={link.url} size={18} />
      </div>
      <div className="link-copy">
        <strong>{link.title}</strong>
        <small>{link.url}</small>
      </div>
      <div className="link-meta">
        {!link.isVisible && <Badge>Hidden</Badge>}
        {clicks !== undefined && (
          <span className="link-clicks num" title="Clicks in the last 30 days">
            {clicks}
            <small>clicks</small>
          </span>
        )}
      </div>
      <div className="link-actions">
        <button
          type="button"
          className="icon-btn"
          title={link.isVisible ? 'Hide from your page' : 'Show on your page'}
          aria-label={(link.isVisible ? 'Hide ' : 'Show ') + link.title}
          onClick={onToggle}
        >
          {link.isVisible ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Edit"
          aria-label={'Edit ' + link.title}
          onClick={onEdit}
        >
          <Pencil size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-btn danger"
          title="Delete"
          aria-label={'Delete ' + link.title}
          onClick={onDelete}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
    </article>
  );
}

export function SectionList({
  sections,
  links,
  audience = 'owner',
  onPreviewClick,
}: {
  sections: Pick<Section, 'id' | 'title'>[];
  links: Link[];
  /** Who is looking: owners are nudged to add links, visitors just see a quiet note. */
  audience?: 'owner' | 'visitor';
  onPreviewClick?: (link: PublicLink) => void;
}) {
  if (!links.length && !sections.length)
    return audience === 'visitor' ? (
      <div className="public-empty">
        <p style={{ margin: 0 }}>Nothing has been shared here yet.</p>
      </div>
    ) : (
      <div className="empty-state">
        <span className="empty-state-icon" aria-hidden>
          <LinkIcon size={22} />
        </span>
        <h3>Your next chapter starts with a link.</h3>
        <p>Add your first link to make this space yours.</p>
      </div>
    );
  const ungrouped = links.filter((l) => !l.sectionId);
  return (
    <>
      {ungrouped.length > 0 && (
        <div className="public-links">
          {ungrouped.map((l) => (
            <PublicLinkButton key={l.id} link={l} onPreviewClick={onPreviewClick} />
          ))}
        </div>
      )}
      {sections.map((s) => {
        const items = links.filter((l) => l.sectionId === s.id);
        return items.length ? (
          <section key={s.id} className="public-section">
            <h3 className="section-title">{s.title}</h3>
            <div className="public-links">
              {items.map((l) => (
                <PublicLinkButton key={l.id} link={l} onPreviewClick={onPreviewClick} />
              ))}
            </div>
          </section>
        ) : null;
      })}
    </>
  );
}

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({
  profile,
  onSave,
  onValuesChange,
}: {
  profile: ProfileValues;
  /** Reject (throw) to signal a failed save; the form stays dirty so the user can retry. */
  onSave: (data: ProfileValues) => Promise<unknown>;
  onValuesChange?: (values: Partial<ProfileValues>) => void;
}) {
  const [saveError, setSaveError] = useState(''),
    [saved, setSaved] = useState(profile);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.input<typeof profileSchema>, unknown, z.output<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });
  const [displayName = '', bio = '', avatar = '', username = ''] = useWatch({
    control,
    name: ['displayName', 'bio', 'avatarUrl', 'username'],
  });
  useEffect(() => {
    onValuesChange?.({ displayName, bio, avatarUrl: avatar, username });
  }, [displayName, bio, avatar, username, onValuesChange]);
  const bioLength = bio.length;
  return (
    <form
      className="profile-form"
      noValidate
      onSubmit={handleSubmit(async (data) => {
        setSaveError('');
        try {
          await onSave(data);
          setSaved(data);
          reset(data);
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : 'Unable to save your profile.');
        }
      })}
    >
      <section className="card form-section" aria-labelledby="profile-public">
        <div className="card-header">
          <div>
            <h2 id="profile-public">Public profile</h2>
            <p>Everything here is visible to anyone who opens your page.</p>
          </div>
        </div>
        <div className="card-body">
          <Field label="Display name" error={errors.displayName?.message}>
            {(c) => (
              <input className="input" autoComplete="name" {...c} {...register('displayName')} />
            )}
          </Field>
          <Field
            label="Bio"
            error={errors.bio?.message}
            hint={
              <>
                A line or two about you.{' '}
                <span className="char-count num" data-over={bioLength > PROFILE_BIO_LIMIT}>
                  {bioLength}/{PROFILE_BIO_LIMIT}
                </span>
              </>
            }
          >
            {(c) => <textarea className="textarea" rows={4} {...c} {...register('bio')} />}
          </Field>
          <div className="avatar-field">
            <Field
              label="Avatar URL"
              error={errors.avatarUrl?.message}
              hint="Link to an image on the web. Leave empty to show your initial."
            >
              {(c) => (
                <input
                  className="input"
                  placeholder="https://…"
                  inputMode="url"
                  autoCapitalize="none"
                  spellCheck={false}
                  {...c}
                  {...register('avatarUrl')}
                />
              )}
            </Field>
            <span className="avatar-thumb" aria-hidden>
              {avatar && !errors.avatarUrl ? (
                // A live preview of whatever URL is being typed; next/image needs a vetted URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" referrerPolicy="no-referrer" />
              ) : (
                (displayName || 'L').slice(0, 1)
              )}
            </span>
          </div>
        </div>
      </section>

      <section className="card form-section" aria-labelledby="profile-address">
        <div className="card-header">
          <div>
            <h2 id="profile-address">Your address</h2>
            <p>The public web address of your page.</p>
          </div>
        </div>
        <div className="card-body">
          <Field
            label="Username"
            error={errors.username?.message}
            hint={
              <>
                Your page lives at <strong>linkhouse/{username || 'username'}</strong>. Changing
                this changes the address you share, so old links to your page will stop working.
              </>
            }
          >
            {(c) => (
              <div className="input-group">
                <span className="input-prefix" aria-hidden>
                  linkhouse/
                </span>
                <input
                  className="input"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  {...c}
                  {...register('username')}
                />
              </div>
            )}
          </Field>
        </div>
      </section>

      {saveError && (
        <p className="form-error" role="alert">
          <CircleAlert size={16} aria-hidden style={{ flex: 'none', marginTop: 2 }} />
          {saveError}
        </p>
      )}

      <div className="save-bar">
        <span className="save-bar-status" aria-live="polite">
          {isDirty ? (
            <>
              <span className="dot" style={{ color: 'var(--warning)' }} aria-hidden /> Unsaved
              changes
            </>
          ) : (
            <>
              <Check size={15} aria-hidden style={{ color: 'var(--success)' }} /> Profile is up to
              date
            </>
          )}
        </span>
        <div className="form-actions">
          <Button
            type="button"
            variant="ghost"
            disabled={!isDirty || isSubmitting}
            onClick={() => reset(saved)}
          >
            Discard
          </Button>
          <Button disabled={!isDirty} loading={isSubmitting}>
            Save profile
          </Button>
        </div>
      </div>
    </form>
  );
}

export function OnboardingForm({
  check,
  submit,
}: {
  check: (value: string) => Promise<{ available: boolean; message: string }>;
  submit: (value: string) => Promise<unknown>;
}) {
  const [value, setValue] = useState(''),
    [status, setStatus] = useState({ available: false, message: '' }),
    [pending, setPending] = useState(false);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(async () => {
      const parsed = usernameSchema.safeParse(value);
      if (!parsed.success) {
        if (live)
          setStatus({ available: false, message: value ? parsed.error.issues[0].message : '' });
        return;
      }
      try {
        const result = await check(value);
        if (live) setStatus(result);
      } catch {
        if (live) setStatus({ available: false, message: 'Unable to check. Please try again.' });
      }
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [value, check]);
  const checking = status.message === 'Checking…';
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        try {
          const result = (await submit(value)) as { error?: string } | undefined;
          if (result?.error) setStatus({ available: false, message: result.error });
        } finally {
          setPending(false);
        }
      }}
    >
      <Field label="Username">
        {(c) => (
          <div className="input-group">
            <span className="input-prefix" aria-hidden>
              linkhouse/
            </span>
            <input
              className="input"
              {...c}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setStatus({ available: false, message: 'Checking…' });
              }}
              placeholder="your-name"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
          </div>
        )}
      </Field>
      <p
        role="status"
        className="username-status"
        data-state={status.available ? 'ok' : checking || !status.message ? 'idle' : 'error'}
      >
        {status.message}
      </p>
      <Button size="lg" block disabled={!status.available} loading={pending}>
        Create my page
      </Button>
    </form>
  );
}
