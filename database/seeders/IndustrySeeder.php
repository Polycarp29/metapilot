<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class IndustrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $industries = [
            [
                'name' => 'E-commerce',
                'slug' => 'ecommerce',
                'keywords' => ['shop', 'product', 'cart', 'checkout', 'store', 'buy', 'sale'],
                'benchmarks' => [
                    'avg_session_duration' => 180,
                    'bounce_rate' => 45,
                    'conversion_rate' => 2.5,
                    'avg_ctr' => 3.2,
                ]
            ],
            [
                'name' => 'SaaS',
                'slug' => 'saas',
                'keywords' => ['software', 'app', 'platform', 'dashboard', 'api', 'integration'],
                'benchmarks' => [
                    'avg_session_duration' => 240,
                    'bounce_rate' => 35,
                    'conversion_rate' => 5.0,
                    'avg_ctr' => 4.5,
                ]
            ],
            [
                'name' => 'Blog & News',
                'slug' => 'blog',
                'keywords' => ['article', 'post', 'blog', 'news', 'story', 'guide'],
                'benchmarks' => [
                    'avg_session_duration' => 120,
                    'bounce_rate' => 65,
                    'conversion_rate' => 1.0,
                    'avg_ctr' => 2.8,
                ]
            ],
            [
                'name' => 'Education',
                'slug' => 'education',
                'keywords' => ['course', 'learn', 'tutorial', 'lesson', 'class', 'training'],
                'benchmarks' => [
                    'avg_session_duration' => 210,
                    'bounce_rate' => 40,
                    'conversion_rate' => 3.5,
                    'avg_ctr' => 3.8,
                ]
            ],
            [
                'name' => 'Real Estate',
                'slug' => 'real_estate',
                'keywords' => ['property', 'house', 'apartment', 'rent', 'real estate', 'listing'],
                'benchmarks' => [
                    'avg_session_duration' => 200,
                    'bounce_rate' => 42,
                    'conversion_rate' => 2.0,
                    'avg_ctr' => 3.5,
                ]
            ],
            [
                'name' => 'Health & Wellness',
                'slug' => 'health',
                'keywords' => ['health', 'medical', 'doctor', 'wellness', 'fitness', 'nutrition'],
                'benchmarks' => [
                    'avg_session_duration' => 190,
                    'bounce_rate' => 48,
                    'conversion_rate' => 2.2,
                    'avg_ctr' => 3.1,
                ]
            ],
            [
                'name' => 'Finance',
                'slug' => 'finance',
                'keywords' => ['finance', 'investment', 'banking', 'loan', 'credit', 'insurance'],
                'benchmarks' => [
                    'avg_session_duration' => 220,
                    'bounce_rate' => 38,
                    'conversion_rate' => 4.0,
                    'avg_ctr' => 4.2,
                ]
            ],
            [
                'name' => 'Travel',
                'slug' => 'travel',
                'keywords' => ['travel', 'hotel', 'flight', 'destination', 'tour', 'vacation'],
                'benchmarks' => [
                    'avg_session_duration' => 170,
                    'bounce_rate' => 44,
                    'conversion_rate' => 2.8,
                    'avg_ctr' => 3.4,
                ]
            ],
            [
                'name' => 'Food & Drink',
                'slug' => 'food',
                'keywords' => ['recipe', 'food', 'restaurant', 'cooking', 'meal', 'cuisine'],
                'benchmarks' => [
                    'avg_session_duration' => 150,
                    'bounce_rate' => 52,
                    'conversion_rate' => 1.8,
                    'avg_ctr' => 2.9,
                ]
            ],
            [
                'name' => 'Sports Betting',
                'slug' => 'betting',
                'keywords' => ['bet', 'odds', 'sportsbook', 'accumulator', 'betting tips', 'wagering'],
                'benchmarks' => [
                    'avg_session_duration' => 300,
                    'bounce_rate' => 30,
                    'conversion_rate' => 6.5,
                    'avg_ctr' => 5.2,
                ]
            ],
            [
                'name' => 'Casino & Gambling',
                'slug' => 'casino',
                'keywords' => ['casino', 'slots', 'jackpot', 'poker', 'roulette', 'spins', 'gambling'],
                'benchmarks' => [
                    'avg_session_duration' => 450,
                    'bounce_rate' => 25,
                    'conversion_rate' => 8.0,
                    'avg_ctr' => 6.5,
                ]
            ],
        ];

        foreach ($industries as $industry) {
            \App\Models\Industry::updateOrCreate(
                ['slug' => $industry['slug']],
                $industry
            );
        }
    }
}
