import { toast } from 'react-hot-toast';
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants } from '../utils/animations';
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Globe2,
  IndianRupee,
  Link2,
  Mail,
  Plus,
  QrCode,
  ReceiptText,
  Share2,
  Smartphone,
  UserRound,
  Zap,
} from "lucide-react";
import { ShimmerButton } from '../components/magicui/shimmer-button';

import { auth, firebaseReady, db } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import Logo from '../components/Logo';

const STEPS = [
  { key: "login", title: "Secure Login", sub: "Enter BillQyro workspace", icon: Check },
  { key: "setup", title: "Workspace Setup", sub: "Region and business details", icon: Globe2 },
  { key: "dashboard", title: "Dashboard Opened", sub: "All billing tools ready", icon: CreditCard },
  { key: "customer", title: "Customer Added", sub: "Ready for billing", icon: UserRound },
  { key: "invoice", title: "Invoice Created", sub: "Items and total added", icon: ReceiptText },
  { key: "preview", title: "Live Preview", sub: "Customer invoice view ready", icon: Smartphone },
  { key: "pdf", title: "PDF Ready", sub: "Printable invoice generated", icon: FileCheck2 },
  { key: "download", title: "Downloaded", sub: "Saved successfully", icon: Download },
  { key: "share", title: "Share Link Sent", sub: "Customer receives full invoice link", icon: Share2 },
  { key: "paylink", title: "Payment Link Opened", sub: "Customer can pay instantly", icon: IndianRupee },
  { key: "paid", title: "Payment Received", sub: "Status synced automatically", icon: CreditCard },
  { key: "done", title: "Completed", sub: "Billing completed", icon: Check },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function BrandMark({ small = false }) {
  return (
    <div className={cn("flex items-center", small ? "scale-75 origin-left" : "scale-100 origin-left")}>
      <Logo type="horizontal" />
    </div>
  );
}

function ShowcaseCard({ icon: Icon, title, sub, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 160, damping: 18, mass: 1 }}
      className="relative flex h-[430px] w-full flex-col overflow-hidden rounded-[1.8rem] border border-theme-border-soft/40 bg-theme-app/40 p-5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl ring-1 ring-inset ring-white/5 before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.08] before:to-transparent before:content-['']"
    >
      <div className="relative z-10 mb-4 flex shrink-0 items-center gap-3 border-b border-theme-border-soft pb-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-theme-accent-light text-theme-accent">
          <Icon size={21} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-black tracking-tight text-theme-primary">{title}</h3>
          <p className="mt-0.5 truncate text-xs text-theme-accent/80">{sub}</p>
        </div>
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">{children}</div>
    </motion.div>
  );
}

function DemoInput({ width }) {
  return (
    <div className="h-10 rounded-2xl border border-theme-border-soft bg-theme-card px-4 py-3">
      <div className="h-2 rounded-full bg-theme-surface/45" style={{ width }} />
    </div>
  );
}

function LoginDemoCard() {
  return (
    <ShowcaseCard icon={Check} title="Secure Login" sub="Workspace unlocked">
      <div className="flex h-full flex-col justify-center rounded-[1.4rem] border border-theme-border-soft bg-theme-surface p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-theme-accent-light text-theme-accent">
            <Check size={22} />
          </div>
          <div>
            <p className="font-black text-theme-primary">Welcome back</p>
            <p className="text-xs text-theme-muted">Secure workspace access verified</p>
          </div>
        </div>
        <div className="space-y-3">
          <DemoInput width="70%" />
          <DemoInput width="52%" />
        </div>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.15, ease: "easeOut" }}
          className="mt-4 h-10 rounded-2xl bg-[image:var(--accent-gradient)] shadow-glow"
        />
      </div>
    </ShowcaseCard>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-2xl border border-theme-border-soft bg-theme-card px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wide text-theme-muted">{label}</p>
      <p className="mt-1 truncate text-[11px] font-bold text-theme-primary">{value}</p>
    </div>
  );
}

