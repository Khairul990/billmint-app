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

import { authEngine } from '../services/authEngine';
import { firebaseReady } from '../services/firebaseConfig';

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
    <div
      className="relative flex h-[430px] w-full flex-col overflow-hidden rounded-[1.8rem] border border-theme-border-soft/40 bg-theme-card/60 p-5 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.18)] backdrop-blur-2xl ring-1 ring-inset ring-black/5 before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:content-[''] dark:ring-white/10 dark:before:from-white/10"
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
    </div>
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
        <div
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
              <div
                key={region.code}
                className={cn(
                  "rounded-2xl border p-3 text-center",
                  index === 0 ? "border-theme-accent/60 bg-theme-accent-light" : "border-theme-border-soft bg-theme-surface"
                )}
              >
                <p className="text-base font-black text-theme-primary">{region.code}</p>
                <p className="mt-1 text-[10px] text-theme-muted">{region.label}</p>
              </div>
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
    <div
      className={cn("rounded-2xl border p-2", active ? "border-theme-border-soft bg-theme-accent-light" : "border-theme-border-soft bg-theme-surface")}
    >
      <p className={cn("text-[9px] font-bold uppercase tracking-wide", active ? "text-theme-accent/80" : "text-theme-muted")}>{label}</p>
      <p className="mt-1 text-sm font-black text-theme-primary">{value}</p>
    </div>
  );
}

function ActionTile({ icon: Icon, text, active = false }) {
  return (
    <div             className={cn("flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black", active ? "bg-theme-accent text-white" : "bg-theme-surface text-theme-muted")}>
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
            <div className="mb-4 grid h-7 w-7 place-items-center rounded-lg bg-theme-accent text-[10px] font-black text-white">BQ</div>
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
                <div className="inline-flex rounded-full border border-theme-border-soft bg-theme-accent-light px-2 py-1 text-[9.5px] font-black uppercase tracking-wide text-theme-accent">
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
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-theme-muted/20">
                <div className="h-full rounded-full bg-[image:var(--accent-gradient)]" />
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
            <div
              key={item}
              className="flex items-center justify-between rounded-xl bg-theme-surface px-3 py-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 truncate text-theme-muted">
                <Plus size={12} className="shrink-0 text-theme-accent" />
                {item}
              </span>
              <span className="shrink-0 font-semibold text-theme-primary">{price}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-theme-border-soft pt-4">
          <span className="text-xs text-theme-muted">Grand Total</span>
          <span className="text-2xl font-black text-theme-accent">
            ₹2,510
          </span>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-[image:var(--accent-gradient)]" />
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
        <p className="mt-0.5 truncate text-[9px] font-semibold text-theme-muted">Dhulagor Howrah · info@billqyro.app</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] font-black tracking-wide">INVOICE</p>
          <div className="text-right text-[9px] font-bold text-theme-muted">
            <p>INV-1002</p>
            <p>24-05-2026</p>
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-theme-border-soft py-2 text-[9px]">
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
        <div className="grid grid-cols-[0.8fr_1fr_0.4fr_0.6fr] gap-1 rounded-md bg-theme-surface px-1.5 py-1 text-[9px] font-black text-theme-muted">
          <span>Design</span>
          <span>Type</span>
          <span>Qty</span>
          <span>Amt</span>
        </div>
        <div className="mt-1 space-y-1">
          {rows.map(([design, type, qty, amount]) => (
            <div key={design} className="grid grid-cols-[0.8fr_1fr_0.4fr_0.6fr] gap-1 px-1.5 text-[9px] font-semibold text-theme-muted">
              <span>{design}</span>
              <span>{type}</span>
              <span>{qty}</span>
              <span>{amount}</span>
            </div>
          ))}
          <div className="px-1.5 text-[9px] font-semibold text-theme-muted">+ 23 more embroidery items</div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-[0.9fr_1fr] gap-2 border-t border-theme-border-soft pt-2">
        <div className="rounded-lg bg-theme-surface p-2 text-center">
          <QrCode className="mx-auto text-theme-primary" size={compact ? 18 : 15} />
          <p className="mt-1 text-[9px] font-black text-theme-muted">UPI QR</p>
        </div>
        <div className="space-y-1 text-[9px] font-bold">
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
      {pdf ? <p className="mt-1 shrink-0 text-center text-[9px] font-bold text-theme-muted">Powered by BillQyro Invoicing SaaS</p> : null}
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
        <div
          className="min-h-0 overflow-hidden rounded-[1.35rem] border border-theme-border-soft bg-theme-card p-3 text-theme-primary shadow-xl"
        >
          <MiniInvoiceDocument pdf />
        </div>

        <div className="flex min-h-0 flex-col justify-between gap-3">
          <div
            className="grid flex-1 place-items-center rounded-[1.35rem] border border-theme-border-soft bg-theme-accent-light p-3 text-center"
          >
            <div>
              <div className="mx-auto grid h-16 w-14 place-items-center rounded-2xl border border-theme-border-soft bg-theme-card text-theme-accent">
                <FileText size={26} />
              </div>
              <p className="mt-3 text-lg font-black text-theme-primary">PDF</p>
              <p className="mt-1 text-[10px] font-semibold text-theme-muted">2 pages · 184 KB</p>
            </div>
          </div>
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
        <div
          className="grid h-20 w-20 place-items-center rounded-full border border-theme-accent/35 bg-theme-accent-light text-theme-accent shadow-xl shadow-glow"
        >
          <Check size={34} strokeWidth={3} />
        </div>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-theme-muted/20">
          <div className="h-full rounded-full bg-[image:var(--accent-gradient)]" />
        </div>
        <p className="mt-3 text-sm font-bold text-theme-accent">100% Complete</p>
      </div>
    </ShowcaseCard>
  );
}

