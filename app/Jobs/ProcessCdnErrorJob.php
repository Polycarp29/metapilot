<?php

namespace App\Jobs;

use App\Models\CdnError;
use App\Models\PixelSite;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCdnErrorJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public function __construct(
        protected array $payload,
        protected string $ip,
        protected string $userAgent
    ) {}

    public function handle(): void
    {
        $token = $this->payload['token'] ?? null;
        if (!$token) return;

        $pixelSite = PixelSite::where('ads_site_token', $token)->first();
        if (!$pixelSite) return;

        $ts        = (int) ($this->payload['_ts'] ?? 0);
        $signature = $this->payload['_sig'] ?? '';
        
        $expected = hash_hmac(
            'sha256',
            $token . ($this->payload['page_view_id'] ?? '') . $ts,
            $pixelSite->ads_site_token
        );

        if ($signature !== 'nosig' && !hash_equals($expected, $signature)) {
            return;
        }

        CdnError::create([
            'pixel_site_id'   => $pixelSite->id,
            'organization_id' => $pixelSite->organization_id,
            'page_view_id'    => $this->payload['page_view_id'] ?? null,
            'url'             => mb_substr((string) ($this->payload['url'] ?? ''), 0, 500),
            'message'         => mb_substr((string) ($this->payload['message'] ?? ''), 0, 500),
            'stack'           => mb_substr((string) ($this->payload['stack'] ?? ''), 0, 2000),
            'source'          => $this->payload['source'] ?? 'window',
            'line'            => $this->payload['line']   ?? null,
            'col'             => $this->payload['col']    ?? null,
            'filename'        => mb_substr((string) ($this->payload['filename'] ?? ''), 0, 500),
            'user_agent'      => substr($this->userAgent, 0, 1000),
            'ip_hash'         => hash('sha256', $this->ip),
            'load_time_ms'    => $this->payload['load_time_ms'] ?? null,
            'error_type'      => $this->payload['error_type'] ?? 'js_error',
            'http_status'     => $this->payload['http_status'] ?? null,
        ]);

        Log::info("CDN Error Recorded", [
            'site' => $pixelSite->id,
            'type' => $this->payload['error_type'] ?? 'js_error'
        ]);
    }
}
