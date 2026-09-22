'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSubmitting(true);
    try { await login(email, password); router.replace(searchParams.get('next') || '/'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in'); }
    finally { setSubmitting(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12"><Card className="w-full max-w-md"><CardHeader><CardTitle>Welcome back</CardTitle><CardDescription>Sign in to continue to DevFlow.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>{error && <p className="text-sm text-danger" role="alert">{error}</p>}<Button className="w-full" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button></form><p className="mt-6 text-center text-sm text-muted-fg">New to DevFlow? <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link></p></CardContent></Card></main>;
}
