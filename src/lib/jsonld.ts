// Safe JSON-LD serialization for use in `dangerouslySetInnerHTML`.
//
// SECURITY (QA-024 fix): JSON.stringify does NOT escape the literal string
// `</script>`, so if any field contains it (e.g. a product title or blog post
// body contains the substring `</script>`), it would break out of the inline
// <script> tag and allow XSS. We escape `<` to `\u003c` (which JSON parsers
// still interpret as `<`, but the HTML parser inside <script> won't see a
// closing tag).
//
// Usage:
//   <script type="application/ld+json"
//     dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}
