<?php

namespace App\Jobs;

use App\Models\CdnPageSchema;
use App\Models\PixelSite;
use App\Services\OpenAIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateCdnSchemaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public $timeout = 60;

    protected $pixelSite;
    protected $url;
    protected $metadata;

    /**
     * Create a new job instance.
     */
    public function __construct(PixelSite $pixelSite, string $url, array $metadata)
    {
        $this->pixelSite = $pixelSite;
        $this->url = $url;
        $this->metadata = $metadata;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $urlHash = hash('sha256', strtolower(rtrim(preg_replace('/^www\./', '', parse_url($this->url, PHP_URL_HOST) . parse_url($this->url, PHP_URL_PATH)), '/')));

        // Final deduplication check before starting expensive AI work
        if (CdnPageSchema::where('pixel_site_id', $this->pixelSite->id)->where('url_hash', $urlHash)->exists()) {
            return;
        }

        try {
            $aiService = app(OpenAIService::class);
            $aiService->setModelFromOrganization($this->pixelSite->organization);
            
            // Construct pseudo-html from metadata for extraction
            $pseudoHtml = "<html><head><title>" . ($this->metadata['title'] ?? '') . "</title>";
            $pseudoHtml .= "<meta name='description' content='" . ($this->metadata['description'] ?? '') . "'>";
            $pseudoHtml .= "</head><body><h1>" . ($this->metadata['h1'] ?? '') . "</h1></body></html>";

            $aiData = $aiService->extractProfessionalSchemaData($this->url, $pseudoHtml);
            
            if ($aiData && !empty($aiData['data'])) {
                $schema = $aiData['data'];
                if (!isset($schema['@context'])) $schema['@context'] = 'https://schema.org';
                if (!isset($schema['@type'])) $schema['@type'] = $aiData['type'] ?? 'WebPage';

                CdnPageSchema::create([
                    'pixel_site_id' => $this->pixelSite->id,
                    'url'           => $this->url,
                    'url_hash'      => $urlHash,
                    'schema_type'   => $schema['@type'],
                    'schema_json'   => $schema,
                    'is_auto_generated' => true,
                    'last_injected_at'  => now(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error("CDN Background Schema Generation Failure", [
                'pixel_site_id' => $this->pixelSite->id,
                'url'           => $this->url,
                'error'         => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
