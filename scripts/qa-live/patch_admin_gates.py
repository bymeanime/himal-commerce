#!/usr/bin/env python3
"""
Batch-patch admin API routes to add requireAdmin gate.
Idempotent — skips files that already import requireAdmin.
"""
import re
import os
from pathlib import Path

ROUTES = [
    "src/app/api/dashboard/route.ts",
    "src/app/api/audit-logs/route.ts",
    "src/app/api/abandoned-carts/route.ts",
    "src/app/api/returns/route.ts",
    "src/app/api/coupons/route.ts",
    "src/app/api/refunds/route.ts",
    "src/app/api/affiliates/route.ts",
    "src/app/api/influencers/route.ts",
    "src/app/api/export/customers/route.ts",
    "src/app/api/export/products/route.ts",
    "src/app/api/export/orders/route.ts",
    "src/app/api/orders/[id]/route.ts",
]

BASE = "/home/z/my-project"
IMPORT_LINE = "import { requireAdmin } from '@/lib/admin-auth'"
GATE_BLOCK = "  const adminGate = requireAdmin(req)\n  if (adminGate) return adminGate\n\n"

patched = []
skipped = []

for relpath in ROUTES:
    fpath = os.path.join(BASE, relpath)
    if not os.path.exists(fpath):
        print(f"SKIP (missing): {relpath}")
        skipped.append(relpath)
        continue
    with open(fpath, "r") as f:
        src = f.read()

    if "requireAdmin" in src:
        print(f"SKIP (already patched): {relpath}")
        skipped.append(relpath)
        continue

    # 1. Add import after the last `import` line at the top of the file
    lines = src.split("\n")
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import_idx = i
        elif last_import_idx >= 0 and line.strip() == "":
            # Blank line after imports — keep going to find last import block
            pass
        elif last_import_idx >= 0 and not line.startswith("import ") and not line.strip() == "":
            break
    if last_import_idx == -1:
        print(f"SKIP (no imports found): {relpath}")
        skipped.append(relpath)
        continue
    lines.insert(last_import_idx + 1, IMPORT_LINE)

    # 2. Insert gate block right after each `export async function GET(req: NextRequest...)` line
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        # Match GET handler signature
        if re.match(r"^export async function GET\(req: NextRequest", line):
            # Find the opening brace line
            j = i + 1
            while j < len(lines) and "{" not in lines[j]:
                new_lines.append(lines[j])
                j += 1
            if j < len(lines):
                new_lines.append(lines[j])  # the line with {
                new_lines.append(GATE_BLOCK.rstrip())
                i = j + 1
                continue
            i = j
            continue
        i += 1

    new_src = "\n".join(new_lines)
    with open(fpath, "w") as f:
        f.write(new_src)
    print(f"PATCHED: {relpath}")
    patched.append(relpath)

print()
print(f"Patched: {len(patched)}  Skipped: {len(skipped)}")
