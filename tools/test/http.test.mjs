import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fetchOk } from "../lib/http.mjs";

let server;
let base;

before(async () => {
  server = createServer((req, res) => {
    if (req.url === "/ok") res.end("bonjour");
    else if (req.url === "/lent") setTimeout(() => res.end("trop tard"), 2000);
    else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.closeAllConnections() || server.close());

test("fetchOk renvoie la réponse en cas de succès", async () => {
  assert.equal(await (await fetchOk(`${base}/ok`)).text(), "bonjour");
});

test("fetchOk cite l'URL et le statut HTTP en cas d'erreur", async () => {
  await assert.rejects(fetchOk(`${base}/absent`), (err) => err.message.includes(`${base}/absent`) && /HTTP 404/.test(err.message));
});

test("fetchOk abandonne après le délai, avec un message explicite", async () => {
  await assert.rejects(fetchOk(`${base}/lent`, { timeoutMs: 100 }), (err) => /délai/.test(err.message) && err.message.includes("/lent"));
});

test("fetchOk explique un échec réseau (URL + cause)", async () => {
  const closed = createServer();
  await new Promise((resolve) => closed.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${closed.address().port}/`;
  await new Promise((resolve) => closed.close(resolve));
  await assert.rejects(fetchOk(url), (err) => err.message.includes(url) && /ECONNREFUSED/.test(err.message));
});
