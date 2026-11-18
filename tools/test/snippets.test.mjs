import { test } from "node:test";
import assert from "node:assert/strict";
import { extractSnippets, snippetFileName } from "../lib/snippets.mjs";

test("extractSnippets lit les blocs de code et leur langage", () => {
  const html =
    '<p>x</p><pre><code class="language-typescript">a &lt; b &amp;&amp; c</code></pre>' +
    "<pre><code>x</code></pre>";
  assert.deepEqual(extractSnippets(html), [
    { lang: "typescript", code: "a < b && c" },
    { lang: null, code: "x" },
  ]);
});

test("extractSnippets décode les entités HTML courantes", () => {
  const html = '<pre><code class="language-java">&quot;a&quot; &#39;b&#39; &gt; &lt;T&gt;</code></pre>';
  assert.equal(extractSnippets(html)[0].code, `"a" 'b' > <T>`);
});

test("extractSnippets décode les entités numériques et &apos;", () => {
  const html = '<pre><code class="language-ts">&#123;&#x2F;&#96;&apos;&#X41;</code></pre>';
  assert.equal(extractSnippets(html)[0].code, "{/`'A");
});

test("extractSnippets ne double-décode pas &amp;lt;", () => {
  assert.equal(extractSnippets("<pre><code>&amp;lt;</code></pre>")[0].code, "&lt;");
});

test("extractSnippets retire les balises insérées dans le code", () => {
  const html = '<pre><code class="language-ts">let <mark>x</mark> = <span class="k">1</span>;</code></pre>';
  assert.equal(extractSnippets(html)[0].code, "let x = 1;");
});

test("extractSnippets ignore le code inline hors <pre>", () => {
  assert.deepEqual(extractSnippets("<p><code>TypeScript</code></p>"), []);
});

test("snippetFileName numérote et donne l'extension du langage", () => {
  assert.equal(snippetFileName(1, "typescript"), "01.typescript.ts");
  assert.equal(snippetFileName(3, "csharp"), "03.csharp.cs");
  assert.equal(snippetFileName(2, null), "02.txt");
  assert.equal(snippetFileName(4, "gherkin"), "04.gherkin.txt");
});
