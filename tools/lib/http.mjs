/** `fetch` avec délai maximal et messages d'erreur qui citent toujours l'URL. */
export async function fetchOk(url, { timeoutMs = 30_000 } = {}) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    if (err.name === "TimeoutError") throw new Error(`${url} : pas de réponse dans le délai de ${timeoutMs} ms`);
    const cause = err.cause?.code ?? err.cause?.message ?? err.message;
    throw new Error(`${url} injoignable (${cause}) : vérifie ta connexion`);
  }
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res;
}
