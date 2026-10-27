import { Settings } from '@/features/dashboard';
export default function Page() {
  return (
    <div className="narrow">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Your account, on your terms.</p>
        </div>
      </div>
      <Settings />
    </div>
  );
}
