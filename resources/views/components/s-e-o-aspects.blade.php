@php
    // Get title with fallback - prioritizes admin-configured SEO
    $seoService = app(\App\Services\SEOService::class);
    $pageTitle = $seoService->getTitle($title ?? 'VervioDesk');
@endphp

{{-- Basic Meta Tags --}}
<title>{{ $pageTitle }}</title>

@if ($seoService->getDescription())
    <meta name="description" content="{{ $seoService->getDescription() }}">
@endif

<meta name="robots" content="{{ $seoService->getRobotsMeta() }}">

{{-- Favicon --}}
@if ($seoService->getFaviconUrl())
    <link rel="icon" type="{{ $seoService->getFaviconType() }}" href="{{ $seoService->getFaviconUrl() }}">
@else
    {{-- Default favicon --}}
    <link rel="icon" type="image/x-icon" href="{{ asset('assets/Assets/favicon.png') }}">
@endif

{{-- Canonical URL --}}
@if ($seoService->getCanonicalUrl())
    <link rel="canonical" href="{{ $seoService->getCanonicalUrl() }}">
@endif

{{-- Open Graph Meta Tags --}}
@php $ogData = $seoService->getOpenGraphData(); @endphp
@if (!empty($ogData))
    @foreach ($ogData as $property => $content)
        @if ($content)
            <meta property="og:{{ $property }}" content="{{ $content }}">
        @endif
    @endforeach
@endif

{{-- Twitter Card Meta Tags --}}
@php $twitterData = $seoService->getTwitterCardData(); @endphp
@if (!empty($twitterData))
    @foreach ($twitterData as $name => $content)
        @if ($content)
            <meta name="twitter:{{ $name }}" content="{{ $content }}">
        @endif
    @endforeach
@endif

{{-- Structured Data (Schema.org) --}}
@if ($seoService->getStructuredDataJson())
    <script type="application/ld+json">
        {!! $seoService->getStructuredDataJson() !!}
    </script>
@endif

{{-- Additional SEO meta tags if available --}}
@if ($seoService->hasSeoData() && $seoService->getSeoAspects()->custom_head_tags)
    {!! $seoService->getSeoAspects()->custom_head_tags !!}
@endif

{{-- Google Tag Manager (Head) --}}
{!! $seoService->getGtmHead() !!}
