<?php

namespace App\Services;

class SchemaValidationService
{
    /**
     * Google Schema.org validation rules for different types
     */
    private const VALIDATION_RULES = [
        'Product' => [
            'required_one_of' => ['offers', 'review', 'aggregateRating'],
            'required_fields' => ['name'],
            'recommended_fields' => ['image', 'description', 'brand'],
            'offers_requirements' => ['price', 'priceCurrency', 'availability']
        ],
        'Service' => [
            'required_one_of' => ['offers', 'review', 'aggregateRating'],
            'required_fields' => ['name'],
            'recommended_fields' => ['provider', 'areaServed']
        ],
        'Organization' => [
            'required_fields' => ['name'],
            'recommended_fields' => ['url', 'logo', 'contactPoint', 'address']
        ],
        'LocalBusiness' => [
            'required_fields' => ['name', 'address'],
            'recommended_fields' => ['telephone', 'openingHours', 'priceRange']
        ],
        'VideoGame' => [
            'required_one_of' => ['offers', 'review', 'aggregateRating'],
            'required_fields' => ['name'],
            'recommended_fields' => ['applicationCategory', 'operatingSystem', 'publisher']
        ],
        'Game' => [
            'required_fields' => ['name'],
            'recommended_fields' => ['numberOfPlayers', 'gameItem']
        ],
        'HowTo' => [
            'required_fields' => ['name', 'step'],
            'recommended_fields' => ['description', 'image', 'totalTime']
        ],
        'FAQPage' => [
            'required_fields' => ['mainEntity'],
            'mainEntity_requirements' => ['@type' => 'Question', 'name', 'acceptedAnswer']
        ],
        'WebSite' => [
            'required_fields' => ['name', 'url'],
            'recommended_fields' => ['description', 'publisher']
        ]
    ];

