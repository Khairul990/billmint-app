import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, Sparkles, CheckCircle2, TrendingUp, Download, Receipt, AlertTriangle, 
  Settings, Check, X, CreditCard, Building, Building2, Phone, Mail, 
  MessageSquare, Zap, Shield, FileText, Cloud 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select, Label } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Progress, ProgressRing } from '../../components/ui/Progress';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';

// ----------------------------------------------------------------------
// DATA MOCKS
// ----------------------------------------------------------------------
const PRICING_PLANS = [
  { id: 'free', name: 'Free', price: '₹0', interval: 'forever', features: ['5 Invoices/mo', '1 Customer', 'Basic Templates', 'Community Support'], isCurrent: false },
  { id: 'starter', name: 'Starter', price: '₹499', interval: 'per month', features: ['50 Invoices/mo', '10 Customers', 'Standard Templates', 'Email Support'], isCurrent: false },
  { id: 'pro', name: 'Pro', price: '₹999', interval: 'per month', features: ['Unlimited Invoices', 'Unlimited Customers', 'Premium Templates', 'Priority Support', 'Remove Branding'], isCurrent: true },
  { id: 'business', name: 'Business', price: '₹1999', interval: 'per month', features: ['Everything in Pro', 'Custom Domain', 'Team Access (5 users)', 'API Access', '24/7 Phone Support'], isCurrent: false },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', interval: 'contact us', features: ['Unlimited Teams', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee', 'On-premise deployment'], isCurrent: false },
  { id: 'lifetime', name: 'Lifetime', price: '₹24,999', interval: 'one time', features: ['All Business Features', 'Pay once, use forever', 'Free updates for life', 'Early access to features'], isCurrent: false },
];

const FEATURES_COMPARISON = [
  { name: 'Monthly Invoices', starter: '50', pro: 'Unlimited', business: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Customers', starter: '10', pro: 'Unlimited', business: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Remove BillQyro Branding', starter: false, pro: true, business: true, enterprise: true },
  { name: 'Custom Domain', starter: false, pro: false, business: true, enterprise: true },
  { name: 'API Access', starter: false, pro: false, business: true, enterprise: true },
  { name: 'Team Members', starter: '1', pro: '1', business: '5', enterprise: 'Unlimited' },
];

const PAYMENT_HISTORY = [
  { id: 'INV-001', date: 'Oct 12, 2026', amount: '₹999', plan: 'Pro Plan (Monthly)', status: 'Success' },
  { id: 'INV-002', date: 'Sep 12, 2026', amount: '₹999', plan: 'Pro Plan (Monthly)', status: 'Success' },
  { id: 'INV-003', date: 'Aug 12, 2026', amount: '₹999', plan: 'Pro Plan (Monthly)', status: 'Refunded' },
];

// ----------------------------------------------------------------------
// SECTIONS
// ----------------------------------------------------------------------

const Section1PremiumHero = memo(() => (
  <div className="relative overflow-hidden rounded-3xl bg-theme-surface border border-theme-border-soft p-8 md:p-12 shadow-glass group mb-8">
    <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/10 via-theme-accent/5 to-transparent pointer-events-none" />
    <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/10 rounded-full blur-[80px] group-hover:bg-theme-accent/20 transition-colors pointer-events-none" />
    
    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <Badge variant="solid" className="mb-4">
          <Sparkles className="w-3 h-3 mr-1" /> Active Subscription
        </Badge>
        <h2 className="text-4xl md:text-5xl font-black text-theme-primary mb-2 tracking-tight">Pro Plan</h2>
        <p className="text-sm text-theme-secondary font-medium max-w-md">
          You are on the Pro plan, enabling unlimited invoices, premium templates, and priority support.
        </p>
      </div>
      <div className="text-left md:text-right">
        <p className="text-xs text-theme-muted font-bold uppercase tracking-wider mb-1">Next Renewal</p>
        <p className="text-2xl font-black text-theme-primary mb-1">Nov 12, 2026</p>
        <p className="text-[10px] text-theme-secondary font-bold">Auto-renews at ₹999/mo</p>
        <Button className="mt-4 shadow-glass border-theme-accent" leftIcon={Crown}>Upgrade Plan</Button>
      </div>
    </div>
  </div>
));

