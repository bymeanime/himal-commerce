#!/usr/bin/env python3
"""
Phase 6 QA — focused re-test on storefront flows + extra IDOR probes.
Run after run_live_qa.py.
"""
import json
import re
import sys
import urllib.request
import urllib.error

BASE = "https://himal-commerce.vercel.app"
TIMEOUT = 15
STORE_SLUG = "himal-crafts"
STORE_ID = "cms6d60lz0000ho6rr4v40yt5"
SAMPLE_PRODUCT_SLUG = "timur-nepali-pepper-200g"
SAMPLE_PRODUCT_ID = "cms6d6eaz001qho6rey19oo50"


def http(method, path, *, json_body=None, headers=None):
    url = path if path.startswith("http") else BASE + path
    data = None
    h = {"Accept": "application/json"}
    if headers:
        h.update(headers)
    if json_body is not None:
        data = json.dumps(json_body).encode()
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read() or b""
    except Exception as e:
        return 0, {}, str(e).encode()


def parse_json(b):
    try:
        return json.loads(b.decode("utf-8", errors="replace"))
    except Exception:
        return None


def extract_text(b):
    s = b.decode("utf-8", errors="replace")
    s = re.sub(r"<script[^>]*>.*?</script>", "", s, flags=re.S | re.I)
    s = re.sub(r"<style[^>]*>.*?</style>", "", s, flags=re.S | re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


results = []


def check(test_id, severity, title, status, detail="", evidence=""):
    results.append((test_id, severity, title, status, detail, evidence))
    icon = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭️"}.get(status, "?")
    print(f"{icon} {test_id} [{severity}] {status} — {title}")
    if detail:
        print(f"     {detail}")
    if evidence:
        print(f"     evidence: {evidence[:200]}")


# ---------------- Storefront routes ----------------
print("\n--- Storefront route smoke tests ---")

# Homepage
code, _, body = http("GET", "/")
check("SF-01", "—", "Marketing homepage loads", "PASS" if code == 200 else "FAIL",
      f"HTTP {code}, {len(body)} bytes")

# /s/[slug]
code, _, body = http("GET", f"/s/{STORE_SLUG}")
text = extract_text(body)
check("SF-02", "P0", "Storefront /s/:slug loads", "PASS" if code == 200 and len(text) > 500 else "FAIL",
      f"HTTP {code}, {len(text)} chars visible")

# /s/[slug]/about
code, _, body = http("GET", f"/s/{STORE_SLUG}/about")
check("SF-03", "—", "Storefront about page", "PASS" if code == 200 else "FAIL",
      f"HTTP {code}")

# /s/[slug]/contact
code, _, body = http("GET", f"/s/{STORE_SLUG}/contact")
check("SF-04", "—", "Storefront contact page", "PASS" if code == 200 else "FAIL",
      f"HTTP {code}")

# /s/[slug]/blog
code, _, body = http("GET", f"/s/{STORE_SLUG}/blog")
check("SF-05", "—", "Storefront blog index", "PASS" if code == 200 else "FAIL",
      f"HTTP {code}")

# /s/[slug]/wishlist
code, _, body = http("GET", f"/s/{STORE_SLUG}/wishlist")
check("SF-06", "—", "Storefront wishlist", "PASS" if code == 200 else "FAIL",
      f"HTTP {code}")

# /s/[slug]/orders (lookup form)
code, _, body = http("GET", f"/s/{STORE_SLUG}/orders")
check("SF-07", "—", "Storefront order lookup", "PASS" if code == 200 else "FAIL",
      f"HTTP {code}")

# /s/[slug]/search
code, _, body = http("GET", f"/s/{STORE_SLUG}/search")
check("SF-08", "—", "Storefront search", "PASS" if code == 200 else "FAIL",
      f"HTTP {code}")

# /s/[slug]/p/[productSlug]
code, _, body = http("GET", f"/s/{STORE_SLUG}/p/{SAMPLE_PRODUCT_SLUG}")
text = extract_text(body)
check("SF-09", "P0", "Product detail page loads", "PASS" if code == 200 and len(text) > 500 else "FAIL",
      f"HTTP {code}, {len(text)} chars visible")

# /s/[slug]/c/[categorySlug] — try a fake category
code, _, body = http("GET", f"/s/{STORE_SLUG}/c/test")
check("SF-10", "—", "Category route exists (even if 404)", "PASS" if code in (200, 404) else "FAIL",
      f"HTTP {code}")


# ---------------- Storefront API endpoints ----------------
print("\n--- Storefront API endpoints ---")

# /api/products?storeId=...
code, _, body = http("GET", f"/api/products?storeId={STORE_ID}&limit=5")
parsed = parse_json(body)
products = parsed if isinstance(parsed, list) else (parsed or {}).get("products", [])
check("API-01", "P0", "Public products list", "PASS" if code == 200 and len(products) > 0 else "FAIL",
      f"HTTP {code}, {len(products)} products returned")

# /api/products without storeId
code, _, body = http("GET", "/api/products")
check("API-02", "P0", "Products list requires storeId", "PASS" if code in (400,) else "FAIL",
      f"HTTP {code}, body: {body[:120].decode('utf-8', errors='replace')}")

# /api/products/[id] without storeId
code, _, body = http("GET", f"/api/products/{SAMPLE_PRODUCT_ID}")
check("API-03", "P0", "Product GET requires storeId (QA-002)", "PASS" if code in (400, 404) else "FAIL",
      f"HTTP {code}, body: {body[:120].decode('utf-8', errors='replace')}")

# /api/products/[id] with WRONG storeId
code, _, body = http("GET", f"/api/products/{SAMPLE_PRODUCT_ID}?storeId=cms_wrong_store_id_xxx")
check("API-04", "P0", "Product GET with wrong storeId → 404", "PASS" if code in (404,) else "FAIL",
      f"HTTP {code}, body: {body[:120].decode('utf-8', errors='replace')}")

# /api/products/[id] with CORRECT storeId
code, _, body = http("GET", f"/api/products/{SAMPLE_PRODUCT_ID}?storeId={STORE_ID}")
parsed = parse_json(body)
check("API-05", "P0", "Product GET with correct storeId works", "PASS" if code == 200 and parsed else "FAIL",
      f"HTTP {code}, has product data: {bool(parsed)}")


# ---------------- /api/stores PII leak (THE CRITICAL ONE) ----------------
print("\n--- /api/stores PII leak (post-fix verification) ---")

# This was a regression found in the first QA run
code, _, body = http("GET", "/api/stores")
parsed = parse_json(body)
stores = (parsed or {}).get("stores", [])
if stores:
    s = stores[0]
    pii_fields = ["ownerEmail", "ownerPhone", "supportPhone", "supportEmail", "address",
                  "panNumber", "vatNumber", "businessRegistrationNumber", "panDocumentUrl",
                  "businessRegistrationDocumentUrl"]
    leaked = [k for k in pii_fields if s.get(k)]
    if leaked:
        check("PII-01", "P0", "/api/stores does not leak PII", "FAIL",
              f"leaked fields: {leaked}",
              f"sample: {leaked[0]}={s.get(leaked[0])}")
    else:
        check("PII-01", "P0", "/api/stores does not leak PII", "PASS",
              f"no PII fields in {len(stores)} stores' responses")
else:
    check("PII-01", "P0", "/api/stores does not leak PII", "FAIL", "no stores in response")

# Also test ?slug= variant
code, _, body = http("GET", f"/api/stores?slug={STORE_SLUG}")
parsed = parse_json(body)
store = (parsed or {}).get("store", {})
if store:
    pii_fields = ["ownerEmail", "ownerPhone", "supportPhone", "supportEmail", "address",
                  "panNumber", "vatNumber", "businessRegistrationNumber", "panDocumentUrl",
                  "businessRegistrationDocumentUrl"]
    leaked = [k for k in pii_fields if store.get(k)]
    if leaked:
        check("PII-02", "P0", "/api/stores?slug= does not leak PII", "FAIL",
              f"leaked fields: {leaked}")
    else:
        check("PII-02", "P0", "/api/stores?slug= does not leak PII", "PASS",
              f"no PII fields in slug response")
else:
    check("PII-02", "P0", "/api/stores?slug= does not leak PII", "FAIL", "no store returned")


# ---------------- Customer public APIs ----------------
print("\n--- Customer-facing public APIs ---")

# /api/health
code, _, body = http("GET", "/api/health")
parsed = parse_json(body)
check("API-06", "—", "Health endpoint", "PASS" if code == 200 and parsed and parsed.get("status") == "ok" else "FAIL",
      f"HTTP {code}")

# /api/stores (already tested)

# /api/categories
code, _, body = http("GET", f"/api/categories?storeId={STORE_ID}")
check("API-07", "—", "Categories endpoint reachable", "PASS" if code in (200, 404) else "FAIL",
      f"HTTP {code}")

# /api/reviews?productId=...
code, _, body = http("GET", f"/api/reviews?productId={SAMPLE_PRODUCT_ID}")
check("API-08", "—", "Reviews endpoint reachable", "PASS" if code in (200, 400, 404) else "FAIL",
      f"HTTP {code}")


# ---------------- Customer auth flow ----------------
print("\n--- Customer auth / account flows ---")

# /api/customers (admin-only — should reject)
code, _, body = http("GET", f"/api/customers?storeId={STORE_ID}")
check("AUTH-01", "P0", "/api/customers requires auth", "PASS" if code in (400, 401, 403) else "FAIL",
      f"HTTP {code}")

# /api/orders (admin-only — should reject or return empty)
code, _, body = http("GET", f"/api/orders?storeId={STORE_ID}")
parsed = parse_json(body)
if code == 200:
    # If 200, ensure no real orders leaked
    orders = parsed.get("orders", parsed) if parsed else []
    if isinstance(orders, list) and len(orders) == 0:
        check("AUTH-02", "P0", "/api/orders requires auth", "PASS",
              f"HTTP {code} (empty list returned, no leak)")
    else:
        check("AUTH-02", "P0", "/api/orders requires auth", "FAIL",
              f"HTTP {code} with {len(orders) if isinstance(orders, list) else '?'} orders leaked!")
elif code in (400, 401, 403):
    check("AUTH-02", "P0", "/api/orders requires auth", "PASS", f"HTTP {code}")
else:
    check("AUTH-02", "P0", "/api/orders requires auth", "FAIL", f"HTTP {code}")


# ---------------- Static / SEO routes ----------------
print("\n--- SEO / static routes ---")

for path in ["/robots.txt", "/sitemap.xml", "/about", "/privacy", "/terms", "/cookie-policy",
             "/shipping-policy", "/refund-policy"]:
    code, _, body = http("GET", path)
    check("SEO", "—", f"{path} reachable", "PASS" if code == 200 else "FAIL",
          f"HTTP {code}")


# ---------------- Summary ----------------
print()
print("=" * 70)
print("FOCUSED QA SUMMARY")
print("=" * 70)
pass_count = sum(1 for r in results if r[3] == "PASS")
fail_count = sum(1 for r in results if r[3] == "FAIL")
skip_count = sum(1 for r in results if r[3] == "SKIP")
print(f"  PASS: {pass_count}")
print(f"  FAIL: {fail_count}")
print(f"  SKIP: {skip_count}")
print(f"  TOTAL: {len(results)}")

if fail_count > 0:
    print()
    print("FAILURES:")
    for r in results:
        if r[3] == "FAIL":
            print(f"  ❌ {r[0]} [{r[1]}] {r[2]}")
            print(f"     {r[4]}")

# Save report
report = {
    "base_url": BASE,
    "store_slug": STORE_SLUG,
    "store_id": STORE_ID,
    "summary": {"pass": pass_count, "fail": fail_count, "skip": skip_count, "total": len(results)},
    "results": [{"id": r[0], "severity": r[1], "title": r[2], "status": r[3], "detail": r[4], "evidence": r[5][:500]} for r in results],
}
with open("/home/z/my-project/scripts/qa-live/focused_qa_report.json", "w") as f:
    json.dump(report, f, indent=2)
print("\nReport saved to: /home/z/my-project/scripts/qa-live/focused_qa_report.json")
