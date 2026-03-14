---
name: web-quality
description: Audit web application quality — Core Web Vitals (LCP, FID, CLS), Lighthouse scores, performance optimization, accessibility compliance, SEO, and best practices. Use when the user mentions "performance audit", "Lighthouse", "Core Web Vitals", "LCP", "page speed", "web quality", or needs to improve web app metrics.
allowed-tools: Read, Bash, Grep, Glob
---

# Web Quality Skill

Optimize web applications for performance, accessibility, and SEO.

## Core Web Vitals Targets
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4.0s | > 4.0s |
| INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |

## Common Fixes
### LCP Optimization
- Preload critical images: `<link rel="preload" as="image" href="...">`
- Use `next/image` or `<img loading="eager">` for hero images
- Inline critical CSS, defer non-critical
- Use CDN for static assets

### CLS Optimization
- Always set width/height on images and videos
- Reserve space for dynamic content (skeleton screens)
- Avoid inserting content above existing content
- Use `font-display: swap` for web fonts

### INP Optimization
- Break long tasks into smaller chunks (`requestIdleCallback`)
- Use `startTransition` for non-urgent updates in React
- Debounce input handlers
- Move heavy computation to Web Workers
