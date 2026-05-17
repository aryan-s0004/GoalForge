import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const FEATURES = [
  { icon: '✅', title: 'Approval Workflows', desc: 'Multi-level goal approval from employee to manager with inline editing and feedback.' },
  { icon: '🔒', title: 'Locked Goals', desc: 'Approved goals are auto-locked, preventing edits. Admins can unlock for revisions.' },
  { icon: '📊', title: 'Quarterly Check-ins', desc: 'Track progress every quarter with achievement updates and manager comments.' },
  { icon: '⚖️', title: 'Weightage Validation', desc: 'Goals must total 100% weightage with a minimum 10% per goal. System enforces it.' },
  { icon: '🤝', title: 'Shared KPIs', desc: 'Admins cascade organization-wide goals to departments and individual employees.' },
  { icon: '📋', title: 'Audit Trail', desc: 'Every approval, rejection, edit, and lock action is logged for compliance.' },
];

const WORKFLOW = [
  { step: '01', title: 'Employee Creates Goals', desc: 'Define quarterly goals with UOM, targets, and weightage allocation.' },
  { step: '02', title: 'Manager Reviews', desc: 'Approve, reject with feedback, or inline-edit target values.' },
  { step: '03', title: 'Goals Lock Automatically', desc: 'Approved goals become immutable. Quarterly tracking begins.' },
  { step: '04', title: 'Admin Oversees Organization', desc: 'Analytics, shared KPIs, audit logs, and unlock controls.' },
];

