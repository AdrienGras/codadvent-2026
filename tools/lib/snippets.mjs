import { LANGUAGES, findLanguage } from "./languages.mjs";

const ENTITIES = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&nbsp;": " " };

function decodeEntities(text) {
  // &amp; en dernier pour ne pas re-décoder « &amp;lt; » en « < ».
  return text.replace(/&(lt|gt|quot|#39|#x27|nbsp);/g, (m) => ENTITIES[m]).replace(/&amp;/g, "&");
}

/** Blocs `<pre><code class="language-X">` d'une fiche : les squelettes fournis par la consigne. */
export function extractSnippets(html) {
  const blocks = html.matchAll(/<pre>\s*<code(?:\s+class="([^"]*)")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g);
  return [...blocks].map(([, cls, body]) => ({
    lang: cls?.match(/language-([\w#+-]+)/)?.[1] ?? null,
    code: decodeEntities(body),
  }));
}

export function snippetFileName(index, lang) {
  const num = String(index).padStart(2, "0");
  if (!lang) return `${num}.txt`;
  const known = findLanguage(lang);
  return `${num}.${lang}.${known ? LANGUAGES[known].ext : "txt"}`;
}
