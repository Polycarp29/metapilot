<?php

namespace App\Models\AIAgent;

use Illuminate\Database\Eloquent\Model;

class AgentSession extends Model
{
    //


    protected $fillable = [
        'session_id',
        'title',
        'organization_id',
        'user_id',
        'task_type',
        'message',
        'context_snapshot',
        'recommendations',
        'status',
    ];

    protected $casts = [
        'message' => 'array',
        'context_snapshot' => 'array',
        'recommendations' => 'array',
        'status' => 'string',
    ];
}
