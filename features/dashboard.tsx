'use client';
import NextLink from 'next/link';
import Image from 'next/image';
import { useCallback, useState, useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { Link, Section, User } from '@prisma/client';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Link2,
  Search,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@clerk/nextjs';
import { mutate, deleteAccount } from '@/lib/actions';
import { reorder, sectionSchema } from '@/lib/logic/core';
import { LINK_LIMIT } from '@/lib/logic/limits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { BrandMark } from '@/components/brand';
import { LinkForm, LinkCard, SectionList, ProfileForm } from './editor';
import { ShareButton } from './share';

export function Sortable({
  id,
  label,
  className = 'sortable',
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const handle = (
    <button
      type="button"
      className="drag"
      title="Drag to reorder"
      aria-label={'Reorder ' + label}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} aria-hidden />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={className}
      data-dragging={isDragging}
    >
      {children(handle)}
    </div>
  );
}

const inertLink = () =>
  toast('This is a preview', { description: 'Open your public page to try the links.' });

export function DashboardEditor({
  user,
  links: initialLinks,
  sections: initialSections,
  clicks = {},
}: {
  user: User;
  links: Link[];
  sections: Section[];
  /** Clicks per link id over the last 30 days. */
  clicks?: Record<string, number>;
}) {
  const [links, setLinks] = useState(initialLinks),
    [sections, setSections] = useState(initialSections),
    [source, setSource] = useState({ links: initialLinks, sections: initialSections });
  // Adopt fresh server data (after router.refresh) without an effect: the documented
  // "adjust state when a prop changes" pattern.
  if (source.links !== initialLinks || source.sections !== initialSections) {
    setSource({ links: initialLinks, sections: initialSections });
    setLinks(initialLinks);
    setSections(initialSections);
  }
  const [editing, setEditing] = useState<Link | null | undefined>(),
    [sectionEdit, setSectionEdit] = useState<Section | null | undefined>();
  const [sectionTitle, setSectionTitle] = useState(''),
    [sectionError, setSectionError] = useState('');
  const [deleting, setDeleting] = useState<{ id: string; section: boolean; name: string } | null>(
      null,
    ),
    [deleteLinks, setDeleteLinks] = useState(false);
  const [preview, setPreview] = useState(false),
    [query, setQuery] = useState(''),
    [pending, startTransition] = useTransition();
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function save(input: unknown) {
    const result = await mutate(input);
    if (!result.ok) {
      toast.error(result.error);
      throw new Error(result.error ?? 'Unable to save');
    }
    toast.success('Changes saved');
    router.refresh();
  }

  async function order(
    event: DragEndEvent,
    kind: 'links' | 'sections',
    sectionId: string | null = null,
  ) {
    if (!event.over || event.active.id === event.over.id) return;
    const rows = kind === 'links' ? links.filter((l) => l.sectionId === sectionId) : sections;
    const ids = reorder(
      rows.map((r) => r.id),
      String(event.active.id),
      String(event.over.id),
    );
    const previousLinks = links,
      previousSections = sections;
    if (kind === 'links')
      setLinks(links.map((l) => (ids.includes(l.id) ? { ...l, position: ids.indexOf(l.id) } : l)));
    else setSections(sections.map((s) => ({ ...s, position: ids.indexOf(s.id) })));
    try {
      await save({ type: 'reorder', kind, ids, sectionId });
    } catch {
      setLinks(previousLinks);
      setSections(previousSections);
    }
  }

  const needle = query.trim().toLowerCase();
  const matches = (l: Link) =>
    !needle ||
    [l.title, l.url, l.description ?? ''].some((text) => text.toLowerCase().includes(needle));
  const sortedSections = [...sections].sort((a, b) => a.position - b.position);
  const visibleSections = sortedSections.filter(
    (s) =>
      !needle ||
      s.title.toLowerCase().includes(needle) ||
      links.some((l) => l.sectionId === s.id && matches(l)),
  );
  const ungrouped = links
    .filter((l) => !l.sectionId && matches(l))
    .sort((a, b) => a.position - b.position);
  const nothingFound = Boolean(needle) && !ungrouped.length && !visibleSections.length;

  function toggleLink(link: Link) {
    const before = links;
    setLinks(links.map((l) => (l.id === link.id ? { ...l, isVisible: !l.isVisible } : l)));
    startTransition(async () => {
      try {
        await save({ type: 'edit-link', id: link.id, data: { isVisible: !link.isVisible } });
      } catch {
        setLinks(before);
      }
    });
  }

  function toggleSection(section: Section) {
    const before = sections;
    setSections(sections.map((s) => (s.id === section.id ? { ...s, isVisible: !s.isVisible } : s)));
    startTransition(async () => {
      try {
        await save({
          type: 'edit-section',
          id: section.id,
          data: { isVisible: !section.isVisible },
        });
      } catch {
        setSections(before);
      }
    });
  }

  function group(sectionId: string | null) {
    const items = (
      sectionId ? links.filter((l) => l.sectionId === sectionId && matches(l)) : ungrouped
    )
      .slice()
      .sort((a, b) => a.position - b.position);
    return (
      <DndContext
        id={'links-' + (sectionId ?? 'ungrouped')}
        sensors={sensors}
        onDragEnd={(e) => order(e, 'links', sectionId)}
      >
        <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {items.map((link) => (
            <Sortable key={link.id} id={link.id} label={link.title}>
              {(handle) => (
                <>
                  {handle}
                  <div className="sortable-body">
                    <LinkCard
                      link={link}
                      clicks={clicks[link.id]}
                      onEdit={() => setEditing(link)}
                      onDelete={() => {
                        setDeleting({ id: link.id, section: false, name: link.title });
                        setDeleteLinks(false);
                      }}
                      onToggle={() => toggleLink(link)}
                    />
                  </div>
                </>
              )}
            </Sortable>
          ))}
        </SortableContext>
      </DndContext>
    );
  }

  const publicLinks = links.filter(
    (l) =>
      l.isVisible && (!l.sectionId || sections.some((s) => s.id === l.sectionId && s.isVisible)),
  );
  const isEmpty = !links.length && !sections.length;

  return (
    <>
      <PageHeader
        title="Your links"
        description="Add, group and reorder what appears on your public page."
        actions={
          <>
            <Button variant="ghost" className="mobile-preview" onClick={() => setPreview(!preview)}>
              {preview ? 'Hide preview' : 'Show preview'}
            </Button>
            {user.username && (
              <ShareButton username={user.username} displayName={user.displayName} />
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setSectionEdit(null);
                setSectionTitle('');
                setSectionError('');
              }}
            >
              <Plus size={16} aria-hidden />
              Add section
            </Button>
            <Button onClick={() => setEditing(null)}>
              <Plus size={16} aria-hidden />
              Add link
            </Button>
          </>
        }
      />
      <div className="editor-layout">
        <div className="editor-main">
          {isEmpty ? (
            <EmptyState
              icon={<Link2 size={22} />}
              title="Your page is empty"
              action={
                <Button onClick={() => setEditing(null)}>
                  <Plus size={16} aria-hidden />
                  Add your first link
                </Button>
              }
            >
              Add a link to your portfolio, newsletter or socials. It appears on your public page as
              soon as you save.
            </EmptyState>
          ) : (
            <>
              <div className="editor-toolbar">
                <div className="search-field">
                  <Search size={16} aria-hidden />
                  <input
                    className="input"
                    type="search"
                    placeholder="Search links"
                    aria-label="Search links"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="limit-meter num">
                  <progress value={links.length} max={LINK_LIMIT} aria-hidden />
                  <span>
                    {links.length} / {LINK_LIMIT} links
                  </span>
                </div>
              </div>
              <div className="link-groups">
                {ungrouped.length > 0 && (
                  <section className="card" aria-label="Ungrouped links">
                    {sections.length > 0 && (
                      <div className="link-group-head">
                        <div className="link-group-title">
                          <h2>Ungrouped</h2>
                          <small>{ungrouped.length}</small>
                        </div>
                      </div>
                    )}
                    <div className="link-group-body">{group(null)}</div>
                  </section>
                )}
                <DndContext id="sections" sensors={sensors} onDragEnd={(e) => order(e, 'sections')}>
                  <SortableContext
                    items={visibleSections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {visibleSections.map((section) => (
                      <Sortable
                        key={section.id}
                        id={section.id}
                        label={section.title}
                        className="card"
                      >
                        {(handle) => (
                          <section aria-label={section.title}>
                            <div className="link-group-head">
                              <div className="link-group-title">
                                {handle}
                                <h3>{section.title}</h3>
                                {!section.isVisible && <Badge>Hidden</Badge>}
                              </div>
                              <div className="link-group-actions">
                                <button
                                  type="button"
                                  className="icon-btn"
                                  title={section.isVisible ? 'Hide section' : 'Show section'}
                                  aria-label={
                                    (section.isVisible ? 'Hide section ' : 'Show section ') +
                                    section.title
                                  }
                                  onClick={() => toggleSection(section)}
                                >
                                  {section.isVisible ? (
                                    <Eye size={16} aria-hidden />
                                  ) : (
                                    <EyeOff size={16} aria-hidden />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  title="Rename section"
                                  aria-label={'Rename ' + section.title}
                                  onClick={() => {
                                    setSectionEdit(section);
                                    setSectionTitle(section.title);
                                    setSectionError('');
                                  }}
                                >
                                  <Pencil size={16} aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn danger"
                                  title="Delete section"
                                  aria-label={'Delete section ' + section.title}
                                  onClick={() => {
                                    setDeleting({
                                      id: section.id,
                                      section: true,
                                      name: section.title,
                                    });
                                    setDeleteLinks(false);
                                  }}
                                >
                                  <Trash2 size={16} aria-hidden />
                                </button>
                              </div>
                            </div>
                            <div className="link-group-body">
                              {group(section.id)}
                              {!links.some((l) => l.sectionId === section.id) && (
                                <p className="link-group-empty muted">
                                  Move a link here using its edit form. Empty sections stay off your
                                  public page.
                                </p>
                              )}
                            </div>
                          </section>
                        )}
                      </Sortable>
                    ))}
                  </SortableContext>
                </DndContext>
                {nothingFound && (
                  <p className="no-results muted" role="status">
                    No links match “{query}”.
                  </p>
                )}
              </div>
              <p className="hint">
                Drag the handle to reorder, or focus it and use Space, the arrow keys, then Space.
                Clicks are counted over the last 30 days.
              </p>
            </>
          )}
        </div>
        <aside className={'preview ' + (preview ? 'preview-open' : '')} aria-label="Live preview">
          <div className="preview-head">
            <span className="eyebrow">Live preview</span>
            <Badge tone="success" dot>
              Published
            </Badge>
          </div>
          <div className="phone">
            <div className="phone-screen">
              <span className="phone-notch" aria-hidden />
              <PublicProfile
                user={user}
                links={publicLinks}
                sections={sections.filter((s) => s.isVisible)}
                headingLevel={2}
                onPreviewClick={inertLink}
              />
            </div>
          </div>
          <NextLink
            className="preview-url"
            href={'/' + user.username}
            target="_blank"
            rel="noreferrer"
          >
            linkhouse/{user.username} ↗
          </NextLink>
        </aside>
      </div>

      {editing !== undefined && (
        <Dialog title={editing ? 'Edit link' : 'Add a link'} onClose={() => setEditing(undefined)}>
          <LinkForm
            initial={editing ?? undefined}
            sections={sections}
            onCancel={() => setEditing(undefined)}
            onSave={async (data) => {
              try {
                await save(
                  editing
                    ? { type: 'edit-link', id: editing.id, data }
                    : { type: 'add-link', data },
                );
                setEditing(undefined);
              } catch {
                /* the toast already explained; keep the dialog open so nothing typed is lost */
              }
            }}
          />
        </Dialog>
      )}
      {sectionEdit !== undefined && (
        <Dialog
          title={sectionEdit ? 'Rename section' : 'Add a section'}
          description="Sections group related links under a heading on your page."
          onClose={() => setSectionEdit(undefined)}
        >
          <form
            className="form-stack"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              const parsed = sectionSchema.safeParse({ title: sectionTitle });
              if (!parsed.success) {
                setSectionError(parsed.error.issues[0].message);
                return;
              }
              try {
                await save(
                  sectionEdit
                    ? { type: 'edit-section', id: sectionEdit.id, data: parsed.data }
                    : { type: 'add-section', data: parsed.data },
                );
                setSectionEdit(undefined);
              } catch {}
            }}
          >
            <Field label="Section name" error={sectionError}>
              {(c) => (
                <input
                  className="input"
                  autoFocus
                  placeholder="Social, Writing, Free resources…"
                  {...c}
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                />
              )}
            </Field>
            <div className="dialog-foot">
              <Button type="button" variant="secondary" onClick={() => setSectionEdit(undefined)}>
                Cancel
              </Button>
              <Button>Save section</Button>
            </div>
          </form>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          title={deleting.section ? 'Delete section?' : 'Delete link?'}
          description={'“' + deleting.name + '” will be removed. This cannot be undone.'}
          onClose={() => setDeleting(null)}
        >
          {deleting.section && (
            <label className="check">
              <input
                type="checkbox"
                checked={deleteLinks}
                onChange={(e) => setDeleteLinks(e.target.checked)}
              />
              Also delete links in this section
            </label>
          )}
          <div className="dialog-foot">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await save(
                      deleting.section
                        ? { type: 'delete-section', id: deleting.id, deleteLinks }
                        : { type: 'delete-link', id: deleting.id },
                    );
                    setDeleting(null);
                  } catch {}
                })
              }
            >
              Confirm delete
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

/** Only absolute http(s) URLs are handed to next/image; anything else falls back to the initial. */
function safeAvatar(url: string) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

export function PublicProfile({
  user,
  links,
  sections,
  audience = 'owner',
  headingLevel = 1,
  onPreviewClick,
}: {
  user: Pick<User, 'displayName' | 'bio' | 'avatarUrl'> & { username?: string | null };
  links: Link[];
  sections: Pick<Section, 'id' | 'title'>[];
  audience?: 'owner' | 'visitor';
  headingLevel?: 1 | 2;
  onPreviewClick?: React.ComponentProps<typeof SectionList>['onPreviewClick'];
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const avatar = safeAvatar(user.avatarUrl);
  return (
    <div className="public-profile">
      <div className="avatar">
        {avatar ? (
          <Image
            src={avatar}
            alt=""
            width={96}
            height={96}
            unoptimized
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="avatar-initial">
            {user.displayName.slice(0, 1).toUpperCase() || 'L'}
          </span>
        )}
      </div>
      <Heading>{user.displayName}</Heading>
      {user.username && <p className="public-handle">@{user.username}</p>}
      {user.bio && <p className="bio">{user.bio}</p>}
      <SectionList
        links={links}
        sections={sections}
        audience={audience}
        onPreviewClick={onPreviewClick}
      />
      <NextLink className="public-footer" href="/">
        <BrandMark size={11} />
        Made with linkhouse
      </NextLink>
    </div>
  );
}

export function ProfileEditor({
  user,
  links = [],
  sections = [],
}: {
  user: User;
  /** Visible links, used only to render an accurate preview next to the form. */
  links?: Link[];
  sections?: Pick<Section, 'id' | 'title'>[];
}) {
  const [initial] = useState({
    username: user.username ?? '',
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  });
  const [draft, setDraft] = useState(initial);
  const onValuesChange = useCallback(
    (values: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...values })),
    [],
  );
  return (
    <div className="profile-layout">
      <ProfileForm
        profile={initial}
        onValuesChange={onValuesChange}
        onSave={async (data) => {
          const r = await mutate({ type: 'profile', data });
          if (!r.ok) {
            toast.error(r.error);
            throw new Error(r.error ?? 'Unable to save your profile.');
          }
          toast.success('Changes saved');
        }}
      />
      <aside className="preview" aria-label="Profile preview">
        <div className="preview-head">
          <span className="eyebrow">Preview</span>
          <Badge>Updates as you type</Badge>
        </div>
        <div className="phone">
          <div className="phone-screen">
            <span className="phone-notch" aria-hidden />
            <PublicProfile
              user={{ ...draft, username: draft.username }}
              links={links}
              sections={sections}
              headingLevel={2}
              onPreviewClick={inertLink}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

const themeChoices = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

const subscribeNoop = () => () => {};

export function Settings() {
  const [confirm, setConfirm] = useState(false),
    [pending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored preference on the client; avoid a hydration mismatch.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[
            ['appearance', 'Appearance'],
            ['account', 'Account'],
            ['danger', 'Danger zone'],
          ].map(([id, label]) => (
            <a
              key={id}
              href={'#' + id}
              onClick={(e) => {
                e.preventDefault();
                jump(id);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="settings-sections">
          <section id="appearance" className="card" aria-labelledby="appearance-title">
            <div className="card-header">
              <div>
                <h2 id="appearance-title">Appearance</h2>
                <p>Choose how Linkhouse looks. This is saved in this browser only.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="theme-options" role="radiogroup" aria-label="Color theme">
                {themeChoices.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    className="theme-option"
                    aria-checked={mounted && theme === value}
                    onClick={() => setTheme(value)}
                  >
                    <span className={'theme-swatch theme-swatch-' + value} aria-hidden />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={15} aria-hidden />
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="account" className="card" aria-labelledby="account-title">
            <div className="card-header">
              <div>
                <h2 id="account-title">Account settings</h2>
                <p>Your email address, password, connected sign-in methods and active devices.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="clerk-profile-root">
                <UserProfile routing="hash" />
              </div>
            </div>
          </section>

          <section id="danger" className="card card-danger" aria-labelledby="danger-title">
            <div className="card-header">
              <div>
                <h2 id="danger-title">Delete account</h2>
                <p>Permanently remove your page and everything on it.</p>
              </div>
            </div>
            <div className="card-body danger-row">
              <p>
                Your username, links, sections and analytics are deleted immediately and cannot be
                recovered.
              </p>
              <Button variant="danger" onClick={() => setConfirm(true)}>
                Delete account
              </Button>
            </div>
          </section>
        </div>
      </div>
      {confirm && (
        <Dialog
          title="Delete your account?"
          description="This permanently removes all your links, sections and analytics. This cannot be undone."
          onClose={() => setConfirm(false)}
        >
          <div className="dialog-foot">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deleteAccount();
                  } catch (e) {
                    if (e instanceof Error && e.message.includes('NEXT_REDIRECT')) throw e;
                    toast.error('Unable to delete your account. Please try again.');
                  }
                })
              }
            >
              Permanently delete account
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
