<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchemaController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

// Guest routes (Login & Register)
Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
    Route::get('register', [RegisterController::class, 'create'])->name('register');
    Route::post('register', [RegisterController::class, 'store']);
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    // Logout
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

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
    Route::get('/sitemaps/{sitemap}/generate', [SitemapController::class, 'generate'])->name('sitemaps.generate');
    Route::post('/sitemaps/{sitemap}/links', [SitemapController::class, 'addLink'])->name('sitemaps.links.store');
    Route::put('/sitemaps/links/{link}', [SitemapController::class, 'updateLink'])->name('sitemaps.links.update');
    Route::delete('/sitemaps/links/{link}', [SitemapController::class, 'destroyLink'])->name('sitemaps.links.destroy');

    // Schema Type Actions
    Route::get('schema-types/{schemaType}/required-fields', [SchemaController::class, 'getRequiredFields'])->name('schema-types.required-fields');

    // Team Management
    Route::resource('team-members', \App\Http\Controllers\TeamMemberController::class)->only(['index', 'update', 'destroy']);
    Route::post('team-invitations', [\App\Http\Controllers\OrganizationInvitationController::class, 'store'])->name('team-invitations.store');
    Route::delete('team-invitations/{invitation}', [\App\Http\Controllers\OrganizationInvitationController::class, 'destroy'])->name('team-invitations.destroy');

    // Profile
    Route::get('profile', [\App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('profile', [\App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
});
