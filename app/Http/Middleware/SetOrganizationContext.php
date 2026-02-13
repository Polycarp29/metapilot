<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetOrganizationContext
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $organizationId = session('current_organization_id');
            
            if (!$organizationId && auth()->user()->hasOrganizations()) {
                // Set first organization as default
                $org = auth()->user()->organizations()->first();
                if ($org) {
                    session(['current_organization_id' => $org->id]);
                }
            }
        }
        
        return $next($request);
    }
}
