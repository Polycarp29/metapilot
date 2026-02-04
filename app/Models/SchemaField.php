<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchemaField extends Model
{
    protected $fillable = ['schema_id', 'parent_field_id', 'field_path', 'field_type', 'field_value', 'field_config', 'sort_order'];

    protected $casts = [
        'field_config' => 'array'
    ];

    public function schema()
    {
        return $this->belongsTo(Schema::class);
    }

    public function parent()
    {
        return $this->belongsTo(SchemaField::class, 'parent_field_id');
    }

    public function children()
    {
        return $this->hasMany(SchemaField::class, 'parent_field_id')->orderBy('sort_order');
    }

    public function recursiveChildren()
    {
        return $this->children()->with('recursiveChildren');
    }
}
