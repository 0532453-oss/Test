# PRD: flexdesk-website -- Deployment Readiness

## Introduction

`flexdesk-website` is the FlexDesk marketing website built with Next.js 14.2, React 18, Tailwind CSS, and Emotion CSS-in-JS. It is deployed to Vercel and includes a pricing page (with Stripe checkout integration), a contact form (currently simulated with `setTimeout`), a sign-in/sign-up page, a checkout success page, and a stub homepage (the real homepage is served via Framer with Cloudflare traffic splitting). The site has an MDX blog engine (`get-posts.tsx` with `next-mdx-remote`) but no published posts, uses Keystatic with collections disabled, and is missing SEO fundamentals, analytics, legal pages, a 404 page, and real contact form submission. This PRD addresses all gaps required for a production-ready marketing website.

## Goals

- Implement proper SEO: per-page meta tags, Open Graph images, JSON-LD structured data for SaaS
- Optimize Core Web Vitals (LCP, CLS, FID) for Vercel deployment
- Connect the contact form to a real backend service (Formspree or SendGrid via API route)
- Wire pricing page CTA buttons to the actual signup and Stripe checkout flows (partially done, needs env var validation)
- Add analytics integration (Google Analytics 4 or Plausible)
- Add favicon set (ico, apple-touch-icon, webmanifest) and Open Graph social sharing images
- Create placeholder legal pages (privacy policy, terms of service) linked from footer and signup form
- Build a custom 404 page
- Verify mobile responsiveness across all pages
- Add missing footer links (privacy, terms, contact)

## User Stories

### US-001: Global SEO Metadata and Layout Improvements

**Description:** As a marketing team member, I want every page to have proper SEO metadata so that search engines and social media platforms display FlexDesk correctly.

**Acceptance Criteria:**
- [ ] Root layout `(public)/layout.tsx` metadata updated: `title` uses template pattern `"%s | FlexDesk"` with a default, `description` is a full marketing sentence, `metadataBase` is set to the production URL
- [ ] Add `openGraph` fields to root metadata: `siteName`, `type: "website"`, `locale: "en_US"`, default `images` array
- [ ] Add `twitter` card metadata: `card: "summary_large_image"`, `site` handle
- [ ] Add `robots` metadata: `index: true, follow: true`
- [ ] Verify the `<html lang="en">` attribute is present (it is)
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-002: Per-Page SEO Metadata

**Description:** As a marketing team member, I want each page to have unique, descriptive metadata so that search results show relevant previews.

**Acceptance Criteria:**
- [ ] Pricing page (`pricing/page.tsx`): title "Pricing | FlexDesk" (fix current "Pricing - Service Flex" inconsistency), description mentions plans and pricing
- [ ] Contact page (`contact/page.tsx`): title "Contact Sales | FlexDesk", description mentions enterprise solutions
- [ ] Sign-in page (`signin/page.tsx`): title "Sign In | FlexDesk", add `robots: { index: false }` to prevent indexing login pages
- [ ] Story/About page (`story/page.tsx`): title "About | FlexDesk", add a real description
- [ ] Checkout success page: add `robots: { index: false }` to prevent indexing
- [ ] Each page's metadata uses the root layout title template
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-003: JSON-LD Structured Data

**Description:** As a marketing team member, I want JSON-LD structured data on key pages so that Google rich results can display FlexDesk information.

**Acceptance Criteria:**
- [ ] Add `Organization` schema to the root layout with name, url, logo, sameAs (social links)
- [ ] Add `WebSite` schema to the homepage with `potentialAction` SearchAction (if applicable)
- [ ] Add `Product` schema to the pricing page with offers for each tier
- [ ] JSON-LD is injected via `<script type="application/ld+json">` in a server component
- [ ] Validate output with Google Rich Results Test structure
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-004: Favicon and Social Sharing Images

**Description:** As a marketing team member, I want proper favicons and OG images so that the site looks professional in browser tabs and when shared on social media.

**Acceptance Criteria:**
- [ ] Add `favicon.ico` to `public/` (convert from existing `images/core/logo.svg`)
- [ ] Add `apple-touch-icon.png` (180x180) to `public/`
- [ ] Add `icon-192.png` and `icon-512.png` for PWA manifest
- [ ] Add `site.webmanifest` to `public/` with name, icons, theme_color
- [ ] Add `og-image.png` (1200x630) to `public/` for default Open Graph image
- [ ] Update root layout metadata to reference these files via Next.js `icons` metadata API
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-005: Connect Contact Form to Real Submission Service

**Description:** As a potential customer, I want the contact form to actually deliver my message to the FlexDesk sales team instead of simulating submission with setTimeout.

