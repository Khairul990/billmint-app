import { useState } from "react";

function BrandMark() {
  return (
    <div className="flex items-center scale-100 origin-left">
      <Logo type="horizontal" />
    </div>
  );
}

export default function DemoLogin({ onDemoLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [cardHover, setCardHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSigningIn(true);
    
    // Simulate network latency for realism
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Set demo login flag safely
    localStorage.setItem('billqyro_demo_logged_in', 'true');
    
    setIsSigningIn(false);
    onDemoLoginSuccess();
  };

  return (
    <AnimatedPage>
      <div className="relative min-h-screen w-full bg-theme-app p-4 text-theme-primary sm:p-6 lg:p-8 flex items-center justify-center">
      <section className="flex items-center justify-center w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            setMousePosition({ x, y });
            setCardHover(true);
          }}
          onMouseLeave={() => setCardHover(false)}
          className="relative w-full overflow-hidden rounded-[2rem] border border-theme-border-soft bg-theme-surface/80 p-6 shadow-2xl shadow-theme-glow/5 backdrop-blur-xl transition-colors duration-300 sm:p-10"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            animate={cardHover ? { opacity: 0.72 } : { opacity: 0.18 }}
            transition={{ duration: 0.28 }}
            style={{
              background: `radial-gradient(420px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(245,158,11,0.16), rgba(251,191,36,0.055) 28%, transparent 64%)`,
            }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-amber-500/10"
            animate={cardHover ? { boxShadow: "inset 0 0 0 1px rgba(245,158,11,0.18), 0 0 40px rgba(245,158,11,0.10)" } : { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 0 rgba(0,0,0,0)" }}
            transition={{ duration: 0.25 }}
          />
          
          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="mb-8 flex justify-center">
              <BrandMark />
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="text-center">
              <div className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-500">
                <ShieldCheck className="w-3 h-3" /> Sandbox Mode Active
              </div>
              <h1 className="text-3xl font-black tracking-tight text-theme-primary sm:text-4xl">
                Demo User Journey
              </h1>
              <p className="mt-3 text-sm font-semibold text-theme-muted px-4">
                Experience the full BillQyro workflow exactly as a new user would. 100% safely isolated.
              </p>
            </motion.div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <motion.label initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="block relative group">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">Email address</span>
                <div className="relative opacity-70">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-[18px] w-[18px] text-theme-muted" />
                  </div>
                  <input
                    type="email"
                    value="demo@billqyro.local"
                    readOnly
                    className="h-12 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-11 pr-4 text-sm text-theme-primary outline-none cursor-not-allowed"
                  />
                </div>
              </motion.label>

              <motion.label initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="block relative group">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">Password</span>
                <div className="relative opacity-70">
                  <input
                    type={showPassword ? "text" : "password"}
                    value="demopassword123"
                    readOnly
                    className="h-12 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-4 pr-12 text-sm text-theme-primary outline-none cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.label>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSigningIn}
                  className="group relative flex h-[52px] w-full items-center justify-center overflow-hidden rounded-[22px] border-0 bg-amber-500 px-6 font-black text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:bg-amber-400"
                >
                  <span className="relative flex items-center gap-2 text-[15px]">
                    {isSigningIn ? "Signing in..." : "Start Demo Login"}
                    {isSigningIn ? (
                      <motion.span
                        className="h-4 w-4 rounded-full border-2 border-amber-950/40 border-t-amber-950"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" size={18} />
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </section>
    </div>
    </AnimatedPage>
  );
}
