-- ============================================================================
-- BillQyro Phase 2 — Seed 001: Local Development Mock Data
-- FOR LOCAL DEVELOPMENT TESTING ONLY — NEVER RUN IN PRODUCTION
-- ============================================================================

-- 1. DEV USERS
INSERT INTO users (id, firebase_uid, email, full_name, phone_number, system_role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'fb_dev_user_alice', 'alice@dev.billqyro.local', 'Alice Enterprise Dev', '+91 9876543210', 'user'),
    ('a0000000-0000-0000-0000-000000000002', 'fb_dev_user_bob', 'bob@dev.billqyro.local', 'Bob Retailer Dev', '+91 9123456789', 'user')
ON CONFLICT (email) DO NOTHING;

-- 2. DEV WORKSPACES
INSERT INTO workspaces (id, owner_id, name, slug, currency, currency_symbol, invoice_prefix, next_invoice_number)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Alice Fashion Studio', 'alice-fashion-studio', 'INR', '₹', 'AFS-', 101),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Bob Electronics Hub', 'bob-electronics-hub', 'INR', '₹', 'BEH-', 201)
ON CONFLICT (slug) DO NOTHING;

-- 3. WORKSPACE MEMBERS
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'owner')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 4. DEV CUSTOMERS
INSERT INTO customers (id, workspace_id, name, phone, email, address, opening_due, current_due)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Karim Silk Emporium', '+91 9988776655', 'karim@silkemperium.com', 'Kolkata, WB', 0.00, 1500.00),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Delhi Tech Store', '+91 9811223344', 'sales@delhitech.com', 'New Delhi, DL', 0.00, 0.00)
ON CONFLICT (id, workspace_id) DO NOTHING;

-- 5. DEV PRODUCTS
INSERT INTO products (id, workspace_id, name, sku, rate, unit, tax_rate, stock_quantity, min_stock_alert)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Embroidered Banarasi Saree', 'AFS-SKU-01', 4500.00, 'Pcs', 18.00, 50.00, 5.00),
    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Wireless Bluetooth Mouse', 'BEH-SKU-01', 750.00, 'Pcs', 18.00, 120.00, 10.00)
ON CONFLICT (id, workspace_id) DO NOTHING;

-- 6. DEV INVOICES
INSERT INTO invoices (
    id, workspace_id, customer_id, created_by_user_id, invoice_number, date, status,
    subtotal, tax_total, discount_total, grand_total, amount_paid, balance_due,
    public_token
)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'AFS-0100',
    '2026-08-30',
    'Partially Paid',
    9000.00,
    1620.00,
    500.00,
    10120.00,
    8620.00,
    1500.00,
    'dev_mock_token_alice_100'
)
ON CONFLICT (workspace_id, invoice_number, bill_type) DO NOTHING;

-- 7. DEV INVOICE ITEMS
INSERT INTO invoice_items (invoice_id, sequence_number, name, quantity, rate, tax_percent, discount_amount, total_amount)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    1,
    'Embroidered Banarasi Saree',
    2.000,
    4500.00,
    18.00,
    500.00,
    10120.00
)
ON CONFLICT (id) DO NOTHING;
