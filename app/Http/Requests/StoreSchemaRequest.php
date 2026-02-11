<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchemaRequest extends FormRequest
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
        return [
            'schema_type_id' => 'required|exists:schema_types,id',
            'name' => 'required|string|max:255',
            'schema_id' => 'required|url',
            'url' => 'nullable|url|max:500',
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
            'schema_type_id.required' => 'Please select a schema type.',
            'schema_type_id.exists' => 'The selected schema type is invalid.',
            'name.required' => 'Schema name is required.',
            'name.max' => 'Schema name cannot exceed 255 characters.',
            'schema_id.required' => 'Schema ID is required.',
            'schema_id.url' => 'Schema ID must be a valid URL.',
            'schema_id.unique' => 'This schema ID is already in use.',
            'url.url' => 'URL must be a valid URL format.',
            'url.max' => 'URL cannot exceed 500 characters.',
        ];
    }
}