function SetupCard() {
  const regions = [
    { code: "IN", label: "India" },
    { code: "BD", label: "Bangladesh" },
    { code: "Other", label: "Manual" },
  ];

  return (
    <ShowcaseCard icon={Globe2} title="Workspace Setup" sub="Configure once, bill faster">
      <div className="flex h-full flex-col gap-4">
        <div className="rounded-[1.35rem] border border-theme-border-soft bg-theme-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-theme-accent">Step 1 of 2</p>
              <p className="mt-1 font-black text-theme-primary">Configure Local Region</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-theme-border-soft bg-theme-accent-light text-theme-accent">
              <Globe2 size={18} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {regions.map((region, index) => (
              <motion.div
                key={region.code}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                className={cn(
                  "rounded-2xl border p-3 text-center",
                  index === 0 ? "border-theme-accent/60 bg-theme-accent-light" : "border-theme-border-soft bg-theme-surface"
                )}
              >
                <p className="text-base font-black text-theme-primary">{region.code}</p>
                <p className="mt-1 text-[10px] text-theme-muted">{region.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex-1 rounded-[1.35rem] border border-theme-border-soft bg-theme-surface p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-theme-accent-light text-theme-accent">
              <Building2 size={18} />
            </div>
            <div>
              <p className="font-black text-theme-primary">Your Business Workspace</p>
              <p className="text-xs text-theme-muted">Business details saved securely</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InfoField label="Business" value="Your Shop / Studio" />
            <InfoField label="Owner" value="Account Owner" />
            <div className="col-span-2">
              <InfoField label="Billing Email" value="business@example.com" />
            </div>
          </div>
        </div>
      </div>
    </ShowcaseCard>
  );
}

function SideMini({ label, active = false }) {
  return (
    <div className={cn("rounded-xl px-2 py-2 text-[9px] font-bold", active ? "bg-theme-accent-light text-theme-accent" : "text-theme-muted")}>
      {label}
    </div>
  );
}

function DashStat({ label, value, active = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border p-2", active ? "border-theme-border-soft bg-theme-accent-light" : "border-theme-border-soft bg-theme-surface")}
    >
      <p className={cn("text-[9px] font-bold uppercase tracking-wide", active ? "text-theme-accent/80" : "text-theme-muted")}>{label}</p>
      <p className="mt-1 text-sm font-black text-theme-primary">{value}</p>
    </motion.div>
  );
}

function ActionTile({ icon: Icon, text, active = false }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black", active ? "bg-theme-accent text-theme-primary" : "bg-theme-surface text-theme-muted")}>
      <Icon size={13} />
      {text}
    </div>
  );
}

function DashboardCard() {
  return (
    <ShowcaseCard icon={CreditCard} title="Dashboard Opened" sub="Active workspace ready">
      <div className="h-full overflow-hidden rounded-[1.4rem] border border-theme-border-soft bg-theme-surface">
        <div className="flex h-full">
          <div className="w-[76px] border-r border-theme-border-soft bg-theme-card p-2.5">
            <div className="mb-4 grid h-7 w-7 place-items-center rounded-lg bg-theme-accent text-[10px] font-black text-theme-primary">BQ</div>
            <div className="space-y-2">
              <SideMini active label="Dash" />
              <SideMini label="Bills" />
              <SideMini label="Clients" />
              <SideMini label="Plans" />
            </div>
          </div>

          <div className="min-w-0 flex-1 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="inline-flex rounded-full border border-theme-border-soft bg-theme-accent-light px-2 py-1 text-[8px] font-black uppercase tracking-wide text-theme-accent">
                  Active Workspace
                </div>
                <p className="mt-2 truncate text-sm font-black text-theme-primary">Business Dashboard</p>
              </div>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-theme-border-soft bg-theme-surface text-theme-accent">
                <CreditCard size={15} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <DashStat label="Revenue" value="₹82.4K" active />
              <DashStat label="Bills" value="128" />
              <DashStat label="Clients" value="42" />
            </div>

            <div className="mt-3 rounded-2xl border border-theme-border-soft bg-theme-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-wide text-theme-muted">Quick Actions</p>
                <p className="text-[9px] font-bold text-theme-accent">Ready</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ActionTile icon={Plus} text="Invoice" active />
                <ActionTile icon={UserRound} text="Customer" />
                <ActionTile icon={FileText} text="PDF" />
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-theme-border-soft bg-theme-accent-light p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wide text-theme-accent">Recent Bill</p>
                  <p className="mt-1 truncate text-xs font-black text-theme-primary">INV-DEMO-1002</p>
                  <p className="mt-0.5 text-[10px] text-theme-muted">₹2,510 · Pending</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-theme-accent-light text-theme-accent">
                  <ReceiptText size={18} />
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-theme-card/10">
                <motion.div initial={{ width: "0%" }} animate={{ width: "76%" }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full bg-[image:var(--accent-gradient)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseCard>
  );
}

function MiniChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-theme-border-soft bg-theme-surface p-3">
      <p className="text-theme-muted">{label}</p>
      <p className="mt-1 font-bold text-theme-primary">{value}</p>
    </div>
  );
}

function CustomerCard() {
  return (
    <ShowcaseCard icon={UserRound} title="Customer Added" sub="Profile saved">
      <div className="flex h-full flex-col justify-center gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-theme-border-soft bg-theme-surface p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-theme-border-soft bg-theme-accent-light font-black text-theme-accent">DC</div>
          <div className="min-w-0">
            <p className="font-bold text-theme-primary">Demo Customer</p>
            <p className="mt-1 text-xs text-theme-muted">Sample customer profile · India</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <MiniChip label="Payment" value="Cash" />
          <MiniChip label="Status" value="Active" />
        </div>
      </div>
    </ShowcaseCard>
  );
}

function InvoiceCard() {
  const rows = [
    ["Embroidery Design ×2", "₹800"],
    ["Garment Stitching ×3", "₹1,200"],
    ["Custom Repair ×1", "₹350"],
    ["Finishing Charge ×1", "₹160"],
  ];

  return (
    <ShowcaseCard icon={ReceiptText} title="Invoice Created" sub="Items added automatically">
      <div className="flex h-full flex-col justify-center">
        <div className="space-y-2">
          {rows.map(([item, price], index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -14, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: index * 0.16, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between rounded-xl bg-theme-surface px-3 py-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 truncate text-theme-muted">
                <Plus size={12} className="shrink-0 text-theme-accent" />
                {item}
              </span>
              <span className="shrink-0 font-semibold text-theme-primary">{price}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-theme-border-soft pt-4">
          <span className="text-xs text-theme-muted">Grand Total</span>
          <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.45 }} className="text-2xl font-black text-theme-accent">
            ₹2,510
          </motion.span>
        </div>
        <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ delay: 0.25, duration: 1.2, ease: "easeOut" }} className="mt-4 h-1.5 rounded-full bg-[image:var(--accent-gradient)]" />
      </div>
    </ShowcaseCard>
  );
}

function MiniInvoiceDocument({ compact = false, pdf = false }) {
  const rows = [
    ["SH-134", "S/BUTI", "2", "₹80"],
    ["SH-140", "S/BUTI", "2", "₹120"],
    ["SH-145", "B/BUTI", "1", "₹120"],
    ["SH-01-010", "Repair", "1", "₹50"],
  ];

  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-[1rem] bg-theme-card text-theme-primary", compact ? "p-3" : "p-2")}>
      <div className="shrink-0 border-b border-theme-border-soft pb-2">
        <p className={cn("font-black leading-tight", compact ? "text-[11px]" : "text-[10px]")}>KB.Embroidery Designer</p>
        <p className="mt-0.5 truncate text-[7px] font-semibold text-theme-muted">Dhulagor Howrah · khairul2052007@gmail.com</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] font-black tracking-wide">INVOICE</p>
          <div className="text-right text-[7px] font-bold text-theme-muted">
            <p>INV-1002</p>
            <p>24-05-2026</p>
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-theme-border-soft py-2 text-[7px]">
        <div>
          <p className="font-black uppercase text-theme-muted">Invoiced To</p>
          <p className="mt-1 font-bold">Soheb Mollik</p>
          <p className="text-theme-muted">Howrah</p>
        </div>
        <div>
          <p className="font-black uppercase text-theme-muted">Registry</p>
          <p className="mt-1 text-theme-muted">Term: Cash</p>
          <p className="text-theme-muted">Status: Pending</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 py-2">
        <div className="grid grid-cols-[0.8fr_1fr_0.4fr_0.6fr] gap-1 rounded-md bg-theme-surface px-1.5 py-1 text-[6.5px] font-black text-theme-muted">
          <span>Design</span>
          <span>Type</span>
          <span>Qty</span>
          <span>Amt</span>
        </div>
        <div className="mt-1 space-y-1">
          {rows.map(([design, type, qty, amount]) => (
            <div key={design} className="grid grid-cols-[0.8fr_1fr_0.4fr_0.6fr] gap-1 px-1.5 text-[6.5px] font-semibold text-theme-muted">
              <span>{design}</span>
              <span>{type}</span>
              <span>{qty}</span>
              <span>{amount}</span>
            </div>
          ))}
          <div className="px-1.5 text-[6.5px] font-semibold text-theme-muted">+ 23 more embroidery items</div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-[0.9fr_1fr] gap-2 border-t border-theme-border-soft pt-2">
        <div className="rounded-lg bg-theme-surface p-2 text-center">
          <QrCode className="mx-auto text-theme-primary" size={compact ? 18 : 15} />
          <p className="mt-1 text-[6.5px] font-black text-theme-muted">UPI QR</p>
        </div>
        <div className="space-y-1 text-[7px] font-bold">
          <div className="flex justify-between gap-2">
            <span className="text-theme-muted">Subtotal</span>
            <span>₹2510.00</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-theme-muted">Paid</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between gap-2 rounded-md bg-theme-surface px-1.5 py-1">
            <span>Balance</span>
            <span>₹2510.00</span>
          </div>
        </div>
      </div>
      {pdf ? <p className="mt-1 shrink-0 text-center text-[6px] font-bold text-theme-muted">Powered by BillQyro Invoicing SaaS</p> : null}
    </div>
  );
}

