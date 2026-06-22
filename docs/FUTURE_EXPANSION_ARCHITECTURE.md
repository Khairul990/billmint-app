# BillQyro — Future Expansion Architecture

## Phase 13: Scalable Architecture for Future Features

### Overview
Architecture blueprint for upcoming features: Inventory, Expense Tracker, CRM, Staff Accounts, Appointments, Orders, and Control Room.

### Core Principles
1. **No breaking changes** — All new features are additive
2. **Modular architecture** — Each feature is self-contained
3. **Consistent data patterns** — Same Firestore schema conventions
4. **Plugin-ready** — Features can be enabled/disabled per workspace

---

### 1. Inventory System

**Firestore Collection: `inventory`**
```js
{
  id: String,
  workspaceId: String,
  name: String,
  sku: String,
  category: String,
  quantity: Number,
  unitPrice: Number,
  costPrice: Number,
  supplier: String,
  reorderLevel: Number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Features:**
- Stock management with low-stock alerts
- Purchase order generation
- Supplier management
- Barcode/QR code scanning
- Stock movement history

---

### 2. Expense Tracker (Enhanced)

**Firestore Collection: `expenses`**
```js
{
  id: String,
  workspaceId: String,
  category: String,
  amount: Number,
  description: String,
  receipt: String (Storage URL),
  vendor: String,
  date: Timestamp,
  recurring: Boolean,
  recurringInterval: String (daily/weekly/monthly/yearly),
  approvedBy: String,
  createdAt: Timestamp
}
```

**Enhancements:**
- Recurring expense automation
- Receipt OCR scanning
- Expense approval workflow
- Tax category mapping
- Budget tracking per category

---

### 3. CRM System

**Firestore Collection: `contacts`**
```js
{
  id: String,
  workspaceId: String,
  type: String (customer/lead/vendor/partner),
  name: String,
  email: String,
  phone: String,
  company: String,
  notes: String,
  tags: [String],
  communicationHistory: [{
    type: String (call/email/meeting/note),
    date: Timestamp,
    summary: String,
    followUp: Timestamp
  }],
  deals: [{
    name: String,
    value: Number,
    stage: String,
    probability: Number,
    expectedClose: Timestamp
  }],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Features:**
- Lead scoring and pipeline management
- Email integration (SendGrid/Mailgun)
- Activity timeline per contact
- Deal tracking with Kanban board
- Automated follow-up reminders

---

### 4. Staff Accounts

**Firestore Collection: `staff`**
```js
{
  id: String,
  workspaceId: String,
  email: String,
  displayName: String,
  role: String (admin/manager/staff/viewer),
  permissions: [String],
  pinCode: String (encrypted),
  salary: Number,
  employmentType: String (fulltime/parttime/contractor),
  joiningDate: Timestamp,
  workingHours: {
    start: String,
    end: String,
    days: [String]
  },
  createdAt: Timestamp
}
```

**Features:**
- Role-based access control (RBAC)
- Time tracking and attendance
- Commission/salary calculation
- Staff performance metrics
- Activity audit trail

---

### 5. Appointments (Enhanced)

**Firestore Collection: `appointments`**
```js
{
  id: String,
  workspaceId: String,
  customerId: String,
  staffId: String,
  service: String,
  date: Timestamp,
  duration: Number (minutes),
  status: String (scheduled/confirmed/in-progress/completed/cancelled),
  notes: String,
  reminderSent: Boolean,
  recurring: Boolean,
  recurringPattern: Object,
  createdAt: Timestamp
}
```

**Enhancements:**
- Calendar integration (Google/Outlook)
- Automated SMS/email reminders
- Staff availability management
- Multi-service bookings
- Cancellation and rescheduling

---

### 6. Orders

**Firestore Collection: `orders`**
```js
{
  id: String,
  workspaceId: String,
  customerId: String,
  orderNumber: String,
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  status: String (pending/confirmed/processing/shipped/delivered/cancelled),
  paymentStatus: String (unpaid/paid/refunded),
  shippingAddress: Object,
  deliveryDate: Timestamp,
  notes: String,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Features:**
- Order lifecycle management
- Inventory auto-deduction on confirmation
- Invoice generation from orders
- Shipping tracking integration
- Return/refund workflow

---

### 7. Control Room (Admin)

**Firestore Collections:**
- `platformAnalytics` — Aggregate usage statistics
- `errorLogs` — Client and server error logging
- `featureRequests` — User feature suggestions
- `supportTickets` — Customer support workflow
- `systemHealth` — Service health metrics

**Features:**
- Real-time platform overview dashboard
- User activity monitoring
- Error tracking and alerting
- Feature request voting system
- Support ticket management
- System health checks
- Revenue analytics
- Backup monitoring

---

### Implementation Strategy

| Phase | Feature | Timeline | Dependencies |
|-------|---------|----------|--------------|
| 1 | Enhanced Expenses | Immediate | None |
| 2 | Staff Accounts | Week 1-2 | Auth System |
| 3 | Orders | Week 2-3 | Inventory |
| 4 | Inventory | Week 3-4 | Products |
| 5 | CRM | Week 4-6 | Customers |
| 6 | Appointments | Week 6-7 | Staff, Customers |
| 7 | Control Room | Week 7-8 | All above |

### Data Migration
- Backward-compatible schema additions
- No existing data restructuring required
- New collections added alongside existing ones
- Feature flags control UI visibility

### Performance
- Index all new Firestore queries
- Implement pagination for all list views
- Use Firestore collection group queries for cross-workspace queries
- Cache frequently accessed data in IndexedDB
