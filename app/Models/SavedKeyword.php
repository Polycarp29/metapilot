<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavedKeyword extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'keyword_intelligence_id',
        'keyword',
        'source',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function intelligence()
    {
        return $this->belongsTo(KeywordIntelligence::class, 'keyword_intelligence_id');
    }
}
