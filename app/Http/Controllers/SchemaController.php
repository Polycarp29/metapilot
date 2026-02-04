<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchemaRequest;
use App\Http\Requests\UpdateSchemaRequest;
use App\Models\Schema;
use App\Models\SchemaField;
use App\Models\SchemaType;
use App\Services\SchemaValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia; 


class SchemaController extends Controller
{
    public function index(Request $request)
    {
        $schemas = Schema::with('schemaType')
            ->when($request->search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhereHas('schemaType', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            })
            ->when($request->type, function ($query, $type) {
                return $query->whereHas('schemaType', function ($q) use ($type) {
                    $q->where('type_key', $type);
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $schemaTypes = SchemaType::where('is_active', true)->get(['id', 'name', 'type_key']);

        return Inertia::render('Schemas/Index', [
            'schemas' => $schemas,
            'schemaTypes' => $schemaTypes,
            'filters' => $request->only(['search', 'type'])
        ]);
    }

    public function create()
    {
        $schemaTypes = SchemaType::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'type_key', 'description', 'required_fields']);

        return Inertia::render('Schemas/Create', [
            'schemaTypes' => $schemaTypes
        ]);
    }

    public function store(StoreSchemaRequest $request)
    {
        $schema = Schema::create($request->validated());

        // Pre-populate fields from the schema type templates
        if ($schema->schemaType && !empty($schema->schemaType->required_fields)) {
            $defaultData = $schema->schemaType->required_fields;
            if (is_array($defaultData)) {
                // Remove standard @context if it's already handled by the generator
                unset($defaultData['@context']);
                
                $this->createFieldsFromData($schema->id, null, $defaultData);
            }
        }

        return redirect()->route('schemas.edit', $schema)
            ->with('message', 'Schema created successfully with default SEO fields!');
    }

    private function createFieldsFromData($schemaId, $parentId, array $data)
    {
        $index = 0;
        foreach ($data as $key => $value) {
            $type = 'text';
            $val = null;
            $children = [];

            if (is_array($value)) {
                // Check if it's a "list" of items (associative array check)
                if (array_keys($value) === range(0, count($value) - 1)) {
                    $type = 'array';
                    $children = $value;
                } else {
                    $type = 'object';
                    $children = $value;
                }
            } elseif (is_numeric($value)) {
                $type = 'number';
                $val = $value;
            } elseif (is_bool($value)) {
                $type = 'boolean';
                $val = $value ? 'true' : 'false';
            } else {
                $type = 'text';
                $val = $value;
            }

            $field = SchemaField::create([
                'schema_id' => $schemaId,
                'parent_field_id' => $parentId,
                'field_path' => $key,
                'field_type' => $type,
                'field_value' => $val,
                'sort_order' => $index++
            ]);

            if (!empty($children)) {
                $this->createFieldsFromData($schemaId, $field->id, $children);
            }
        }
    }

    public function show(Schema $schema)
    {
        $schema->load(['schemaType', 'rootFields.recursiveChildren']);

        return Inertia::render('Schemas/Show', [
            'schema' => $schema,
            'jsonLd' => $schema->toJsonLd(),
            'validation' => $schema->validateSchema()
        ]);
    }

    public function edit(Schema $schema)
    {
        $schema->load(['schemaType', 'rootFields.recursiveChildren']);
        $schemaTypes = SchemaType::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'type_key', 'description', 'required_fields']);

        return Inertia::render('Schemas/Edit', [
            'schema' => $schema,
            'schemaTypes' => $schemaTypes
        ]);
    }

    public function update(UpdateSchemaRequest $request, Schema $schema)
    {
        $schema->update($request->validated());

        return back()->with('message', 'Schema updated successfully!');
    }

    public function destroy(Schema $schema)
    {
        $schema->delete();

        return redirect()->route('schemas.index')
            ->with('message', 'Schema deleted successfully!');
    }

    public function preview(Schema $schema)
    {
        $schema->load(['schemaType', 'rootFields.recursiveChildren']);
        
        return response()->json($schema->toJsonLd());
    }

