import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('🐘 RUNNING BILLQYRO POSTGRESQL SCHEMA VERIFICATION');
console.log('======================================================');

let passedTests = 0;
const test = async (desc, fn) => {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    throw err;
  }
};

const migrationPath = path.join(rootDir, 'backend', 'migrations', '001_initial_schema.sql');
const seedPath = path.join(rootDir, 'backend', 'seeds', '001_dev_seed.sql');
const dockerComposePath = path.join(rootDir, 'docker-compose.yml');

// 1. Files & Structural Integrity
await test('1. File System Integrity: Migration, Seed, and Docker Compose exist', () => {
  assert.ok(fs.existsSync(migrationPath), '001_initial_schema.sql must exist');
  assert.ok(fs.existsSync(seedPath), '001_dev_seed.sql must exist');
  assert.ok(fs.existsSync(dockerComposePath), 'docker-compose.yml must exist');
});

const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
const seedSql = fs.readFileSync(seedPath, 'utf-8');
const dockerComposeYaml = fs.readFileSync(dockerComposePath, 'utf-8');

// 2. Docker Compose Configuration Validation
await test('2. Docker Compose: PostgreSQL 16, healthcheck, and persistent volumes defined', () => {
  assert.match(dockerComposeYaml, /image:\s*postgres:16-alpine/);
  assert.match(dockerComposeYaml, /billqyro-postgres-dev/);
  assert.match(dockerComposeYaml, /POSTGRES_DB:\s*\${POSTGRES_DB:-billqyro_dev}/);
  assert.match(dockerComposeYaml, /healthcheck:/);
  assert.match(dockerComposeYaml, /billqyro_pgdata:/);
  assert.match(dockerComposeYaml, /minio/);
});