const PRICING = [
  { plan: 'Team', price: '$8', period: '/user/mo', features: ['Up to 50 employees', 'Goal creation & approval', 'Basic analytics', 'Email support'], highlight: false },
  { plan: 'Business', price: '$14', period: '/user/mo', features: ['Unlimited employees', 'Shared KPIs', 'Audit trail', 'CSV export', 'Priority support'], highlight: true },
  { plan: 'Enterprise', price: 'Custom', period: '', features: ['SSO & SCIM', 'Custom integrations', 'Dedicated CSM', 'SLA guarantee', 'On-premise option'], highlight: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ─── Sticky Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-lg gradient-brand-bg flex items-center justify-center">
              <span className="text-white text-xs font-extrabold">G</span>
            </div>
            GoalForge
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Product</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#analytics" className="hover:text-foreground transition-colors">Analytics</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/login" className="text-sm font-semibold gradient-brand-bg text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="hero-bg">
        <motion.div {...stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto text-center pt-24 pb-20 px-6">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold gradient-brand-bg text-white px-3 py-1 rounded-full mb-6">
              🚀 Enterprise Goal Management
            </span>
          </motion.div>
          <motion.h1 {...fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Align teams. Track goals.{' '}
            <span className="gradient-text">Drive results.</span>
          </motion.h1>
          <motion.p {...fadeUp} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            GoalForge is the enterprise OKR platform that gives HR teams complete control over
            goal setting, approvals, quarterly check-ins, and performance tracking — all in one place.
          </motion.p>
          <motion.div {...fadeUp} className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/login" className="gradient-brand-bg text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-glow">
              Start Free Trial
            </Link>
            <a href="#features" className="px-6 py-3 rounded-lg border border-border font-semibold hover:bg-muted transition-colors">
              See Features
            </a>
          </motion.div>
          <motion.div {...fadeUp} className="mt-6 flex justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="text-success">✓</span> No credit card</span>
            <span className="flex items-center gap-1.5"><span className="text-success">✓</span> SOC 2 compliant</span>
            <span className="flex items-center gap-1.5"><span className="text-success">✓</span> 14-day free trial</span>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div {...fadeUp} className="mt-16 surface-card shadow-elevated overflow-hidden">
            <div className="bg-muted border-b border-border px-4 py-2.5 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-4 text-xs text-muted-foreground font-mono">goalforge.app/dashboard</span>
            </div>
            <div className="grid grid-cols-12 min-h-[320px]">
              <div className="col-span-3 sidebar-gradient p-4 hidden md:block">
                <div className="space-y-3 mt-4">
                  {['Dashboard', 'My Goals', 'Check-ins', 'Team', 'Reports'].map((item, i) => (
                    <div key={item} className={`text-sm px-3 py-2 rounded-lg ${i === 0 ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white/80'}`}>{item}</div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 md:col-span-9 p-6 bg-muted/30">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-3 w-40 bg-border rounded mb-2" />
                    <div className="h-2 w-24 bg-border/70 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-primary/10 rounded-lg" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Active Goals', value: '12', color: 'bg-primary/10 text-primary' },
                    { label: 'Completion', value: '78%', color: 'bg-success/10 text-success' },
                    { label: 'Pending', value: '3', color: 'bg-warning/10 text-warning' },
                  ].map((stat) => (
                    <div key={stat.label} className="panel p-4">
                      <div className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="panel p-4">
                  <div className="space-y-3">
                    {['Increase partner activation by 20%', 'Reduce ticket TAT to 4 hours', 'Launch onboarding automation'].map((goal, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-success' : i === 1 ? 'bg-warning' : 'bg-primary'}`} />
                        <span className="text-foreground/80">{goal}</span>
                        <div className="ml-auto flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${70 - i * 20}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{70 - i * 20}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Product Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">Everything your HR team needs</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Built for enterprise goal management with compliance, approval workflows, and real-time tracking.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="surface-card p-6 hover:shadow-elevated transition-all group"
              >
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Workflow ──────────────────────────────────────────────── */}
      <section id="workflow" className="py-24 px-6 mesh-bg">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">From draft to done — in 4 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {WORKFLOW.map((w, i) => (
              <motion.div
                key={w.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="surface-card p-6 flex gap-5"
              >
                <div className="text-3xl font-extrabold gradient-text opacity-50 shrink-0">{w.step}</div>
                <div>
                  <h3 className="font-semibold text-lg">{w.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{w.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Analytics ─────────────────────────────────────────────── */}
      <section id="analytics" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Analytics</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">Insights that drive performance</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Real-time dashboards for every role — employees, managers, and administrators.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { role: 'Employee', features: ['Personal goal tracker', 'Weightage visualization', 'Quarterly progress', 'Submission status'], color: 'bg-primary/10 text-primary' },
              { role: 'Manager', features: ['Team approval queue', 'Inline goal editing', 'Feedback & comments', 'Performance overview'], color: 'bg-success/10 text-success' },
              { role: 'Admin', features: ['Organization heatmap', 'Audit log stream', 'Shared KPI cascading', 'Export & reporting'], color: 'bg-warning/10 text-warning' },
            ].map((card, i) => (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="surface-card p-6"
              >
                <div className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold mb-4 ${card.color}`}>
                  {card.role} View
                </div>
                <ul className="space-y-3">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 mesh-bg">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">Simple, transparent pricing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((p, i) => (
              <motion.div
                key={p.plan}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`surface-card p-6 flex flex-col ${p.highlight ? 'ring-2 ring-primary shadow-glow' : ''}`}
              >
                <h3 className="font-semibold text-lg">{p.plan}</h3>
                <div className="flex items-baseline gap-1 mt-3 mb-6">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <ul className="space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-success">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`mt-6 block text-center py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    p.highlight
                      ? 'gradient-brand-bg text-white hover:opacity-90'
                      : 'border border-border hover:bg-muted'
                  }`}
                >
                  {p.highlight ? 'Start Free Trial' : 'Get Started'}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center surface-card gradient-brand-bg p-12 rounded-2xl">
          <h2 className="text-3xl font-bold text-white">Ready to align your team?</h2>
          <p className="mt-4 text-white/80 text-lg">
            Join 500+ enterprises using GoalForge to track and achieve quarterly objectives.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/login" className="bg-white text-foreground font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <div className="h-7 w-7 rounded-md gradient-brand-bg flex items-center justify-center">
              <span className="text-white text-xs font-extrabold">G</span>
            </div>
            GoalForge
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 GoalForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