**Acceptance Criteria:**
- [ ] Create a Next.js API route at `app/api/contact/route.ts` that accepts POST requests with the form data
- [ ] API route validates required fields (firstName, lastName, email, company, teamSize, message) and returns 400 for invalid input
- [ ] API route sends the form data to an external service: either Formspree (via fetch to `https://formspree.io/f/{form_id}`) or SendGrid (via `@sendgrid/mail`). Use an environment variable `CONTACT_FORM_ENDPOINT` or `SENDGRID_API_KEY`
- [ ] Update `ContactSection.tsx` to POST to `/api/contact` instead of using `setTimeout`
- [ ] Error states display server error messages to the user
- [ ] Success state remains the same (thank you message with return home link)
- [ ] Rate limit the API route (basic: check a timestamp cookie or use a simple in-memory counter)
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-006: Pricing Page Environment Validation and Stripe Hardening

**Description:** As a developer, I want the pricing page Stripe integration to fail gracefully when environment variables are missing and to use real Stripe price IDs.

**Acceptance Criteria:**
- [ ] `PricingSection.tsx`: pricing tiers should include `stripePriceId` fields (monthly and annual) loaded from environment variables or a config file
- [ ] `PricingCard.tsx`: if `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is not set, the Pro CTA button should show a tooltip or disabled state with "Coming soon" instead of silently failing
- [ ] `lib/api.ts`: `createCheckoutSession` should validate the response URL before redirecting (ensure it starts with `https://checkout.stripe.com`)
- [ ] `lib/stripe.ts`: add a named export `isStripeConfigured(): boolean` that checks for the publishable key
- [ ] Checkout success page: validate `session_id` parameter exists before showing success UI; show an error state if missing
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-007: Analytics Integration

**Description:** As a marketing team member, I want analytics tracking on the website so that I can understand visitor behavior and conversion rates.

**Acceptance Criteria:**
- [ ] Add Google Analytics 4 (GA4) integration using `@next/third-parties/google` or a `<Script>` tag in the root layout
- [ ] GA4 measurement ID loaded from `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment variable
- [ ] Analytics script only loads in production (check `process.env.NODE_ENV`)
- [ ] If the env var is not set, no analytics script is loaded (no console errors)
- [ ] Page views are tracked automatically via Next.js App Router navigation
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-008: Privacy Policy Placeholder Page

**Description:** As a user, I want to read a privacy policy before signing up, since the signup form and contact form both link to `/privacy`.

**Acceptance Criteria:**
- [ ] Create `app/(public)/privacy/page.tsx` as a server component
- [ ] Page contains a placeholder privacy policy with sections: Information We Collect, How We Use It, Data Sharing, Cookies, Contact Us
- [ ] Content is clearly marked as a draft/placeholder with a "Last updated" date
- [ ] Page has proper metadata: title "Privacy Policy | FlexDesk"
- [ ] Footer is updated to include a link to `/privacy`
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-009: Terms of Service Placeholder Page

**Description:** As a user, I want to read terms of service before signing up, since the signup form links to `/terms`.

**Acceptance Criteria:**
- [ ] Create `app/(public)/terms/page.tsx` as a server component
- [ ] Page contains a placeholder ToS with sections: Acceptance of Terms, Service Description, User Accounts, Payment Terms, Limitation of Liability, Contact
- [ ] Content is clearly marked as a draft/placeholder with a "Last updated" date
- [ ] Page has proper metadata: title "Terms of Service | FlexDesk"
- [ ] Footer is updated to include a link to `/terms`
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-010: Custom 404 Page

**Description:** As a visitor who lands on a broken link, I want to see a helpful 404 page instead of the default Next.js error page.

**Acceptance Criteria:**
- [ ] Create `app/not-found.tsx` (Next.js App Router convention)
- [ ] Page displays: FlexDesk logo, "Page not found" heading, brief message, link back to homepage, link to contact page
- [ ] Page uses the same layout (header + footer) as other pages
- [ ] Page has metadata: title "Page Not Found | FlexDesk"
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-011: Footer Links Update

**Description:** As a visitor, I want the footer to contain links to all important pages so that I can navigate the site.

**Acceptance Criteria:**
- [ ] `FooterDesktop.tsx`: Add a "Legal" column with links to `/privacy` and `/terms`
- [ ] Add a "Contact" link pointing to `/contact` in the existing Company column
- [ ] Add a "Resources" column with link to `/blog` (even if blog is empty, for future use)
- [ ] Verify footer renders correctly on mobile (the `LeftSideFooter` is hidden on mobile via existing media query, but `RightSideFooter` columns should stack)
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-012: Mobile Responsiveness Audit

**Description:** As a mobile visitor, I want every page to be usable on phone and tablet screen sizes.

**Acceptance Criteria:**
- [ ] Pricing page: cards stack vertically on mobile, comparison table scrolls horizontally or collapses
- [ ] Contact page: form fields stack vertically on small screens (already uses `sm:grid-cols-2`)
- [ ] Sign-in page: plan selection cards stack on mobile (already uses `md:grid-cols-3`)
- [ ] Header mobile menu (`HeaderMobile.tsx`) opens and closes correctly, contains all navigation links
- [ ] Footer columns stack on mobile (partially handled, verify)
- [ ] No horizontal overflow on any page at 375px viewport width
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-013: Core Web Vitals Optimization

**Description:** As a marketing team member, I want the site to score 90+ on Lighthouse performance so that page load is fast and Google rankings are not penalized.

**Acceptance Criteria:**
- [ ] Audit current `force-dynamic` exports on every page -- remove where not needed (homepage, pricing, story, signin are all static-compatible)
- [ ] Remove `export const dynamic = 'force-dynamic'` from pages that do not need server-side data fetching (pricing, story, signin are all client-side state only)
- [ ] Verify fonts use `display: 'swap'` (already configured) and `next/font` preloading
- [ ] Ensure images use `next/image` with proper `width`, `height`, and `priority` for above-the-fold images
- [ ] Check that the Emotion CSS-in-JS setup (`emotion-root-style-registry.tsx`) does not cause layout shift (CLS)
- [ ] Add `loading="lazy"` to below-the-fold images if any
- [ ] Typecheck passes
- [ ] Verify changes work in browser

### US-014: CSP Header Update for Analytics and Stripe

**Description:** As a developer, I want the Content-Security-Policy header in `next.config.ts` to allow Stripe checkout and analytics scripts so that they are not blocked in production.

**Acceptance Criteria:**
- [ ] Update CSP `script-src` to include `https://js.stripe.com` and `https://www.googletagmanager.com`
- [ ] Update CSP `connect-src` to include `https://api.stripe.com` and `https://www.google-analytics.com`
- [ ] Update CSP `frame-src` to include `https://js.stripe.com` and `https://hooks.stripe.com` (for 3D Secure)
- [ ] Verify the existing `'unsafe-inline' 'unsafe-eval'` in script-src is acceptable or tighten if possible using nonces
- [ ] Typecheck passes
- [ ] Verify changes work in browser

