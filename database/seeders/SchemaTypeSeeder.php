<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SchemaTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'name' => 'Product',
                'type_key' => 'product',
                'description' => 'Product schema for sports betting and gaming products',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'offers' => 'Required (one of: offers, review, or aggregateRating)',
                    'review' => 'Alternative to offers',
                    'aggregateRating' => 'Alternative to offers',
                    'image' => 'Recommended',
                    'description' => 'Recommended',
                    'brand' => 'Recommended'
                ])
            ],
            [
                'name' => 'VideoGame',
                'type_key' => 'videogame',
                'description' => 'For specific games like Aviator, slots, and other video games',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'offers' => 'Required (one of: offers, review, or aggregateRating)',
                    'review' => 'Alternative to offers',
                    'aggregateRating' => 'Alternative to offers',
                    'applicationCategory' => 'Recommended',
                    'operatingSystem' => 'Recommended',
                    'publisher' => 'Recommended'
                ])
            ],
            [
                'name' => 'Game',
                'type_key' => 'game',
                'description' => 'For general games and casino games',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'numberOfPlayers' => 'Recommended',
                    'gameItem' => 'Recommended'
                ])
            ],
            [
                'name' => 'Service',
                'type_key' => 'service',
                'description' => 'For betting and gaming services',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'offers' => 'Required (one of: offers, review, or aggregateRating)',
                    'review' => 'Alternative to offers',
                    'aggregateRating' => 'Alternative to offers',
                    'provider' => 'Recommended',
                    'areaServed' => 'Recommended'
                ])
            ],
            [
                'name' => 'HowTo',
                'type_key' => 'howto',
                'description' => 'Step-by-step instructions for withdrawals, deposits, etc.',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'step' => 'Required (array of HowToStep objects)',
                    'description' => 'Recommended',
                    'image' => 'Recommended',
                    'totalTime' => 'Recommended'
                ])
            ],
            [
                'name' => 'FAQPage',
                'type_key' => 'faq',
                'description' => 'Frequently Asked Questions pages',
                'required_fields' => json_encode([
                    'mainEntity' => 'Required (array of Question objects with acceptedAnswer)'
                ])
            ],
            [
                'name' => 'Organization',
                'type_key' => 'organization',
                'description' => 'Organization details and contact information',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'url' => 'Recommended',
                    'logo' => 'Recommended',
                    'contactPoint' => 'Recommended',
                    'address' => 'Recommended'
                ])
            ],
            [
                'name' => 'LocalBusiness',
                'type_key' => 'localbusiness',
                'description' => 'Local business information',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'address' => 'Required',
                    'telephone' => 'Recommended',
                    'openingHours' => 'Recommended',
                    'priceRange' => 'Recommended'
                ])
            ],
            [
                'name' => 'WebSite',
                'type_key' => 'website',
                'description' => 'Website and homepage information',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'url' => 'Required',
                    'description' => 'Recommended',
                    'publisher' => 'Recommended'
                ])
            ]
        ];

        foreach ($types as $type) {
            \App\Models\SchemaType::firstOrCreate(
                ['type_key' => $type['type_key']],
                $type
            );
        }
    }
}
