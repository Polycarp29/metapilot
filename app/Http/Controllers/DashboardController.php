<?php

namespace App\Http\Controllers;

use App\Models\Schema;
use App\Models\SchemaType;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'totalSchemas' => Schema::count(),
            'totalTypes' => SchemaType::where('is_active', true)->count(),
            'activeSchemas' => Schema::where('is_active', true)->count()
        ];

        $recentSchemas = Schema::with('schemaType')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentSchemas' => $recentSchemas 
            
        ]);
    }
}