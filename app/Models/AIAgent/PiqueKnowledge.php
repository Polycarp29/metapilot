<?php

namespace App\Models\AIAgent;

use Illuminate\Database\Eloquent\Model;

class PiqueKnowledge extends Model
{
    protected $table = 'pique_knowledge';

    protected $fillable = [
        'organization_id',
        'question_hash',
        'question_text',
        'answer_text',
        'metadata',
        'hits',
        'last_used_at',
    ];

    protected $casts = [
        'metadata'     => 'array',
        'last_used_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(\App\Models\Organization::class);
    }
}
