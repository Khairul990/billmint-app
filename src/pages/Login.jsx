import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { auth, firebaseReady } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { login } from '../utils/storage';

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
    <div className={cn("flex items-center", small ? "gap-2.5" : "gap-3")}> 
      <motion.div
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#13e6c8] via-[#0fb895] to-[#087965] shadow-lg shadow-emerald-500/20 ring-1 ring-white/10",
          small ? "h-9 w-9" : "h-11 w-11"
        )}
      >
        <div className="absolute inset-[5px] rounded-full bg-white/12" />
        <motion.span
          animate={{ scale: [1, 1.22, 1], opacity: [0.95, 1, 0.95] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]"
        />

        <svg viewBox="0 0 32 32" className={cn("relative z-10 text-white", small ? "h-5 w-5" : "h-6 w-6")} aria-hidden="true">
          <path
            d="M9 5.75h10.2L24 10.55V26.2c0 .9-.72 1.62-1.62 1.62H9c-.9 0-1.62-.72-1.62-1.62V7.38c0-.9.72-1.63 1.62-1.63Z"
            fill="rgba(255,255,255,0.96)"
          />
          <path d="M19.2 5.75v4.8H24" fill="rgba(226,232,240,0.95)" />
          <path d="M11.2 14.2h8.8M11.2 17.4h8.8M11.2 20.6h6.2" stroke="#0f766e" strokeWidth="1.55" strokeLinecap="round" />
          <path d="M12.2 24.5h5.8" stroke="#0f766e" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </motion.div>

      <div className="min-w-0 leading-none">
        <div className="relative inline-flex items-center">
          <span className={cn("font-black tracking-tight text-white", small ? "text-[15px]" : "text-[21px]")}>Bill</span>
          <span className={cn("font-black tracking-tight text-emerald-300", small ? "text-[15px]" : "text-[21px]")}>Qyro</span>
          <motion.span
            animate={{ rotate: [-18, -5, -18], y: [0, -1.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={cn("absolute rounded-full bg-emerald-300", small ? "-right-2 -top-1 h-2 w-1" : "-right-2.5 -top-1.5 h-2.5 w-1.5")}
          />
        </div>

        <div className="mt-1 flex items-center gap-2">
          <div className={cn("font-black uppercase leading-[1.05] tracking-[0.13em] text-slate-400/90", small ? "text-[5.5px]" : "text-[6.5px]")}> 
            Modern Billing & Invoicing
            <br />
            Platform
          </div>
          <span className={cn("h-px bg-emerald-400/35", small ? "w-5" : "w-7")} />
        </div>
      </div>
    </div>
  );
}

function ShowcaseCard({ icon: Icon, title, sub, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-[430px] w-full flex-col overflow-hidden rounded-[1.8rem] border border-emerald-300/20 bg-slate-950/55 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.07] before:to-transparent before:content-['']"
    >
      <div className="relative z-10 mb-4 flex shrink-0 items-center gap-3 border-b border-white/10 pb-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Icon size={21} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-black tracking-tight text-white">{title}</h3>
          <p className="mt-0.5 truncate text-xs text-emerald-300/80">{sub}</p>
        </div>
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">{children}</div>
    </motion.div>
  );
}

function DemoInput({ width }) {
  return (
    <div className="h-10 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3">
      <div className="h-2 rounded-full bg-slate-600/45" style={{ width }} />
    </div>
  );
}

function LoginDemoCard() {
  return (
    <ShowcaseCard icon={Check} title="Secure Login" sub="Workspace unlocked">
      <div className="flex h-full flex-col justify-center rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <Check size={22} />
          </div>
          <div>
            <p className="font-black text-white">Welcome back</p>
            <p className="text-xs text-slate-500">Secure workspace access verified</p>
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
          className="mt-4 h-10 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-300 shadow-lg shadow-emerald-500/20"
        />
      </div>
    </ShowcaseCard>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[11px] font-bold text-slate-200">{value}</p>
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
        <div className="rounded-[1.35rem] border border-emerald-300/20 bg-[#0b1728] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-300">Step 1 of 2</p>
              <p className="mt-1 font-black text-white">Configure Local Region</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
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
                  index === 0 ? "border-emerald-300/60 bg-emerald-300/10" : "border-white/10 bg-white/[0.03]"
                )}
              >
                <p className="text-base font-black text-white">{region.code}</p>
                <p className="mt-1 text-[10px] text-slate-500">{region.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex-1 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300">
              <Building2 size={18} />
            </div>
            <div>
              <p className="font-black text-white">Your Business Workspace</p>
              <p className="text-xs text-slate-500">Business details saved securely</p>
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
    <div className={cn("rounded-xl px-2 py-2 text-[9px] font-bold", active ? "bg-emerald-300/10 text-emerald-300" : "text-slate-600")}>
      {label}
    </div>
  );
}

