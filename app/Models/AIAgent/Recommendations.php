<?php

namespace App\Models\AIAgent;

use Illuminate\Database\Eloquent\Model;

class Recommendations extends Model
{
    //

    protected $fillable = [
        'type',
        'keyword',
        'opportunity_score',
        'reasoning',
        'status',
    ];
}
