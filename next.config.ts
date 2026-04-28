import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel hard-caps serverless functions at 300 MB. Our `public/`
  // folder weighs ~900 MB (atelier dashboard imagery + shop hero
  // shots), so anything that *trace-references* it from inside an
  // API route — even an aborted one — drags the entire tree into the
  // function bundle and blows the limit.
  //
  // We've already removed the `process.cwd()` reads from the play
  // render route, but this is the belt-and-braces guard: explicitly
  // tell Next.js' file tracer never to copy `public/` into any
  // serverless function. Public assets are still served by Vercel's
  // static edge — the function just doesn't need them at runtime.
  outputFileTracingExcludes: {
    "*": [
      "public/**/*",
      "node_modules/@swc/core-linux-*",
      "node_modules/@esbuild/*",
    ],
  },
};

export default nextConfig;
