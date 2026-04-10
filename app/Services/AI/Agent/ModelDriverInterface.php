<?php

namespace App\Services\AI\Agent;

interface ModelDriverInterface
{
    public function generateResponse(string $prompt, array $context = [], array $history = [], string $systemPrompt = '', ?array $actionResult = null): string;
    public function generateStreamedResponse(string $prompt, array $context = [], array $history = [], string $systemPrompt = '', ?array $actionResult = null, callable $onChunk = null): void;
    public function getModelName(): string;
    public function getCreditCost(): float;
}