function LinkFeature({ icon: Icon, label }) {
  return (
    <div className="rounded-xl border border-theme-border-soft bg-theme-surface p-2 text-center">
      <Icon className="mx-auto text-theme-accent" size={15} />
      <p className="mt-1.5 text-[9px] font-bold text-theme-muted">{label}</p>
    </div>
  );
}

function ShareChip({ icon: Icon, label, value, compact = false }) {
  return (
    <div
      className={cn("flex items-center gap-3 rounded-2xl border border-theme-border-soft bg-theme-surface", compact ? "p-2.5" : "p-3")}
    >
      <div className={cn("grid place-items-center rounded-xl bg-theme-accent-light text-theme-accent", compact ? "h-8 w-8" : "h-9 w-9")}>
        <Icon size={compact ? 15 : 17} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-theme-muted">{label}</p>
        <p className="truncate text-xs font-bold text-theme-accent">{value}</p>
      </div>
    </div>
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
          <div
            className="flex min-h-0 flex-col rounded-[1.25rem] border border-theme-border-soft bg-theme-card p-3 text-theme-primary shadow-xl"
          >
            <div className="mb-2 flex shrink-0 items-center justify-between text-[9.5px] font-black">
              <span>Customer View</span>
              <span className="text-theme-accent">OPEN</span>
            </div>
            <div className="shrink-0 space-y-1.5">
              <SkeletonLine w="100%" />
              <SkeletonLine w="78%" />
              <SkeletonLine w="62%" />
            </div>
            <div className="mt-3 rounded-xl bg-theme-surface p-2 text-center text-[9px] font-black text-theme-primary">₹2,510 Due</div>
            <div className="mt-2 rounded-xl bg-theme-accent p-2 text-center text-[9px] font-black text-white">Pay Now</div>
          </div>
        </div>
      </div>
    </ShowcaseCard>
  );
}

