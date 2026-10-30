import { Skeleton } from '@/components/ui/skeleton';

/** Layout-matched placeholders shown by route loading.tsx files while real data streams in. */

function Wrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function HeaderSkeleton({ actions = 0 }: { actions?: number }) {
  return (
    <div className="page-header" aria-hidden>
      <div className="page-header-copy">
        <Skeleton style={{ width: 150, height: 28, marginBottom: 10 }} />
        <Skeleton style={{ width: 'min(320px, 70vw)', height: 14 }} />
      </div>
      {actions > 0 && (
        <div className="page-header-actions">
          {Array.from({ length: actions }, (_, i) => (
            <Skeleton key={i} style={{ width: 104, height: 36 }} />
          ))}
        </div>
      )}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="skeleton-row">
      <Skeleton style={{ width: 28, height: 28 }} />
      <Skeleton style={{ width: 36, height: 36 }} />
      <div style={{ flex: 1 }}>
        <Skeleton style={{ width: '38%', height: 14, marginBottom: 8 }} />
        <Skeleton style={{ width: '60%', height: 11 }} />
      </div>
      <Skeleton style={{ width: 88, height: 28 }} />
    </div>
  );
}

export function LinksSkeleton() {
  return (
    <Wrap label="Loading your links">
      <HeaderSkeleton actions={2} />
      <div className="editor-layout" aria-hidden>
        <div className="editor-main">
          <div className="editor-toolbar">
            <Skeleton style={{ width: 'min(340px, 100%)', height: 40 }} />
            <Skeleton style={{ width: 120, height: 14 }} />
          </div>
          <div className="card" style={{ padding: 6 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="preview">
          <Skeleton style={{ width: 110, height: 12, marginBottom: 14 }} />
          <Skeleton style={{ width: '100%', height: 520, borderRadius: 36 }} />
        </div>
      </div>
    </Wrap>
  );
}

export function ProfileSkeleton() {
  return (
    <Wrap label="Loading your profile">
      <HeaderSkeleton />
      <div className="profile-layout" aria-hidden>
        <div className="profile-form">
          {[0, 1].map((i) => (
            <div className="card" key={i}>
              <div className="card-header">
                <Skeleton style={{ width: 160, height: 18 }} />
              </div>
              <div
                className="card-body"
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                <Skeleton style={{ height: 40 }} />
                <Skeleton style={{ height: 40 }} />
                {i === 0 && <Skeleton style={{ height: 96 }} />}
              </div>
            </div>
          ))}
        </div>
        <div className="preview">
          <Skeleton style={{ width: '100%', height: 480, borderRadius: 36 }} />
        </div>
      </div>
    </Wrap>
  );
}

export function AnalyticsSkeleton() {
  return (
    <Wrap label="Loading analytics">
      <HeaderSkeleton actions={1} />
      <div aria-hidden>
        <div className="stat-grid">
          {[0, 1, 2].map((i) => (
            <div className="card stat" key={i}>
              <Skeleton style={{ width: 90, height: 13, marginBottom: 12 }} />
              <Skeleton style={{ width: 80, height: 30, marginBottom: 10 }} />
              <Skeleton style={{ width: 130, height: 12 }} />
            </div>
          ))}
        </div>
        <div className="analytics-grid">
          <div className="card card-body">
            <Skeleton style={{ width: 120, height: 18, marginBottom: 18 }} />
            <Skeleton style={{ height: 232 }} />
          </div>
          <div className="card card-body">
            <Skeleton style={{ width: 100, height: 18, marginBottom: 18 }} />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ height: 38, marginBottom: 10 }} />
            ))}
          </div>
        </div>
      </div>
    </Wrap>
  );
}

export function SettingsSkeleton() {
  return (
    <Wrap label="Loading settings">
      <HeaderSkeleton />
      <div className="settings-layout" aria-hidden>
        <div className="settings-nav">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={{ width: 100, height: 28, marginBottom: 4 }} />
          ))}
        </div>
        <div className="settings-sections">
          <div className="card card-body">
            <Skeleton style={{ width: 130, height: 18, marginBottom: 18 }} />
            <Skeleton style={{ height: 88 }} />
          </div>
          <div className="card card-body">
            <Skeleton style={{ width: 160, height: 18, marginBottom: 18 }} />
            <Skeleton style={{ height: 280 }} />
          </div>
        </div>
      </div>
    </Wrap>
  );
}
