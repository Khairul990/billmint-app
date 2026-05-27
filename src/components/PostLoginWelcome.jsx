import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import Logo from "./Logo";

const READY_STEPS = [
  { label: "Login successful", icon: CheckCircle2 },
  { label: "BillQyro workspace ready", icon: ShieldCheck },
  { label: "Dashboard opening", icon: LayoutDashboard },
];

const BENEFITS = [
  { label: "Fast billing ready", icon: Zap },
  { label: "Smart invoices ready", icon: FileText },
  { label: "Secure workspace", icon: ShieldCheck },
];


function buildConfettiPieces(count) {
  const pieces = [];

  for (let i = 0; i < count; i += 1) {
    pieces.push({
      id: i,
      left: `${7 + ((i * 19) % 86)}%`,
      delay: (i % 13) * 0.065,
      duration: 2.05 + (i % 5) * 0.18,
      rotate: (i % 2 === 0 ? 1 : -1) * (120 + (i % 8) * 28),
      size: 7 + (i % 4) * 2,
      shape: i % 3,
    });
  }

  return pieces;
}

function buildSparkleBursts(count) {
  const sparks = [];

  for (let i = 0; i < count; i += 1) {
    sparks.push({
      id: i,
      angle: (Math.PI * 2 * i) / count,
      distance: 92 + (i % 5) * 16,
      delay: 0.18 + (i % 4) * 0.035,
    });
  }

  return sparks;
}

const CONFETTI_PIECES = buildConfettiPieces(34);
const SPARKLE_BURSTS = buildSparkleBursts(18);

function CelebrationConfetti({ show = false, reduceMotion = false }) {
  if (!show || reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {CONFETTI_PIECES.map((piece) => {
        const isCircle = piece.shape === 0;
        const isRectangle = piece.shape === 1;
        const className = isCircle
          ? "absolute top-0 rounded-full bg-theme-accent shadow-lg shadow-theme-glow"
          : isRectangle
            ? "absolute top-0 rounded-sm bg-theme-accent-gradient shadow-lg shadow-theme-glow"
            : "absolute top-0 rounded-full border-2 border-theme-accent bg-transparent shadow-lg shadow-theme-glow";

        return (
          <motion.span
            key={piece.id}
            initial={{ opacity: 0, y: -45, x: 0, rotate: 0, scale: 0.75 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, 160, 410, 730],
              x: [
                0,
                piece.id % 2 === 0 ? 26 : -26,
                piece.id % 2 === 0 ? -20 : 20,
                0,
              ],
              rotate: [0, piece.rotate / 2, piece.rotate, piece.rotate * 1.35],
              scale: [0.75, 1, 0.92, 0.72],
            }}
            transition={{ delay: piece.delay, duration: piece.duration, ease: "easeOut" }}
            className={className}
            style={{
              left: piece.left,
              width: piece.size,
              height: piece.shape === 1 ? piece.size * 1.6 : piece.size,
            }}
          />
        );
      })}
    </div>
  );
}

function CenterSparkBurst({ show = false, reduceMotion = false }) {
  if (!show || reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-[23%] z-30 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
      {SPARKLE_BURSTS.map((spark) => {
        const x = Math.cos(spark.angle) * spark.distance;
        const y = Math.sin(spark.angle) * spark.distance;

        return (
          <motion.span
            key={spark.id}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0], x, y, scale: [0.2, 1, 0.25] }}
            transition={{ delay: spark.delay, duration: 0.95, ease: "easeOut" }}
            className="absolute h-2.5 w-2.5 rounded-full bg-theme-accent shadow-[0_0_22px_currentColor]"
          />
        );
      })}

      <motion.div
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.3, 2.8, 4] }}
        transition={{ delay: 0.08, duration: 0.95, ease: "easeOut" }}
        className="absolute -left-12 -top-12 h-24 w-24 rounded-full border border-theme-accent"
      />
    </div>
  );
}

