<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class BotProtectionMiddleware
{
    /**
     * Basic Bot Protection based on User-Agent and suspicious patterns.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userAgent = $request->header('User-Agent');

        $bots = [
            'curl', 'python', 'wget', 'libwww-perl', 'go-http-client', 
            'pypy', 'headless', 'bot', 'spider', 'crawl'
        ];

        // Exclude common search engine bots if needed, but for now we'll be strict on API/Admin paths
        $isBot = false;
        foreach ($bots as $bot) {
            if (stripos($userAgent, $bot) !== false) {
                // Allow Googlebot, Bingbot etc. for the landing page
                if (stripos($userAgent, 'googlebot') === false && 
                    stripos($userAgent, 'bingbot') === false &&
                    stripos($userAgent, 'duckduckgo') === false) {
                    $isBot = true;
                    break;
                }
            }
        }

        if ($isBot && ($request->is('api/*') || $request->is('login') || $request->is('register'))) {
            Log::warning('Bot detected and blocked:', ['agent' => $userAgent, 'ip' => $request->ip()]);
            return response()->json(['error' => 'Automated access is restricted.'], 403);
        }

        return $next($request);
    }
}
