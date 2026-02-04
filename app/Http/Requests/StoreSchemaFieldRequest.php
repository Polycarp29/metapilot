<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchemaFieldRequest extends FormRequest
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
            'parent_field_id' => 'nullable|exists:schema_fields,id',
            'field_path' => 'required|string|max:255',
            'field_type' => 'required|in:string,number,boolean,array,object,url,date,datetime',
            'field_value' => 'nullable|string|max:1000',
            'field_config' => 'nullable|array',
            'sort_order' => 'integer|min:0'
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
            'parent_field_id.exists' => 'The selected parent field is invalid.',
            'field_path.required' => 'Field path is required.',
            'field_path.max' => 'Field path cannot exceed 255 characters.',
            'field_type.required' => 'Field type is required.',
            'field_type.in' => 'Field type must be one of: string, number, boolean, array, object, url, date, datetime.',
            'field_value.max' => 'Field value cannot exceed 1000 characters.',
            'field_config.array' => 'Field configuration must be an array.',
            'sort_order.integer' => 'Sort order must be an integer.',
            'sort_order.min' => 'Sort order cannot be negative.'
        ];
    }
}