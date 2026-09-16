import { supabase } from '../lib/supabase';

export default function AccessDenied() {
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-eyebrow">DIGITAL NOTEPAD</div>
        <h1>Access Denied</h1>
        <p>This account is not registered as a Superadmin.</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    </main>
  );
}
