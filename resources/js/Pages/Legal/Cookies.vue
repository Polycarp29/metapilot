<template>
  <LegalLayout>
    <h1>Cookie Policy</h1>
    <p class="text-slate-400 text-sm mb-12">Last Updated: February 20, 2026</p>

    <section>
      <h2>1. What are Cookies</h2>
      <p>
        Cookies are small text files stored on your device to help websites function better and provide a personalized experience.
      </p>
    </section>

    <section>
      <h2>2. How We Use Cookies</h2>
      <p>
        MetaPilot uses cookies for the following purposes:
      </p>
      <ul>
        <li><strong>Authentication</strong>: To keep you logged in to your account.</li>
        <li><strong>Preferences</strong>: To remember settings like your active organization.</li>
        <li><strong>Security</strong>: To protect against CSRF attacks and maintain session integrity.</li>
      </ul>
    </section>

    <section>
      <h2>3. Third-Party Cookies</h2>
      <p>
        When you connect Google services, Google may set cookies to handle authentication and API requests. We do not control these cookies.
      </p>
    </section>

    <section>
      <h2>4. Managing Cookies</h2>
      <p>
        Most browsers allow you to refuse or delete cookies through their settings. Note that disabling essential cookies may break core functionality of the MetaPilot platform.
      </p>
    </section>
  </LegalLayout>
</template>

<script setup>
import LegalLayout from '../../Layouts/LegalLayout.vue'
</script>
