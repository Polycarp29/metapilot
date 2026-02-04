<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SchemaController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

// Dashboard
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// Schema Management
Route::get('schemas/automated/create', [SchemaController::class, 'automatedCreate'])->name('schemas.automated.create');
Route::post('schemas/automated', [SchemaController::class, 'automatedStore'])->name('schemas.automated.store');
Route::resource('schemas', SchemaController::class);

// Schema Actions (AJAX endpoints)
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
