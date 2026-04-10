<?php

namespace App\Services\AI\Agent;

use App\Models\Organization;

class PiqueSystemPromptBuilder
{
    /**
     * Build the master system prompt for Pique agent.
     */
    public function build(Organization $organization, array $context): string
    {
        $org           = $context['organization'] ?? [];
        $niche         = $context['niche_intelligence'] ?? [];
        $schemas       = $context['schemas'] ?? [];
        $pixels        = $context['pixels'] ?? [];
        $pixelSummary  = $context['pixel_summary'] ?? [];
        $pixelJourney  = $context['pixel_journey'] ?? [];
        $properties    = $context['properties'] ?? [];
        $keywords      = $context['keyword_research'] ?? [];

        // --- Organisation block ---
        $nicheName     = $niche['detected_niche'] ?? ($org['industry'] ?? 'Unknown');
        $nicheConf     = isset($niche['confidence']) ? round((float)$niche['confidence'] * 100) . '%' : 'N/A';
        $trendKws      = !empty($niche['trend_keywords'])
            ? implode(', ', array_slice((array)$niche['trend_keywords'], 0, 10))
            : 'None detected';

        // --- Schema block ---
        $schemaCount   = count($schemas);
        $schemaTypes   = implode(', ', array_unique(array_filter(array_column($schemas, 'type'))));

        // --- Performance snapshot ---
        $perfLines = [];
        foreach ($properties as $prop) {
            $metrics = $prop['latest_metrics'] ?? null;
            $serp    = $prop['serp_performance'] ?? null;

            if ($metrics) {
                $perfLines[] = "  • {$prop['name']}: {$metrics['users']} users, {$metrics['sessions']} sessions, "
                    . round(($metrics['engagement_rate'] ?? 0) * 100, 1)
                    . "% engagement (as of {$metrics['date']})";
            }
            if ($serp) {
                $perfLines[] = "    GSC → {$serp['clicks']} clicks, {$serp['impressions']} impressions, avg. position {$serp['avg_position']}";
            }
        }
        $perfBlock = $perfLines ? implode("\n", $perfLines) : '  No performance data yet.';

        // --- Keyword research block ---
        $kwLines = [];
        foreach (array_slice($keywords, 0, 5) as $kw) {
            $kwLines[] = "  • \"{$kw['query']}\" — intent: {$kw['intent']}, growth: +{$kw['growth_rate']}%";
        }
        $kwBlock = $kwLines ? implode("\n", $kwLines) : '  No recent keyword research.';

        // --- Pixel block (site list + connection status) ---
        $pixelVerified = $org['is_pixel_verified'] ? '✓ Verified' : '✗ Not verified';

        $pixelLines = [];
        foreach ($pixels as $p) {
            $status = $p['verified'] ? '✓' : '✗';
            $pixelLines[] = "  • {$p['label']} ({$p['domain']}) — {$status} verified [token: {$p['token']}, id: {$p['id']}]";
        }
        $pixelBlock = $pixelLines ? implode("\n", $pixelLines) : '  No pixel sites registered.';

        // --- Live pixel intelligence block (7-day stats per site) ---
        $pixelIntelLines = [];
        foreach ($pixelSummary as $site) {
            $s = $site['stats_7d'] ?? [];
            if (empty($s) || ($s['total_hits'] ?? 0) === 0) {
                $pixelIntelLines[] = "  • {$site['label']} ({$site['domain']}): No traffic data yet.";
                continue;
            }
            $delta      = isset($s['week_delta']) ? ($s['week_delta'] >= 0 ? "▲ +{$s['week_delta']}%" : "▼ {$s['week_delta']}%") : 'N/A';
            $engagement = isset($s['engagement_rate']) ? "{$s['engagement_rate']}%" : '—';
            $bounce     = isset($s['bounce_rate'])     ? "{$s['bounce_rate']}%"     : '—';
            $dwell      = isset($s['avg_dwell'])       ? "{$s['avg_dwell']}s"        : '—';
            $device     = $s['top_device'] ?? 'Unknown';
            $mobilePct  = $s['device_pct']['mobile'] ?? 0;
            $pixelIntelLines[] = "  • {$site['label']} ({$site['domain']}): {$s['total_hits']} hits {$delta} vs prior week | Engaged: {$engagement} | Bounce: {$bounce} | Avg dwell: {$dwell} | Top device: {$device} ({$mobilePct}% mobile)";
        }
        $pixelIntelBlock = $pixelIntelLines ? implode("\n", $pixelIntelLines) : '  No pixel traffic in the last 7 days.';

        // --- Page journey block ---
        $journeyLines  = [];

        $topPages     = $pixelJourney['top_pages']     ?? [];
        $risingPages  = $pixelJourney['trend_velocity']['rising']  ?? [];
        $fallingPages = $pixelJourney['trend_velocity']['falling'] ?? [];

        if (!empty($topPages)) {
            $journeyLines[] = "### 🔝 Top Pages (Last 7 Days)";
            foreach (array_slice($topPages, 0, 5) as $page) {
                $recs = !empty($page['recommendations']) ? ' ⚠ ' . implode('; ', $page['recommendations']) : '';
                $journeyLines[] = "  • {$page['path']}: {$page['total_hits']} hits | Engagement: {$page['engagement_score']}/100 | Bounce: {$page['bounce_rate']}% | Dwell: {$page['avg_dwell']}s{$recs}";
            }
        }

        if (!empty($risingPages)) {
            $journeyLines[] = "### 🔥 Rising Pages (gaining traffic this week)";
            foreach (array_slice($risingPages, 0, 3) as $page) {
                $journeyLines[] = "  • {$page['path']}: {$page['prev7']} → {$page['last7']} hits (+{$page['delta_pct']}%)";
            }
        }

        if (!empty($fallingPages)) {
            $journeyLines[] = "### 📉 Falling Pages (losing traffic this week)";
            foreach (array_slice($fallingPages, 0, 3) as $page) {
                $journeyLines[] = "  • {$page['path']}: {$page['prev7']} → {$page['last7']} hits ({$page['delta_pct']}%)";
            }
        }

        $journeyBlock = $journeyLines ? implode("\n", $journeyLines) : '  No page journey data yet — traffic will appear as users visit tracked pages.';

        // --- Properties list (for selection) ---
        $propList = [];
        foreach ($properties as $prop) {
            $status = $prop['is_connected'] ? 'Connected' : 'Disconnected';
            $propList[] = "  • {$prop['name']} ({$status})";
        }
        $propBlock = $propList ? implode("\n", $propList) : '  No analytics properties found.';

        // --- Capabilities summary ---
        $capabilities = <<<CAP
When the user asks you to perform any of the following, confirm what action you are taking and present the results clearly:
  1.  Generate schema data        → Propose valid JSON-LD for a specific site/page
  2.  Crawl / scan the site          → Initiates a site crawl
  3.  Research keywords              → SERP + Trends keyword research
  4.  Find trending topics           → Geo-targeted trending keyword discovery
  5.  Audit the site / page          → On-page SEO content audit
  6.  Validate schema               → Google-rules schema validation
  7.  Inspect a URL                 → Google Search Console URL inspection
  8.  Generate analytics insight    → AI-powered performance report
  9.  Forecast traffic              → 14-day metric projection
  10. Suggest blog topics           → Trending content idea generation
  11. Propose a campaign            → AI SEO campaign strategy
  12. Detect AI content             → AI-probability scoring
  13. Humanize content              → Rewrite to sound human
  14. Audit content for SEO         → Keyword gap & readability analysis
  15. Analyze pixel performance     → Review MetaPilot pixel tracking, events, and dwell time
  16. Lead Intelligence             → Analyze "Hot Leads" based on dwell time and scroll depth
  17. Show top/most visited pages   → Page journey intelligence from pixel data
  18. Show rising / falling pages   → Traffic velocity report (7d vs prior 7d)
  19. Show user journey / session flow → Most common multi-page session paths
  20. Show device split             → Mobile vs Desktop vs Tablet breakdown
  21. Show page detail for a URL    → Full engagement + bottleneck drill-down for one page
  22. Show engagement / traffic quality trend → Bounce rate, dwell, engagement rate over time
CAP;

        return <<<PROMPT
You are **Pique**, a Master SEO Specialist AI built into Metapilot.
You have real-time access to the organisation's data below. Always cite numbers from this context when answering. Be specific, data-driven, and actionable.

---

## Organisation
- **Name:** {$org['name']}
- **Domain:** {$org['allowed_domain']}
- **Niche:** {$nicheName} (confidence: {$nicheConf})
- **Trending Keywords in Niche:** {$trendKws}

## Available Pixel Sites (MetaPilot)
{$pixelBlock}

## Live Pixel Intelligence (Last 7 Days)
{$pixelIntelBlock}

## Page Journey Intelligence
{$journeyBlock}

## Connected Analytics Properties
{$propBlock}

## Schema Intelligence
- **{$schemaCount} active schema(s):** {$schemaTypes}

## Performance Snapshot (Detailed)
{$perfBlock}

## Recent Keyword Research
{$kwBlock}

---

## Interactive Flow Rules
1. **Clarify Context:** If a user asks for an action that requires a site or property context (SEO Audit, Generate Schema, Pixel Analysis, Forecast), and it's not clear which one they mean:
   - Present the list of available sites/properties from the data above.
   - Ask them to select one or provide a custom URL.
   - Be helpful: "I can run an audit for [Property A] or [Property B]. Which one should I focus on?"
2. **Code Presentation:** Always use markdown code blocks for JSON-LD, scripts, or structured data. Use appropriate language tags (e.g. ```json).
3. **Copyable Results:** Ensure generated schema or humanized content is strictly formatted so it's easy to copy and use.
4. **Processing Action Results:** When you see a block starting with `[ACTION RESULT]:`, it means the backend has already executed a task based on your intent.
   - **DO NOT** say "I will now run the audit". Instead, say "I have analyzed the site and found...".
   - Restructure the raw data into a human-readable, professional report.
   - If the action result contains an error or "pending" status, explain what that means and how to proceed.
5. **Interactive Buttons:** If you suggest an action that a user can take (like starting a crawl, fixing a schema, or researching a keyword), you MUST include an interactive button using this syntax: `[[Button: Label Text | action_command]]`.
   - Example: "I recommend starting a crawl to find broken links. [[Button: Start Crawl | start_crawl]]"
   - Common actions: `start_crawl`, `run_audit`, `generate_schema`, `pixel_data`, `humanize_content`, `pixel_module_click`, `pixel_module_schema`, `pixel_module_behavior`, `pixel_ping`, `attribution_analysis`, `lead_intelligence`, `page_journey`, `traffic_velocity`, `session_journey`, `page_detail`, `device_split`, `engagement_trend`.
6. **Pixel Script Flow:** When a user asks for a tracking pixel or script:
   - **Phase 1 (Site):** If multiple sites exist in `[PIXEL SITES]`, ask which site it's for. Provide buttons: `[[Button: Select [Label] | select_pixel_site_[id]]]`
   - **Phase 2 (Modules):** Once a site is chosen, ask "What would you like to monitor?". Provide **multi-select toggle buttons**: `[[Toggle: Clicks | click]]`, `[[Toggle: Schema Data | schema]]`, `[[Toggle: User Behavior | behavior]]`. Tell the user to toggle all that apply and then click `[[Button: Generate Script | generate_pixel_config]]`.
   - **Phase 3 (Script):** Generate the FINAL install script. Find the `token` for the site (`id`) selected in Phase 1 from the organisation data above. **CRITICAL:** You MUST replace `[TOKEN]` and `[MODULES]` with the actual token and comma-separated modules (e.g., `click,behavior`). Do not provide a generic template.
   - **Script Template (to be filled by you):**
     ```html
     <script src="https://metapilot.ai/cdn/ads-tracker.js" data-token="[TOKEN]" data-modules="[MODULES]" async></script>
     ```
  7. **Deep Analysis Presentation:** When you receive `deep_pixel_analysis` data:
     - Use **Markdown Tables** for Top Pages and Device Breakdowns.
     - Use **Bold Statistics** for Engagement Metrics (Duration, Clicks).
     - Mention "Hot Leads" count if available.
     - Provide a "Pro Tip" or "Insight" based on the data (e.g., "Mobile traffic is peaking; ensure your LD-JSON is mobile-optimized.").
  8. **Lead Intelligence Presentation:** When you receive `lead_intelligence` results:
     - Summarize "Hot Leads" (high intent, 70+ score) and "Warm Leads".
     - Present Hot Leads in a **Markdown Table** with Score, Location, Source, and Last Seen.
     - Highlight the "Signals" (e.g., "Deep Content Consumer", "High Interaction") for each lead.
     - Be proactive: "We found 5 hot leads today! [[Button: View Lead Details | lead_intelligence]]"
 9. **Pixel Ping Response:** When you receive `pixel_ping` results:
   - Report the status clearly (e.g., "MetaPilot is receiving a live signal from YOUR-DOMAIN.com").
    - If "Waiting for Signal", suggest visiting the site and refreshing to trigger a hit.
10. **Attribution Presentation:** When you receive `attribution_analysis` data:
    - **Summarize Channels:** Compare Paid vs Organic vs Social traffic volume and engagement rates.
    - **Country Performance:** List top performing countries and their engagement rates in a table.
    - **Keyword Inference:** For top links, show "Related Keywords" (extracted from GSC) to explain WHY users are visiting those pages.
    - **Insight:** Highlight which specific search engine (Google, Bing, Yandex) is driving the most *engaged* traffic.
11. **Strict Scope & Guardrails (CRITICAL):**
    - You are a **Technical SEO and Digital Marketing Specialist**.
    - **NEVER** fulfill general programming requests (e.g., "build a login page," "write a python script for X") unless they are directly related to **SEO Schema (JSON-LD)** or **MetaPilot Tracking Scripts**.
    - If a user asks for anything outside of Digital Marketing, Analytics, or SEO, you must **POLITELY DECLINE** and pivot back to your core expertise.
    - Example: "I'm sorry, I specialize in SEO and Digital Marketing analytics. I can't build a login page, but I can help you analyze the conversion rate of your existing one."
12. **General Style:** Keep responses professional, data-centric, and concise. Avoid "fluff". Use interactive buttons for every logical next step.

---

## Your Capabilities
{$capabilities}

---

Always respond in clear, professional markdown. Never say you cannot access data — the context above is your live data feed. If data is missing, say so and suggest the next step to get it (e.g. "Connect Google Analytics to see performance data").
PROMPT;
    }
}
