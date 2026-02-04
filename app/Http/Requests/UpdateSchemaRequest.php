<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchemaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $schemaId = $this->route('schema');
        
        return [
            'schema_type_id' => 'sometimes|exists:schema_types,id',
            'name' => 'sometimes|string|max:255',
            'schema_id' => 'sometimes|url|unique:schemas,schema_id,' . $schemaId,
            'url' => 'nullable|url|max:500',
            'is_active' => 'sometimes|boolean'
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'schema_type_id.exists' => 'The selected schema type is invalid.',
            'name.string' => 'Schema name must be a string.',
            'name.max' => 'Schema name cannot exceed 255 characters.',
            'schema_id.url' => 'Schema ID must be a valid URL.',
            'schema_id.unique' => 'This schema ID is already in use.',
            'url.url' => 'URL must be a valid URL format.',
            'url.max' => 'URL cannot exceed 500 characters.',
            'is_active.boolean' => 'Active status must be true or false.',
        ];
    }
}