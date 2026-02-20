<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('crawler/callback', [\App\Http\Controllers\Api\CrawlerWebhookController::class, 'handle'])->name('api.crawler.callback');

Route::prefix('v1')->name('api.v1.')->group(function () {
    // Schema Types
    Route::apiResource('schema-types', \App\Http\Controllers\Api\V1\SchemaTypeController::class);
    
    // Schemas
    Route::apiResource('schemas', \App\Http\Controllers\Api\V1\SchemaController::class);
    Route::get('schemas/{schema}/preview', [\App\Http\Controllers\Api\V1\SchemaController::class, 'preview']);
    Route::get('schemas/{schema}/export', [\App\Http\Controllers\Api\V1\SchemaController::class, 'export']);
    Route::get('schemas/{schema}/validate', [\App\Http\Controllers\Api\V1\SchemaController::class, 'validate']);
    Route::get('schemas/{schema}/test-google', [\App\Http\Controllers\Api\V1\SchemaController::class, 'testWithGoogle']);
    Route::get('schema-types/{schemaType}/required-fields', [\App\Http\Controllers\Api\V1\SchemaController::class, 'getRequiredFields']);
    
    // Schema Fields
    Route::apiResource('schemas.fields', \App\Http\Controllers\Api\V1\SchemaFieldController::class);
    Route::post('schemas/{schema}/fields/bulk', [\App\Http\Controllers\Api\V1\SchemaFieldController::class, 'bulkUpdate']);
    Route::post('schemas/{schema}/fields/reorder', [\App\Http\Controllers\Api\V1\SchemaFieldController::class, 'reorder']);
});
