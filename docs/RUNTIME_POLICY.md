# Runtime support reviewed September 10, 2026

KnightBite supports **Node >=24.19.0 <25** for the current application. The preferred developer runtime remains **24.21.0** in `.nvmrc`. The single required `KnightBite release verification` job runs the full gate on both versions. Vercel remains on its supported **24.x** runtime; no custom runtime binary, provider replacement or hosting-protection change is used.

## Why the previous minimum existed

Commit `83161520e6a3a3a41699db3a68b53d6f2810f90e` introduced `.nvmrc` and copied the then-selected latest LTS, 24.21.0, into `engines.node`. Its commit/report documents a supported tooling pin, not a particular required API or CVE boundary. The installed dependency engines accept 24.19.0 (including Next 15.5.25, sharp 0.35.4, ESLint 10.10.0 and Playwright 1.63.0). No application use of APIs first added in 24.20/24.21 was found. Acceptance is also contingent on full tests at the hosting floor; successful compilation alone is insufficient.

Vercel's settings and [official version policy](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) expose major versions 24, 22 and 20 and manage minor/patch rollout. Setting `engines` or installing a different build executable cannot attest or replace the managed function runtime. The existing Preview's npm warning independently identified Node 24.19.0. Node 24 is Active LTS; there is no reason to migrate to an older major just to remove a warning. [Node release schedule](https://nodejs.org/en/about/previous-releases)

## Security assessment and limits

The [July 29 Node security release](https://nodejs.org/en/blog/vulnerability/july-2026-security-releases) supplies fixes in **24.18.1**, including TLS identity/session handling, HTTP/2, DNS and llhttp/Undici updates. Node 24.19.0 follows it and contains OpenSSL 3.5.7, Undici 7.29.0 and llhttp 9.4.3. The [June release](https://nodejs.org/en/blog/vulnerability/june-2026-security-releases) had already supplied OpenSSL 3.5.7 and earlier TLS fixes. Build preflight rejects a lower Node/component baseline; these are reviewed minimums, not a claim that every bundled component is at its newest patch.

**24.19.0 does contain versions affected by later component advisories.** This review distinguishes their input/API prerequisites from the application surface, rather than calling an npm audit result a Node security attestation. [Node 24.21.0](https://nodejs.org/en/blog/release/v24.21.0) includes OpenSSL 3.5.8 and Undici 7.29.1; it remains preferred.

| Newer fixes | Current application assessment |
| --- | --- |
| Undici GHSA-3wwx-pv8p-q78v, GHSA-rx4f-c7p8-82vq, GHSA-rfgv-xxqx-mfg5 | Require outbound Undici/Node WebSocket or WebSocketStream. KnightBite has no such connections. Next's development HMR browser socket is distinct from the Node Undici client and is not deployed as production HMR. |
| GHSA-w293-vg96-wgc3 | Requires `BalancedPool` with function-valued custom TLS/connector options. KnightBite uses native fetch with the default dispatcher, not that pool or certificate overrides. |
| GHSA-8436-99hf-9mmv, GHSA-2jfj-6hjv-fm6j | Require Undici's optional `interceptors.cache()`. Next's fetch/Data Cache and KnightBite's process cache are separate implementations. No Undici caching interceptor is installed. |
| GHSA-2gqq-gqf2-x968, GHSA-3xpg-4rpp-hhhm | Require the optional dump/decompress interceptors. KnightBite does not use them; ordinary native fetch decompression is not the advisory's interceptor. The app reads response streams with existing byte limits and deadlines. These bounds do not attest total platform RSS or the separate Next cache branch. |
| GHSA-r53p-7pc4-xj5r, GHSA-pmjh-fq2x-6v4x | Require Undici RetryHandler/retry interceptor. No such dispatcher is installed, and this app is not a transparent forwarding proxy. |
| GHSA-vp8m-p9jh-q5pm | Affected only in Undici 8.10.0–8.10.1; not the 7.29.0 bundle. |

Sources and per-advisory affected ranges are in [runtime evidence](audits/production-readiness-2026-09-10/runtime-evidence/undici-advisories.json), retrieved from the [maintainer's advisory API](https://api.github.com/repos/nodejs/undici/security-advisories). In particular, [decompression advisory](https://github.com/nodejs/undici/security/advisories/GHSA-3xpg-4rpp-hhhm) and [BalancedPool advisory](https://github.com/nodejs/undici/security/advisories/GHSA-w293-vg96-wgc3) explicitly describe the required optional APIs. This is a source-based reachability assessment, not an exploit test or guarantee concerning Vercel's undisclosed platform code.

[OpenSSL 3.5.8](https://openssl-library.org/news/openssl-3.5-notes/) fixes August issues in QUIC/DTLS, CMP, CMS unwrap, raw-public-key TLS configuration and the one-shot EVP_Cipher API. KnightBite configures none of those services/options. It uses ordinary HTTPS fetch, and Next's action encryption uses WebCrypto AES-GCM rather than one-shot EVP_Cipher with AES-OCB/ChaCha20-Poly1305. [CVE-2026-75803 prerequisites](https://openssl-library.org/news/vulnerabilities/#CVE-2026-75803). The older OpenSSL version remains visible in evidence and should advance with Vercel's rollout; it is not described as fully patched.

## Release enforcement and ongoing review

`npm run build` runs `scripts/verify-runtime.mts` first. It fails closed below the reviewed Node/OpenSSL/Undici/llhttp floors and emits a small build record containing only public commit/version/platform/native-library identifiers. No secret, request body, user preference or plate is recorded. This verifies the **build** runtime; function runtime patch evidence must be recorded separately when available, not inferred from the major selector.

The required CI check retains all existing checks, producer binding and name, and adds a second complete execution on 24.19.0. Do not remove the 24.21.0 run. Both must pass on the exact candidate and, after a separately authorized merge, the final main commit. No release/protection bypass is permitted by this policy.

Reassess when the app adds any affected API, a dependency changes fetch/crypto behavior, Vercel changes runtime, or a relevant advisory appears. Prefer Vercel's patched 24.x as it rolls out, then update the tested floor after verification. If a reachable unpatched issue appears before a supported hosting patch is available, block release rather than lowering a security requirement or substituting a custom unsupported runtime.
