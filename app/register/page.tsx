'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth(); const router = useRouter();
  const [name, setName] = React.useState(''); const [email, setEmail] = React.useState(''); const [password, setPassword] = React.useState(''); const [confirm, setConfirm] = React.useState(''); const [error, setError] = React.useState(''); const [submitting, setSubmitting] = React.useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); if (password !== confirm) { setError('Passwords do not match'); return; } setSubmitting(true); try { await register(name, email, password); router.replace('/'); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create account'); } finally { setSubmitting(false); } }
  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12"><Card className="w-full max-w-md"><CardHeader><CardTitle>Create your account</CardTitle><CardDescription>Start organizing your development workflow.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></div><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" /></div><div className="space-y-2"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" /></div>{error && <p className="text-sm text-danger" role="alert">{error}</p>}<Button className="w-full" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</Button></form><p className="mt-6 text-center text-sm text-muted-fg">Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></p></CardContent></Card></main>;
}
