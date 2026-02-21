

# Fix: digestive_logs severity check constraint violation

## Problem
The database has a check constraint requiring `severity` to be between 1 and 5. However, when all symptom sliders (bloating, pain, gas, reflux, urgency) are at 0, the code computes `Math.max(0, 0, 0, 0, 0) = 0`, which violates the constraint and causes a 400 error.

## Solution
Clamp the computed severity to a minimum of 1 in `src/pages/DigestiveLog.tsx`.

## Change

**File: `src/pages/DigestiveLog.tsx` (line ~141)**

Change:
```typescript
severity: Math.max(form.bloating, form.pain, form.gas, form.reflux, form.urgency),
```

To:
```typescript
severity: Math.max(1, form.bloating, form.pain, form.gas, form.reflux, form.urgency),
```

This ensures severity is always at least 1 (meaning "no symptoms / baseline"), satisfying the database constraint. No schema changes needed.

