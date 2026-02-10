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
                'description' => 'Comprehensive product schema for e-commerce, digital goods, and marketplaces',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'offers' => 'Required (offers, review, or aggregateRating)',
                    'image' => 'Recommended',
                    'description' => 'Recommended',
                    'brand' => 'Recommended'
                ])
            ],
            [
                'name' => 'VideoGame',
                'type_key' => 'videogame',
                'description' => 'Detailed schema for software applications and digital games',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'applicationCategory' => 'Recommended',
                    'operatingSystem' => 'Recommended',
                    'publisher' => 'Recommended'
                ])
            ],
            [
                'name' => 'Game',
                'type_key' => 'game',
                'description' => 'General gaming and recreational activity schema',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'numberOfPlayers' => 'Recommended'
                ])
            ],
            [
                'name' => 'Service',
                'type_key' => 'service',
                'description' => 'Professional service offerings and consulting schemas',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'provider' => 'Recommended',
                    'areaServed' => 'Recommended'
                ])
            ],
            [
                'name' => 'HowTo',
                'type_key' => 'howto',
                'description' => 'Step-by-step documentation and guide instructions',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'step' => 'Required (array of HowToStep objects)',
                    'description' => 'Recommended'
                ])
            ],
            [
                'name' => 'FAQPage',
                'type_key' => 'faq',
                'description' => 'Organized list of frequently asked questions and answers',
                'required_fields' => json_encode([
                    'mainEntity' => 'Required (array of Questions)'
                ])
            ],
            [
                'name' => 'Organization',
                'type_key' => 'organization',
                'description' => 'Primary corporate and brand identity information',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'url' => 'Recommended',
                    'logo' => 'Recommended'
                ])
            ],
            [
                'name' => 'LocalBusiness',
                'type_key' => 'localbusiness',
                'description' => 'Physical store and regional business location details',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'address' => 'Required',
                    'telephone' => 'Recommended'
                ])
            ],
            [
                'name' => 'WebSite',
                'type_key' => 'website',
                'description' => 'High-level website structure and sitewide search info',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'url' => 'Required'
                ])
            ],
            [
                'name' => 'Article',
                'type_key' => 'article',
                'description' => 'Blog posts, news reports, and detailed content marketing entries',
                'required_fields' => json_encode([
                    'headline' => 'Required',
                    'author' => 'Required',
                    'datePublished' => 'Required',
                    'image' => 'Recommended'
                ])
            ],
            [
                'name' => 'BreadcrumbList',
                'type_key' => 'breadcrumb',
                'description' => 'Navigation hierarchy for improved search visibility',
                'required_fields' => json_encode([
                    'itemListElement' => 'Required (array of ListItems)'
                ])
            ],
            [
                'name' => 'Event',
                'type_key' => 'event',
                'description' => 'Scheduled events, webinars, conferences, and exhibitions',
                'required_fields' => json_encode([
                    'name' => 'Required',
                    'startDate' => 'Required',
                    'location' => 'Required'
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
