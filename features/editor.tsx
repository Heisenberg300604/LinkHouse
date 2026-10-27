'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ExternalLink,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Code2 as Github,
  Camera as Instagram,
  Play as Youtube,
  AtSign as Twitter,
  BriefcaseBusiness as Linkedin,
} from 'lucide-react';
import type { Link, Section } from '@prisma/client';
import type { z } from 'zod';
import { linkSchema, profileSchema, platformIcon, usernameSchema } from '@/lib/logic/core';
export function PlatformIcon({ url }: { url: string }) {
  const Icon =
    {
      youtube: Youtube,
      github: Github,
      instagram: Instagram,
      twitter: Twitter,
      linkedin: Linkedin,
      link: LinkIcon,
    }[platformIcon(url)] ?? LinkIcon;
  return <Icon size={20} aria-hidden />;
}
export function PublicLinkButton({
  link,
}: {
  link: Pick<Link, 'id' | 'title' | 'description' | 'url' | 'icon'>;
}) {
  return (
    <a className="public-link" href={'/r/' + link.id} target="_blank" rel="noopener noreferrer">
      <PlatformIcon url={link.url} />
      <span>
        <strong>{link.title}</strong>
        {link.description && <small>{link.description}</small>}
      </span>
      <ExternalLink size={15} aria-hidden />
    </a>
  );
}
export function LinkForm({
  onSave,
  sections,
  initial,
}: {
  onSave: (data: z.infer<typeof linkSchema>) => Promise<unknown>;
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
      <label>
        Title
        <input {...register('title')} placeholder="My latest project" />
      </label>
      <label>
        URL
        <input {...register('url')} placeholder="https://example.com" />
      </label>
      <label>
        Description
        <input {...register('description')} placeholder="A little more context (optional)" />
      </label>
      <label>
        Section
        <select {...register('sectionId', { setValueAs: (v) => v || null })}>
          <option value="">Ungrouped</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Icon
        <input {...register('icon')} placeholder="Auto-detected from the URL" />
      </label>
      {Object.values(errors).map((e, i) => (
        <p role="alert" key={i}>
          {e.message}
        </p>
      ))}
      <Button disabled={isSubmitting}>Save link</Button>
    </form>
  );
}
export function LinkCard({
  link,
  onEdit,
  onDelete,
  onToggle,
}: {
  link: Link;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <article className="link-card">
      <div className="icon-box">
        <PlatformIcon url={link.url} />
      </div>
      <div className="link-copy">
        <strong>{link.title}</strong>
        <small>{link.url}</small>
      </div>
      <button aria-label={(link.isVisible ? 'Hide ' : 'Show ') + link.title} onClick={onToggle}>
        {link.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
      <button aria-label={'Edit ' + link.title} onClick={onEdit}>
        <Pencil size={17} />
      </button>
      <button aria-label={'Delete ' + link.title} onClick={onDelete}>
        <Trash2 size={17} />
      </button>
    </article>
  );
}
export function SectionList({
  sections,
  links,
}: {
  sections: Pick<Section, 'id' | 'title'>[];
  links: Link[];
}) {
  if (!links.length && !sections.length)
    return (
      <div className="empty">
        <LinkIcon size={28} />
        <h3>Your next chapter starts with a link.</h3>
        <p>Add your first link to make this space yours.</p>
      </div>
    );
  return (
    <>
      {links
        .filter((l) => !l.sectionId)
        .map((l) => (
          <PublicLinkButton key={l.id} link={l} />
        ))}
      {sections.map((s) => {
        const items = links.filter((l) => l.sectionId === s.id);
        return items.length ? (
          <section key={s.id}>
            <h3 className="section-title">{s.title}</h3>
            {items.map((l) => (
              <PublicLinkButton key={l.id} link={l} />
            ))}
          </section>
        ) : null;
      })}
    </>
  );
}
export function ProfileForm({
  profile,
  onSave,
}: {
  profile: z.infer<typeof profileSchema>;
  onSave: (data: z.infer<typeof profileSchema>) => Promise<unknown>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof profileSchema>, unknown, z.output<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });
  return (
    <form className="form-stack" onSubmit={handleSubmit((data) => onSave(data))} noValidate>
      <label>
        Display name
        <input {...register('displayName')} />
      </label>
      <label>
        Username
        <input {...register('username')} />
      </label>
      <label>
        Bio
        <textarea aria-label="Bio" rows={4} {...register('bio')} />
        <small>A little about you. Up to 160 characters.</small>
      </label>
      <label>
        Avatar URL
        <input {...register('avatarUrl')} placeholder="https://…" />
      </label>
      {Object.values(errors).map((e, i) => (
        <p role="alert" key={i}>
          {e.message}
        </p>
      ))}
      <Button disabled={isSubmitting}>Save profile</Button>
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
      <label>
        Username
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus({ available: false, message: 'Checking…' });
          }}
          placeholder="your-name"
          autoComplete="off"
        />
      </label>
      <p role="status">{status.message}</p>
      <button className="primary" disabled={!status.available || pending}>
        Create my page
      </button>
    </form>
  );
}
