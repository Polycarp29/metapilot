<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserKeywordBookmark extends Model
{
    use HasFactory;

    protected $table = 'user_keyword_bookmarks';

    protected $fillable = [
        'user_id',
        'keyword_intelligence_id',
        'organization_id',
        'custom_label',
        'use_case',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function intelligence()
    {
        return $this->belongsTo(KeywordIntelligence::class, 'keyword_intelligence_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
