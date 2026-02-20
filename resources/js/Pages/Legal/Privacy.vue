<template>
  <LegalLayout>
    <h1>Privacy Policy</h1>
    <p class="text-slate-400 text-sm mb-12">Last Updated: February 20, 2026</p>

    <section>
      <h2>1. Introduction</h2>
      <p>
        At MetaPilot, we value your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our AI-powered SEO management platform.
      </p>
    </section>

    <section>
      <h2>2. Data Collection & OAuth Usage</h2>
      <p>
        MetaPilot integrates with third-party services like Google to provide analytics and search console data. Specifically:
      </p>
      <ul>
        <li><strong>Google Analytics 4 (GA4)</strong>: We access your GA4 properties to aggregate traffic, conversion, and user behavior data.</li>
        <li><strong>Google Search Console (GSC)</strong>: We access your Search Console data to monitor search impressions, clicks, and page performance.</li>
      </ul>
      <p>
        We use the <code>https://www.googleapis.com/auth/analytics.readonly</code> and <code>https://www.googleapis.com/auth/webmasters.readonly</code> scopes to read this data. We do not modify or delete your external data.
      </p>
    </section>

    <section>
      <h2>3. How We Use Your Data</h2>
      <p>
        The data collected is used strictly for:
      </p>
      <ul>
        <li>Generating AI-driven SEO strategies and insights.</li>
        <li>Populating your MetaPilot dashboard with performance metrics.</li>
        <li>Generating structured data (JSON-LD) suggestions.</li>
      </ul>
      <p>MetaPilot does not sell your data to third parties.</p>
    </section>

    <section>
      <h2>4. Data Security</h2>
      <p>
        We implement industry-standard security measures, including encryption at rest and in transit (SSL/TLS), to protect your credentials and synchronized data.
      </p>
    </section>

    <section>
      <h2>5. Contact Us</h2>
      <p>
        If you have questions about this policy or your data, please contact our privacy team at <strong>privacy@metapilot.ai</strong>.
      </p>
    </section>
  </LegalLayout>
</template>

<script setup>
import LegalLayout from '../../Layouts/LegalLayout.vue'
</script>