    /**
     * Validate a JSON-LD schema against Google's requirements
     */
    public function validateSchema(array $schema): array
    {
        $errors = [];
        $warnings = [];
        
        // Check basic structure
        if (!isset($schema['@type'])) {
            $errors[] = [
                'code' => 'missing_type',
                'field' => '@type',
                'message' => 'Missing @type property'
            ];
            return ['errors' => $errors, 'warnings' => $warnings, 'isValid' => false];
        }
        
        if (!isset($schema['@context']) || $schema['@context'] !== 'https://schema.org') {
            $warnings[] = [
                'code' => 'invalid_context',
                'field' => '@context',
                'message' => '@context should be "https://schema.org"'
            ];
        }
        
        $schemaType = $schema['@type'];
        
        // Handle array of types (like ['Organization', 'WebSite'])
        if (is_array($schemaType)) {
            foreach ($schemaType as $type) {
                $typeErrors = $this->validateSchemaType($schema, $type);
                $errors = array_merge($errors, $typeErrors['errors']);
                $warnings = array_merge($warnings, $typeErrors['warnings']);
            }
        } else {
            $typeErrors = $this->validateSchemaType($schema, $schemaType);
            $errors = array_merge($errors, $typeErrors['errors']);
            $warnings = array_merge($warnings, $typeErrors['warnings']);
        }
        
        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'isValid' => empty($errors)
        ];
    }
    
    /**
     * Validate a specific schema type
     */
    private function validateSchemaType(array $schema, string $schemaType): array
    {
        $errors = [];
        $warnings = [];
        
        if (!isset(self::VALIDATION_RULES[$schemaType])) {
            $warnings[] = [
                'code' => 'unknown_type',
                'field' => '@type',
                'message' => "No validation rules defined for schema type: {$schemaType}"
            ];
            return ['errors' => $errors, 'warnings' => $warnings];
        }
        
        $rules = self::VALIDATION_RULES[$schemaType];
        
        // Check required fields
        if (isset($rules['required_fields'])) {
            foreach ($rules['required_fields'] as $field) {
                if (!isset($schema[$field]) || empty($schema[$field])) {
                    $errors[] = [
                        'code' => 'missing_field',
                        'field' => $field,
                        'message' => "Missing required field: {$field}"
                    ];
                }
            }
        }
        
        // Check "required one of" fields (like offers, review, or aggregateRating for Product)
        if (isset($rules['required_one_of'])) {
            $hasRequiredField = false;
            foreach ($rules['required_one_of'] as $field) {
                if (isset($schema[$field]) && !empty($schema[$field])) {
                    $hasRequiredField = true;
                    break;
                }
            }
            
            if (!$hasRequiredField) {
                $fieldsList = implode('", "', $rules['required_one_of']);
                $errors[] = [
                    'code' => 'missing_one_of',
                    'field' => $rules['required_one_of'][0], // target first one for UI
                    'message' => "Must include at least one of: \"{$fieldsList}\""
                ];
            }
        }
        
        // Check recommended fields
        if (isset($rules['recommended_fields'])) {
            foreach ($rules['recommended_fields'] as $field) {
                if (!isset($schema[$field]) || empty($schema[$field])) {
                    $warnings[] = [
                        'code' => 'missing_recommended',
                        'field' => $field,
                        'message' => "Recommended field missing: {$field}"
                    ];
                }
            }
        }
        
        // Validate offers structure if present
        if (isset($schema['offers']) && isset($rules['offers_requirements'])) {
            $offersErrors = $this->validateOffers($schema['offers'], $rules['offers_requirements']);
            $errors = array_merge($errors, $offersErrors);
        }
        
        // Validate FAQ structure if present
        if ($schemaType === 'FAQPage' && isset($schema['mainEntity'])) {
            $faqErrors = $this->validateFAQ($schema['mainEntity']);
            $errors = array_merge($errors, $faqErrors);
        }
        
        // Validate HowTo structure if present
        if ($schemaType === 'HowTo' && isset($schema['step'])) {
            $howToErrors = $this->validateHowTo($schema['step']);
            $errors = array_merge($errors, $howToErrors);
        }
        
        return ['errors' => $errors, 'warnings' => $warnings];
    }
    
    /**
     * Validate offers structure
     */
    private function validateOffers(array $offers, array $requirements): array
    {
        $errors = [];
        
        // Handle single offer or array of offers
        $offersList = isset($offers['@type']) ? [$offers] : $offers;
        
        foreach ($offersList as $index => $offer) {
            if (!isset($offer['@type']) || $offer['@type'] !== 'Offer') {
                $errors[] = [
                    'code' => 'invalid_type',
                    'field' => "offers[{$index}].@type",
                    'message' => "Offer {$index}: Missing or invalid @type (should be 'Offer')"
                ];
            }
            
            foreach ($requirements as $field) {
                if (!isset($offer[$field]) || empty($offer[$field])) {
                    $errors[] = [
                        'code' => 'missing_field',
                        'field' => "offers[{$index}].{$field}",
                        'message' => "Offer {$index}: Missing required field '{$field}'"
                    ];
                }
            }
            
            // Validate availability values
            if (isset($offer['availability'])) {
                $validAvailability = [
                    'https://schema.org/InStock',
                    'https://schema.org/OutOfStock',
                    'https://schema.org/PreOrder',
                    'https://schema.org/BackOrder',
                    'https://schema.org/Discontinued',
                    'https://schema.org/LimitedAvailability'
                ];
                
                if (!in_array($offer['availability'], $validAvailability)) {
                    $errors[] = [
                        'code' => 'invalid_value',
                        'field' => "offers[{$index}].availability",
                        'message' => "Offer {$index}: Invalid availability value"
                    ];
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Validate FAQ structure
     */
    private function validateFAQ(array $mainEntity): array
    {
        $errors = [];
        
        // Handle single question or array of questions
        $questions = isset($mainEntity['@type']) ? [$mainEntity] : $mainEntity;
        
        foreach ($questions as $index => $question) {
            if (!isset($question['@type']) || $question['@type'] !== 'Question') {
                $errors[] = [
                    'code' => 'invalid_type',
                    'field' => "mainEntity[{$index}].@type",
                    'message' => "Question {$index}: Missing or invalid @type (should be 'Question')"
                ];
            }
            
            if (!isset($question['name']) || empty($question['name'])) {
                $errors[] = [
                    'code' => 'missing_field',
                    'field' => "mainEntity[{$index}].name",
                    'message' => "Question {$index}: Missing 'name' field"
                ];
            }
            
            if (!isset($question['acceptedAnswer'])) {
                $errors[] = [
                    'code' => 'missing_field',
                    'field' => "mainEntity[{$index}].acceptedAnswer",
                    'message' => "Question {$index}: Missing 'acceptedAnswer' field"
                ];
            } else {
                $answer = $question['acceptedAnswer'];
                if (!isset($answer['@type']) || $answer['@type'] !== 'Answer') {
                    $errors[] = [
                        'code' => 'invalid_type',
                        'field' => "mainEntity[{$index}].acceptedAnswer.@type",
                        'message' => "Question {$index}: acceptedAnswer must have @type 'Answer'"
                    ];
                }
                
                if (!isset($answer['text']) || empty($answer['text'])) {
                    $errors[] = [
                        'code' => 'missing_field',
                        'field' => "mainEntity[{$index}].acceptedAnswer.text",
                        'message' => "Question {$index}: acceptedAnswer missing 'text' field"
                    ];
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Validate HowTo structure
     */
    private function validateHowTo(array $steps): array
    {
        $errors = [];
        
        if (empty($steps)) {
            $errors[] = "HowTo: Must have at least one step";
            return $errors;
        }
        
        // Handle single step or array of steps
        $stepsList = isset($steps['@type']) ? [$steps] : $steps;
        
        foreach ($stepsList as $index => $step) {
            if (!isset($step['@type']) || $step['@type'] !== 'HowToStep') {
                $errors[] = [
                    'code' => 'invalid_type',
                    'field' => "step[{$index}].@type",
                    'message' => "Step {$index}: Missing or invalid @type (should be 'HowToStep')"
                ];
            }
            
            if (!isset($step['text']) || empty($step['text'])) {
                $errors[] = [
                    'code' => 'missing_field',
                    'field' => "step[{$index}].text",
                    'message' => "Step {$index}: Missing 'text' field"
                ];
            }
        }
        
        return $errors;
    }
    
    /**
     * Get validation rules for a specific schema type
     */
    public function getValidationRules(string $schemaType): ?array
    {
        return self::VALIDATION_RULES[$schemaType] ?? null;
    }
    
    /**
     * Get all available validation rules
     */
    public function getAllValidationRules(): array
    {
        return self::VALIDATION_RULES;
    }
}