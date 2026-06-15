import https from "node:https";

const hosts = [
  "caelinus.ai",
  "www.caelinus.ai",
  "en.caelinus.ai",
];

for (const host of hosts) {
  await new Promise((resolve) => {
    const req = https.request(
      {
        host,
        port: 443,
        method: "HEAD",
        path: "/",
        timeout: 8000,
        servername: host,
      },
      (res) => {
        console.log(
          `\n=== ${host} === Status: ${res.statusCode}  server: ${res.headers.server ?? ""}  location: ${res.headers.location ?? ""}  x-vercel-id: ${res.headers["x-vercel-id"] ?? ""}`,
        );
        res.resume();
        res.on("end", resolve);
      },
    );
    req.on("error", (e) => {
      console.log(`\n=== ${host} === ERROR: ${e.code || ""} ${e.message}`);
      resolve();
    });
    req.on("timeout", () => {
      console.log(`\n=== ${host} === TIMEOUT`);
      req.destroy();
      resolve();
    });
    req.end();
  });
}
