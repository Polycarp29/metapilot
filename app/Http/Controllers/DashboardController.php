<?php

namespace App\Http\Controllers;

use App\Models\Schema;
use App\Models\SchemaType;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $organization = auth()->user()->currentOrganization();

        $stats = [
            'totalSchemas' => Schema::where('organization_id', $organization->id)->count(),
            'totalTypes' => SchemaType::where('is_active', true)->count(),
            'activeSchemas' => Schema::where('organization_id', $organization->id)->where('is_active', true)->count()
        ];

        $recentSchemas = Schema::where('organization_id', $organization->id)
            ->with('schemaType')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentSchemas' => $recentSchemas 
            
        ]);
    }
}