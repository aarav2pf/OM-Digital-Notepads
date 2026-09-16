import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [mode, setMode] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [rememberEmail, setRememberEmail] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function switchMode(nextMode) {
    setMode(nextMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRememberEmail(false);
    setError('');
    setSuccess('');
  }

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const {
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      /*
       * AuthProvider will receive the new
       * Supabase session and perform the
       * Superadmin authorization check.
       */
    } catch (err) {
      setError(
        err.message || 'Unable to sign in.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      /*
       * The user creates their own password.
       *
       * IMPORTANT:
       * Supabase creates the Auth account here.
       * The email must already have been added
       * as a Superadmin by the Super Superadmin.
       */
      const {
        data,
        error: signupError,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (!data.session) {
        setSuccess(
          'Account created. Check your email to confirm your account, then sign in.'
        );
      } else {
        setSuccess(
          'Account created successfully. You can now sign in.'
        );
      }

      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err.message || 'Unable to create account.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-eyebrow">
          OUTSTATION MANAGEMENT
        </div>

        <h1>DIGITAL NOTEPAD</h1>

        {mode === 'login' ? (
          <>
            <p>
              Sign in to continue.
            </p>

            <form
              onSubmit={handleLogin}
              autoComplete="off"
            >
              <label htmlFor="login-email">
                Email
              </label>

              <input
                id="login-email"
                name="notepad-login-email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
                required
              />

              <label htmlFor="login-password">
                Password
              </label>

              <input
                id="login-password"
                name="notepad-login-password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete="off"
                required
              />

              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) =>
                    setRememberEmail(
                      e.target.checked
                    )
                  }
                />

                <span>
                  Remember this email
                </span>
              </label>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-success">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Signing in...'
                  : 'Sign In'}
              </button>
            </form>

            <div className="signup-prompt">
              <span>
                To create an account,
              </span>

              <button
                type="button"
                className="auth-switch"
                onClick={() =>
                  switchMode('signup')
                }
              >
                Sign Up
              </button>
            </div>
          </>
        ) : (
          <>

            <form
              onSubmit={handleSignup}
              autoComplete="off"
            >
              <label htmlFor="signup-email">
                Email
              </label>

              <input
                id="signup-email"
                name="notepad-signup-email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your authorized Gmail"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
                required
              />

              <label htmlFor="signup-password">
                Create Password
              </label>

              <input
                id="signup-password"
                name="notepad-new-password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create your password"
                autoComplete="new-password"
                required
              />

              <label htmlFor="signup-confirm-password">
                Confirm Password
              </label>

              <input
                id="signup-confirm-password"
                name="notepad-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Enter your password again"
                autoComplete="new-password"
                required
              />

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-success">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Creating account...'
                  : 'Create Account'}
              </button>
            </form>

            <div className="signup-prompt">
              <span>
                Already have an account?
              </span>

              <button
                type="button"
                className="auth-switch"
                onClick={() =>
                  switchMode('login')
                }
              >
                Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}