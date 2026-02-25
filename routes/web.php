<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchemaController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\CrawlScheduleController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Legal Routes
Route::get('privacy', [\App\Http\Controllers\LegalController::class, 'privacy'])->name('privacy');
Route::get('terms', [\App\Http\Controllers\LegalController::class, 'terms'])->name('terms');
Route::get('cookies', [\App\Http\Controllers\LegalController::class, 'cookies'])->name('cookies');

// Landing Page
Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

// Guest routes (Login & Register)
Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
    Route::get('register', [RegisterController::class, 'create'])->name('register');
    Route::post('register', [RegisterController::class, 'store']);

    // Password Reset
    Route::get('forgot-password', [\App\Http\Controllers\Auth\ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [\App\Http\Controllers\Auth\ForgotPasswordController::class, 'store'])->name('password.email');
    Route::get('reset-password/{token}', [\App\Http\Controllers\Auth\ResetPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [\App\Http\Controllers\Auth\ResetPasswordController::class, 'store'])->name('password.store');
});

// Social Login (Accessible to guests for login and authenticated users for connection)
Route::get('auth/google', [\App\Http\Controllers\GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('auth/google/callback', [\App\Http\Controllers\GoogleAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Logout
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Schema Management
    Route::get('schemas/automated/create', [SchemaController::class, 'automatedCreate'])->name('schemas.automated.create');
    Route::post('schemas/automated', [SchemaController::class, 'automatedStore'])->name('schemas.automated.store');
    Route::post('api/analyze-url', [SchemaController::class, 'analyzeUrl'])->name('api.analyze-url');
    Route::resource('schemas', SchemaController::class);

    // Schema Actions (AJAX endpoints)
    Route::post('api/validate-schema', [SchemaController::class, 'validateJsonLd'])->name('api.validate-schema');
    Route::prefix('schemas/{schema}')->name('schemas.')->group(function () {
        Route::get('preview', [SchemaController::class, 'preview'])->name('preview');
        Route::get('export', [SchemaController::class, 'export'])->name('export');
        Route::get('validate', [SchemaController::class, 'validate'])->name('validate');
        Route::get('test-google', [SchemaController::class, 'testWithGoogle'])->name('test-google');
        Route::post('fields/bulk', [SchemaController::class, 'bulkUpdateFields'])->name('fields.bulk');
    });

    // Sitemap management
    Route::get('/sitemaps', [SitemapController::class, 'index'])->name('sitemaps.index');
    Route::post('/sitemaps', [SitemapController::class, 'store'])->name('sitemaps.store');
    Route::get('/sitemaps/{sitemap}', [SitemapController::class, 'show'])->name('sitemaps.show');
    Route::put('/sitemaps/{sitemap}', [SitemapController::class, 'update'])->name('sitemaps.update');
    Route::delete('/sitemaps/{sitemap}', [SitemapController::class, 'destroy'])->name('sitemaps.destroy');
    Route::post('/sitemaps/{sitemap}/import', [SitemapController::class, 'import'])->name('sitemaps.import');
    Route::post('/sitemaps/{sitemap}/generate', [SitemapController::class, 'generate'])->name('sitemaps.generate');
    Route::get('/sitemaps/{sitemap}/export', [SitemapController::class, 'exportReport'])->name('sitemaps.export');
    Route::get('/sitemaps/{sitemap}/export-pdf', [SitemapController::class, 'exportPdf'])->name('sitemaps.export-pdf');
    Route::post('/sitemaps/{sitemap}/crawl', [SitemapController::class, 'crawl'])->name('sitemaps.crawl');
    Route::post('/sitemaps/{sitemap}/recrawl-all', [SitemapController::class, 'recrawlAll'])->name('sitemaps.recrawl-all');
    Route::post('/sitemaps/{sitemap}/cancel-crawl', [SitemapController::class, 'cancelCrawl'])->name('sitemaps.cancel-crawl');
    Route::get('/sitemaps/jobs/{jobId}/progress', [SitemapController::class, 'getJobProgress'])->name('sitemaps.jobs.progress');
    Route::get('/sitemaps/{sitemap}/tree', [SitemapController::class, 'getTree'])->name('sitemaps.tree');
    Route::post('/sitemaps/links/{link}/ai-analyze', [SitemapController::class, 'aiAnalyze'])->name('sitemaps.links.ai-analyze');
    Route::post('/sitemaps/links/{link}/generate-json-ld', [SitemapController::class, 'generateJsonLd'])->name('sitemaps.links.generate-json-ld');
    Route::post('/sitemaps/links/{link}/recrawl', [SitemapController::class, 'recrawlLink'])->name('sitemaps.links.recrawl');
    Route::post('/sitemaps/links/{link}/manual-analyze', [SitemapController::class, 'manualAnalyzeLink'])->name('sitemaps.links.manual-analyze');
    Route::post('/sitemaps/{sitemap}/links', [SitemapController::class, 'addLink'])->name('sitemaps.links.store');
    Route::put('/sitemaps/links/{link}', [SitemapController::class, 'updateLink'])->name('sitemaps.links.update');
    Route::delete('/sitemaps/links/{link}', [SitemapController::class, 'destroyLink'])->name('sitemaps.links.destroy');

    // Crawl Schedules
    Route::get('/crawl-schedules', [CrawlScheduleController::class, 'index'])->name('crawl-schedules.index');
    Route::post('/crawl-schedules', [CrawlScheduleController::class, 'store'])->name('crawl-schedules.store');
    Route::put('/crawl-schedules/{schedule}', [CrawlScheduleController::class, 'update'])->name('crawl-schedules.update');
    Route::delete('/crawl-schedules/{schedule}', [CrawlScheduleController::class, 'destroy'])->name('crawl-schedules.destroy');

    // Schema Type Actions
    Route::get('schema-types/{schemaType}/required-fields', [SchemaController::class, 'getRequiredFields'])->name('schema-types.required-fields');

    // Team Management
    Route::resource('team-members', \App\Http\Controllers\TeamMemberController::class)->only(['index', 'update', 'destroy']);
    Route::post('team-invitations', [\App\Http\Controllers\OrganizationInvitationController::class, 'store'])->name('team-invitations.store');
    Route::delete('team-invitations/{invitation}', [\App\Http\Controllers\OrganizationInvitationController::class, 'destroy'])->name('team-invitations.destroy');

    // Profile
    Route::get('profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');

    // Organization Settings
    Route::get('settings', [\App\Http\Controllers\OrganizationSettingsController::class, 'index'])->name('organization.settings');
    Route::put('settings', [\App\Http\Controllers\OrganizationSettingsController::class, 'update'])->name('organization.update');

    // Password Update
    Route::put('password', [\App\Http\Controllers\PasswordController::class, 'update'])->name('password.update');

    // Analytics
    Route::get('analytics', [\App\Http\Controllers\AnalyticsDashboardController::class, 'index'])->name('analytics.index');
    Route::get('/analytics/overview/{property}', [\App\Http\Controllers\AnalyticsDashboardController::class, 'getOverview'])->name('api.analytics.overview');
    Route::get('/analytics/trends/{property}', [\App\Http\Controllers\AnalyticsDashboardController::class, 'getTrends'])->name('api.analytics.trends');
    Route::get('/analytics/insights/{property}', [\App\Http\Controllers\AnalyticsDashboardController::class, 'getInsights'])->name('api.analytics.insights');
    Route::get('/analytics/acquisition/{property}', [\App\Http\Controllers\AnalyticsDashboardController::class, 'getAcquisition'])->name('api.analytics.acquisition');
    Route::get('/analytics/forecast/{property}', [\App\Http\Controllers\AnalyticsDashboardController::class, 'getForecast'])->name('api.analytics.forecast');
    Route::get('/analytics/forecasts/{property}', [\App\Http\Controllers\AnalyticsDashboardController::class, 'getForecasts'])->name('analytics.forecasts');
    Route::get('/analytics/seo-intelligence/{property}', [\App\Http\Controllers\AnalyticsDashboardController::class, 'getSEOIntelligence'])->name('api.analytics.seo-intelligence');
    Route::post('/analytics/ad-insights/{property}', [\App\Http\Controllers\AnalyticsDashboardController::class, 'getAdInsights'])->name('api.analytics.ad-insights');
    Route::post('api/analytics/properties', [\App\Http\Controllers\AnalyticsPropertyController::class, 'store'])->name('analytics.properties.store');
    Route::delete('api/analytics/properties/{property}', [\App\Http\Controllers\AnalyticsPropertyController::class, 'destroy'])->name('analytics.properties.destroy');
    Route::put('api/analytics/properties/{property}', [\App\Http\Controllers\AnalyticsPropertyController::class, 'update'])->name('analytics.properties.update');


    // Campaigns
    Route::get('campaigns', [\App\Http\Controllers\SeoCampaignController::class, 'index'])->name('campaigns.index');
    Route::get('campaigns/create', [\App\Http\Controllers\SeoCampaignController::class, 'create'])->name('campaigns.create');
    Route::post('campaigns', [\App\Http\Controllers\SeoCampaignController::class, 'store'])->name('campaigns.store');
    Route::get('campaigns/{campaign}', [\App\Http\Controllers\SeoCampaignController::class, 'show'])->name('campaigns.show');
    Route::get('api/campaigns/propose/{property}', [\App\Http\Controllers\SeoCampaignController::class, 'propose'])->name('api.campaigns.propose');
    Route::get('api/campaigns/{campaign}/performance', [\App\Http\Controllers\SeoCampaignController::class, 'performance'])->name('api.campaigns.performance');

    // Keywords Hub
    Route::get('keywords/trending', [\App\Http\Controllers\KeywordController::class, 'trending'])->name('keywords.trending');
    Route::get('keywords/research', [\App\Http\Controllers\KeywordController::class, 'research'])->name('keywords.research');

    // Keyword Wallet API
    Route::prefix('api/keywords/wallet')->name('api.keywords.wallet.')->group(function () {
        Route::get('/', [\App\Http\Controllers\KeywordWalletController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\KeywordWalletController::class, 'store'])->name('store');
        Route::delete('/{savedKeyword}', [\App\Http\Controllers\KeywordWalletController::class, 'destroy'])->name('destroy');
    });

    // Trending Keywords for Campaigns
    Route::prefix('api/trending-keywords')->name('api.trending-keywords.')->group(function () {
        Route::get('/', [\App\Http\Controllers\CampaignKeywordController::class, 'index'])->name('index');
        Route::get('/suggestions', [\App\Http\Controllers\CampaignKeywordController::class, 'suggestions'])->name('suggestions');
        Route::post('/discover', [\App\Http\Controllers\CampaignKeywordController::class, 'discover'])->name('discover');
        Route::post('/campaigns/{campaign}/attach', [\App\Http\Controllers\CampaignKeywordController::class, 'attachKeywords'])->name('attach');
        Route::get('/campaigns/{campaign}/performance', [\App\Http\Controllers\CampaignKeywordController::class, 'performance'])->name('campaign-performance');
    });

    // Organization Selection
    Route::get('organizations/select', [\App\Http\Controllers\OrganizationController::class, 'select'])->name('organizations.select');
    Route::post('organizations/select', [\App\Http\Controllers\OrganizationController::class, 'store'])->name('organizations.select.store');
});

// Invitation Acceptance (Public/Guest or Auth)
Route::get('invitations/{token}', [\App\Http\Controllers\Auth\InvitationAcceptanceController::class, 'show'])->name('invitations.accept');
Route::post('invitations/{token}', [\App\Http\Controllers\Auth\InvitationAcceptanceController::class, 'store']);

// Email Verification Routes
Route::middleware('auth')->group(function () {
    Route::get('email/verify', function () {
        return Inertia::render('Auth/VerifyEmail');
    })->name('verification.notice');

    Route::get('email/verify/{id}/{hash}', function (\Illuminate\Foundation\Auth\EmailVerificationRequest $request) {
        $request->fulfill();
        return redirect('/dashboard');
    })->middleware('signed')->name('verification.verify');

    Route::post('email/verification-notification', function (\Illuminate\Http\Request $request) {
        $request->user()->sendEmailVerificationNotification();
        return back()->with('status', 'verification-link-sent');
    })->middleware('throttle:6,1')->name('verification.send');
});
