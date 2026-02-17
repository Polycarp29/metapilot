<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class KeywordController extends Controller
{
    /**
     * Display the trending keywords hub.
     */
    public function trending()
    {
        return Inertia::render('Keywords/Trending', [
            'organization' => auth()->user()->currentOrganization()
        ]);
    }

    /**
     * Display the keyword research tool (Coming Soon).
     */
    public function research()
    {
        return Inertia::render('Keywords/Research');
    }
}
