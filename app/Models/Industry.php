<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Industry extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'keywords',
        'benchmarks',
    ];

    protected $casts = [
        'keywords' => 'array',
        'benchmarks' => 'array',
    ];
}