const Section2UsageAnalytics = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
    <Card className="flex flex-col items-center justify-center py-8 hover:scale-[1.02] transition-transform">
      <ProgressRing value={85} max={100} size={100} strokeWidth={6} label="85%" sublabel="Invoices" />
      <p className="text-xs text-theme-secondary mt-4">850 / 1000 Used</p>
    </Card>
    <Card className="flex flex-col items-center justify-center py-8 hover:scale-[1.02] transition-transform">
      <ProgressRing value={45} max={100} size={100} strokeWidth={6} label="4.5GB" sublabel="Storage" />
      <p className="text-xs text-theme-secondary mt-4">4.5 / 10 GB Used</p>
    </Card>
    <Card className="flex flex-col items-center justify-center py-8 hover:scale-[1.02] transition-transform">
      <ProgressRing value={12} max={100} size={100} strokeWidth={6} label="12%" sublabel="API Calls" />
      <p className="text-xs text-theme-secondary mt-4">1.2k / 10k Used</p>
    </Card>
    <Card className="flex flex-col justify-center p-6 hover:scale-[1.02] transition-transform relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16 text-theme-accent" /></div>
      <h3 className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Cloud Sync</h3>
      <p className="text-2xl font-black text-theme-primary mb-1">99.9%</p>
      <p className="text-[10px] text-theme-success font-bold flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> System Healthy
      </p>
      <div className="mt-4"><Progress value={99.9} /></div>
    </Card>
  </div>
));