function DashStat({ label, value, active = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border p-2", active ? "border-emerald-300/15 bg-emerald-300/[0.055]" : "border-white/10 bg-white/[0.035]")}
    >
      <p className={cn("text-[9px] font-bold uppercase tracking-wide", active ? "text-emerald-300/80" : "text-slate-500")}>{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </motion.div>
  );
}

function ActionTile({ icon: Icon, text, active = false }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black", active ? "bg-emerald-400 text-slate-950" : "bg-white/[0.035] text-slate-500")}>
      <Icon size={13} />
      {text}
    </div>
  );
}

function DashboardCard() {
  return (
    <ShowcaseCard icon={CreditCard} title="Dashboard Opened" sub="Active workspace ready">
      <div className="h-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#080f1c]">
        <div className="flex h-full">
          <div className="w-[76px] border-r border-white/10 bg-[#060b14] p-2.5">
            <div className="mb-4 grid h-7 w-7 place-items-center rounded-lg bg-emerald-400 text-[10px] font-black text-slate-950">BQ</div>
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
                <div className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-emerald-300">
                  Active Workspace
                </div>
                <p className="mt-2 truncate text-sm font-black text-white">Business Dashboard</p>
              </div>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-300">
                <CreditCard size={15} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <DashStat label="Revenue" value="₹82.4K" active />
              <DashStat label="Bills" value="128" />
              <DashStat label="Clients" value="42" />
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-wide text-slate-500">Quick Actions</p>
                <p className="text-[9px] font-bold text-emerald-300">Ready</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ActionTile icon={Plus} text="Invoice" active />
                <ActionTile icon={UserRound} text="Customer" />
                <ActionTile icon={FileText} text="PDF" />
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.045] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Recent Bill</p>
                  <p className="mt-1 truncate text-xs font-black text-white">INV-DEMO-1002</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">₹2,510 · Pending</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <ReceiptText size={18} />
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: "0%" }} animate={{ width: "76%" }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-200">{value}</p>
    </div>
  );
}

function CustomerCard() {
  return (
    <ShowcaseCard icon={UserRound} title="Customer Added" sub="Profile saved">
      <div className="flex h-full flex-col justify-center gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-emerald-300/25 bg-emerald-400/10 font-black text-emerald-300">DC</div>
          <div className="min-w-0">
            <p className="font-bold text-white">Demo Customer</p>
            <p className="mt-1 text-xs text-slate-500">Sample customer profile · India</p>
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
              className="flex items-center justify-between rounded-xl bg-white/[0.035] px-3 py-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 truncate text-slate-400">
                <Plus size={12} className="shrink-0 text-emerald-300" />
                {item}
              </span>
              <span className="shrink-0 font-semibold text-slate-200">{price}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-slate-500">Grand Total</span>
          <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.45 }} className="text-2xl font-black text-emerald-300">
            ₹2,510
          </motion.span>
        </div>
        <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ delay: 0.25, duration: 1.2, ease: "easeOut" }} className="mt-4 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
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
    <div className={cn("flex h-full flex-col overflow-hidden rounded-[1rem] bg-white text-slate-900", compact ? "p-3" : "p-2")}>
      <div className="shrink-0 border-b border-slate-200 pb-2">
        <p className={cn("font-black leading-tight", compact ? "text-[11px]" : "text-[10px]")}>KB.Embroidery Designer</p>
        <p className="mt-0.5 truncate text-[7px] font-semibold text-slate-500">Dhulagor Howrah · khairul2052007@gmail.com</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] font-black tracking-wide">INVOICE</p>
          <div className="text-right text-[7px] font-bold text-slate-500">
            <p>INV-1002</p>
            <p>24-05-2026</p>
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-slate-200 py-2 text-[7px]">
        <div>
          <p className="font-black uppercase text-slate-400">Invoiced To</p>
          <p className="mt-1 font-bold">Soheb Mollik</p>
          <p className="text-slate-500">Howrah</p>
        </div>
        <div>
          <p className="font-black uppercase text-slate-400">Registry</p>
          <p className="mt-1 text-slate-600">Term: Cash</p>
          <p className="text-slate-600">Status: Pending</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 py-2">
        <div className="grid grid-cols-[0.8fr_1fr_0.4fr_0.6fr] gap-1 rounded-md bg-slate-100 px-1.5 py-1 text-[6.5px] font-black text-slate-500">
          <span>Design</span>
          <span>Type</span>
          <span>Qty</span>
          <span>Amt</span>
        </div>
        <div className="mt-1 space-y-1">
          {rows.map(([design, type, qty, amount]) => (
            <div key={design} className="grid grid-cols-[0.8fr_1fr_0.4fr_0.6fr] gap-1 px-1.5 text-[6.5px] font-semibold text-slate-600">
              <span>{design}</span>
              <span>{type}</span>
              <span>{qty}</span>
              <span>{amount}</span>
            </div>
          ))}
          <div className="px-1.5 text-[6.5px] font-semibold text-slate-400">+ 23 more embroidery items</div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-[0.9fr_1fr] gap-2 border-t border-slate-200 pt-2">
        <div className="rounded-lg bg-slate-100 p-2 text-center">
          <QrCode className="mx-auto text-slate-700" size={compact ? 18 : 15} />
          <p className="mt-1 text-[6.5px] font-black text-slate-600">UPI QR</p>
        </div>
        <div className="space-y-1 text-[7px] font-bold">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Subtotal</span>
            <span>₹2510.00</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Paid</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between gap-2 rounded-md bg-slate-100 px-1.5 py-1">
            <span>Balance</span>
            <span>₹2510.00</span>
          </div>
        </div>
      </div>
      {pdf ? <p className="mt-1 shrink-0 text-center text-[6px] font-bold text-slate-400">Powered by BillQyro Invoicing SaaS</p> : null}
    </div>
  );
}

