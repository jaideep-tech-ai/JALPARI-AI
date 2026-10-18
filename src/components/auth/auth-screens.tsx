'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CITIES } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import {
  Eye, EyeOff, ShieldCheck, User, Building2, Siren, HardHat, Cog, BarChart3,
  Crown, CheckCircle2, Info, AlertCircle, Loader2, Droplets, ArrowRight,
} from 'lucide-react';

// ============ Shared layout ============
function AuthShell({ children, title, sub }: { children: React.ReactNode; title: string; sub?: string }) {
  const setView = useAppStore((s) => s.setView);
  return (
    <div className="jg-hero-bg flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <button className="mb-6 flex items-center gap-2" onClick={() => setView('landing')}>
        { }
        <img src="/logo.svg" alt="JALGUARD" className="size-9" />
        <span className="text-xl font-extrabold tracking-tight text-white">
          JAL<span className="jg-gradient-text">GUARD</span>
        </span>
      </button>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <Card className="border-white/10 bg-[#111C2E]/95 shadow-2xl shadow-black/40 backdrop-blur">
          <CardContent className="p-6 md:p-7">
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {sub && <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{sub}</p>}
            <div className="mt-5">{children}</div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function ErrAlert({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-300">
      <AlertCircle className="size-4" />
      <AlertDescription className="text-[13px]">{msg}</AlertDescription>
    </Alert>
  );
}

function SubmitBtn({ loading, children, disabled, onClick }: { loading: boolean; children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <Button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={loading || disabled}
      className="h-10 w-full bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

const inputCls = 'h-10 border-white/15 bg-white/5 text-white placeholder:text-slate-500';

// ============ Password field with strength + visibility ============
function PasswordField({
  value, onChange, placeholder, show, setShow, autoComplete,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  show: boolean; setShow: (v: boolean) => void; autoComplete?: string;
}) {
  const t = useTranslations('auth');
  const strength = value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value) ? 4
    : value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value) ? 3
    : value.length >= 8 ? 2 : value.length >= 4 ? 1 : 0;
  const labels = [t('pwdWeak'), t('pwdWeak'), t('pwdFair'), t('pwdGood'), t('pwdStrong')];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];
  return (
    <div>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={inputCls + ' pr-10'}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
          aria-label={show ? t('hidePassword') : t('showPassword')}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {value && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-1 w-8 rounded-full ${i <= strength ? colors[strength] : 'bg-white/10'}`} />
            ))}
          </div>
          <span className="text-[11px] text-slate-400">{labels[strength]}</span>
        </div>
      )}
    </div>
  );
}

// ============ Sign in ============
export function SignInScreen() {
  const t = useTranslations('auth');
  const tn = useTranslations('nav');
  const { setView, setUser, setPending } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  function routeUser(u: { emailVerified: boolean; role: string | null; onboarded: boolean; mustChangePassword: boolean }) {
    if (u.mustChangePassword) { setView('app'); return; }
    if (!u.emailVerified) { setView('verify'); return; }
    if (u.role === null) { setView('roleSelect'); return; }
    if (!u.onboarded) { setView('onboarding'); return; }
    setView('app');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await api<{ ok: boolean; user: { emailVerified: boolean; role: string | null; onboarded: boolean; mustChangePassword: boolean } }>(
        '/api/auth', { body: { action: 'login', email, password } }
      );
      const session = await api<{ user: import('@/lib/types').SessionUser }>('/api/auth');
      setUser(session.user);
      setPending({ email: '', token: '', role: null });
      routeUser(res.user);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const demoAccounts = [
    ['admin@jalguard.demo', 'Super Admin'],
    ['officer@jalguard.demo', 'Municipal'],
    ['disaster@jalguard.demo', 'Disaster Mgmt'],
    ['field@jalguard.demo', 'Field Ops'],
    ['analyst@jalguard.demo', 'Analyst'],
    ['citizen@jalguard.demo', 'Citizen'],
  ];

  return (
    <AuthShell title={t('signInTitle')} sub={t('signInSub')}>
      <form onSubmit={submit} className="space-y-4">
        <ErrAlert msg={err} />
        <div className="space-y-1.5">
          <Label htmlFor="si-email" className="text-slate-300">{t('email')}</Label>
          <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="si-pwd" className="text-slate-300">{t('password')}</Label>
            <button type="button" className="text-xs text-emerald-400 hover:underline" onClick={() => setView('forgot')}>
              {t('forgot')}
            </button>
          </div>
          <PasswordField value={password} onChange={setPassword} placeholder="••••••••" show={show} setShow={setShow} autoComplete="current-password" />
        </div>
        <SubmitBtn loading={loading}>{t('signInCta')}</SubmitBtn>
        <p className="text-center text-[13px] text-slate-400">
          {t('noAccount')}{' '}
          <button type="button" className="font-semibold text-emerald-400 hover:underline" onClick={() => setView('signup')}>
            {t('createOne')}
          </button>
        </p>
      </form>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          <Info className="size-3.5" />
          {t('demoAccounts')}
        </div>
        <p className="mt-1 text-[11px] text-slate-500">{t('demoAccountsHint')} — password <span className="font-mono text-slate-300">Demo#Pass1</span></p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {demoAccounts.map(([em, label]) => (
            <button
              key={em}
              type="button"
              className="flex items-center justify-between rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-white"
              onClick={async () => {
                setLoading(true);
                setErr('');
                try {
                  await api('/api/auth', { body: { action: 'login', email: em, password: 'Demo#Pass1' } });
                  const session = await api<{ user: import('@/lib/types').SessionUser }>('/api/auth');
                  setUser(session.user);
                  setView('app');
                } catch (e2) {
                  setErr((e2 as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <span className="truncate font-medium">{label}</span>
              <ArrowRight className="size-3 shrink-0 text-emerald-400" />
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center">
        <button className="text-[12px] text-slate-500 hover:text-slate-300" onClick={() => setView('landing')}>
          ← {tn('platform')}
        </button>
      </p>
    </AuthShell>
  );
}

// ============ Sign up ============
export function SignUpScreen() {
  const t = useTranslations('auth');
  const tv = useTranslations('auth.validation');
  const { setView, setPending } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [organization, setOrganization] = useState('');
  const [terms, setTerms] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (name.trim().length < 2) return setErr(tv('nameMin'));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr(tv('emailInvalid'));
    if (password.length < 8) return setErr(tv('pwdMin'));
    if (password !== confirm) return setErr(tv('pwdMatch'));
    if (!terms) return setErr(tv('termsRequired'));
    setLoading(true);
    try {
      const res = await api<{ demoVerifyToken: string }>('/api/auth', {
        body: { action: 'signup', name, email, password, language, organization },
      });
      setPending({ email, token: res.demoVerifyToken });
      setView('verify');
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('signUpTitle')} sub={t('signUpSub')}>
      <form onSubmit={submit} className="space-y-4">
        <ErrAlert msg={err} />
        <div className="space-y-1.5">
          <Label htmlFor="su-name" className="text-slate-300">{t('fullName')}</Label>
          <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-email" className="text-slate-300">{t('email')}</Label>
          <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300">{t('preferredLanguage')}</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'hi')}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="su-org" className="text-slate-300">{t('organization')} <span className="text-slate-500">({t('optional')})</span></Label>
            <Input id="su-org" value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">{t('password')}</Label>
          <PasswordField value={password} onChange={setPassword} placeholder="8+ characters" show={show} setShow={setShow} autoComplete="new-password" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">{t('confirmPassword')}</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} autoComplete="new-password" />
        </div>
        <label className="flex items-start gap-2.5 text-[13px] text-slate-300">
          <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-0.5 border-white/30" />
          {t('terms')}
        </label>
        <SubmitBtn loading={loading}>{t('signUpCta')}</SubmitBtn>
        <p className="text-center text-[13px] text-slate-400">
          {t('haveAccount')}{' '}
          <button type="button" className="font-semibold text-emerald-400 hover:underline" onClick={() => setView('signin')}>
            {t('signInCta')}
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

// ============ Email verify (demo-labelled) ============
export function VerifyScreen() {
  const t = useTranslations('auth');
  const { pendingEmail, pendingToken, user, setUser, setView } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const emailShown = pendingEmail || user?.email || '';
  const canTokenVerify = !!pendingEmail && !!pendingToken;
  const canSelfVerify = !!user && !user.emailVerified;

  async function verify() {
    setLoading(true);
    setErr('');
    try {
      if (canTokenVerify) {
        await api('/api/auth', { body: { action: 'verify', email: pendingEmail, token: pendingToken } });
        const session = await api<{ user: import('@/lib/types').SessionUser }>('/api/auth');
        setUser(session.user);
      } else {
        const res = await api<{ user: import('@/lib/types').SessionUser }>('/api/auth', { body: { action: 'verifySelf' } });
        setUser(res.user);
      }
      setView('roleSelect');
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('verifyTitle')} sub={t('verifySub')}>
      <div className="space-y-4">
        <ErrAlert msg={err} />
        <Alert className="border-sky-500/30 bg-sky-500/10 text-sky-300">
          <Info className="size-4" />
          <AlertDescription className="text-[12.5px] leading-relaxed">{t('verifyDemo')}</AlertDescription>
        </Alert>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[12px] text-slate-300">
          <div><span className="text-slate-500">{t('email')}:</span> <span className="font-mono">{emailShown || '—'}</span></div>
          <div className="mt-1"><span className="text-slate-500">Token:</span> <span className="font-mono break-all">{pendingToken ? pendingToken.slice(0, 8) + '…' : '—'}</span></div>
        </div>
        <SubmitBtn loading={loading} disabled={!canTokenVerify && !canSelfVerify} onClick={verify}>{t('verifyCta')}</SubmitBtn>
      </div>
    </AuthShell>
  );
}

// ============ Forgot / Reset password ============
export function ForgotScreen() {
  const t = useTranslations('auth');
  const { setView, setPending, pendingEmail } = useAppStore();
  const [email, setEmail] = useState(pendingEmail);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const res = await api<{ demoResetToken?: string }>('/api/auth', { body: { action: 'forgot', email } });
      if (res.demoResetToken) {
        setToken(res.demoResetToken);
        setPending({ email, token: res.demoResetToken });
      }
      setDone(true);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('resetTitle')} sub={t('resetSub')}>
      {done ? (
        <div className="space-y-4">
          <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="size-4" />
            <AlertDescription className="text-[12.5px]">
              {t('verifyDemo')} {token && <span className="mt-1 block font-mono text-[11px] break-all">Token: {token}</span>}
            </AlertDescription>
          </Alert>
          <Button
            className="h-10 w-full bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400"
            onClick={() => setView('reset')}
          >
            {t('resetCta')}
          </Button>
          <p className="text-center">
            <button className="text-[13px] text-emerald-400 hover:underline" onClick={() => setView('signin')}>
              ← {t('signInCta')}
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ErrAlert msg={err} />
          <div className="space-y-1.5">
            <Label htmlFor="fp-email" className="text-slate-300">{t('email')}</Label>
            <Input id="fp-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <SubmitBtn loading={loading}>{t('sendReset')}</SubmitBtn>
          <p className="text-center">
            <button type="button" className="text-[13px] text-emerald-400 hover:underline" onClick={() => setView('signin')}>
              ← {t('signInCta')}
            </button>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetScreen() {
  const t = useTranslations('auth');
  const { pendingEmail, pendingToken, setView } = useAppStore();
  const [email, setEmail] = useState(pendingEmail);
  const [token, setToken] = useState(pendingToken);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await api('/api/auth', { body: { action: 'reset', email, token, password } });
      setOk(true);
      setTimeout(() => setView('signin'), 1200);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('resetTitle')}>
      <form onSubmit={submit} className="space-y-4">
        <ErrAlert msg={err} />
        {ok && (
          <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="size-4" />
            <AlertDescription>{t('verified')}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1.5">
          <Label className="text-slate-300">{t('email')}</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Reset token</Label>
          <Input required value={token} onChange={(e) => setToken(e.target.value)} className={inputCls + ' font-mono text-xs'} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">{t('newPassword')}</Label>
          <PasswordField value={password} onChange={setPassword} placeholder="8+ characters" show={show} setShow={setShow} autoComplete="new-password" />
        </div>
        <SubmitBtn loading={loading}>{t('resetCta')}</SubmitBtn>
      </form>
    </AuthShell>
  );
}

// ============ Role selection ============
const ROLE_META: { key: string; icon: typeof User; tint: string }[] = [
  { key: 'citizen', icon: User, tint: 'text-sky-400 bg-sky-500/10 border-sky-500/25' },
  { key: 'municipal', icon: Building2, tint: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  { key: 'disaster', icon: Siren, tint: 'text-red-400 bg-red-500/10 border-red-500/25' },
  { key: 'field', icon: HardHat, tint: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
  { key: 'infra', icon: Cog, tint: 'text-violet-400 bg-violet-500/10 border-violet-500/25' },
  { key: 'analyst', icon: BarChart3, tint: 'text-teal-400 bg-teal-500/10 border-teal-500/25' },
  { key: 'org_admin', icon: ShieldCheck, tint: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25' },
  { key: 'super_admin', icon: Crown, tint: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/25' },
];

export function RoleSelectScreen() {
  const t = useTranslations('auth');
  const tr = useTranslations('roles');
  const { setUser, setView, setPending, pendingRole } = useAppStore();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  async function pick(role: string) {
    setLoadingRole(role);
    try {
      const res = await api<{ granted: boolean; pendingRole?: string; user: import('@/lib/types').SessionUser }>(
        '/api/auth', { body: { action: 'selectRole', requestedRole: role } }
      );
      setUser(res.user);
      if (res.granted) {
        setView('onboarding');
      } else {
        setPending({ role: res.pendingRole ?? role });
      }
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoadingRole(null);
    }
  }

  if (pendingRole) {
    return (
      <AuthShell title={t('rolePendingTitle')}>
        <div className="space-y-4">
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-200">
            <Info className="size-4" />
            <AlertDescription className="text-[13px] leading-relaxed">
              {t('rolePendingBody', { role: tr(pendingRole as 'municipal') })}
            </AlertDescription>
          </Alert>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-2.5 animate-pulse rounded-full bg-amber-400" />
              <span className="text-[13px] font-medium text-slate-200">{tr('requestSent')} · {tr(pendingRole as 'municipal')}</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
              An administrator reviews privileged-role requests on the server. Until approval, you keep standard citizen access.
            </p>
          </div>
          <Button
            className="h-10 w-full bg-emerald-500 font-semibold text-[#06251B] hover:bg-emerald-400"
            onClick={() => setView('onboarding')}
          >
            {t('continueAsCitizen')}
          </Button>
          <p className="text-center">
            <button className="text-[12px] text-slate-400 hover:underline" onClick={() => setView('signin')}>
              {t('goSignIn')}
            </button>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('roleTitle')} sub={t('roleSub')}>
      <div className="grid grid-cols-2 gap-2.5">
        {ROLE_META.map((r) => (
          <button
            key={r.key}
            disabled={loadingRole !== null}
            onClick={() => pick(r.key)}
            className="group rounded-xl border border-white/10 bg-white/5 p-3.5 text-left transition-all hover:border-emerald-500/50 hover:bg-white/10 disabled:opacity-50"
          >
            <div className={`inline-flex size-9 items-center justify-center rounded-lg border ${r.tint}`}>
              {loadingRole === r.key ? <Loader2 className="size-4 animate-spin" /> : <r.icon className="size-4" />}
            </div>
            <div className="mt-2.5 text-[13px] font-bold text-white">{tr(r.key as 'citizen')}</div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{tr((r.key + 'Desc') as 'citizenDesc')}</p>
          </button>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
        {t('roleCitizenNote')}
      </p>
    </AuthShell>
  );
}

// ============ Onboarding ============
export function OnboardingScreen() {
  const t = useTranslations('auth.onboarding');
  const { setUser, setView, locale, setLocale } = useAppStore();
  const [regionState, setRegionState] = useState('');
  const [regionCity, setRegionCity] = useState('');
  const [mapFirst, setMapFirst] = useState(true);
  const [notif, setNotif] = useState(true);
  const [loading, setLoading] = useState(false);

  const states = Array.from(new Set(CITIES.map((c) => c.state)));
  const cities = CITIES.filter((c) => !regionState || c.state === regionState);

  async function finish(skip: boolean) {
    setLoading(true);
    try {
      const res = await api<{ user: import('@/lib/types').SessionUser }>('/api/auth', {
        body: skip
          ? { action: 'onboarding' }
          : {
              action: 'onboarding',
              language: locale,
              regionState,
              regionCity,
              notificationsEnabled: notif,
            },
      });
      setUser(res.user);
      setView('app');
    } catch {
      setView('app');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('title')} sub={t('sub')}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300">{t('regionLabel')}</Label>
            <Select value={regionState} onValueChange={(v) => { setRegionState(v); setRegionCity(''); }}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">{t('cityLabel')}</Label>
            <Select value={regionCity} onValueChange={setRegionCity}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {cities.map((c) => <SelectItem key={c.city} value={c.city}>{c.city}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">{t('dashPrefs')}</Label>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5">
            <span className="text-[13px] text-slate-200">{mapFirst ? t('prefMap') : t('prefList')}</span>
            <Switch checked={mapFirst} onCheckedChange={setMapFirst} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5">
          <span className="text-[13px] leading-snug text-slate-200">{t('notifPref')}</span>
          <Switch checked={notif} onCheckedChange={setNotif} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5">
          <span className="text-[13px] text-slate-200">English / हिन्दी</span>
          <Button variant="ghost" size="sm" className="h-7 text-slate-200" onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}>
            {locale === 'en' ? 'EN' : 'हिन्दी'}
          </Button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 pt-1">
          <SubmitBtn loading={loading} onClick={() => finish(false)}>{t('finish')}</SubmitBtn>
          <Button variant="ghost" className="h-10 text-slate-400 hover:text-white" disabled={loading} onClick={() => finish(true)}>
            {t('skip')}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}

// ============ Forced password change gate ============
export function ChangePasswordGate() {
  const t = useTranslations('auth.changePassword');
  const { user, setUser } = useAppStore();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await api('/api/auth', { body: { action: 'changePassword', currentPassword: current, password } });
      const session = await api<{ user: import('@/lib/types').SessionUser }>('/api/auth');
      setUser(session.user);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t('title')} sub={t('sub')}>
      <form onSubmit={submit} className="space-y-4">
        <ErrAlert msg={err} />
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-300">
          <Droplets className="size-3.5 shrink-0" />
          <span className="font-mono">{user?.email}</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">{t('current')}</Label>
          <Input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} autoComplete="current-password" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">{t('newPassword')}</Label>
          <PasswordField value={password} onChange={setPassword} placeholder="8+ characters" show={show} setShow={setShow} autoComplete="new-password" />
        </div>
        <SubmitBtn loading={loading}>{t('cta')}</SubmitBtn>
      </form>
    </AuthShell>
  );
}