const Section3PricingCards = memo(() => (
  <div className="mb-16">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-black text-theme-primary mb-2">Flexible Plans for Every Business</h2>
      <p className="text-xs text-theme-secondary">Choose the perfect plan to scale your invoicing workflow.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
      {PRICING_PLANS.map((plan) => (
        <Card key={plan.id} className={`flex flex-col h-full group hover:-translate-y-2 transition-transform duration-300 relative ${plan.isCurrent ? 'border-theme-accent ring-1 ring-theme-accent shadow-[0_0_20px_var(--accent)]' : ''}`}>
          {plan.isCurrent && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-theme-accent text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md z-10 whitespace-nowrap">
              Current Plan
            </div>
          )}
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-[40px] group-hover:bg-theme-accent/10 transition-colors pointer-events-none" />
          
          <CardHeader className="text-center border-b-0 pb-2">
            <CardTitle className="text-xl mb-1">{plan.name}</CardTitle>
            <div className="flex items-end justify-center gap-1 mt-4">
              <span className="text-4xl font-black text-theme-primary">{plan.price}</span>
              <span className="text-[10px] text-theme-secondary font-bold uppercase mb-1.5 tracking-wider">/{plan.interval}</span>
            </div>
          </CardHeader>
          
          <CardContent className="flex-grow flex flex-col pt-4">
            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-theme-success/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-theme-success" />
                  </div>
                  <span className="text-xs font-bold text-theme-secondary">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant={plan.isCurrent ? 'outline' : 'primary'} className="w-full mt-auto">
              {plan.isCurrent ? 'Manage Plan' : 'Upgrade'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

const Section4FeatureComparison = memo(() => (
  <div className="mb-16">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-black text-theme-primary mb-2">Compare Features</h2>
      <p className="text-xs text-theme-secondary">A detailed breakdown of everything included.</p>
    </div>
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            <TableHead className="text-center">Starter</TableHead>
            <TableHead className="text-center">Pro</TableHead>
            <TableHead className="text-center">Business</TableHead>
            <TableHead className="text-center">Enterprise</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURES_COMPARISON.map((feature, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-bold">{feature.name}</TableCell>
              {['starter', 'pro', 'business', 'enterprise'].map((plan) => (
                <TableCell key={plan} className="text-center">
                  {typeof feature[plan] === 'boolean' ? (
                    feature[plan] ? (
                      <CheckCircle2 className="w-4 h-4 text-theme-success mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-theme-muted mx-auto" />
                    )
                  ) : (
                    <span className="text-xs font-bold text-theme-secondary">{feature[plan]}</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  </div>
));

const Section5PaymentHistory = memo(() => (
  <Card className="mb-12">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and download your previous billing receipts.</CardDescription>
        </div>
        <Button variant="outline" size="sm" leftIcon={Download}>Export All</Button>
      </div>
    </CardHeader>
    <CardContent className="pt-0 p-0 sm:p-6">
      <div className="divide-y divide-theme-border-soft">
        {PAYMENT_HISTORY.map((payment) => (
          <div key={payment.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-0 sm:py-4 gap-4 hover:bg-theme-surface-hover transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${payment.status === 'Success' ? 'bg-theme-success/10 text-theme-success' : 'bg-theme-warning/10 text-theme-warning'}`}>
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-theme-primary">{payment.plan}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-theme-secondary">{payment.id}</span>
                  <span className="text-[10px] text-theme-muted">•</span>
                  <span className="text-[10px] text-theme-secondary">{payment.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-sm font-black text-theme-primary">{payment.amount}</p>
                <Badge variant={payment.status === 'Success' ? 'success' : 'warning'} className="mt-1">{payment.status}</Badge>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0"><Download className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

const Section6BillingSettings = memo(() => (
  <Card className="mb-12">
    <CardHeader>
      <CardTitle>Billing Settings</CardTitle>
      <CardDescription>Manage your payment methods and billing addresses.</CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
      <Tabs defaultValue="payment">
        <TabsList>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="address">Billing Address</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment" className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-theme-surface-elevated border border-theme-border-soft rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-theme-main rounded border border-theme-border-soft flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-theme-muted" />
              </div>
              <div>
                <p className="text-xs font-bold text-theme-primary">Visa ending in 4242</p>
                <p className="text-[10px] text-theme-secondary">Expires 12/28</p>
              </div>
            </div>
            <Badge variant="primary">Default</Badge>
          </div>
          <Button variant="outline" className="w-full border-dashed">
            + Add New Payment Method
          </Button>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input type="text" defaultValue="Acme Corp" />
            </div>
            <div>
              <Label>GSTIN / Tax ID</Label>
              <Input type="text" defaultValue="29XXXXX1234X1Z5" />
            </div>
            <div className="md:col-span-2">
              <Label>Billing Address</Label>
              <Input type="text" defaultValue="123 Startup Hub, Silicon Valley, CA 94025" />
            </div>
          </div>
          <Button variant="primary">Save Changes</Button>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-theme-border-soft rounded-xl">
            <div>
              <p className="text-xs font-bold text-theme-primary">Auto-Renewal</p>
              <p className="text-[10px] text-theme-secondary">Automatically renew subscription at the end of billing cycle.</p>
            </div>
            <button className="relative w-10 h-5 bg-theme-accent rounded-full border border-theme-accent transition-all flex items-center p-0.5">
              <span className="w-4 h-4 bg-white rounded-full shadow-md translate-x-5" />
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
));

const Section7UpgradeJourney = memo(() => (
  <div className="mb-16">
    <div className="text-center mb-8">
      <h2 className="text-xl font-black text-theme-primary mb-2">Upgrade Journey</h2>
      <p className="text-xs text-theme-secondary">How our seamless enterprise onboarding works.</p>
    </div>
    
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
      <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-theme-border-soft -translate-y-1/2 z-0" />
      {[ 
        { step: 1, label: 'Choose Plan', active: true, done: true },
        { step: 2, label: 'Payment', active: true, done: true },
        { step: 3, label: 'Verification', active: true, done: false },
        { step: 4, label: 'Activated', active: false, done: false }
      ].map((item, idx) => (
        <div key={idx} className="relative z-10 flex flex-col items-center group">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
            item.done ? 'bg-theme-success text-white shadow-[0_0_15px_var(--success)]' 
            : item.active ? 'bg-theme-accent text-white shadow-[0_0_15px_var(--accent)] ring-4 ring-theme-accent/20' 
            : 'bg-theme-surface border-2 border-theme-border-soft text-theme-muted'
          }`}>
            {item.done ? <Check className="w-4 h-4" /> : item.step}
          </div>
          <span className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${item.active ? 'text-theme-primary' : 'text-theme-muted'}`}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  </div>
));

const Section8PremiumBenefits = memo(() => (
  <div className="mb-16">
    <h2 className="text-2xl font-black text-theme-primary mb-6">Enterprise Benefits</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { icon: Shield, title: 'Bank-grade Security', desc: 'End-to-end encryption' },
        { icon: Zap, title: 'Priority Support', desc: '24/7 dedicated manager' },
        { icon: Cloud, title: 'Cloud Sync', desc: 'Real-time multi-device' },
        { icon: FileText, title: 'Premium PDFs', desc: 'Custom branding & fonts' },
      ].map((benefit, idx) => (
        <Card key={idx} className="p-6 text-center hover:-translate-y-1 transition-transform group border-transparent bg-gradient-to-br from-theme-surface to-theme-surface-hover">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-theme-accent/10 flex items-center justify-center mb-4 group-hover:bg-theme-accent/20 transition-colors">
            <benefit.icon className="w-6 h-6 text-theme-accent" />
          </div>
          <h3 className="text-xs font-black text-theme-primary mb-1">{benefit.title}</h3>
          <p className="text-[10px] text-theme-secondary">{benefit.desc}</p>
        </Card>
      ))}
    </div>
  </div>
));

const Section9FAQ = memo(() => (
  <Card className="mb-16">
    <CardHeader>
      <CardTitle>Frequently Asked Questions</CardTitle>
      <CardDescription>Everything you need to know about billing and subscriptions.</CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
      <Accordion>
        <AccordionItem title="Can I change my plan later?">
          Yes, you can upgrade or downgrade your plan at any time. Prorated charges will be applied automatically to your next invoice.
        </AccordionItem>
        <AccordionItem title="What happens to my data if I downgrade?">
          Your data is always safe. If you downgrade, you may lose access to premium features (like custom domains or API access), but your core data remains intact.
        </AccordionItem>
        <AccordionItem title="Do you offer refunds?">
          We offer a 14-day money-back guarantee for all new subscriptions. Please contact support to initiate a refund.
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
));

const Section10ContactBilling = memo(() => (
  <Card className="bg-gradient-to-br from-theme-accent/10 to-transparent border-theme-accent/20 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-5"><Building className="w-32 h-32 text-theme-accent" /></div>
    <CardContent className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 p-8">
      <div>
        <h3 className="text-lg font-black text-theme-primary mb-2">Need help with Enterprise billing?</h3>
        <p className="text-xs text-theme-secondary">Our dedicated accounts team is available 24/7 to assist you.</p>
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto">
        <Button variant="outline" className="w-full md:w-auto border-theme-accent text-theme-accent hover:bg-theme-accent/10" leftIcon={Phone}>
          Contact Sales
        </Button>
        <Button variant="primary" className="w-full md:w-auto shadow-glass" leftIcon={MessageSquare}>
          Live Chat
        </Button>
      </div>
    </CardContent>
  </Card>
));

const SubscriptionStudio = ({ settings, onUpdate }) => {
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <Section1PremiumHero />
      <Section2UsageAnalytics />
      <Section3PricingCards />
      <Section4FeatureComparison />
      <Section5PaymentHistory />
      <Section6BillingSettings />
      <Section7UpgradeJourney />
      <Section8PremiumBenefits />
      <Section9FAQ />
      <Section10ContactBilling />
    </div>
  );
};

export default SubscriptionStudio;
