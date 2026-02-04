<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SchemaTypeController extends Controller
{
    public function index()
    {
        return \App\Models\SchemaType::where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type_key' => 'required|string|max:255|unique:schema_types,type_key',
            'description' => 'nullable|string',
            'required_fields' => 'nullable|array',
            'is_active' => 'boolean'
        ]);

        $schemaType = \App\Models\SchemaType::create($validated);
        
        return response()->json($schemaType, 201);
    }

    public function show(string $id)
    {
        return \App\Models\SchemaType::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $schemaType = \App\Models\SchemaType::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'string|max:255',
            'type_key' => 'string|max:255|unique:schema_types,type_key,' . $id,
            'description' => 'nullable|string',
            'required_fields' => 'nullable|array',
            'is_active' => 'boolean'
        ]);

        $schemaType->update($validated);
        
        return response()->json($schemaType);
    }

    public function destroy(string $id)
    {
        $schemaType = \App\Models\SchemaType::findOrFail($id);
        
        // Check if any schemas are using this type
        if ($schemaType->schemas()->exists()) {
            return response()->json([
                'message' => 'Cannot delete schema type that is being used by schemas.'
            ], 422);
        }
        
        $schemaType->delete();
        
        return response()->json(null, 204);
    }
}