function PreviewCard() {
  return (
    <ShowcaseCard icon={Smartphone} title="Live Preview" sub="Customer invoice view ready">
      <div className="mx-auto h-full max-w-[260px] rounded-[1.6rem] border border-theme-border-soft bg-theme-card p-2.5 shadow-2xl shadow-glow">
        <MiniInvoiceDocument compact />
      </div>
    </ShowcaseCard>
  );
}

function PdfCard() {
  return (
    <ShowcaseCard icon={FileCheck2} title="PDF Ready" sub="Invoice converted to printable PDF">
      <div className="grid h-full grid-cols-[1fr_0.62fr] gap-3">
        <motion.div
          initial={{ opacity: 0, x: -14, rotate: -1 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-0 overflow-hidden rounded-[1.35rem] border border-theme-border-soft bg-theme-card p-3 text-theme-primary shadow-xl"
        >
          <MiniInvoiceDocument pdf />
        </motion.div>

        <div className="flex min-h-0 flex-col justify-between gap-3">
          <motion.div
            initial={{ scale: 0.84, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.22, type: "spring", stiffness: 150, damping: 14 }}
            className="grid flex-1 place-items-center rounded-[1.35rem] border border-theme-border-soft bg-theme-accent-light p-3 text-center"
          >
            <div>
              <div className="mx-auto grid h-16 w-14 place-items-center rounded-2xl border border-theme-border-soft bg-theme-card text-theme-accent">
                <FileText size={26} />
              </div>
              <p className="mt-3 text-lg font-black text-theme-primary">PDF</p>
              <p className="mt-1 text-[10px] font-semibold text-theme-muted">2 pages · 184 KB</p>
            </div>
          </motion.div>
          <div className="rounded-2xl border border-theme-border-soft bg-theme-surface p-3 text-center text-[10px] font-bold text-theme-muted">INV-DEMO-1002.pdf</div>
        </div>
      </div>
    </ShowcaseCard>
  );
}

function DownloadCard() {
  return (
    <ShowcaseCard icon={Download} title="Downloaded" sub="Saved successfully">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 12 }}
          className="grid h-20 w-20 place-items-center rounded-full border border-theme-accent/35 bg-theme-accent-light text-theme-accent shadow-xl shadow-glow"
        >
          <Check size={34} strokeWidth={3} />
        </motion.div>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-theme-card/10">
          <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.1, ease: "easeOut" }} className="h-full rounded-full bg-[image:var(--accent-gradient)]" />
        </div>
        <p className="mt-3 text-sm font-bold text-theme-accent">100% Complete</p>
      </div>
    </ShowcaseCard>
  );
}

