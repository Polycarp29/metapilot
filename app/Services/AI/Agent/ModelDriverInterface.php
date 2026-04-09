<?php

namespace App\Services\AI\Agent;

interface ModelDriverInterface
{
    public function generateResponse(string $prompt, array $context = [], array $history = [], string $systemPrompt = '', ?array $actionResult = null): string;
    public function getModelName(): string;
    public function getCreditCost(): float;
}
