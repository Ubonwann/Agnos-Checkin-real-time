/**
 * Custom server
 * ---------------
 * Next.js handles page rendering; we attach a Socket.io server to the same
 * HTTP server so patient <-> staff updates travel over one long-lived
 * connection instead of polling. See lib/realtime/store.js for the in-memory
 * session store and lib/realtime/socketServer.js for the event wiring.
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { attachRealtime } = require("./lib/realtime/socketServer");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  attachRealtime(httpServer);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