function FloatingOrbs({ reduceMotion = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={reduceMotion ? {} : { scale: [1, 1.12, 1], opacity: [0.28, 0.55, 0.28] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-theme-accent/20 blur-3xl"
      />

      <motion.div
        animate={reduceMotion ? {} : { scale: [1.08, 1, 1.08], opacity: [0.18, 0.42, 0.18] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-28 h-[30rem] w-[30rem] rounded-full bg-theme-accent/20 blur-3xl"
      />

      <motion.div
        animate={reduceMotion ? {} : { x: [-14, 18, -14], y: [0, -18, 0], opacity: [0.16, 0.32, 0.16] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[12%] top-[58%] h-28 w-28 rounded-[2rem] border border-theme-soft bg-theme-card/30 backdrop-blur-md"
      />

      <motion.div
        animate={reduceMotion ? {} : { x: [18, -12, 18], y: [-10, 18, -10], opacity: [0.12, 0.28, 0.12] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[12%] top-[18%] h-24 w-24 rounded-full border border-theme-soft bg-theme-card/30 backdrop-blur-md"
      />
    </div>
  );
}

function DashboardRevealBackdrop({ show = false, reduceMotion = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.06, filter: "blur(18px)" }}
      animate={{
        opacity: show ? 0.42 : 0,
        scale: show ? 1 : reduceMotion ? 1 : 1.06,
        filter: show ? "blur(8px)" : "blur(18px)",
      }}
      transition={{ duration: reduceMotion ? 0.2 : 1.1, ease: "easeOut" }}
      className="pointer-events-none absolute inset-4 z-0 hidden overflow-hidden rounded-[2.5rem] border border-theme-soft bg-theme-surface/50 shadow-2xl sm:block"
    >
      <div className="grid h-full grid-cols-[220px_1fr] gap-5 p-5 opacity-80">
        <div className="rounded-[2rem] border border-theme-soft bg-theme-card/70 p-4">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-theme-accent-gradient" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-theme-accent/35" />
              <div className="h-2 w-16 rounded-full bg-theme-accent/20" />
            </div>
          </div>
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`mb-3 h-11 rounded-2xl ${item === 0 ? "bg-theme-accent/25" : "bg-theme-surface/70"}`}
            />
          ))}
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-theme-soft bg-theme-card/75 p-6">
            <div className="h-4 w-36 rounded-full bg-theme-accent/25" />
            <div className="mt-4 h-9 w-72 rounded-full bg-theme-primary/10" />
            <div className="mt-3 h-3 w-96 rounded-full bg-theme-accent/15" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-[1.6rem] border border-theme-soft bg-theme-card/75 p-5">
                <div className="h-3 w-20 rounded-full bg-theme-accent/20" />
                <div className="mt-4 h-7 w-28 rounded-full bg-theme-primary/10" />
              </div>
            ))}
          </div>
          <div className="h-36 rounded-[2rem] border border-theme-soft bg-theme-card/75" />
        </div>
      </div>
    </motion.div>
  );
}

function AnimatedSuccessCheck({ reduceMotion = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.72, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : 0.55, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="absolute -right-3 -top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-theme-surface text-theme-accent shadow-lg shadow-theme-glow ring-2 ring-theme-soft"
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M20 6 9 17l-5-5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.7, duration: reduceMotion ? 0.1 : 0.42, ease: "easeOut" }}
        />
      </motion.svg>
    </motion.div>
  );
}

function LogoMark({ reduceMotion = false }) {
  return (
    <div className="relative mx-auto flex w-fit items-center justify-center mt-4">
      <motion.div
        animate={reduceMotion ? {} : { scale: [1, 1.12, 1], opacity: [0.15, 0.45, 0.15] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-[2rem] bg-theme-accent/20 blur-xl"
      />

        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.82, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.52, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex items-center justify-center rounded-[2rem] bg-theme-surface dark:bg-theme-card/40 backdrop-blur-2xl border border-theme-soft dark:border-white/5 px-10 py-6 shadow-2xl shadow-theme-glow/40"
        >
        <Logo className="scale-125 origin-center" />
        <AnimatedSuccessCheck reduceMotion={reduceMotion} />
      </motion.div>
    </div>
  );
}

function TextShine({ children, reduceMotion = false }) {
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <span className="relative z-10">{children}</span>
      {!reduceMotion && (
        <motion.span
          aria-hidden="true"
          initial={{ x: "-140%" }}
          animate={{ x: "150%" }}
          transition={{ delay: 1.05, duration: 1.35, ease: "easeInOut" }}
          className="absolute inset-y-0 z-20 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />
      )}
    </span>
  );
}

function PremiumWelcomeBoard({ show = false, reduceMotion = false, userName = "", activeStep = -1, onComplete }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 30, scale: reduceMotion ? 1 : 0.955 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -16, scale: reduceMotion ? 1 : 0.985 }}
          transition={{ duration: reduceMotion ? 0.18 : 0.62, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[3rem] border border-theme-soft bg-theme-card/60 p-6 text-center shadow-2xl shadow-theme-glow/40 backdrop-blur-2xl sm:p-10"
        >
          <FloatingOrbs reduceMotion={reduceMotion} />

          <div className="relative">
            <LogoMark reduceMotion={reduceMotion} />

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.25, duration: 0.42 }}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-theme-soft bg-theme-surface px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-theme-primary shadow-sm"
            >
              <Trophy className="h-4 w-4 text-theme-accent" /> Congratulations!
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24, filter: reduceMotion ? "blur(0px)" : "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: reduceMotion ? 0 : 0.45, duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-4xl font-black leading-tight tracking-tight text-theme-primary sm:text-5xl lg:text-6xl"
            >
              {userName ? (
                <>
                  <TextShine reduceMotion={reduceMotion}>Welcome back, </TextShine>
                  <span className="text-theme-primary"><TextShine reduceMotion={reduceMotion}>{userName}</TextShine></span>
                </>
              ) : (
                <>
                  <TextShine reduceMotion={reduceMotion}>Welcome to </TextShine>
                  <span className="text-theme-primary"><TextShine reduceMotion={reduceMotion}>BillQyro</TextShine></span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.72, duration: 0.48, ease: "easeOut" }}
              className="mx-auto mt-5 max-w-xl text-lg font-black leading-7 text-theme-primary sm:text-xl"
            >
              Login successful — your smart BillQyro workspace is ready.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.92, duration: 0.48, ease: "easeOut" }}
              className="mx-auto mt-3 max-w-2xl text-base font-semibold leading-7 text-theme-secondary sm:text-lg"
            >
              Thank you for choosing BillQyro. Create invoices faster, manage customers easily, and grow your business with confidence.
            </motion.p>

            <ProgressSteps show={show} activeStep={activeStep} reduceMotion={reduceMotion} />
            <OpeningFooter show={show} reduceMotion={reduceMotion} onComplete={onComplete} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProgressSteps({ show = false, activeStep = -1, reduceMotion = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 18 }}
      transition={{ delay: reduceMotion ? 0 : 0.22, duration: 0.42 }}
      className="mx-auto mt-6 w-full max-w-3xl"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {READY_STEPS.map((step, index) => {
          const Icon = step.icon;
          const done = activeStep >= index;
          const cardClassName = done
            ? "border-theme-accent bg-theme-surface dark:bg-theme-card/60 text-theme-primary shadow-xl shadow-theme-glow/30 backdrop-blur-2xl"
            : "border-theme-soft dark:border-white/5 bg-theme-surface dark:bg-theme-card/40 text-theme-secondary backdrop-blur-2xl shadow-md";
          const iconClassName = done
            ? "bg-theme-accent text-white shadow-md"
            : "bg-slate-100 dark:bg-theme-accent/15 text-slate-400 dark:text-theme-secondary";

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              animate={{ opacity: show ? 1 : 0, y: show ? 0 : 14 }}
              transition={{ delay: reduceMotion ? 0 : 0.38 + index * 0.12, duration: 0.35 }}
              className={`rounded-2xl border px-4 py-4 transition-all duration-500 ${cardClassName}`}
            >
              <div className="flex items-center justify-center gap-3 sm:flex-col sm:gap-2">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-black">{step.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: show ? 1 : 0, scaleX: show ? 1 : 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.82, duration: 0.4 }}
        className="mt-6 h-3 origin-left overflow-hidden rounded-full bg-theme-accent/15"
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: show ? "100%" : "0%" }}
          transition={{ delay: reduceMotion ? 0 : 0.95, duration: reduceMotion ? 0.45 : 2.05, ease: "easeInOut" }}
          className="h-full rounded-full bg-theme-accent-gradient shadow-lg shadow-theme-glow"
        />
      </motion.div>
    </motion.div>
  );
}