function PaymentLinkCard() {
  return (
    <ShowcaseCard icon={IndianRupee} title="Payment Link Opened" sub="Customer pays from invoice link">
      <div className="grid h-full grid-cols-[0.92fr_1fr] gap-3">
        <div className="min-h-0 overflow-hidden rounded-[1.35rem] border border-theme-border-soft bg-theme-card p-2.5 text-theme-primary shadow-xl">
          <MiniInvoiceDocument compact />
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div
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
            <div className="h-1.5 rounded-full bg-[image:var(--accent-gradient)]" />
          </div>
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
        <div
          className="grid h-20 w-20 place-items-center rounded-full border border-theme-accent/35 bg-theme-accent-light text-theme-accent shadow-xl shadow-glow"
        >
          <IndianRupee size={34} strokeWidth={3} />
        </div>
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
        <div
          className="grid h-24 w-24 place-items-center rounded-full border border-theme-accent/35 bg-theme-accent-light text-theme-accent shadow-xl shadow-glow"
        >
          <Check size={42} strokeWidth={3} />
        </div>
        <h3 className="mt-6 text-2xl font-black text-theme-primary">All set</h3>
        <p className="mt-2 max-w-[240px] text-sm leading-6 text-theme-muted">Customer, invoice, PDF, share link and payment completed.</p>
        <div
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-theme-border-soft bg-theme-accent-light px-4 py-2 text-xs font-bold text-theme-accent"
        >
          <Zap size={14} /> Ready for next bill
        </div>
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
      className="relative flex min-h-[560px] w-full flex-col overflow-hidden bg-theme-surface p-6 lg:min-h-[640px] lg:w-[47%] lg:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_36%,var(--accent-glow),transparent_32%),radial-gradient(circle_at_82%_18%,var(--accent-glow),transparent_28%)] opacity-30" />
      <div
        aria-hidden="true"
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
          <div
            aria-hidden="true"
            className="absolute -inset-7 rounded-[2.3rem] border border-theme-border-soft"
          />
          <div
            aria-hidden="true"
            className="absolute -inset-12 rounded-[2.6rem] border border-theme-accent/5"
          />
          
            <ActiveComponent key={STEPS[active].key} />
          
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

        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-theme-muted/20">
          <div
            className="h-full rounded-full bg-[image:var(--accent-gradient)]"
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
                  isActive && "border-theme-accent bg-theme-accent text-white shadow-lg shadow-theme-glow",
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

function LoginPanel({ onLoginSuccess, embedded = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [cardHover, setCardHover] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const [isLoginMode, setIsLoginMode] = useState(true);

  // Demo → signup conversion: the landing page sets this flag when a demo
  // visitor taps "Create free account". This panel is lazy-loaded, so it
  // consumes the flag on mount instead of listening for a one-shot event
  // that fires before this chunk is even downloaded.
  useEffect(() => {
    try {
      if (localStorage.getItem('billqyro_open_signup') === '1') {
        localStorage.removeItem('billqyro_open_signup');
        setIsLoginMode(false);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSigningIn(true);
    setError('');
    
    if (!email || !email.trim()) {
      setError('Email address is required.');
      setIsSigningIn(false);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      setIsSigningIn(false);
      return;
    }

    if (!password || !password.trim()) {
      setError('Password is required.');
      setIsSigningIn(false);
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      setIsSigningIn(false);
      return;
    }

    if (!isLoginMode) {
      if (!name || !name.trim()) {
        setError('Full Name is required for registration.');
        setIsSigningIn(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsSigningIn(false);
        return;
      }
      if (!agreeTerms) {
        setError('You must agree to the Terms of Service & Privacy Policy.');
        setIsSigningIn(false);
        return;
      }
    }
    
    try {
      if (firebaseReady) {
        if (isLoginMode) {
          await authEngine.signIn(email.trim(), password.trim());
          toast.success("Welcome back to BillQyro!");
          if (onLoginSuccess) onLoginSuccess();
        } else {
          await authEngine.register(email.trim(), password.trim(), name.trim());
          toast.success("Account created successfully!");
          if (onLoginSuccess) onLoginSuccess();
        }
      } else {
        setError('Firebase is not configured. Cannot login or create account offline.');
      }
    } catch (err) {
      console.error('Firebase auth error', err);
      let errorMsg = 'Authentication failed. Please check your details.';
      if (err.code === 'auth/email-already-in-use') errorMsg = 'An account already exists with this email address. Please sign in.';
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') errorMsg = 'Invalid email or password. Please verify your credentials.';
      else if (err.code === 'auth/weak-password') errorMsg = 'Password is too weak. Please choose a stronger password.';
      else if (err.code === 'auth/too-many-requests') errorMsg = 'Too many failed attempts. Please wait a moment before trying again.';
      else if (err.code === 'auth/network-request-failed') errorMsg = 'Network error. Please check your internet connection and retry.';
      else if (err.message) errorMsg = err.message;
      
      setError(errorMsg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsSigningIn(true);
    try {
      if (firebaseReady) {
        const user = await authEngine.signInWithGoogle(name.trim());
        if (user) {
          toast.success("Signed in with Google successfully!");
          if (onLoginSuccess) onLoginSuccess();
        }
      } else {
        setError('Firebase is not configured for Google login.');
      }
    } catch (err) {
      console.error('Firebase auth error', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google login failed');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const content = (
    <div className="relative z-10 w-full">
      {!embedded && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-theme-accent via-emerald-400/80 to-theme-accent rounded-t-[2rem]" />}
      {!embedded && (
        <div className="mb-8">
          <BrandMark />
        </div>
      )}
      <div>
        <div className="badge-premium mb-2.5 inline-flex items-center gap-2 rounded-full border border-theme-border-soft bg-theme-accent-light px-3 py-1 text-[10px] font-black uppercase tracking-wide text-theme-accent">
          {isLoginMode ? 'Secure Login' : 'Create Account'} <span className="h-1.5 w-1.5 rounded-full bg-theme-accent" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-theme-primary">
          {isLoginMode ? 'Welcome back' : 'Get started'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm font-medium text-theme-muted">
          {isLoginMode 
            ? 'Sign in to manage your customers, invoices, PDFs, and collections.' 
            : 'Create your account, then complete the 1-minute setup wizard to launch your business.'}
        </p>
      </div>

        {error && <p className="mt-4 rounded-xl bg-theme-danger/10 px-4 py-2.5 text-sm font-semibold text-theme-danger border border-theme-danger/20">{error}</p>}

        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit}
        >
          {!isLoginMode && (
            <label className="block relative group">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-theme-muted transition-colors group-focus-within:text-theme-accent pl-1">Full Name</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserRound className="h-[18px] w-[18px] text-theme-muted group-focus-within:text-theme-accent transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  className="input-premium premium-focus h-14 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-11 pr-4 text-[15px] font-medium text-theme-primary outline-none transition-all duration-200 placeholder:text-theme-muted/70 focus:border-theme-accent focus:bg-theme-surface focus:ring-4 focus:ring-theme-accent/15 focus:shadow-[0_0_12px_var(--accent-glow)]"
                />
              </div>
            </label>
          )}
          <label className="block relative group">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-theme-muted transition-colors group-focus-within:text-theme-accent pl-1">Email address</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-[18px] w-[18px] text-theme-muted group-focus-within:text-theme-accent transition-colors duration-200" />
              </div>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-premium premium-focus h-14 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-11 pr-4 text-[15px] font-medium text-theme-primary outline-none transition-all duration-200 placeholder:text-theme-muted/70 focus:border-theme-accent focus:bg-theme-surface focus:ring-4 focus:ring-theme-accent/15 focus:shadow-[0_0_12px_var(--accent-glow)]"
              />
            </div>
          </label>

          <label className="block relative group">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-theme-muted transition-colors group-focus-within:text-theme-accent pl-1">Password</span>
            <div className="relative">
              <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-premium premium-focus h-14 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-4 pr-12 text-[15px] font-medium text-theme-primary outline-none transition-all duration-200 placeholder:text-theme-muted/70 focus:border-theme-accent focus:bg-theme-surface focus:ring-4 focus:ring-theme-accent/15 focus:shadow-[0_0_12px_var(--accent-glow)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted transition hover:text-theme-accent cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {!isLoginMode && (
            <label className="block relative group">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-theme-muted transition-colors group-focus-within:text-theme-accent pl-1">Confirm Password</span>
              <div className="relative">
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-premium premium-focus h-14 w-full rounded-2xl border border-theme-border-soft bg-theme-surface pl-4 pr-12 text-[15px] font-medium text-theme-primary outline-none transition-all duration-200 placeholder:text-theme-muted/70 focus:border-theme-accent focus:bg-theme-surface focus:ring-4 focus:ring-theme-accent/15 focus:shadow-[0_0_12px_var(--accent-glow)]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted transition hover:text-theme-accent cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}

          {!isLoginMode ? (
            <label className="flex items-start gap-2.5 pt-1 text-xs text-theme-muted cursor-pointer">
              <input 
                type="checkbox" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-theme-accent" 
              />
              <span>I agree to the <span className="font-bold text-theme-primary">Terms of Service</span> & <span className="font-bold text-theme-primary">Privacy Policy</span>.</span>
            </label>
          ) : (
            <div className="flex items-center justify-end text-sm">
              <button
                type="button"
                onClick={async () => {
                  const email = prompt('Enter your email address to reset your password:');
                  if (email && email.includes('@')) {
                    try {
                      await authEngine.resetPassword(email.trim());
                      toast.success('Password reset email sent! Check your inbox.');
                    } catch (err) {
                      toast.error(err.message || 'Failed to send reset email.');
                    }
                  } else if (email) {
                    toast.error('Please enter a valid email address.');
                  }
                }}
                className="font-bold text-xs text-theme-accent hover:text-theme-primary transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          )}

          <div className="pt-2">
            <ShimmerButton
              type="submit"
              disabled={isSigningIn}
              className="btn-premium w-full h-[56px] transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(11,143,120,0.3)]"
              shimmerColor="#ffffff"
              background="var(--accent-gradient)"
            >
              <div className="flex items-center justify-center gap-2 text-[15px] font-black text-white drop-shadow-md">
                {isSigningIn ? (isLoginMode ? "Signing in..." : "Creating account...") : (isLoginMode ? "Sign In to Dashboard" : "Register & Begin Setup")}
                {isSigningIn ? (
                  <span
                    className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                  />
                ) : (
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" size={18} />
                )}
              </div>
            </ShimmerButton>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-theme-border-soft" />
            <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">or</span>
            <div className="h-px flex-1 bg-theme-border-soft" />
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="btn-premium flex h-[56px] w-full items-center justify-center gap-3 rounded-[22px] border-2 border-theme-border-soft bg-theme-surface/50 text-[14px] font-black text-theme-primary transition-all hover:bg-theme-surface hover:border-theme-border hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--bq26-sunken)] border border-theme-border-soft text-[11px] font-black text-theme-primary">G</span>
            {isSigningIn && !email && !password ? "Connecting to Google..." : "Continue with Google"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-theme-muted">
          {isLoginMode ? (
            <>Need an account? <button type="button" onClick={() => { setIsLoginMode(false); setError(''); }} className="font-bold text-theme-accent hover:text-theme-primary transition-colors cursor-pointer">Create account</button></>
          ) : (
            <>Already have an account? <button type="button" onClick={() => { setIsLoginMode(true); setError(''); }} className="font-bold text-theme-accent hover:text-theme-primary transition-colors cursor-pointer">Sign in instead</button></>
          )}
        </p>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { text: '256-bit Encryption' },
            { text: 'SOC 2 Compliant' },
            { text: '99.9% Uptime' },
            { text: 'Secure Cloud' }
          ].map((badge, idx) => (
            <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-theme-accent/5 border border-theme-accent/10 text-[10px] font-bold tracking-wide text-theme-primary">
              <Check size={11} className="text-theme-accent" /> {badge.text}
            </span>
          ))}
        </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="w-full">
        {content}
      </div>
    );
  }

  return (
    <section className="flex flex-1 items-center justify-center border-t border-theme-border-soft bg-theme-app/50 p-6 sm:p-10 lg:border-t-0 lg:border-l">
      <div
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(420px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(13,138,107,0.16), rgba(16,185,129,0.055) 28%, transparent 64%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.075] via-transparent to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-theme-card/12 blur-xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-theme-accent/10"
        />
        {content}
      </div>
    </section>
  );
}

export default function Login({ onLoginSuccess, embedded = false }) {
  if (embedded) {
    return <LoginPanel onLoginSuccess={onLoginSuccess} embedded={true} />;
  }

  return (
    <div
      className="relative w-full py-12 p-4 text-theme-primary sm:p-6 lg:py-20 lg:px-8 z-10"
    >
      <div className="card-premium relative z-10 mx-auto flex w-[98%] max-w-7xl overflow-hidden rounded-[2rem] border border-theme-border-soft bg-theme-surface/60 backdrop-blur-3xl shadow-2xl shadow-theme-glow/10 min-h-[600px] lg:min-h-[680px]">
        <div className="flex w-full flex-col lg:flex-row">
          
          <LoginPanel onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </div>
  );
}
