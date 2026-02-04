<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSchemaRequest;
use App\Http\Requests\UpdateSchemaRequest;
use Illuminate\Http\Request;

class SchemaController extends Controller
{
    public function index()
    {
        return \App\Models\Schema::with('schemaType')->where('is_active', true)->paginate(20);
    }

    public function store(StoreSchemaRequest $request)
    {
        $schema = \App\Models\Schema::create($request->validated());
        
        return response()->json($schema->load('schemaType'), 201);
    }

    public function show(string $id)
    {
        return \App\Models\Schema::with(['schemaType', 'fields.children'])->findOrFail($id);
    }

    public function update(UpdateSchemaRequest $request, string $id)
    {
        $schema = \App\Models\Schema::findOrFail($id);
        $schema->update($request->validated());
        
        return response()->json($schema->load('schemaType'));
    }

    public function destroy(string $id)
    {
        \App\Models\Schema::findOrFail($id)->delete();
        return response()->json(null, 204);
    }

    public function preview($id)
    {
        $schema = \App\Models\Schema::with(['schemaType', 'fields.children'])->findOrFail($id);
        return response()->json($schema->toJsonLd());
    }

    public function export($id)
    {
        $schema = \App\Models\Schema::with(['schemaType', 'fields.children'])->findOrFail($id);
        $json = json_encode($schema->toJsonLd(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        
        return response($json)
            ->header('Content-Type', 'application/json')
            ->header('Content-Disposition', 'attachment; filename="schema-' . $id . '.json"');
    }

    public function validate($id)
    {
        $schema = \App\Models\Schema::with(['schemaType', 'fields.children'])->findOrFail($id);
        $validation = $schema->validateSchema();
        
        return response()->json([
            'schema_id' => $id,
            'is_valid' => $validation['isValid'],
            'errors' => $validation['errors'],
            'warnings' => $validation['warnings'],
            'json_ld' => $schema->toJsonLd()
        ]);
    }

    public function testWithGoogle($id)
    {
        $schema = \App\Models\Schema::with(['schemaType', 'fields.children'])->findOrFail($id);
        $jsonLd = $schema->toJsonLd();
        
        // Generate Google Rich Results Test URL
        $testUrl = 'https://search.google.com/test/rich-results';
        
        return response()->json([
            'schema_id' => $id,
            'json_ld' => $jsonLd,
            'test_url' => $testUrl,
            'validation' => $schema->validateSchema(),
            'google_test_instructions' => [
                '1. Copy the JSON-LD from the "json_ld" field',
                '2. Visit the Google Rich Results Test URL',
                '3. Paste the JSON-LD in the "Code Snippet" tab',
                '4. Click "TEST CODE" to validate'
            ]
        ]);
    }

    public function getRequiredFields($schemaTypeId)
    {
        $schemaType = \App\Models\SchemaType::findOrFail($schemaTypeId);
        $validationService = new \App\Services\SchemaValidationService();
        
        $rules = $validationService->getValidationRules($schemaType->name);
        
        return response()->json([
            'schema_type' => $schemaType->name,
            'validation_rules' => $rules,
            'has_rules' => !is_null($rules)
        ]);
    }
}
