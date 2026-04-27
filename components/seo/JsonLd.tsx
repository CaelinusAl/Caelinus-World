import { serialiseJsonLd } from "@/lib/seo/jsonld";

type JsonLdNode = Parameters<typeof serialiseJsonLd>[0];

/**
 * Server component — renders one or more schema.org JSON-LD nodes
 * inside a single `<script type="application/ld+json">` tag.
 *
 * We use `dangerouslySetInnerHTML` because that's the only way React
 * lets us emit raw JSON without HTML-escaping (Google's parser
 * doesn't care, but breaks if we feed it `&quot;`-escaped strings).
 *
 * Place this near the top of a page's JSX so it sits early in the
 * `<body>` — Googlebot reads top-down and bails on long pages.
 */
export default function JsonLd({ nodes }: { nodes: JsonLdNode }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify already escapes `<` and `>` poorly for inline
      // scripts, so we patch the closing-tag sequence to keep the
      // browser HTML parser from terminating the script early.
      dangerouslySetInnerHTML={{
        __html: serialiseJsonLd(nodes).replace(/</g, "\\u003c"),
      }}
    />
  );
}
