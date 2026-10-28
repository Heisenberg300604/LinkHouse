'use client';
import NextLink from 'next/link';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { GripVertical, Plus, Eye, EyeOff, Pencil, Trash2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { mutate, deleteAccount } from '@/lib/actions';
import { reorder, sectionSchema } from '@/lib/logic/core';
import { LinkForm, LinkCard, SectionList, ProfileForm } from './editor';
import { UserProfile } from '@clerk/nextjs';
function Sortable({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="sortable"
    >
      <button className="drag" aria-label={'Reorder ' + label} {...attributes} {...listeners}>
        <GripVertical size={18} />
      </button>
      <div className="sortable-body">{children}</div>
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <dialog open aria-label={title} className="modal">
        <div className="row">
          <h2>{title}</h2>
          <button onClick={onClose}>Cancel</button>
        </div>
        {children}
      </dialog>
    </div>
  );
}
export function DashboardEditor({
  user,
  links: initialLinks,
  sections: initialSections,
}: {
  user: User;
  links: Link[];
  sections: Section[];
}) {
  const [links, setLinks] = useState(initialLinks),
    [sections, setSections] = useState(initialSections);
  const [editing, setEditing] = useState<Link | null | undefined>(),
    [sectionEdit, setSectionEdit] = useState<Section | null | undefined>();
  const [sectionTitle, setSectionTitle] = useState(''),
    [sectionError, setSectionError] = useState('');
  const [deleting, setDeleting] = useState<{ id: string; section: boolean } | null>(null),
    [deleteLinks, setDeleteLinks] = useState(false);
  const [preview, setPreview] = useState(false),
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
  async function reloadSave(input: unknown) {
    await save(input);
    window.location.reload();
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
  function group(sectionId: string | null) {
    const items = links
      .filter((l) => l.sectionId === sectionId)
      .sort((a, b) => a.position - b.position);
    return (
      <DndContext sensors={sensors} onDragEnd={(e) => order(e, 'links', sectionId)}>
        <SortableContext items={items.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {items.map((link) => (
            <Sortable key={link.id} id={link.id} label={link.title}>
              <LinkCard
                link={link}
                onEdit={() => setEditing(link)}
                onDelete={() => {
                  setDeleting({ id: link.id, section: false });
                  setDeleteLinks(false);
                }}
                onToggle={() => {
                  const before = links;
                  setLinks(
                    links.map((l) => (l.id === link.id ? { ...l, isVisible: !l.isVisible } : l)),
                  );
                  startTransition(async () => {
                    try {
                      await save({
                        type: 'edit-link',
                        id: link.id,
                        data: { isVisible: !link.isVisible },
                      });
                    } catch {
                      setLinks(before);
                    }
                  });
                }}
              />
            </Sortable>
          ))}
        </SortableContext>
      </DndContext>
    );
  }
  return (
    <div className="editor-layout">
      <div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">MAKE IT YOURS</p>
            <h1>Your links</h1>
            <p>Everything you share, in one place.</p>
          </div>
          <button className="primary" onClick={() => setEditing(null)}>
            <Plus size={17} />
            Add link
          </button>
        </div>
        <div className="row editor-toolbar">
          <span>{links.length} / 200 links</span>
          <button
            onClick={() => {
              setSectionEdit(null);
              setSectionTitle('');
              setSectionError('');
            }}
          >
            <Plus size={16} />
            Add section
          </button>
        </div>
        {!links.length && !sections.length && <SectionList links={[]} sections={[]} />}
        {group(null)}
        <DndContext sensors={sensors} onDragEnd={(e) => order(e, 'sections')}>
          <SortableContext
            items={[...sections].sort((a, b) => a.position - b.position).map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {[...sections]
              .sort((a, b) => a.position - b.position)
              .map((section) => (
                <Sortable key={section.id} id={section.id} label={section.title}>
                  <section className="section-editor">
                    <div className="row">
                      <h3>{section.title}</h3>
                      <div className="row">
                        <button
                          aria-label={
                            (section.isVisible ? 'Hide section ' : 'Show section ') + section.title
                          }
                          onClick={() =>
                            startTransition(async () => {
                              try {
                                await save({
                                  type: 'edit-section',
                                  id: section.id,
                                  data: { isVisible: !section.isVisible },
                                });
                                setSections(
                                  sections.map((s) =>
                                    s.id === section.id ? { ...s, isVisible: !s.isVisible } : s,
                                  ),
                                );
                              } catch {}
                            })
                          }
                        >
                          {section.isVisible ? <Eye size={17} /> : <EyeOff size={17} />}
                        </button>
                        <button
                          aria-label={'Rename ' + section.title}
                          onClick={() => {
                            setSectionEdit(section);
                            setSectionTitle(section.title);
                          }}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          aria-label={'Delete section ' + section.title}
                          onClick={() => {
                            setDeleting({ id: section.id, section: true });
                            setDeleteLinks(false);
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                    {group(section.id)}
                    {!links.some((l) => l.sectionId === section.id) && (
                      <p className="muted">
                        Move a link here using its edit form. Empty sections stay off your public
                        page.
                      </p>
                    )}
                  </section>
                </Sortable>
              ))}
          </SortableContext>
        </DndContext>
        <p className="hint">
          Drag to reorder, or focus a handle and use Space, arrow keys, then Space.
        </p>
        <button className="mobile-preview" onClick={() => setPreview(!preview)}>
          {preview ? 'Hide preview' : 'Show preview'}
        </button>
      </div>
      <aside className={'preview ' + (preview ? 'preview-open' : '')}>
        <div className="row">
          <span className="eyebrow">LIVE PREVIEW</span>
          <span className="status-dot">Published</span>
        </div>
        <div className="phone">
          <div className="phone-notch" />
          <PublicProfile
            user={user}
            links={links.filter(
              (l) =>
                l.isVisible &&
                (!l.sectionId || sections.some((s) => s.id === l.sectionId && s.isVisible)),
            )}
            sections={sections.filter((s) => s.isVisible)}
          />
        </div>
        <NextLink
          className="preview-url"
          href={'/' + user.username}
          target="_blank"
          rel="noreferrer"
        >
          linkhouse / {user.username} ↗
        </NextLink>
      </aside>
      {editing !== undefined && (
        <Modal title={editing ? 'Edit link' : 'Add a link'} onClose={() => setEditing(undefined)}>
          <LinkForm
            initial={editing ?? undefined}
            sections={sections}
            onSave={async (data) => {
              await reloadSave(
                editing ? { type: 'edit-link', id: editing.id, data } : { type: 'add-link', data },
              );
              setEditing(undefined);
            }}
          />
        </Modal>
      )}
      {sectionEdit !== undefined && (
        <Modal
          title={sectionEdit ? 'Rename section' : 'Add a section'}
          onClose={() => setSectionEdit(undefined)}
        >
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const parsed = sectionSchema.safeParse({ title: sectionTitle });
              if (!parsed.success) {
                setSectionError(parsed.error.issues[0].message);
                return;
              }
              try {
                await reloadSave(
                  sectionEdit
                    ? { type: 'edit-section', id: sectionEdit.id, data: parsed.data }
                    : { type: 'add-section', data: parsed.data },
                );
                setSectionEdit(undefined);
              } catch {}
            }}
          >
            <label>
              Section name
              <input
                autoFocus
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
              />
            </label>
            {sectionError && <p role="alert">{sectionError}</p>}
            <button className="primary">Save section</button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this item?" onClose={() => setDeleting(null)}>
          <p>This cannot be undone.</p>
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
          <button
            className="danger"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await reloadSave(
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
          </button>
        </Modal>
      )}
    </div>
  );
}
export function PublicProfile({
  user,
  links,
  sections,
}: {
  user: Pick<User, 'displayName' | 'bio' | 'avatarUrl'>;
  links: Link[];
  sections: Pick<Section, 'id' | 'title'>[];
}) {
  return (
    <div className="public-profile">
      <div className="avatar">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={86}
            height={86}
            unoptimized
            referrerPolicy="no-referrer"
          />
        ) : (
          user.displayName.slice(0, 1) || 'L'
        )}
      </div>
      <h1>{user.displayName}</h1>
      {user.bio && <p className="bio">{user.bio}</p>}
      <SectionList links={links} sections={sections} />
      <NextLink className="wordmark public-footer" href="/">
        <span className="brand-icon"><Link2 size={13} /></span>
        linkhouse<span className="brand-period">.</span>
      </NextLink>
    </div>
  );
}
export function ProfileEditor({ user }: { user: User }) {
  return (
    <ProfileForm
      profile={{
        username: user.username ?? '',
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      }}
      onSave={async (data) => {
        const r = await mutate({ type: 'profile', data });
        if (r.ok) toast.success('Changes saved');
        else toast.error(r.error);
      }}
    />
  );
}
export function Settings() {
  const [confirm, setConfirm] = useState(false),
    [pending, startTransition] = useTransition();
  return (
    <>
      <section className="panel">
        <h2>Account settings</h2>
        <p>Manage your email, password and account security.</p>
        <UserProfile routing="hash" />
      </section>
      <section className="panel">
        <h2>Delete account</h2>
        <p>Permanently remove your page and everything on it.</p>
        <button className="danger" onClick={() => setConfirm(true)}>
          Delete account
        </button>
      </section>
      {confirm && (
        <Modal title="Delete your account?" onClose={() => setConfirm(false)}>
          <p>
            This permanently removes all your links, sections and analytics. This cannot be undone.
          </p>
          <button
            className="danger"
            disabled={pending}
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
          </button>
        </Modal>
      )}
    </>
  );
}
