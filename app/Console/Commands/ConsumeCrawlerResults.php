<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ConsumeCrawlerResults extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crawler:consume';

    protected $description = 'Consume crawl results from Redis and process them';

    public function handle(): void
    {
        $this->info("Listening for crawler results on 'crawler:results'...");

        while (true) {
            // BLPOP blocks until an element is available in the list
            $result = Redis::blpop('crawler:results', 0);

            if ($result) {
                $payload = json_decode($result[1], true);
                
                if ($payload) {
                    $this->info("Processing result for URL: " . ($payload['url'] ?? 'unknown'));
                    ProcessCrawlerResultJob::dispatch($payload);
                }
            }
        }
    }
}