function LinkFeature({ icon: Icon, label }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-theme-border-soft bg-theme-surface p-2 text-center">
      <Icon className="mx-auto text-theme-accent" size={15} />
      <p className="mt-1.5 text-[9px] font-bold text-theme-muted">{label}</p>
    </motion.div>
  );
}

function ShareChip({ icon: Icon, label, value, compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center gap-3 rounded-2xl border border-theme-border-soft bg-theme-surface", compact ? "p-2.5" : "p-3")}
    >
      <div className={cn("grid place-items-center rounded-xl bg-theme-card/5 text-theme-accent", compact ? "h-8 w-8" : "h-9 w-9")}>
        <Icon size={compact ? 15 : 17} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-theme-muted">{label}</p>
        <p className="truncate text-xs font-bold text-theme-accent">{value}</p>
      </div>
    </motion.div>
  );
}

function SkeletonLine({ w }) {
  return <div className="h-2 rounded-full bg-theme-border-soft" style={{ width: w }} />;
}

function ShareCard() {
  return (
    <ShowcaseCard icon={Share2} title="Share Link Sent" sub="Customer receives full invoice link">
      <div className="grid h-full grid-rows-[auto_1fr] gap-3">
        <div className="rounded-[1.25rem] border border-theme-border-soft bg-theme-accent-light p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wide text-theme-accent">Public Invoice Link</p>
              <p className="mt-1 truncate text-[11px] font-bold text-theme-muted">billqyro.app/i/demo-invoice</p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-theme-border-soft bg-theme-card text-theme-accent">
              <Link2 size={16} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <LinkFeature icon={FileText} label="View" />
            <LinkFeature icon={Download} label="PDF" />
            <LinkFeature icon={IndianRupee} label="Pay" />
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-[0.92fr_0.78fr] gap-3">
          <div className="flex min-h-0 flex-col gap-2">
            <ShareChip icon={Smartphone} label="WhatsApp" value="Sent" compact />
            <ShareChip icon={Mail} label="Email" value="Delivered" compact />
            <ShareChip icon={QrCode} label="QR Code" value="Ready" compact />
          </div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex min-h-0 flex-col rounded-[1.25rem] border border-theme-border-soft bg-theme-card p-3 text-theme-primary shadow-xl"
          >
            <div className="mb-2 flex shrink-0 items-center justify-between text-[8px] font-black">
              <span>Customer View</span>
              <span className="text-theme-accent">OPEN</span>
            </div>
            <div className="shrink-0 space-y-1.5">
              <SkeletonLine w="100%" />
              <SkeletonLine w="78%" />
              <SkeletonLine w="62%" />
            </div>
            <div className="mt-3 rounded-xl bg-theme-surface p-2 text-center text-[9px] font-black text-theme-primary">₹2,510 Due</div>
            <div className="mt-2 rounded-xl bg-theme-accent p-2 text-center text-[9px] font-black text-theme-primary">Pay Now</div>
          </motion.div>
        </div>
      </div>
    </ShowcaseCard>
  );
}

