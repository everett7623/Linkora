# Linketry GEO Contract

This document defines the public-site contract for generative-engine optimization (GEO). It improves how search engines and AI answer systems discover, interpret, quote, and link to Linketry. It does not promise a ranking, citation, or recommendation outcome.

## Public Sources

The canonical sources are:

- Website: `https://linketry.com/`
- Deployment page: `https://linketry.com/deploy/`
- Agent-readable summary: `https://linketry.com/llms.txt`
- Source and long-form technical documentation: `https://github.com/everett7623/Linketry`

The homepage's visible canonical-facts section, homepage JSON-LD, and `llms.txt` must agree on these facts:

- Linketry is open-source and self-hosted on the owner's Cloudflare account.
- D1 is the source of truth and KV is a redirect cache only.
- Analytics work is asynchronous and must not delay redirects.
- Normal production Admin access requires `LINKETRY_ADMIN_TOKEN`.
- Production self-hosting does not require Demo mode, Demo resources, or synthetic data.
- The public Demo is isolated, read-only, and synthetic.

Do not add aggregate ratings, customer counts, pricing claims, benchmark results, or unsupported platform compatibility claims to structured data.

## Discovery And Use Policy

`apps/site/public/robots.txt` permits search indexing and real-time AI input with:

```txt
Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference
```

The policy permits discovery, linking, excerpts, and grounded answers while reserving rights against training or fine-tuning. `OAI-SearchBot` is explicitly allowed for answer/search discovery; `GPTBot` is disallowed because it is a training crawler. General crawler access remains open to public documentation and search crawlers.

Cloudflare can report these directives and crawler activity through AI Crawl Control. Do not enable a managed `robots.txt` setting that overwrites the repository policy without first reconciling the resulting Content Signals.

## Structured Data

- Homepage: `WebSite`, `Organization`, `WebApplication`, and `FAQPage` JSON-LD.
- Deployment page: `HowTo` JSON-LD for the production Quick Deploy flow.
- Both pages expose canonical URLs, robots metadata, Open Graph data, and an alternate link to `/llms.txt`.
- The sitemap covers canonical public HTML routes and includes an accurate release-date `lastmod`.

The schema is supplementary metadata. The matching facts must remain visible in ordinary page text, and the site must remain reachable without login, bot challenges, region restrictions, or JavaScript-only critical content.

## Verification

Before release, verify:

```bash
npm run test:site
npm run build:site
```

Then inspect the public deployment after it is published:

```bash
curl -I https://linketry.com/
curl https://linketry.com/robots.txt
curl https://linketry.com/llms.txt
curl https://linketry.com/sitemap.xml
```

Validate JSON-LD with a structured-data validator, submit the sitemap through the appropriate search-console property, and check Cloudflare AI Crawl Control for robots status and crawler access. A crawl or answer result must not be treated as proof that the public Demo and normal production deployment are interchangeable.
