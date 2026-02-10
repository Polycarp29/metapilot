<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchemaContainer extends Model
{
    protected $fillable = ['name', 'identifier', 'description'];

    public function schemas()
    {
        return $this->hasMany(Schema::class);
    }

    /**
     * Aggregate all schemas in this container into a single array for output.
     */
    public function getCombinedJsonLd(): array
    {
        return $this->schemas()
            ->with(['schemaType', 'rootFields.recursiveChildren'])
            ->get()
            ->map(function ($schema) {
                return $schema->toJsonLd();
            })
            ->toArray();
    }
}