    public function export(Schema $schema)
    {
        $schema->load(['schemaType', 'rootFields.recursiveChildren']);
        $json = json_encode($schema->toJsonLd(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        
        return response($json)
            ->header('Content-Type', 'application/json')
            ->header('Content-Disposition', 'attachment; filename="schema-' . $schema->id . '.json"');
    }

    public function validate(Schema $schema)
    {
        $schema->load(['schemaType', 'rootFields.recursiveChildren']);
        $validation = $schema->validateSchema();
        
        return response()->json([
            'schema_id' => $schema->id,
            'is_valid' => $validation['isValid'],
            'errors' => $validation['errors'],
            'warnings' => $validation['warnings'],
            'json_ld' => $schema->toJsonLd()
        ]);
    }

    public function testWithGoogle(Schema $schema)
    {
        $schema->load(['schemaType', 'rootFields.recursiveChildren']);
        $jsonLd = $schema->toJsonLd();
        
        // Generate Google Rich Results Test URL
        $testUrl = 'https://search.google.com/test/rich-results';
        
        return response()->json([
            'schema_id' => $schema->id,
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

    public function bulkUpdateFields(Request $request, Schema $schema)
    {
        $request->validate([
            'fields' => 'required|array'
        ]);

        // Transaction to ensure data integrity
        DB::transaction(function () use ($schema, $request) {
            // Delete existing fields (cascade will handle children)
            $schema->fields()->whereNull('parent_field_id')->delete();
            
            // Re-create fields recursively
            $this->createFields($schema->id, null, $request->fields);
        });

        return back()->with('message', 'Schema fields updated successfully!');
    }

    private function createFields($schemaId, $parentId, array $fields)
    {
        foreach ($fields as $index => $fieldData) {
            $field = SchemaField::create([
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

    public function getRequiredFields(SchemaType $schemaType)
    {
        $validationService = new SchemaValidationService();
        
        $rules = $validationService->getValidationRules($schemaType->name);
        
        return response()->json([
            'schema_type' => $schemaType->name,
            'validation_rules' => $rules,
            'has_rules' => !is_null($rules)
        ]);
    }

    public function automatedCreate()
    {
        $schemaTypes = SchemaType::where('is_active', true)->get(['id', 'name', 'type_key']);
        
        return Inertia::render('Schemas/AutomatedGenerator', [
            'schemaTypes' => $schemaTypes
        ]);
    }

    public function automatedStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'meta_description' => 'required|string',
            'page_link' => 'required|url',
            'include_brand_identity' => 'boolean',
            'brand_show_products' => 'boolean',
            'brand_show_services' => 'boolean',
            'brand_show_offers' => 'boolean',
            'brand_products' => 'array',
            'brand_products.*.@type' => 'nullable|string',
            'brand_products.*.name' => 'nullable|string',
            'brand_products.*.description' => 'nullable|string',
            'brand_products.*.url' => 'nullable|string',
            'brand_services' => 'array',
            'brand_services.*.@type' => 'nullable|string',
            'brand_services.*.name' => 'nullable|string',
            'brand_services.*.description' => 'nullable|string',
            'brand_services.*.url' => 'nullable|string',
            'modules' => 'array',
            'modules.*.schema_type_id' => 'required|exists:schema_types,id',
            'modules.*.data' => 'array',
            'modules.*.data.items' => 'array',
            'modules.*.data.items.*.name' => 'nullable|string',
            'modules.*.data.items.*.description' => 'nullable|string',
            'modules.*.data.items.*.url' => 'nullable|string'
        ]);

        // Initialize fields array
        $fields = [];

        // Find primary type ID
        $primaryTypeId = null;
        if ($validated['include_brand_identity']) {
            $primaryTypeId = SchemaType::where('type_key', 'organization')->first()?->id;
            $fields = $this->getOrganizationBaseData($validated['meta_description'], $validated['page_link']);
            
            if ($validated['brand_show_offers']) {
                $fields['offers'] = [
                    '@type' => 'Offer',
                    'name' => 'Daily Deposit Bonus',
                    'description' => '99% withdrawable bonus on all deposits with no limitations',
                    'category' => 'DepositBonus',
                    'url' => $validated['page_link'] . '/bonuses'
                ];
            }

            if ($validated['brand_show_products'] && !empty($validated['brand_products'])) {
                $fields['makesOffer'] = array_map([$this, 'mapProductData'], $validated['brand_products']);
            }

            if ($validated['brand_show_services'] && !empty($validated['brand_services'])) {
                $fields['service'] = array_map([$this, 'mapServiceData'], $validated['brand_services']);
            }
        } else {
            $fields = [
                'description' => $validated['meta_description'],
                'url' => $validated['page_link']
            ];
        }

        // 2. Process Dynamic Modules (Eager Load Types)
        $typeIds = collect($validated['modules'])->pluck('schema_type_id')->unique();
        $schemaTypes = SchemaType::whereIn('id', $typeIds)->get()->keyBy('id');

        foreach ($validated['modules'] as $module) {
            $type = $schemaTypes->get($module['schema_type_id']);
            if (!$type) continue;
            
            if (!$primaryTypeId) $primaryTypeId = $type->id;

            $items = $module['data']['items'] ?? [];
            if (empty($items)) continue;

            if ($type->type_key === 'product') {
                $mappedItems = array_map([$this, 'mapProductData'], $items);
                $fields['makesOffer'] = $this->deduplicateItems(
                    array_merge($fields['makesOffer'] ?? [], $mappedItems)
                );
            } elseif ($type->type_key === 'service' || $type->type_key === 'financial_product') {
                $mappedItems = array_map([$this, 'mapServiceData'], $items);
                $fields['service'] = $this->deduplicateItems(
                    array_merge($fields['service'] ?? [], $mappedItems)
                );
            } else {
                $fields[$type->type_key] = array_merge($fields[$type->type_key] ?? [], $items);
            }
        }

        // Fallback for primary type
        if (!$primaryTypeId) {
            $primaryTypeId = SchemaType::where('type_key', 'webpage')->first()?->id;
        }

        $pageLink = rtrim($validated['page_link'], '/');
        $pageLinkWithSlash = $pageLink . '/';

        DB::transaction(function () use ($pageLink, $pageLinkWithSlash, $primaryTypeId, $validated, $fields) {
            $schema = Schema::withTrashed()
                ->whereIn('schema_id', [$pageLink, $pageLinkWithSlash])
                ->first();

            if ($schema) {
                $schema->update([
                    'schema_id' => $pageLink,
                    'schema_type_id' => $primaryTypeId,
                    'name' => $validated['name'],
                    'url' => $validated['page_link'],
                    'is_active' => true
                ]);
                if ($schema->trashed()) {
                    $schema->restore();
                }
            } else {
                $schema = Schema::create([
                    'schema_id' => $pageLink,
                    'schema_type_id' => $primaryTypeId,
                    'name' => $validated['name'],
                    'url' => $validated['page_link'],
                    'is_active' => true
                ]);
            }

            // Clean existing and create new in one go
            $schema->fields()->delete();
            $this->createFieldsFromData($schema->id, null, $fields);
            
            $this->lastGeneratedSchema = $schema;
        });

        return redirect()->route('schemas.edit', $this->lastGeneratedSchema)
            ->with('message', 'Modular automated schema generated successfully!');
    }

    private $lastGeneratedSchema;

    /**
     * Centralized Brand/Organization Data
     */
    private function getOrganizationBaseData(string $description, string $url): array
    {
        return [
            '@type' => ['Organization', 'WebSite'],
            'name' => '9UBET',
            'alternateName' => ['9UBET Kenya', '9ubet.com'],
            'description' => $description,
            'url' => $url,
            'logo' => 'https://www.9ubet.co.ke/logo.png',
            'sameAs' => [
                'https://www.instagram.com/9ubet.com_?igsh=MWx4eGwyYTlzaTFtYQ%3D%3D&utm_source=qr',
                'https://x.com/9ubet?s=21',
                'https://www.facebook.com/profile.php?id=61568301403707',
                'https://www.linkedin.com/company/96422776'
            ],
            'address' => [
                'addressCountry' => 'KE',
                'addressRegion' => 'Nairobi'
            ],
            'paymentAccepted' => 'M-Pesa',
            'currenciesAccepted' => 'KES',
            'aggregateRating' => [
                '@type' => 'AggregateRating',
                'ratingValue' => '4.8',
                'reviewCount' => '2500',
                'bestRating' => '5'
            ],
            'potentialAction' => [
                '@type' => 'RegisterAction',
                'name' => 'Betting Registration',
                'target' => 'https://www.9ubet.co.ke/register'
            ]
        ];
    }

    /**
     * Map item to Product Schema
     */
    private function mapProductData(array $data): array
    {
        return [
            '@type' => $data['@type'] ?? 'Product',
            'name' => $data['name'] ?? 'Unnamed Product',
            'description' => $data['description'] ?? '',
            'offers' => [
                '@type' => 'Offer',
                'url' => $data['url'] ?? '',
                'priceCurrency' => 'KES',
                'price' => '0',
                'availability' => 'https://schema.org/InStock'
            ]
        ];
    }

    /**
     * Map item to Service/FinancialProduct Schema
     */
    private function mapServiceData(array $data): array
    {
        return [
            '@type' => $data['@type'] ?? 'FinancialProduct',
            'name' => $data['name'] ?? 'Unnamed Service',
            'description' => $data['description'] ?? '',
            'url' => $data['url'] ?? ''
        ];
    }

    /**
     * Deduplicate items in an array by Name or URL
     */
    private function deduplicateItems(array $items): array
    {
        $unique = [];
        foreach ($items as $item) {
            $key = !empty($item['name']) ? $item['name'] : (!empty($item['url']) ? $item['url'] : serialize($item));
            if (!isset($unique[$key])) {
                $unique[$key] = $item;
            }
        }
        return array_values($unique);
    }
}
