import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { rules } from '../../lib/validation';
import { FormError, Input } from '../../components/ui/Form';
import { DemoNotice } from '../../components/ui/Feedback';
import { LogoMark } from '../../components/public/Logo';

const DEMO_USERS = [
  ['admin@demo-showroom.pk', 'Owner / Admin'],
  ['manager@demo-showroom.pk', 'Manager'],
  ['sales@demo-showroom.pk', 'Sales Representative'],
  ['inventory@demo-showroom.pk', 'Inventory Manager'],
];

export default function AdminLogin() {
  const { admin, adminLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({ email: 'admin@demo-showroom.pk', password: '' }, {
    email: [rules.required('Email'), rules.email()],
    password: [rules.required('Password')],
  });
  if (admin) return <Navigate to="/admin/dashboard" replace />;

  const submit = form.submit(async (v) => {
    await adminLogin(v.email, v.password);
    navigate(location.state?.from || '/admin/dashboard', { replace: true });
  });

  return (
    <div className="dark grid min-h-screen bg-carbon text-bone lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-black lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,91,31,0.25),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3"><LogoMark className="h-10 w-10" /><span className="font-display text-xl">REVZONE</span></div>
          <div>
            <h1 className="font-display text-5xl">Showroom manager</h1>
            <p className="mt-4 max-w-md text-fog">Inventory, bookings, sales, invoices and website content – one dashboard for the whole dealership.</p>
          </div>
          <p className="text-xs text-fog">Demo environment. Data resets when the API restarts.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} noValidate className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-extrabold">Staff sign in</h2>
            <p className="mt-1 text-sm text-fog">Use a demo account below.</p>
          </div>
          <DemoNotice>
            Demo authentication only – password for every demo account is <b>admin123</b>. Real deployments must enforce authentication in FastAPI.
          </DemoNotice>
          <FormError message={form.formError} />
          <Input name="email" type="email" label="Email" autoComplete="username" value={form.values.email} onChange={form.handleChange} error={form.errors.email} />
          <Input name="password" type="password" label="Password" autoComplete="current-password" value={form.values.password} onChange={form.handleChange} error={form.errors.password} />
          <button className="btn-primary w-full py-3" disabled={form.submitting}>{form.submitting ? 'Signing in…' : 'Sign in'}</button>
          <fieldset>
            <legend className="mb-2 text-xs text-fog">Quick fill a demo role</legend>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map(([email, role]) => (
                <button key={email} type="button" onClick={() => form.setValues({ email, password: 'admin123' })}
                  className="rounded-lg border border-white/10 px-3 py-2 text-left text-xs hover:border-white/30">
                  {role}
                </button>
              ))}
            </div>
          </fieldset>
          <a href="/" className="block text-center text-sm text-fog hover:text-bone">Back to the website</a>
        </motion.form>
      </div>
    </div>
  );
}