function PaymentLinkCard() {
  return (
    <ShowcaseCard icon={IndianRupee} title="Payment Link Opened" sub="Customer pays from invoice link">
      <div className="grid h-full grid-cols-[0.92fr_1fr] gap-3">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="min-h-0 overflow-hidden rounded-[1.35rem] border border-theme-border-soft bg-theme-card p-2.5 text-theme-primary shadow-xl">
          <MiniInvoiceDocument compact />
        </motion.div>

        <div className="flex min-h-0 flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-theme-border-soft bg-theme-accent-light p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-theme-accent">UPI Payment</p>
                <p className="mt-1 text-lg font-black text-theme-primary">₹2,510</p>
                <p className="mt-1 text-[10px] font-semibold text-theme-muted">9903591839@ybl</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-theme-border-soft bg-theme-card text-theme-accent">
                <QrCode size={24} />
              </div>
            </div>
            <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.1, ease: "easeOut" }} className="h-1.5 rounded-full bg-[image:var(--accent-gradient)]" />
          </motion.div>
          <div className="rounded-2xl border border-theme-border-soft bg-theme-surface p-3 text-xs text-theme-muted">
            Customer can view bill, download PDF, scan QR, or pay through link.
          </div>
        </div>
      </div>
    </ShowcaseCard>
  );
}

function PaymentSuccessCard() {
  return (
    <ShowcaseCard icon={CreditCard} title="Payment Received" sub="Invoice status auto-updated">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.78, opacity: 0 }}
          animate={{ scale: [0.78, 1.08, 1], opacity: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="grid h-20 w-20 place-items-center rounded-full border border-theme-accent/35 bg-theme-accent-light text-theme-accent shadow-xl shadow-glow"
        >
          <IndianRupee size={34} strokeWidth={3} />
        </motion.div>
        <h3 className="mt-5 text-2xl font-black text-theme-primary">₹2,510 Paid</h3>
        <p className="mt-2 text-sm text-theme-muted">Payment status changed to Paid.</p>
        <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left">
          <MiniChip label="Payment" value="UPI" />
          <MiniChip label="Status" value="Paid" />
        </div>
      </div>
    </ShowcaseCard>
  );
}

function DeliveredCard() {
  return (
    <ShowcaseCard icon={Check} title="Completed" sub="Billing completed">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.08, 1], opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid h-24 w-24 place-items-center rounded-full border border-theme-accent/35 bg-theme-accent-light text-theme-accent shadow-xl shadow-glow"
        >
          <Check size={42} strokeWidth={3} />
        </motion.div>
        <h3 className="mt-6 text-2xl font-black text-theme-primary">All set</h3>
        <p className="mt-2 max-w-[240px] text-sm leading-6 text-theme-muted">Customer, invoice, PDF, share link and payment completed.</p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-theme-border-soft bg-theme-accent-light px-4 py-2 text-xs font-bold text-theme-accent"
        >
          <Zap size={14} /> Ready for next bill
        </motion.div>
      </div>
    </ShowcaseCard>
  );
}

