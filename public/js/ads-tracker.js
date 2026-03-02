(function () {
    // MetaPilot Ads Tracker
    const script = document.currentScript;
    const siteToken = script ? script.getAttribute('data-token') : null;
    const campaignId = script ? script.getAttribute('data-campaign') : null;

    if (!siteToken) {
        console.warn('MetaPilot Ads Tracker: Missing data-token');
        return;
    }

    const getUrlParam = (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    };

    const getSessionId = () => {
        let sid = sessionStorage.getItem('mp_sid');
        if (!sid) {
            sid = Math.random().toString(36).substring(2, 11);
            sessionStorage.setItem('mp_sid', sid);
        }
        return sid;
    };

    const pageViewId = Math.random().toString(36).substring(2, 15);
    const startTime = Date.now();
    let clicks = 0;

    document.addEventListener('click', () => clicks++);

    const sendHit = (isFinal = false) => {
        const payload = {
            token: siteToken,
            page_view_id: pageViewId,
            campaign_id: campaignId,
            page_url: window.location.href,
            referrer: document.referrer,
            session_id: getSessionId(),
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            duration_seconds: Math.floor((Date.now() - startTime) / 1000),
            click_count: clicks,
            gclid: getUrlParam('gclid'),
            utm_source: getUrlParam('utm_source'),
            utm_medium: getUrlParam('utm_medium'),
            utm_campaign: getUrlParam('utm_campaign')
        };

        const endpoint = script.src.split('/cdn/')[0] + '/cdn/ad-hit';
        const params = new URLSearchParams(payload);

        if (isFinal && navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, params);
        } else {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                mode: 'no-cors',
                body: params.toString()
            }).catch(() => { });
        }
    };

    // Initial hit
    sendHit();

    // Heartbeat every 30s
    const heartbeat = setInterval(sendHit, 30000);

    // Final hit on unload
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sendHit(true);
        }
    });
})();
