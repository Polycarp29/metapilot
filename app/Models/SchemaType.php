<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchemaType extends Model
{
    protected $fillable = [
        'name',
        'type_key',
        'description',
        'required_fields',
        'is_active'
    ];

    protected $casts = [
        'required_fields' => 'array',
        'is_active' => 'boolean'
    ];

    public function schemas()
    {
        return $this->hasMany(Schema::class);
    }
}
