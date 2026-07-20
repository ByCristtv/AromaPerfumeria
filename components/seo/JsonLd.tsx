import type { JsonLdNode } from "@/lib/seo/jsonLd";

/**
 * Renders a schema.org JSON-LD block.
 *
 * A Server Component with no "use client" — the script must be in the initial
 * HTML so crawlers that don't execute JavaScript still read it.
 *
 * `JSON.stringify` output is escaped for `</script>` sequences. Product
 * descriptions come from the database, so a value containing `</script>` would
 * otherwise break out of the script element — an XSS vector, not just a
 * rendering bug.
 */
export default function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const json = JSON.stringify(data).replace(/<\/(script)/gi, "<\\/$1");

  return (
    <script
      type="application/ld+json"
      // Content is our own serialized object, escaped above — never raw input.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
