'use client';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Link } from '@prisma/client';
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { BarChart3, FlaskConical, Link2, Plus, RotateCcw, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { reorder } from '@/lib/logic/core';
import { PROFILE_BIO_LIMIT } from '@/lib/logic/limits';
import { compareDelta } from '@/lib/logic/analytics';
import { distribute, sampleSeries } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { LinkCard, LinkForm } from './editor';
import { PublicProfile, Sortable } from './dashboard';
import { AnalyticsView } from './analytics';

const sections = [
  { id: 'demo-social', title: 'Social' },
  { id: 'demo-resources', title: 'Free resources' },
];

const base = { userId: 'demo', icon: null, isVisible: true, createdAt: new Date(0) };
const initialLinks: Link[] = [
  {
    ...base,
    id: 'd1',
    title: 'My portfolio',
    url: 'https://example.com/',
    description: 'Thoughtful things, made with care',
    sectionId: null,
    position: 0,
  },
  {
    ...base,
    id: 'd2',
    title: 'Latest writing',
    url: 'https://example.com/journal',
    description: 'Notes from the process',
    sectionId: null,
    position: 1,
  },
  {
    ...base,
    id: 'd3',
    title: 'Instagram',
    url: 'https://instagram.com/',
    description: null,
    sectionId: 'demo-social',
    position: 2,
  },
  {
    ...base,
    id: 'd4',
    title: 'GitHub',
    url: 'https://github.com/',
    description: null,
    sectionId: 'demo-social',
    position: 3,
  },
  {
    ...base,
    id: 'd5',
    title: 'Design resources',
    url: 'https://www.figma.com/community',
    description: 'Templates and UI kits',
    sectionId: 'demo-resources',
    position: 4,
  },
  {
    ...base,
    id: 'd6',
    title: 'Learn to build',
    url: 'https://developer.mozilla.org/',
    description: null,
    sectionId: 'demo-resources',
    position: 5,
  },
];
const initialProfile = {
  displayName: 'Alex Morgan',
  bio: 'Designer, maker, and curious human. A little corner of everything I create.',
};
// Relative popularity used only to spread sample clicks across the demo links.
const weights: Record<string, number> = { d1: 9, d2: 6, d3: 4, d4: 3, d5: 3, d6: 2 };

const tabs = [
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;
type TabId = (typeof tabs)[number]['id'];

export function DemoWorkspace() {
  const [tab, setTab] = useState<TabId>('links');
  const [links, setLinks] = useState(initialLinks);
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState<Link | null | undefined>();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const nextId = useRef(100);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ordered = [...links].sort((a, b) => a.position - b.position);
  const preview = ordered.filter((l) => l.isVisible);
  const renumber = (list: Link[]) => list.map((l, position) => ({ ...l, position }));

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const ids = reorder(
      ordered.map((l) => l.id),
      String(event.active.id),
      String(event.over.id),
    );
    setLinks(renumber(ids.map((id) => ordered.find((l) => l.id === id)!)));
  };

  const remove = (link: Link) => {
    const before = links;
    setLinks(renumber(ordered.filter((l) => l.id !== link.id)));
    toast('Link deleted', { action: { label: 'Undo', onClick: () => setLinks(before) } });
  };

  const sample = useMemo(() => {
    const doubled = sampleSeries(range * 2);
    const series = doubled.slice(range);
    const previous = doubled.slice(0, range);
    const sum = (list: typeof series, key: 'views' | 'clicks') =>
      list.reduce((n, p) => n + p[key], 0);
    const clicks = sum(series, 'clicks');
    const visible = ordered.filter((l) => l.isVisible);
    const shares = distribute(
      clicks,
      visible.map((l) => weights[l.id] ?? 3),
    );
    return {
      series,
      views: sum(series, 'views'),
      clicks,
      viewsDelta: compareDelta(sum(series, 'views'), sum(previous, 'views')),
      clicksDelta: compareDelta(clicks, sum(previous, 'clicks')),
      stats: ordered.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        clicks: l.isVisible ? shares[visible.indexOf(l)] : 0,
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, links]);

  const onTabKey = (event: KeyboardEvent, index: number) => {
    const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const next = tabs[(index + move + tabs.length) % tabs.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const bioLength = profile.bio.length;

  return (
    <div className="demo-workspace">
      <div className="demo-toolbar">
        <div className="demo-tabs" role="tablist" aria-label="Demo sections">
          {tabs.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              ref={(node) => {
                tabRefs.current[id] = node;
              }}
              type="button"
              role="tab"
              id={'demo-tab-' + id}
              aria-selected={tab === id}
              aria-controls={'demo-panel-' + id}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(e) => onTabKey(e, index)}
            >
              <Icon size={16} aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <div className="demo-toolbar-end">
          <Badge tone="warning">
            <FlaskConical size={12} aria-hidden /> Demo · sample data
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLinks(initialLinks);
              setProfile(initialProfile);
              toast.success('Demo reset');
            }}
          >
            <RotateCcw size={14} aria-hidden /> Reset
          </Button>
        </div>
      </div>

      <div className={'demo-body' + (tab === 'analytics' ? ' is-wide' : '')}>
        <div className="demo-panel">
          {tab === 'links' && (
            <div role="tabpanel" id="demo-panel-links" aria-labelledby="demo-tab-links">
              <div className="demo-panel-head">
                <div>
                  <h2>Your links</h2>
                  <p>Drag to reorder, hide, edit or delete. The preview updates instantly.</p>
                </div>
                <Button size="sm" onClick={() => setEditing(null)}>
                  <Plus size={15} aria-hidden /> Add link
                </Button>
              </div>
              <div className="card link-group-body">
                <DndContext id="demo-links" sensors={sensors} onDragEnd={onDragEnd}>
                  <SortableContext
                    items={ordered.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {ordered.map((link) => (
                      <Sortable key={link.id} id={link.id} label={link.title}>
                        {(handle) => (
                          <>
                            {handle}
                            <div className="sortable-body">
                              <LinkCard
                                link={link}
                                clicks={sample.stats.find((s) => s.id === link.id)?.clicks}
                                onEdit={() => setEditing(link)}
                                onDelete={() => remove(link)}
                                onToggle={() =>
                                  setLinks(
                                    links.map((l) =>
                                      l.id === link.id ? { ...l, isVisible: !l.isVisible } : l,
                                    ),
                                  )
                                }
                              />
                            </div>
                          </>
                        )}
                      </Sortable>
                    ))}
                  </SortableContext>
                </DndContext>
                {!ordered.length && (
                  <p className="no-results muted">All links removed. Use Reset to start over.</p>
                )}
              </div>
              <p className="hint">Clicks shown are sample data for the last 30 days.</p>
            </div>
          )}

          {tab === 'profile' && (
            <div role="tabpanel" id="demo-panel-profile" aria-labelledby="demo-tab-profile">
              <div className="demo-panel-head">
                <div>
                  <h2>Profile</h2>
                  <p>Change your name and bio and watch the page update.</p>
                </div>
              </div>
              <div className="card card-body form-stack">
                <Field label="Display name">
                  {(c) => (
                    <input
                      className="input"
                      {...c}
                      maxLength={80}
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    />
                  )}
                </Field>
                <Field
                  label="Bio"
                  hint={
                    <>
                      A line or two about you.{' '}
                      <span className="char-count num" data-over={bioLength > PROFILE_BIO_LIMIT}>
                        {bioLength}/{PROFILE_BIO_LIMIT}
                      </span>
                    </>
                  }
                  error={
                    bioLength > PROFILE_BIO_LIMIT
                      ? 'Bio must be 160 characters or fewer'
                      : undefined
                  }
                >
                  {(c) => (
                    <textarea
                      className="textarea"
                      rows={4}
                      {...c}
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    />
                  )}
                </Field>
                <p className="hint" style={{ margin: 0 }}>
                  In the real app you can also set a profile photo and your own address, and changes
                  are saved to your account.
                </p>
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <div role="tabpanel" id="demo-panel-analytics" aria-labelledby="demo-tab-analytics">
              <div className="demo-panel-head">
                <div>
                  <h2>Analytics</h2>
                  <p>
                    Sample data for a fictional page. Your own numbers come from real visits to your
                    page.
                  </p>
                </div>
                <div className="segmented" role="group" aria-label="Time range">
                  {([7, 30, 90] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={range === r}
                      onClick={() => setRange(r)}
                    >
                      {r} days
                    </button>
                  ))}
                </div>
              </div>
              <AnalyticsView
                days={range}
                series={sample.series}
                views={sample.views}
                clicks={sample.clicks}
                viewsDelta={sample.viewsDelta}
                clicksDelta={sample.clicksDelta}
                links={sample.stats}
                sample
              />
            </div>
          )}
        </div>

        {tab !== 'analytics' && (
          <aside className="demo-preview" aria-label="Live preview">
            <div className="preview-head">
              <span className="eyebrow">Live preview</span>
              <Badge>Sample page</Badge>
            </div>
            <div className="phone">
              <div className="phone-screen">
                <span className="phone-notch" aria-hidden />
                <PublicProfile
                  user={{ ...profile, avatarUrl: '', username: 'alexmorgan' }}
                  links={preview}
                  sections={sections}
                  headingLevel={2}
                  onPreviewClick={(link) =>
                    toast('Demo link', {
                      description:
                        'On a real page this opens ' + link.url.replace(/^https?:\/\//, ''),
                    })
                  }
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {editing !== undefined && (
        <Dialog title={editing ? 'Edit link' : 'Add a link'} onClose={() => setEditing(undefined)}>
          <LinkForm
            initial={editing ?? undefined}
            sections={sections}
            onCancel={() => setEditing(undefined)}
            onSave={async (data) => {
              if (editing)
                setLinks(
                  links.map((l) =>
                    l.id === editing.id
                      ? { ...l, ...data, description: data.description || null }
                      : l,
                  ),
                );
              else
                setLinks([
                  ...ordered,
                  {
                    ...base,
                    id: 'n' + nextId.current++,
                    title: data.title,
                    url: data.url,
                    description: data.description || null,
                    sectionId: data.sectionId ?? null,
                    position: ordered.length,
                  },
                ]);
              setEditing(undefined);
              toast.success(editing ? 'Link updated (demo)' : 'Link added (demo)');
            }}
          />
        </Dialog>
      )}
    </div>
  );
}
