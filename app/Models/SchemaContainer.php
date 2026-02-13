<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchemaContainer extends Model
{
    protected $fillable = ['user_id', 'organization_id', 'name', 'identifier', 'description'];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

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