function OpeningFooter({ show = false, reduceMotion = false, onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 12 }}
      transition={{ delay: reduceMotion ? 0 : 1.18, duration: 0.4 }}
      className="mt-8 flex justify-center"
    >
      <button
        onClick={onComplete}
        className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-theme-accent px-8 py-3.5 font-bold text-white shadow-xl shadow-theme-glow hover:opacity-90 active:scale-95 transition-all"
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
        <span>Get Started</span>
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </motion.div>
  );
}

export default function PostLoginWelcome({ show = true, userName = "", onComplete }) {
  const reduceMotion = useReducedMotion();
  const [showBoard, setShowBoard] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (!show) return undefined;

    const timers = reduceMotion
      ? [
          window.setTimeout(() => setShowBoard(true), 80),
          window.setTimeout(() => setActiveStep(2), 210),
        ]
      : [
          window.setTimeout(() => setShowConfetti(true), 120),
          window.setTimeout(() => setShowBoard(true), 180),
          window.setTimeout(() => setActiveStep(0), 1500),
          window.setTimeout(() => setActiveStep(1), 1950),
          window.setTimeout(() => setActiveStep(2), 2450),
        ];

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [show, reduceMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reduceMotion ? 1 : 1.01, filter: reduceMotion ? "blur(0px)" : "blur(8px)" }}
          transition={{ duration: reduceMotion ? 0.15 : 0.45 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-theme-app/95 px-4 py-6 text-theme-primary backdrop-blur-2xl"
        >
          <DashboardRevealBackdrop show={showBoard} reduceMotion={reduceMotion} />
          <FloatingOrbs reduceMotion={reduceMotion} />
          <CelebrationConfetti show={showConfetti} reduceMotion={reduceMotion} />
          <CenterSparkBurst show={showConfetti} reduceMotion={reduceMotion} />

          <motion.div
            initial={{ y: reduceMotion ? 0 : 24, opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: reduceMotion ? 0 : -20, opacity: 0, scale: reduceMotion ? 1 : 0.97 }}
            transition={{ duration: reduceMotion ? 0.18 : 0.55, ease: "easeOut" }}
            className="relative z-20 w-full max-w-5xl p-5 sm:p-8"
          >
            <PremiumWelcomeBoard show={showBoard} reduceMotion={reduceMotion} userName={userName} activeStep={activeStep} onComplete={onComplete} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
