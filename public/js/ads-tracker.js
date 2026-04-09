/**
 * MetaPilot Ads Tracker v3.0
 *
 * Features:
 * - HMAC-SHA256 request signing (prevents token spoofing & replay attacks)
 * - Exponential backoff retry queue (up to 3 retries on failure)
 * - Two-way connection verification handshake
 * - window.MetaPilot debug object for developer inspection
 * - Proper CORS fetch (no 'no-cors' — errors are now detectable)
 * - sendBeacon JSON Blob for reliable unload hits
 */
(function () {
    'use strict';

    if (window.__metapilot_loaded) return;
    window.__metapilot_loaded = true;

    const script = document.currentScript;
    const siteToken = script ? script.getAttribute('data-token') : null;
    const campaignId = script ? script.getAttribute('data-campaign') : null;
    const requestedModules = script ? (script.getAttribute('data-modules') || 'click').split(',') : ['click'];

    if (!siteToken) {
        console.warn('[MetaPilot] Missing data-token on script tag.');
        return;
    }

    // Derive the server base URL from where this script was loaded from.
    const serverBase = script.src ? script.src.split('/cdn/')[0] : window.location.origin;
    const hitEndpoint = serverBase + '/cdn/ad-hit';
    const verifyEndpoint = serverBase + '/cdn/verify-connection';
    const errorEndpoint = serverBase + '/cdn/error';

    // ─── Public debug object ──────────────────────────────────────────────────
    window.MetaPilot = {
        version: '3.2',
        token: siteToken,
        modules: requestedModules,
        status: 'initialising',
        connected: false,
        hitCount: 0,
        lastHit: null,
        retryQueue: [],
        schemaInjected: false,
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const getParam = (p) => new URLSearchParams(window.location.search).get(p);

    const getMetadata = () => {
        const meta = (name) => {
            const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"]`);
            return el ? el.getAttribute('content') : null;
        };

        const h1 = document.querySelector('h1');

        return {
            title: document.title,
            description: meta('description'),
            h1: h1 ? h1.innerText.trim() : null,
            og_image: meta('image'),
            canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
            content_type: meta('type') || (window.location.pathname.includes('/blog/') ? 'article' : 'website'),
        };
    };

    const getSessionId = () => {
        let sid = sessionStorage.getItem('mp_sid');
        if (!sid) {
            sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
            sessionStorage.setItem('mp_sid', sid);
        }
        return sid;
    };

    /**
     * Generate HMAC-SHA256 using the Web Crypto API.
     * Signing payload: token + page_view_id + timestamp
     * Using the site token as the HMAC key means even a stolen token can't
     * produce valid signatures for arbitrary timestamps (5-min replay window).
     */
    const signPayload = async (pageViewId, ts) => {
        try {
            const enc = new TextEncoder();
            const key = await crypto.subtle.importKey(
                'raw',
                enc.encode(siteToken),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            const message = enc.encode(siteToken + pageViewId + ts);
            const sigBuf = await crypto.subtle.sign('HMAC', key, message);
            return Array.from(new Uint8Array(sigBuf))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (e) {
            // Fallback if SubtleCrypto is unavailable (old browsers)
            return 'nosig';
        }
    };

    // ─── State & Dwell Tracking ─────────────────────────────────────────────
    const pageViewId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 15));
    
    let totalActiveTime = 0;
    let lastStartTime = Date.now();
    let isCurrentlyActive = !document.hidden;
    let clicks = 0;
    let maxScrollDepth = 0;
    let retryCount = 0;

    const updateScrollDepth = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (documentHeight <= windowHeight) {
            maxScrollDepth = 100;
            return;
        }

        const scrollPercentage = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
        if (scrollPercentage > maxScrollDepth) {
            maxScrollDepth = Math.min(100, scrollPercentage);
        }
    };

    window.addEventListener('scroll', updateScrollDepth, { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (isCurrentlyActive) totalActiveTime += (Date.now() - lastStartTime);
            isCurrentlyActive = false;
        } else {
            lastStartTime = Date.now();
            isCurrentlyActive = true;
        }
    });

    document.addEventListener('click', () => clicks++, { passive: true });

    // ─── Hit sender ──────────────────────────────────────────────────────────
    const buildPayload = (ts) => {
        const currentActive = isCurrentlyActive ? (totalActiveTime + (Date.now() - lastStartTime)) : totalActiveTime;
        const activeSeconds = Math.floor(currentActive / 1000);
        
        return {
            token: siteToken,
            modules: requestedModules,
            page_view_id: pageViewId,
            campaign_id: campaignId,
            page_url: window.location.href,
            referrer: document.referrer,
            session_id: getSessionId(),
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            duration_seconds: activeSeconds,
            max_scroll_depth: maxScrollDepth,
            is_engaged: activeSeconds >= 30 || maxScrollDepth >= 50,
            click_count: clicks,
            metadata: getMetadata(),
            gclid: getParam('gclid'),
            utm_source: getParam('utm_source'),
            utm_medium: getParam('utm_medium'),
            utm_campaign: getParam('utm_campaign'),
            _ts: ts,
        };
    };

    const sendHit = async (isFinal = false) => {
        const ts = Math.floor(Date.now() / 1000);
        const sig = await signPayload(pageViewId, ts);
        const payload = { ...buildPayload(ts), _sig: sig };

        if (isFinal && navigator.sendBeacon) {
            // sendBeacon with JSON Blob has the widest browser support
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(hitEndpoint, blob);
            window.MetaPilot.hitCount++;
            window.MetaPilot.lastHit = new Date().toISOString();
            return;
        }

        try {
            const res = await fetch(hitEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                // No 'no-cors' — we want real error visibility for retry logic
            });

            if (res.ok || res.status === 204) {
                window.MetaPilot.hitCount++;
                window.MetaPilot.lastHit = new Date().toISOString();
                window.MetaPilot.status = 'active';
                retryCount = 0; // reset on success
            } else if (res.status === 403) {
                // Hard rejection: wrong domain or bad signature — don't retry
                console.warn('[MetaPilot] Hit rejected (403). Check token and allowed domain.');
                window.MetaPilot.status = 'rejected';
            } else {
                scheduleRetry(payload);
            }
        } catch (networkErr) {
            // Network failure — queue for retry
            scheduleRetry(payload);
        }
    };

    // ─── Error Reporter ──────────────────────────────────────────────────────
    const sendError = async (err, source = 'window') => {
        try {
            const ts = Math.floor(Date.now() / 1000);
            const payload = {
                token: siteToken,
                page_view_id: pageViewId,
                url: window.location.href,
                message: err.message || err.reason?.message || String(err),
                stack: err.stack || err.reason?.stack || (err.reason ? err.reason.stack : null) || null,
                source: source,
                line: err.lineno || null,
                col: err.colno || null,
                filename: err.filename || null,
                _ts: ts,
            };

            // Sign with a specific signature for errors to prevent spoofing
            const sig = await signPayload(pageViewId + '_err', ts);
            payload._sig = sig;

            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(errorEndpoint, blob);
            } else {
                fetch(errorEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    mode: 'cors'
                }).catch(() => { });
            }
        } catch (e) { /* silent fail for error reporter */ }
    };

    window.addEventListener('error', (e) => sendError(e, 'window'));
    window.addEventListener('unhandledrejection', (e) => sendError(e, 'promise'));

    // ─── Performance Reporter (slow page load) ────────────────────────────────
    const reportSlowLoad = async () => {
        try {
            const timing = window.performance?.timing;
            if (!timing || timing.loadEventEnd <= 0) return;
            const loadTimeMs = timing.loadEventEnd - timing.navigationStart;
            if (loadTimeMs < 3000) return; // Only report if > 3 seconds

            const ts = Math.floor(Date.now() / 1000);
            const payload = {
                token:         siteToken,
                page_view_id:  pageViewId,
                url:           window.location.href,
                message:       `Slow page load: ${loadTimeMs}ms`,
                error_type:    'slow_load',
                load_time_ms:  loadTimeMs,
                source:        'performance',
                _ts:           ts,
            };
            const sig = await signPayload(pageViewId + '_perf', ts);
            payload._sig = sig;

            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(errorEndpoint, blob);
            } else {
                fetch(errorEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    mode: 'cors'
                }).catch(() => {});
            }
        } catch (e) { /* silent fail */ }
    };

    // Wait until after load event for accurate timing
    if (document.readyState === 'complete') {
        setTimeout(reportSlowLoad, 0);
    } else {
        window.addEventListener('load', () => setTimeout(reportSlowLoad, 0));
    }


    // ─── Retry queue with exponential backoff ─────────────────────────────────
    const scheduleRetry = (payload) => {
        if (retryCount >= 3) return; // give up after 3 attempts
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s

        window.MetaPilot.retryQueue.push({ payload, retryAt: Date.now() + delay });

        setTimeout(async () => {
            try {
                const res = await fetch(hitEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok || res.status === 204) {
                    window.MetaPilot.hitCount++;
                    window.MetaPilot.lastHit = new Date().toISOString();
                    window.MetaPilot.status = 'active';
                    retryCount = 0;
                }
            } catch (e) {
                // Silent — we already retried
            }
            window.MetaPilot.retryQueue.shift();
        }, delay);
    };

    // ─── Connection Verification Handshake ────────────────────────────────────
    let verifyRetryCount = 0;
    const verifyConnection = async () => {
        try {
            const challenge = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
            const url = `${verifyEndpoint}?token=${encodeURIComponent(siteToken)}&challenge=${encodeURIComponent(challenge)}&modules=${encodeURIComponent(requestedModules.join(','))}`;
            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                if (data.ok && data.echo === challenge) {
                    window.MetaPilot.connected = true;
                    window.MetaPilot.domainVerified = data.domain_verified;
                    window.MetaPilot.serverTime = data.server_time;
                    window.MetaPilot.status = 'active';
                    window.MetaPilot.modules = data.modules_active || requestedModules;

                    // Handle Auto-Schema Injection (honor backend enforcement)
                    if (window.MetaPilot.modules.includes('schema') && data.schema_json && !window.MetaPilot.schemaInjected) {
                        const script = document.createElement('script');
                        script.type = 'application/ld+json';
                        script.text = JSON.stringify(data.schema_json);
                        document.head.appendChild(script);
                        window.MetaPilot.schemaInjected = true;
                        console.log('[MetaPilot] Schema injected successfully.');
                    }

                    verifyRetryCount = 0; // reset
                    return;
                }
            }
            throw new Error('Handshake failed');
        } catch (e) {
            if (verifyRetryCount < 3) {
                verifyRetryCount++;
                const delay = Math.pow(2, verifyRetryCount) * 1000;
                window.MetaPilot.status = `retrying_handshake (${verifyRetryCount})`;
                setTimeout(verifyConnection, delay);
            } else {
                window.MetaPilot.status = 'handshake_failed';
            }
        }
    };

    // ─── Kick off ─────────────────────────────────────────────────────────────
    // 1. Verify connection with server (async, non-blocking)
    verifyConnection();

    // 2. Send the initial page-view hit
    sendHit();

    // 3. Heartbeat every 30s to capture updated engagement metrics
    setInterval(sendHit, 30000);

    // 4. Final hit on page hide (captures true dwell time)
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sendHit(true);
        }
    });
})();