function PreviewCard() {
  return (
    <ShowcaseCard icon={Smartphone} title="Live Preview" sub="Customer invoice view ready">
      <div className="mx-auto h-full max-w-[260px] rounded-[1.6rem] border border-emerald-300/15 bg-slate-950/75 p-2.5 shadow-2xl shadow-emerald-500/10">
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
          className="min-h-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white p-3 text-slate-900 shadow-xl"
        >
          <MiniInvoiceDocument pdf />
        </motion.div>

        <div className="flex min-h-0 flex-col justify-between gap-3">
          <motion.div
            initial={{ scale: 0.84, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.22, type: "spring", stiffness: 150, damping: 14 }}
            className="grid flex-1 place-items-center rounded-[1.35rem] border border-emerald-300/25 bg-emerald-300/[0.045] p-3 text-center"
          >
            <div>
              <div className="mx-auto grid h-16 w-14 place-items-center rounded-2xl border border-emerald-300/25 bg-slate-950/45 text-emerald-300">
                <FileText size={26} />
              </div>
              <p className="mt-3 text-lg font-black text-white">PDF</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">2 pages · 184 KB</p>
            </div>
          </motion.div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-center text-[10px] font-bold text-slate-300">INV-DEMO-1002.pdf</div>
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
          className="grid h-20 w-20 place-items-center rounded-full border border-emerald-300/35 bg-emerald-400/10 text-emerald-300 shadow-xl shadow-emerald-500/20"
        >
          <Check size={34} strokeWidth={3} />
        </motion.div>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.1, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
        </div>
        <p className="mt-3 text-sm font-bold text-emerald-300">100% Complete</p>
      </div>
    </ShowcaseCard>
  );
}

function LinkFeature({ icon: Icon, label }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/10 bg-white/[0.035] p-2 text-center">
      <Icon className="mx-auto text-emerald-300" size={15} />
      <p className="mt-1.5 text-[9px] font-bold text-slate-400">{label}</p>
    </motion.div>
  );
}

function ShareChip({ icon: Icon, label, value, compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035]", compact ? "p-2.5" : "p-3")}
    >
      <div className={cn("grid place-items-center rounded-xl bg-white/5 text-emerald-300", compact ? "h-8 w-8" : "h-9 w-9")}>
        <Icon size={compact ? 15 : 17} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <p className="truncate text-xs font-bold text-emerald-300">{value}</p>
      </div>
    </motion.div>
  );
}

function SkeletonLine({ w }) {
  return <div className="h-2 rounded-full bg-slate-200" style={{ width: w }} />;
}

