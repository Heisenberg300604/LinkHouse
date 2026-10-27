import { requireUser } from '@/lib/auth';
import { ProfileEditor } from '@/features/dashboard';
export default async function Page() {
  const user = await requireUser();
  return (
    <div className="narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE PERSON BEHIND THE LINKS</p>
          <h1>Your profile</h1>
          <p>Make a first impression that feels like you.</p>
        </div>
      </div>
      <div className="panel">
        <ProfileEditor user={user} />
      </div>
    </div>
  );
}
