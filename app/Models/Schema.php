<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Services\SchemaValidationService;

class Schema extends Model
{
    use SoftDeletes;

    protected $fillable = ['schema_type_id', 'name', 'schema_id', 'url', 'is_active', 'published_at'];

    protected $casts = [
        'is_active' => 'boolean',
        'published_at' => 'datetime'
    ];

    public function schemaType()
    {
        return $this->belongsTo(SchemaType::class);
    }

    public function fields()
    {
        return $this->hasMany(SchemaField::class)->orderBy('sort_order');
    }

    public function rootFields()
    {
        return $this->hasMany(SchemaField::class)
            ->whereNull('parent_field_id')
            ->orderBy('sort_order');
    }

    /**
     * Validate the schema against Google's Schema.org requirements
     */
    public function validateSchema(): array
    {
        $validationService = new SchemaValidationService();
        $jsonLd = $this->toJsonLd();
        
        return $validationService->validateSchema($jsonLd);
    }

    /**
     * Check if the schema is valid according to Google's requirements
     */
    public function isValidForGoogle(): bool
    {
        $validation = $this->validateSchema();
        return $validation['isValid'];
    }

    /**
     * Get validation errors and warnings
     */
    public function getValidationMessages(): array
    {
        return $this->validateSchema();
    }

    /**
     * Get required fields for the current schema type
     */
    public function getRequiredFields(): ?array
    {
        $validationService = new SchemaValidationService();
        return $validationService->getValidationRules($this->schemaType->name);
    }

    /**
     * Enhanced JSON-LD generation with better error handling
     */
    public function toJsonLd(): array
    {
        if (!$this->schemaType) {
            throw new \Exception('Schema type not loaded. Use with("schemaType") when querying.');
        }

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => $this->schemaType->name,
        ];

        // Add @id if provided
        if (!empty($this->schema_id)) {
            $schema['@id'] = $this->schema_id;
        }

        // Process root fields
        $rootFields = $this->rootFields()
            ->with('recursiveChildren')
            ->get();

        // Check for @type override first to support multi-type (e.g. ["Organization", "WebSite"])
        $typeField = $rootFields->where('field_path', '@type')->first();
        if ($typeField) {
            $schema['@type'] = $this->processField($typeField);
        }

        foreach ($rootFields as $field) {
            if ($field->field_path === '@type') continue;
            
            $value = $this->processField($field);
            if ($value !== null && $value !== '') {
                $schema[$field->field_path] = $value;
            }
        }

        return $schema;
    }

    /**
     * Enhanced field processing with better type handling
     */
    private function processField($field)
    {
        // Use recursiveChildren if loaded, fall back to children
        $children = $field->relationLoaded('recursiveChildren') ? $field->recursiveChildren : $field->children;

        // Handle empty values
        if (empty($field->field_value) && $children->isEmpty()) {
            return null;
        }

        switch ($field->field_type) {
            case 'object':
                $obj = [];
                
                // Add type if specified in config
                if (!empty($field->field_config['@type'])) {
                    $obj['@type'] = $field->field_config['@type'];
                }
                
                // Process children
                foreach ($children as $child) {
                    $childValue = $this->processField($child);
                    if ($childValue !== null && $childValue !== '') {
                        $obj[$child->field_path] = $childValue;
                    }
                }
                
                return empty($obj) ? null : $obj;
                
            case 'array':
                $arr = [];
                
                // Process children as array items
                foreach ($children as $child) {
                    $childValue = $this->processField($child);
                    if ($childValue !== null && $childValue !== '') {
                        $arr[] = $childValue;
                    }
                }
                
                // Add config items if any
                if (!empty($field->field_config['items'])) {
                    foreach ($field->field_config['items'] as $item) {
                        $arr[] = $item;
                    }
                }
                
                return $arr;
                
            case 'number':
                return is_numeric($field->field_value) ? floatval($field->field_value) : null;
                
            case 'boolean':
                return filter_var($field->field_value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                
            case 'url':
                return filter_var($field->field_value, FILTER_VALIDATE_URL) ? $field->field_value : null;
                
            case 'date':
                try {
                    return (new \DateTime($field->field_value))->format('Y-m-d');
                } catch (\Exception $e) {
                    return null;
                }
                
            case 'datetime':
                try {
                    return (new \DateTime($field->field_value))->format('c'); // ISO 8601 format
                } catch (\Exception $e) {
                    return null;
                }
                
            default:
                return $field->field_value;
        }
    }
}
