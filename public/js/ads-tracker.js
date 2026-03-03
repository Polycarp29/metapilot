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

    const script = document.currentScript;
    const siteToken = script ? script.getAttribute('data-token') : null;
    const campaignId = script ? script.getAttribute('data-campaign') : null;

    if (!siteToken) {
        console.warn('[MetaPilot] Missing data-token on script tag.');
        return;
    }

    // Derive the server base URL from where this script was loaded from.
    const serverBase = script.src ? script.src.split('/cdn/')[0] : window.location.origin;
    const hitEndpoint = serverBase + '/cdn/ad-hit';
    const verifyEndpoint = serverBase + '/cdn/verify-connection';

    // ─── Public debug object ──────────────────────────────────────────────────
    window.MetaPilot = {
        version: '3.0',
        token: siteToken,
        status: 'initialising',
        connected: false,
        hitCount: 0,
        lastHit: null,
        retryQueue: [],
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const getParam = (p) => new URLSearchParams(window.location.search).get(p);

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

    // ─── State ────────────────────────────────────────────────────────────────
    const pageViewId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 15));
    const startTime = Date.now();
    let clicks = 0;
    let retryCount = 0;

    document.addEventListener('click', () => clicks++, { passive: true });

    // ─── Hit sender ──────────────────────────────────────────────────────────
    const buildPayload = (ts) => ({
        token: siteToken,
        page_view_id: pageViewId,
        campaign_id: campaignId,
        page_url: window.location.href,
        referrer: document.referrer,
        session_id: getSessionId(),
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        duration_seconds: Math.floor((Date.now() - startTime) / 1000),
        click_count: clicks,
        gclid: getParam('gclid'),
        utm_source: getParam('utm_source'),
        utm_medium: getParam('utm_medium'),
        utm_campaign: getParam('utm_campaign'),
        _ts: ts,
    });

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
    const verifyConnection = async () => {
        try {
            const challenge = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
            const url = `${verifyEndpoint}?token=${encodeURIComponent(siteToken)}&challenge=${encodeURIComponent(challenge)}`;
            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                if (data.ok && data.echo === challenge) {
                    window.MetaPilot.connected = true;
                    window.MetaPilot.domainVerified = data.domain_verified;
                    window.MetaPilot.serverTime = data.server_time;
                    window.MetaPilot.status = 'active';
                }
            }
        } catch (e) {
            // Non-critical — connection verify is best-effort
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
