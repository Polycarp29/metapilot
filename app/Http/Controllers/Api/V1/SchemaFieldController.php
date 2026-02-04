<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSchemaFieldRequest;
use Illuminate\Http\Request;

class SchemaFieldController extends Controller
{
    public function index(string $schemaId)
    {
        $schema = \App\Models\Schema::findOrFail($schemaId);
        
        return response()->json(
            $schema->fields()
                ->with('children')
                ->whereNull('parent_field_id')
                ->orderBy('sort_order')
                ->get()
        );
    }

    public function store(StoreSchemaFieldRequest $request, string $schemaId)
    {
        $schema = \App\Models\Schema::findOrFail($schemaId);
        
        $validated = $request->validated();
        $validated['schema_id'] = $schema->id;
        
        if (!isset($validated['sort_order'])) {
            $maxOrder = $schema->fields()
                ->where('parent_field_id', $validated['parent_field_id'] ?? null)
                ->max('sort_order') ?? -1;
            $validated['sort_order'] = $maxOrder + 1;
        }

        $field = \App\Models\SchemaField::create($validated);
        
        return response()->json($field->load('children'), 201);
    }

    public function bulkUpdate(Request $request, string $schemaId)
    {
        $request->validate([
            'fields' => 'required|array'
        ]);

        $schema = \App\Models\Schema::findOrFail($schemaId);
        
        // Transaction to ensure data integrity
        \Illuminate\Support\Facades\DB::transaction(function () use ($schema, $request) {
            // Delete existing fields (cascade will handle children)
            $schema->fields()->whereNull('parent_field_id')->delete();
            
            // Re-create fields recursively
            $this->createFields($schema->id, null, $request->fields);
        });

        return response()->json($schema->load('fields.children'));
    }

    private function createFields($schemaId, $parentId, array $fields)
    {
        foreach ($fields as $index => $fieldData) {
            $field = \App\Models\SchemaField::create([
                'schema_id' => $schemaId,
                'parent_field_id' => $parentId,
                'field_path' => $fieldData['field_path'],
                'field_type' => $fieldData['field_type'],
                'field_value' => $fieldData['field_value'] ?? null,
                'field_config' => $fieldData['field_config'] ?? null,
                'sort_order' => $index
            ]);

            // If it has children (nested object/array items)
            if (!empty($fieldData['children']) && is_array($fieldData['children'])) {
                $this->createFields($schemaId, $field->id, $fieldData['children']);
            }
        }
    }

    public function show(string $schemaId, string $fieldId)
    {
        $schema = \App\Models\Schema::findOrFail($schemaId);
        $field = $schema->fields()->with('children')->findOrFail($fieldId);
        
        return response()->json($field);
    }

    public function update(Request $request, string $schemaId, string $fieldId)
    {
        $schema = \App\Models\Schema::findOrFail($schemaId);
        $field = $schema->fields()->findOrFail($fieldId);
        
        $validated = $request->validate([
            'field_path' => 'string|max:255',
            'field_type' => 'in:string,number,boolean,array,object,url,date,datetime',
            'field_value' => 'nullable|string',
            'field_config' => 'nullable|array',
            'sort_order' => 'integer|min:0'
        ]);

        $field->update($validated);
        
        return response()->json($field->load('children'));
    }

    public function destroy(string $schemaId, string $fieldId)
    {
        $schema = \App\Models\Schema::findOrFail($schemaId);
        $field = $schema->fields()->findOrFail($fieldId);
        
        $field->delete(); // Cascade will delete children
        
        return response()->json(null, 204);
    }

    public function reorder(Request $request, string $schemaId)
    {
        $request->validate([
            'fields' => 'required|array',
            'fields.*.id' => 'required|exists:schema_fields,id',
            'fields.*.sort_order' => 'required|integer|min:0'
        ]);

        $schema = \App\Models\Schema::findOrFail($schemaId);
        
        \Illuminate\Support\Facades\DB::transaction(function () use ($schema, $request) {
            foreach ($request->fields as $fieldData) {
                $schema->fields()
                    ->where('id', $fieldData['id'])
                    ->update(['sort_order' => $fieldData['sort_order']]);
            }
        });

        return response()->json(['message' => 'Fields reordered successfully']);
    }
}
