import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();

    setError('');
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setCodeSent(true);
    setMessage(
      'A verification code has been sent to your email.'
    );
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();

    setError('');
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanCode) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: 'email',
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage('Login successful.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            School Management System
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in with your email
          </p>
        </div>

        {!codeSent ? (
          <form onSubmit={sendCode}>

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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>

          </form>
        ) : (
          <form onSubmit={verifyCode}>

            <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              We sent a verification code to:
              <div className="mt-1 font-semibold">
                {email}
              </div>
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Verification Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-lg tracking-[0.4em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode('');
                setError('');
                setMessage('');
              }}
              disabled={loading}
              className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Use a different email
            </button>

          </form>
        )}

        {message && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

      </div>
    </div>
  );
}