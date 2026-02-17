<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\KeywordResearch>
 */
class KeywordResearchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => \App\Models\Organization::factory(),
            'query' => $this->faker->word(),
            'gl' => 'us',
            'hl' => 'en',
            'intent' => $this->faker->randomElement(['Informational', 'Commercial', 'Transactional', 'Navigational']),
            'niche' => $this->faker->word(),
            'results' => [],
            'last_searched_at' => now(),
        ];
    }
}
