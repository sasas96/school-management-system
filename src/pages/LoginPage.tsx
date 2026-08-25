import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isSignUp, setIsSignUp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      /*
       * If email confirmation is enabled in Supabase,
       * the user must confirm their email first.
       */

      if (data.session) {
        setMessage(
          'Account created successfully.'
        );
      } else {
        setMessage(
          'Account created. Please check your email and confirm your account before signing in.'
        );
      }

      return;
    }

    const {
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage('Login successful.');
  }

  function switchMode() {
    setIsSignUp((current) => !current);

    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

        {/* Header */}

        <div className="mb-8 text-center">

          <h1 className="text-2xl font-bold text-gray-900">
            School Management System
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {isSignUp
              ? 'Create your teacher account'
              : 'Sign in to your account'}
          </p>

        </div>

        {/* Form */}

        <form onSubmit={handleSubmit}>

          {/* Email */}

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email address
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="your@email.com"
            autoComplete="email"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {/* Password */}

          <label className="mb-2 mt-4 block text-sm font-medium text-gray-700">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your password"
            autoComplete={
              isSignUp
                ? 'new-password'
                : 'current-password'
            }
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
                ? 'Create Account'
                : 'Sign In'}
          </button>

        </form>

        {/* Switch Login / Signup */}

        <div className="mt-6 text-center">

          <p className="text-sm text-gray-500">

            {isSignUp
              ? 'Already have an account?'
              : "Don't have an account?"}

            <button
              type="button"
              onClick={switchMode}
              disabled={loading}
              className="ml-1 font-semibold text-blue-600 hover:text-blue-700"
            >
              {isSignUp
                ? 'Sign In'
                : 'Create Account'}
            </button>

          </p>

        </div>

        {/* Success */}

        {message && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

      </div>

    </div>
  );
}