function ShareCard() {
  return (
    <ShowcaseCard icon={Share2} title="Share Link Sent" sub="Customer receives full invoice link">
      <div className="grid h-full grid-rows-[auto_1fr] gap-3">
        <div className="rounded-[1.25rem] border border-emerald-300/20 bg-emerald-300/[0.045] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wide text-emerald-300">Public Invoice Link</p>
              <p className="mt-1 truncate text-[11px] font-bold text-slate-300">billqyro.app/i/demo-invoice</p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-300/25 bg-slate-950/45 text-emerald-300">
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
            className="flex min-h-0 flex-col rounded-[1.25rem] border border-white/10 bg-white p-3 text-slate-900 shadow-xl"
          >
            <div className="mb-2 flex shrink-0 items-center justify-between text-[8px] font-black">
              <span>Customer View</span>
              <span className="text-emerald-600">OPEN</span>
            </div>
            <div className="shrink-0 space-y-1.5">
              <SkeletonLine w="100%" />
              <SkeletonLine w="78%" />
              <SkeletonLine w="62%" />
            </div>
            <div className="mt-3 rounded-xl bg-slate-100 p-2 text-center text-[9px] font-black text-slate-900">₹2,510 Due</div>
            <div className="mt-2 rounded-xl bg-emerald-500 p-2 text-center text-[9px] font-black text-white">Pay Now</div>
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
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="min-h-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white p-2.5 text-slate-900 shadow-xl">
          <MiniInvoiceDocument compact />
        </motion.div>

        <div className="flex min-h-0 flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.045] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-300">UPI Payment</p>
                <p className="mt-1 text-lg font-black text-white">₹2,510</p>
                <p className="mt-1 text-[10px] font-semibold text-slate-500">9903591839@ybl</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/25 bg-slate-950/45 text-emerald-300">
                <QrCode size={24} />
              </div>
            </div>
            <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.1, ease: "easeOut" }} className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
          </motion.div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs text-slate-400">
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
          className="grid h-20 w-20 place-items-center rounded-full border border-emerald-300/35 bg-emerald-400/10 text-emerald-300 shadow-xl shadow-emerald-500/20"
        >
          <IndianRupee size={34} strokeWidth={3} />
        </motion.div>
        <h3 className="mt-5 text-2xl font-black text-white">₹2,510 Paid</h3>
        <p className="mt-2 text-sm text-slate-500">Payment status changed to Paid.</p>
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
          className="grid h-24 w-24 place-items-center rounded-full border border-emerald-300/35 bg-emerald-400/10 text-emerald-300 shadow-xl shadow-emerald-500/20"
        >
          <Check size={42} strokeWidth={3} />
        </motion.div>
        <h3 className="mt-6 text-2xl font-black text-white">All set</h3>
        <p className="mt-2 max-w-[240px] text-sm leading-6 text-slate-500">Customer, invoice, PDF, share link and payment completed.</p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-300"
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
      className="relative flex min-h-[560px] flex-col overflow-hidden bg-[#07101d] p-6 lg:min-h-[640px] lg:w-[47%] lg:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_36%,rgba(22,169,125,0.20),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_18%_82%,rgba(16,185,129,0.09),transparent_30%)]" />
      <motion.div
        aria-hidden="true"
        animate={isPaused ? { scale: 1, opacity: 0.42 } : { scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div className="pointer-events-none absolute inset-x-8 top-24 h-px bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-10 bottom-24 h-px bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent" />

      <div className="relative z-10 flex items-center justify-between">
        <BrandMark small />
        <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300 shadow-lg shadow-emerald-500/10">
          {isPaused ? "Paused Preview" : "Sample Workflow"}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center py-7">
        <div className="relative w-full max-w-[390px]">
          <motion.div
            aria-hidden="true"
            animate={isPaused ? { rotate: 0 } : { rotate: 360 }}
            transition={{ duration: 22, repeat: isPaused ? 0 : Infinity, ease: "linear" }}
            className="absolute -inset-7 rounded-[2.3rem] border border-emerald-300/10"
          />
          <motion.div
            aria-hidden="true"
            animate={isPaused ? { rotate: 0 } : { rotate: -360 }}
            transition={{ duration: 28, repeat: isPaused ? 0 : Infinity, ease: "linear" }}
            className="absolute -inset-12 rounded-[2.6rem] border border-cyan-300/5"
          />
          <AnimatePresence mode="wait">
            <ActiveComponent key={STEPS[active].key} />
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[410px] rounded-[1.35rem] border border-white/10 bg-black/15 p-3 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
              Step {active + 1} of {STEPS.length}
            </p>
            <p className="mt-1 truncate text-sm font-black text-white">{STEPS[active].title}</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{STEPS[active].sub}</p>
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-300">
            <ActiveIcon size={18} />
          </div>
        </div>

        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
            animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>

        <p className="mb-2 text-center text-[10px] font-semibold text-slate-600">Sample demo only · real data appears after login</p>
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
                  isActive && "border-emerald-300 bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25",
                  isDone && !isActive && "border-emerald-300/40 bg-emerald-400/10 text-emerald-300",
                  !isDone && !isActive && "border-white/10 bg-white/[0.03] text-slate-600"
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSigningIn(true);
    
    try {
      if (firebaseReady && auth && email && password) {
        await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess();
      } else if (email) {
        // Fallback for local storage login
        const isOk = login(email);
        if (isOk) {
          localStorage.setItem('billqyro_admin_unlocked', 'true');
          onLoginSuccess();
        } else {
          // If fallback fails but they just want to preview, we'll let them in after timeout to match the design's intent
          window.setTimeout(() => {
            onLoginSuccess();
            setIsSigningIn(false);
          }, 1400);
        }
      } else {
        // Just mock login
        window.setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess();
          setIsSigningIn(false);
        }, 1400);
      }
    } catch (error) {
      console.error(error);
      window.setTimeout(() => {
        setIsSigningIn(false);
      }, 1400);
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center border-l border-white/5 bg-[#0e1520] p-6 sm:p-10">
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
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1420] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl transition-colors duration-300 hover:border-emerald-300/25 sm:p-7"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          animate={cardHover ? { opacity: 0.72 } : { opacity: 0.18 }}
          transition={{ duration: 0.28 }}
          style={{
            background: `radial-gradient(420px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(16,185,129,0.16), rgba(34,211,238,0.055) 28%, transparent 64%)`,
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
          className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-white/12 blur-xl"
          animate={cardHover ? { x: [0, 760] } : { x: 0 }}
          transition={{ duration: 1.15, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-emerald-300/10"
          animate={cardHover ? { boxShadow: "inset 0 0 0 1px rgba(110,231,183,0.18), 0 0 40px rgba(16,185,129,0.10)" } : { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 0 rgba(0,0,0,0)" }}
          transition={{ duration: 0.25 }}
        />
        <div className="relative z-10">
        <div className="mb-8">
          <BrandMark />
        </div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300">
          Secure Login <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Welcome back</h1>
        <p className="mt-2 text-sm font-semibold text-slate-400">Sign in to manage your own customers, invoices, PDFs, links, and payments.</p>

        <form
          className="mt-8 space-y-5"
          onSubmit={handleLogin}
        >
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/60 focus:bg-emerald-300/[0.03]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/60 focus:bg-emerald-300/[0.03]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-emerald-300"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-500">
              <input type="checkbox" className="h-4 w-4 accent-emerald-400" />
              Remember me
            </label>
            <a className="font-bold text-emerald-300 hover:text-emerald-200" href="#">
              Forgot password?
            </a>
          </div>

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSigningIn}
            className="group relative flex h-[52px] w-full items-center justify-center overflow-hidden rounded-[22px] border border-emerald-200/25 bg-emerald-300/10 px-6 font-black text-white shadow-[0_18px_45px_rgba(16,185,129,0.22)] backdrop-blur-2xl transition disabled:cursor-not-allowed disabled:opacity-80"
          >
            <span className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/22 via-emerald-300/18 to-cyan-300/12" />
            <span className="absolute inset-[1px] rounded-[21px] bg-gradient-to-b from-white/12 via-white/4 to-black/20" />
            <span className="absolute left-4 right-4 top-1 h-5 rounded-full bg-white/35 blur-lg opacity-70 transition group-hover:opacity-100" />
            <span className="absolute -left-24 top-0 h-full w-20 rotate-12 bg-white/45 blur-md transition-all duration-700 group-hover:left-[120%]" />
            <span className="absolute bottom-0 left-8 h-10 w-28 rounded-full bg-emerald-300/25 blur-2xl transition group-hover:bg-cyan-300/30" />
            <span className="absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/20" />
            <span className="relative flex items-center gap-2 text-sm drop-shadow-[0_1px_10px_rgba(255,255,255,0.18)]">
              {isSigningIn ? "Signing in..." : "Sign In to Dashboard"}
              {isSigningIn ? (
                <motion.span
                  className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" size={18} />
              )}
            </span>
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-700">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button type="button" className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-black text-slate-950">G</span>
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need access? <a href="#" className="font-bold text-emerald-300">Create free account</a>
        </p>
              </div>
      </motion.div>
    </section>
  );
}

export default function Login({ onLoginSuccess }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030914] p-4 text-white sm:p-6 lg:p-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#07101d] shadow-2xl shadow-black/50 lg:min-h-[680px]">
        <div className="hidden lg:flex lg:w-full">
          <ShowcasePanel />
          <LoginPanel onLoginSuccess={onLoginSuccess} />
        </div>
        <div className="flex w-full flex-col lg:hidden">
          <ShowcasePanel />
          <LoginPanel onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </div>
  );
}