## Non-Goals

- Building the actual homepage (served by Framer via Cloudflare traffic splitting, as stated in `page.tsx`)
- Implementing a full blog with MDX content (the engine exists via `get-posts.tsx` and `next-mdx-remote`, but content creation is out of scope)
- Writing legally binding privacy policy or terms of service (placeholder text only; legal review is separate)
- Adding authentication logic to the website itself (auth lives in flexdesk-server and the main app)
- Implementing a CMS for marketing content (Keystatic is configured but collections are disabled)
- Redesigning the visual UI or brand identity
- Adding i18n/multi-language support
- Implementing A/B testing infrastructure

## Technical Considerations

- **Deployment:** Vercel via `vercel.json`. Build command runs through Nx: `pnpm nx run flexdesk-website:build`. Output directory is `.next`. Standalone output mode is enabled in `next.config.ts`.
- **Styling architecture:** The site uses both Tailwind CSS and Emotion CSS-in-JS. New pages (legal, 404) should use Tailwind for consistency with the pricing and contact pages. Emotion is used in the header and footer (legacy pattern).
- **Framer split:** The homepage at `(public)/page.tsx` is a stub. The real homepage is served by Framer via Cloudflare DNS. Do not invest in this page.
- **Stripe integration:** `lib/api.ts` calls `POST /api/v1/subscriptions/create-checkout-session` on the flexdesk-server backend. The `NEXT_PUBLIC_API_URL` env var must be set. `lib/stripe.ts` uses `@stripe/stripe-js` client-side. Stripe publishable key comes from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **Contact form:** Currently uses `setTimeout` to simulate submission in `ContactSection.tsx`. The real fix is a Next.js API route that forwards to Formspree or SendGrid. No backend endpoint exists on flexdesk-server for generic contact forms.
- **Security headers:** `next.config.ts` already sets CSP, X-Content-Type-Options, X-Frame-Options, and Referrer-Policy. The CSP needs updating for Stripe and analytics domains.
- **Middleware:** `src/middleware.ts` adds CORS headers only for `/api/*` routes. This is correct for API routes but should not affect page routes.
- **Fonts:** Gabarito (headings) and Inter (body) loaded via `next/font/google` with `display: 'swap'`. Font variables are applied to `<html>`.
- **force-dynamic:** Every page currently exports `force-dynamic`, which disables static generation. Most pages (pricing, story, signin) are purely client-side and should be statically generated for better performance.
- **Public assets:** Only `images/core/logo.svg`, `.well-known/security.txt`, and `.well-known/microsoft-identity-association.json` exist. Favicon, OG images, and webmanifest are all missing.
