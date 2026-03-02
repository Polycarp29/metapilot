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

    const payload = {
        token: siteToken,
        campaign_id: campaignId,
        page_url: window.location.href,
        gclid: getUrlParam('gclid'),
        utm_source: getUrlParam('utm_source'),
        utm_medium: getUrlParam('utm_medium'),
        utm_campaign: getUrlParam('utm_campaign')
    };

    // Only fire if there is ad-related data or it's a critical page hit
    // You can adjust this logic based on needs (e.g., always fire, or only fire on ?gclid=)
    const hasAdData = payload.gclid || payload.utm_source || payload.utm_campaign;

    if (hasAdData) {
        const endpoint = script.src.split('/cdn/')[0] + '/cdn/ad-hit';

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(endpoint, blob);
        } else {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'no-cors',
                body: JSON.stringify(payload)
            }).catch(() => { });
        }
    }
})();
