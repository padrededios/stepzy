---
name: step-03-execute
description: Phase d'exécution - appliquer les transformations avec précision
next_step: steps/step-04-verify.md
---

# Phase 3: Execute

**Role: SURGEON** - Apply transformations with precision and care

---

<available_state>
From previous step:
- Detailed refactoring plan
- Ordered transformation sequence
- Checkpoint schedule
- Rollback plan
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🧪 TEST after EVERY transformation - no exceptions
- 👣 ONE change at a time - never batch multiple refactorings
- ⏸️ STOP on red - fix before continuing
- 💾 COMMIT at checkpoints - preserve progress
- 🚫 FORBIDDEN: Continuing with failing tests
</mandatory_rules>

---

## Execution Protocol

### Pour CHAQUE transformation :

```
┌─────────────────────────────────────────┐
│  1. BASELINE - Verify tests are green   │
│     npm test -- --bail                  │
│     Expected: ALL PASS                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  2. TRANSFORM - Apply single change     │
│     Apply ONE refactoring technique     │
│     Follow the plan precisely           │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  3. VERIFY - Check tests still pass     │
│     npm test -- --bail                  │
│     npx tsc --noEmit                    │
└──────────────────┬──────────────────────┘
                   │
         ┌────────┴────────┐
         │                 │
    ✅ PASS            ❌ FAIL
         │                 │
         ▼                 ▼
┌─────────────┐    ┌─────────────┐
│ 4. CONTINUE │    │ 4. ROLLBACK │
│ Next step   │    │ Fix & retry │
└─────────────┘    └─────────────┘
```

---

## Actions

### Exécution Level 1: Preparations

#### T1.1: Rename variables

```bash
# Baseline
npm test -- --bail
```

```typescript
// Apply rename (use editor refactoring if available)
// BEFORE
const x = order.items.reduce((sum, i) => sum + i.price, 0);

// AFTER
const orderTotal = order.items.reduce((sum, item) => sum + item.price, 0);
```

```bash
# Verify
npm test -- --bail
npx tsc --noEmit
```

#### T1.2: Extract variables

```typescript
// BEFORE
const result = basePrice * quantity + shippingCost - discount * quantity / 100;

// AFTER
const subtotal = basePrice * quantity;
const discountAmount = discount * quantity / 100;
const result = subtotal + shippingCost - discountAmount;
```

```bash
# Verify
npm test -- --bail
```

**Checkpoint Level 1**:
```bash
git add -A && git commit -m "$(cat <<'EOF'
refactor: improve variable naming and extract expressions

- Renamed unclear variables for better readability
- Extracted complex expressions into named variables

No behavioral changes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Exécution Level 2: Extractions

#### T2.1: Extract Method

```typescript
// BEFORE - Long function
async function processOrder(order: Order) {
  // 30 lines of validation
  if (!order.customer) throw new Error('No customer');
  if (order.items.length === 0) throw new Error('No items');
  // ... more validation

  // 40 lines of calculation
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal);
  // ... more calculation

  // 20 lines of persistence
  await saveOrder(order);
  // ...
}

// AFTER - Extracted methods
async function processOrder(order: Order) {
  this.validateOrder(order);
  const totals = this.calculateTotals(order);
  await this.persistOrder(order, totals);
}

private validateOrder(order: Order): void {
  if (!order.customer) throw new Error('No customer');
  if (order.items.length === 0) throw new Error('No items');
  // ... validation logic
}

private calculateTotals(order: Order): OrderTotals {
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal);
  // ... calculation logic
  return { subtotal, tax, total };
}

private async persistOrder(order: Order, totals: OrderTotals): Promise<void> {
  await saveOrder(order);
  // ... persistence logic
}
```

```bash
# Verify after EACH extraction
npm test -- --bail
```

**Checkpoint Level 2**:
```bash
git add -A && git commit -m "$(cat <<'EOF'
refactor: extract methods from processOrder

- Extract validateOrder() - handles all validation logic
- Extract calculateTotals() - handles all calculations
- Extract persistOrder() - handles database operations

Main function now clearly shows the 3-step process.
No behavioral changes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Exécution Level 3: Reorganization

#### T3.1: Move Method

```bash
# 1. Verify all usages
grep -r "calculateTax" --include="*.ts"
```

```typescript
// 1. Create method in target class
// tax.service.ts
export class TaxService {
  calculate(amount: number, region: string): number {
    // Moved logic from OrderService
  }
}

// 2. Update original to delegate (temporary)
// order.service.ts
calculateTax(amount: number, region: string): number {
  return this.taxService.calculate(amount, region);
}

// 3. Verify tests pass
// 4. Update all callers to use TaxService directly
// 5. Remove delegating method
// 6. Verify again
```

```bash
# Verify at each sub-step
npm test -- --bail
```

**Checkpoint Level 3**:
```bash
git add -A && git commit -m "$(cat <<'EOF'
refactor: move tax calculation to TaxService

- Created TaxService with calculate() method
- Moved tax logic from OrderService
- Updated all callers to use TaxService
- Better separation of concerns

No behavioral changes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Gestion des échecs

Si les tests échouent après une transformation :

```bash
# 1. Don't panic - identify what broke
npm test 2>&1 | grep -A5 "FAIL"

# 2. Options:
#    a) Fix the transformation (small typo, forgotten update)
#    b) Rollback and try different approach
git checkout -- .

# 3. If stuck, commit what works and note the issue
git stash
# Analyze the problem
```

---

## Output de cette phase

```markdown
## Execution Log

### Transformations Applied

| # | Transformation | Status | Tests | Commit |
|---|---------------|--------|-------|--------|
| T1.1 | Rename variables | ✅ | Pass | - |
| T1.2 | Extract expressions | ✅ | Pass | abc123 |
| T2.1 | Extract validateOrder | ✅ | Pass | - |
| T2.2 | Extract calculateTotals | ✅ | Pass | - |
| T2.3 | Extract persistOrder | ✅ | Pass | def456 |
| T3.1 | Move calculateTax | ✅ | Pass | ghi789 |

### Test Results
- Baseline: [X] passing
- After Level 1: [X] passing
- After Level 2: [X] passing
- After Level 3: [X] passing
- Final: [X] passing, 0 failing

### Commits Created
1. `abc123` - refactor: improve variable naming
2. `def456` - refactor: extract methods from processOrder
3. `ghi789` - refactor: move tax calculation to TaxService

### Issues Encountered
[None / List of issues and how they were resolved]
```

---

→ **Next**: `step-04-verify.md` - Final verification