const STEP_COMPONENTS = [
  LoginDemoCard,
  SetupCard,
  DashboardCard,
  CustomerCard,
  InvoiceCard,
  PreviewCard,
  PdfCard,
  DownloadCard,
  ShareCard,
  PaymentLinkCard,
  PaymentSuccessCard,
  DeliveredCard,
];

function ShowcasePanel() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % STEPS.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const ActiveComponent = STEP_COMPONENTS[active] || LoginDemoCard;
  const ActiveIcon = STEPS[active].icon;

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative flex min-h-[560px] flex-col overflow-hidden bg-theme-surface p-6 lg:min-h-[640px] lg:w-[47%] lg:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_36%,var(--accent-glow),transparent_32%),radial-gradient(circle_at_82%_18%,var(--accent-glow),transparent_28%)] opacity-30" />
      <motion.div
        aria-hidden="true"
        animate={isPaused ? { scale: 1, opacity: 0.42 } : { scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-theme-accent-light blur-3xl"
      />
      <div className="pointer-events-none absolute inset-x-8 top-24 h-px bg-gradient-to-r from-transparent via-theme-accent/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-10 bottom-24 h-px bg-gradient-to-r from-transparent via-theme-accent/10 to-transparent" />

      <div className="relative z-10 flex items-center justify-between">
        <BrandMark small />
        <div className="badge-premium rounded-full border border-theme-border-soft bg-theme-accent-light px-3 py-1 text-[10px] font-black uppercase tracking-wide text-theme-accent shadow-glow">
          {isPaused ? "Paused Preview" : "Sample Workflow"}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center py-7">
        <div className="relative w-full max-w-[390px]">
          <motion.div
            aria-hidden="true"
            animate={isPaused ? { rotate: 0 } : { rotate: 360 }}
            transition={{ duration: 22, repeat: isPaused ? 0 : Infinity, ease: "linear" }}
            className="absolute -inset-7 rounded-[2.3rem] border border-theme-border-soft"
          />
          <motion.div
            aria-hidden="true"
            animate={isPaused ? { rotate: 0 } : { rotate: -360 }}
            transition={{ duration: 28, repeat: isPaused ? 0 : Infinity, ease: "linear" }}
            className="absolute -inset-12 rounded-[2.6rem] border border-theme-accent/5"
          />
          <AnimatePresence mode="wait">
            <ActiveComponent key={STEPS[active].key} />
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[410px] rounded-[1.35rem] border border-theme-border-soft bg-theme-surface/50 p-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-theme-accent">
              Step {active + 1} of {STEPS.length}
            </p>
            <p className="mt-1 truncate text-sm font-black text-theme-primary">{STEPS[active].title}</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-theme-muted">{STEPS[active].sub}</p>
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-theme-border-soft bg-theme-accent-light text-theme-accent">
            <ActiveIcon size={18} />
          </div>
        </div>

        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-theme-card/10">
          <motion.div
            className="h-full rounded-full bg-[image:var(--accent-gradient)]"
            animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>

        <p className="mb-2 text-center text-[10px] font-semibold text-theme-muted">Sample demo only · real data appears after login</p>
        <div className="flex items-center justify-center gap-1.5 overflow-hidden">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isDone = index < active;
            const isActive = index === active;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => {
                  setActive(index);
                  setIsPaused(true);
                }}
                title={`${step.title} - ${step.sub}`}
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs transition",
                  isActive && "border-theme-accent bg-theme-accent text-theme-primary shadow-lg shadow-theme-glow",
                  isDone && !isActive && "border-theme-accent/40 bg-theme-accent-light text-theme-accent",
                  !isDone && !isActive && "border-theme-border-soft bg-theme-surface text-theme-muted"
                )}
              >
                {isDone ? <Check size={12} /> : <StepIcon size={12} />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LoginPanel({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [cardHover, setCardHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSigningIn(true);
    setError('');
    
    if (!email || !email.trim()) {
      setError('Email is required');
      setIsSigningIn(false);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Invalid email format');
      setIsSigningIn(false);
      return;
    }

    if (!password || !password.trim()) {
      setError('Password is required');
      setIsSigningIn(false);
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters');
      setIsSigningIn(false);
      return;
    }
    
    try {
      if (firebaseReady && auth) {
        if (isLoginMode) {
          await signInWithEmailAndPassword(auth, email.trim(), password.trim());
          onLoginSuccess();
        } else {
          const result = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
          const user = result.user;
          // Create Firestore documents using standard Date fallback instead of serverTimestamp for simplicity
          const userDocRef = doc(db, 'usersList', user.uid);
          await setDoc(userDocRef, {
            userId: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
            role: 'user'
          }, { merge: true });
          
          const settingsRef = doc(db, 'settings', user.uid);
          await setDoc(settingsRef, {
            email: user.email,
            contactEmail: user.email,
            ownerName: name.trim(),
            businessName: '',
            phone: '',
            whatsapp: '',
            address: '',
            logoUrl: '',
            profileSetupCompleted: false,
            createdAt: new Date().toISOString()
          }, { merge: true });
          

          onLoginSuccess();
        }
      } else {
        setError('Firebase not configured. Cannot login or create account offline.');
        setIsSigningIn(false);
      }
    } catch (err) {
      console.error('Firebase auth error', err);
      let errorMsg = err.message || 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') errorMsg = 'Email is already in use.';
      if (err.code === 'auth/invalid-credential') errorMsg = 'Invalid email or password.';
      setError(errorMsg);
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {

    setIsSigningIn(true);
    setError('');
    try {
      if (firebaseReady && auth) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check/Create user profile
        const userDocRef = doc(db, 'usersList', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            userId: user.uid,
            email: user.email,
            createdAt: new Date().toISOString(),
            role: 'user'
          }, { merge: true });
          
          const settingsRef = doc(db, 'settings', user.uid);
          await setDoc(settingsRef, {
            email: user.email,
            contactEmail: user.email,
            ownerName: name.trim(),
            businessName: '',
            phone: '',
            whatsapp: '',
            address: '',
            logoUrl: '',
            profileSetupCompleted: false,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }

        onLoginSuccess();
      } else {
        setError('Firebase is not configured for Google login.');
        setIsSigningIn(false);
      }
    } catch (err) {
      console.error('Firebase auth error', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google login failed');
      }
      setIsSigningIn(false);
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center border-l border-theme-border-soft bg-theme-app/50 p-6 sm:p-10">
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
        className="card-premium glass glass-strong relative w-full max-w-md overflow-hidden rounded-[2rem] border border-theme-border-soft bg-theme-surface/80 p-6 shadow-2xl shadow-theme-glow/5 backdrop-blur-xl transition-colors duration-300 sm:p-7"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          animate={cardHover ? { opacity: 0.72 } : { opacity: 0.18 }}
          transition={{ duration: 0.28 }}
          style={{
            background: `radial-gradient(420px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(225,29,72,0.16), rgba(244,114,182,0.055) 28%, transparent 64%)`,
          }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.075] via-transparent to-transparent"
          animate={cardHover ? { opacity: 0.75 } : { opacity: 0.22 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-theme-card/12 blur-xl"
          animate={cardHover ? { x: [0, 760] } : { x: 0 }}
          transition={{ duration: 1.15, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-theme-accent/10"
          animate={cardHover ? { boxShadow: "inset 0 0 0 1px rgba(225,29,72,0.18), 0 0 40px rgba(225,29,72,0.10)" } : { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 0 rgba(0,0,0,0)" }}
          transition={{ duration: 0.25 }}
        />
        <div className="relative z-10">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-theme-accent via-purple-500/80 to-theme-accent rounded-t-[2rem]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="mb-8">
          <BrandMark />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <div className="badge-premium mb-3 inline-flex items-center gap-2 rounded-full border border-theme-border-soft bg-theme-accent-light px-3 py-1 text-[10px] font-black uppercase tracking-wide text-theme-accent">
            {isLoginMode ? 'Secure Login' : 'Create Account'} <span className="h-1.5 w-1.5 rounded-full bg-theme-accent" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-theme-primary sm:text-4xl">
            {isLoginMode ? 'Welcome back' : 'Get started'}
          </h1>
          <p className="mt-2 text-sm font-semibold text-theme-muted">
            {isLoginMode 
              ? 'Sign in to manage your own customers, invoices, PDFs, links, and payments.' 
              : 'New here? Create your account first, then complete the 1-minute setup wizard inside to get your shop ready.'}
          </p>
        </motion.div>

        {error && <p className="mt-4 rounded-xl bg-theme-danger/10 px-4 py-2 text-sm font-semibold text-theme-danger">{error}</p>}

        <form
          className="mt-8 space-y-5"
          onSubmit={handleSubmit}
        >
          {!isLoginMode && (
            <motion.label initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="block relative group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-theme-muted transition-colors group-focus-within:text-theme-accent">Full Name</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserRound className="h-[18px] w-[18px] text-theme-muted group-focus-within:text-theme-accent transition-colors" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="input-premium premium-focus h-12 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-11 pr-4 text-sm text-theme-primary outline-none transition-all placeholder:text-theme-muted focus:border-theme-accent/60 focus:bg-theme-accent-light focus:ring-4 focus:ring-theme-accent/10 focus:shadow-[0_0_15px_var(--accent-glow)]"
                />
              </div>
            </motion.label>
          )}
          <motion.label initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="block relative group">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-theme-muted transition-colors group-focus-within:text-theme-accent">Email address</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-[18px] w-[18px] text-theme-muted group-focus-within:text-theme-accent transition-colors" />
              </div>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-premium premium-focus h-12 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-11 pr-4 text-sm text-theme-primary outline-none transition-all placeholder:text-theme-muted focus:border-theme-accent/60 focus:bg-theme-accent-light focus:ring-4 focus:ring-theme-accent/10 focus:shadow-[0_0_15px_var(--accent-glow)]"
              />
            </div>
          </motion.label>

          <motion.label initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="block relative group">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-theme-muted transition-colors group-focus-within:text-theme-accent">Password</span>
            <div className="relative">
              <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-premium premium-focus h-12 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-4 pr-12 text-sm text-theme-primary outline-none transition-all placeholder:text-theme-muted focus:border-theme-accent/60 focus:bg-theme-accent-light focus:ring-4 focus:ring-theme-accent/10 focus:shadow-[0_0_15px_var(--accent-glow)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted transition hover:text-theme-accent"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.label>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-theme-muted">
              <input type="checkbox" className="h-4 w-4 accent-theme-accent" />
              Remember me
            </label>
            {isLoginMode && (
              <a className="font-bold text-theme-accent hover:text-theme-accent" href="#">
                Forgot password?
              </a>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
            <ShimmerButton
              type="submit"
              disabled={isSigningIn}
              className="btn-premium w-full h-[52px]"
              shimmerColor="#ffffff"
              background="var(--accent-gradient)"
            >
              <div className="flex items-center gap-2 text-[15px] font-black drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] text-theme-primary">
                {isSigningIn ? (isLoginMode ? "Signing in..." : "Creating account...") : (isLoginMode ? "Sign In to Dashboard" : "Sign Up to Dashboard")}
                {isSigningIn ? (
                  <motion.span
                    className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" size={18} />
                )}
              </div>
            </ShimmerButton>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }} className="flex items-center gap-3">
            <div className="h-px flex-1 bg-theme-card/10" />
            <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">or</span>
            <div className="h-px flex-1 bg-theme-card/10" />
          </motion.div>

          <motion.button 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.8, duration: 0.5 }} 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="btn-premium flex h-[52px] w-full items-center justify-center gap-3 rounded-[22px] border border-theme-border-soft bg-theme-surface text-sm font-bold text-theme-muted transition-all hover:bg-theme-card hover:text-theme-primary hover:shadow-[0_0_15px_rgba(0,0,0,0.05)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-theme-app text-xs font-black text-theme-primary">G</span>
            {isSigningIn && !email && !password ? "Connecting to Google..." : "Continue with Google"}
          </motion.button>
        </form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }} className="mt-6 text-center text-sm text-theme-muted">
          {isLoginMode ? (
            <>Need access? <button type="button" onClick={() => { setIsLoginMode(false); setError(''); }} className="font-bold text-theme-accent hover:text-theme-primary transition-colors cursor-pointer">Create free account</button></>
          ) : (
            <>Already have an account? <button type="button" onClick={() => { setIsLoginMode(true); setError(''); }} className="font-bold text-theme-accent hover:text-theme-primary transition-colors cursor-pointer">Sign in instead</button></>
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-semibold text-theme-muted"
        >
          <span className="flex items-center gap-1.5"><Check size={11} className="text-theme-accent" /> 256-bit Encryption</span>
          <span className="flex items-center gap-1.5"><Check size={11} className="text-theme-accent" /> SOC 2 Compliant</span>
          <span className="flex items-center gap-1.5"><Check size={11} className="text-theme-accent" /> 99.9% Uptime</span>
          <span className="flex items-center gap-1.5"><Check size={11} className="text-theme-accent" /> Secure Cloud</span>
        </motion.div>
              </div>
      </motion.div>
    </section>
  );
}

export default function Login({ onLoginSuccess }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative min-h-screen w-full bg-theme-app p-4 text-theme-primary sm:p-6 lg:p-8"
    >
      <div className="card-premium relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-theme-border-soft bg-theme-surface shadow-2xl shadow-theme-glow/10 lg:min-h-[680px]">
        <div className="hidden lg:flex lg:w-full">
          <ShowcasePanel />
          <LoginPanel onLoginSuccess={onLoginSuccess} />
        </div>
        <div className="flex w-full flex-col lg:hidden">
          <ShowcasePanel />
          <LoginPanel onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </motion.div>
  );
}