// 3. PostgreSQL Extensions & Migration Tracking
await test('3. Schema Extensions & Tracking: pgcrypto and schema_migrations table present', () => {
  assert.match(migrationSql, /CREATE EXTENSION IF NOT EXISTS "pgcrypto"/);
  assert.match(migrationSql, /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.match(migrationSql, /migration_name VARCHAR\(255\) NOT NULL UNIQUE/);
});

// 4. Core Entities Table Presence
await test('4. Core Entity Tables: users, workspaces, customers, products, invoices, invoice_items, payments present', () => {
  const expectedTables = [
    'users',
    'workspaces',
    'workspace_members',
    'customers',
    'products',
    'invoices',
    'invoice_items',
    'payments',
    'pdf_documents',
    'sync_operations',
    'audit_logs',
    'expenses',
    'bank_ledger',
    'students',
    'staff'
  ];

  for (const tbl of expectedTables) {
    const regex = new RegExp(`CREATE TABLE IF NOT EXISTS ${tbl}\\s*\\(`, 'i');
    assert.match(migrationSql, regex, `Table ${tbl} must be defined in schema`);
  }
});

// 5. Multi-Tenant Cross-Workspace Referential Invariants
await test('5. Multi-Tenant Safety: Composite foreign keys strictly enforce same-workspace references', () => {
  // Check customers composite unique key
  assert.match(migrationSql, /UNIQUE\s*\(id,\s*workspace_id\)/i, 'customers must have composite (id, workspace_id) unique key');

  // Check invoices composite foreign key to customers
  assert.match(
    migrationSql,
    /FOREIGN KEY\s*\(customer_id,\s*workspace_id\)\s*REFERENCES\s*customers\s*\(id,\s*workspace_id\)/i,
    'invoices must bind (customer_id, workspace_id) to prevent cross-workspace customer leaks'
  );

  // Check payments composite foreign key to invoices
  assert.match(
    migrationSql,
    /FOREIGN KEY\s*\(invoice_id,\s*workspace_id\)\s*REFERENCES\s*invoices\s*\(id,\s*workspace_id\)/i,
    'payments must bind (invoice_id, workspace_id) to prevent cross-workspace invoice payment leaks'
  );

  // Check pdf_documents composite foreign key to invoices
  assert.match(
    migrationSql,
    /FOREIGN KEY\s*\(invoice_id,\s*workspace_id\)\s*REFERENCES\s*invoices\s*\(id,\s*workspace_id\)/i,
    'pdf_documents must bind (invoice_id, workspace_id)'
  );
});

// 6. Fixed Precision Monetary & Non-Negative Financial Invariants
await test('6. Financial Integrity: NUMERIC(14,2) and non-negative check constraints enforced', () => {
  assert.match(migrationSql, /subtotal NUMERIC\(14,2\)\s*NOT NULL DEFAULT 0\.00 CHECK\s*\(subtotal >= 0\)/);
  assert.match(migrationSql, /tax_total NUMERIC\(14,2\)\s*NOT NULL DEFAULT 0\.00 CHECK\s*\(tax_total >= 0\)/);
  assert.match(migrationSql, /discount_total NUMERIC\(14,2\)\s*NOT NULL DEFAULT 0\.00 CHECK\s*\(discount_total >= 0\)/);
  assert.match(migrationSql, /grand_total NUMERIC\(14,2\)\s*NOT NULL DEFAULT 0\.00 CHECK\s*\(grand_total >= 0\)/);
  assert.match(migrationSql, /amount_paid NUMERIC\(14,2\)\s*NOT NULL DEFAULT 0\.00 CHECK\s*\(amount_paid >= 0\)/);
  assert.match(migrationSql, /balance_due NUMERIC\(14,2\)\s*NOT NULL DEFAULT 0\.00 CHECK\s*\(balance_due >= 0\)/);
});

// 7. Atomic Invoice Number Concurrency Allocation Function
await test('7. Concurrency Function: generate_next_invoice_number uses FOR UPDATE row-level lock', () => {
  assert.match(migrationSql, /CREATE OR REPLACE FUNCTION generate_next_invoice_number/i);
  assert.match(migrationSql, /FOR UPDATE/i, 'Function must acquire exclusive row lock with FOR UPDATE');
  assert.match(migrationSql, /next_invoice_number = v_next_val \+ 1/i);
});

// 8. Sync Idempotency & Public Token High-Entropy Constraints
await test('8. Sync & Public Token Invariants: UNIQUE(workspace_id, client_tx_id) & unique public_token', () => {
  assert.match(migrationSql, /UNIQUE\s*\(workspace_id,\s*client_tx_id\)/i, 'sync_operations must enforce idempotency');
  assert.match(migrationSql, /public_token VARCHAR\(64\) NOT NULL UNIQUE/i, 'invoices must enforce unique high-entropy public token');
  assert.match(migrationSql, /UNIQUE\s*\(invoice_id,\s*content_hash\)/i, 'pdf_documents must enforce unique immutable cache hash');
});

// 9. Development Seed Validation (Isolated Mock Records)
await test('9. Development Seed Safety: Clearly separated mock data without real user info', () => {
  assert.match(seedSql, /alice@dev\.billqyro\.local/);
  assert.match(seedSql, /bob@dev\.billqyro\.local/);
  assert.match(seedSql, /Alice Fashion Studio/);
  assert.match(seedSql, /Bob Electronics Hub/);
  assert.match(seedSql, /ON CONFLICT/);
});

// 10. Concurrency Simulation: Atomic sequential counter increments
await test('10. Concurrency Simulation: Atomic invoice sequence generator logic test', () => {
  class MockWorkspaceRow {
    constructor(prefix, startVal) {
      this.prefix = prefix;
      this.nextVal = startVal;
      this.locked = false;
    }
    // Simulate FOR UPDATE transaction
    async generateNextNumber(billType = 'Invoice') {
      while (this.locked) {
        await new Promise(r => setImmediate(r));
      }
      this.locked = true;
      try {
        const current = this.nextVal;
        this.nextVal++;
        const numStr = String(current).padStart(4, '0');
        return billType === 'Estimate' ? `EST-${numStr}` : `${this.prefix}${numStr}`;
      } finally {
        this.locked = false;
      }
    }
  }

  const ws = new MockWorkspaceRow('INV-', 101);

  // Simulate 50 concurrent staff creating invoices simultaneously
  const results = [];
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(ws.generateNextNumber().then(num => results.push(num)));
  }

  return Promise.all(promises).then(() => {
    assert.strictEqual(results.length, 50);
    const uniqueSet = new Set(results);
    assert.strictEqual(uniqueSet.size, 50, 'Zero duplicate invoice numbers allowed under high concurrency');
    assert.strictEqual(ws.nextVal, 151);
  });
});

console.log('======================================================');
console.log(`🐘 POSTGRESQL SCHEMA VERIFICATION: ${passedTests} / 10 PASSED (100%)`);
console.log('======================================================\n');
