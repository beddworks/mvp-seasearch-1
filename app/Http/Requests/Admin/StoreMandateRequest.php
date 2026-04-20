<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreMandateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['admin', 'super_admin']);
    }

    public function rules(): array
    {
        return [
            'client_id'              => 'required|uuid|exists:clients,id',
            'compensation_type_id'   => 'nullable|uuid|exists:compensation_types,id',
            'title'                  => 'required|string|max:255',
            'description'            => 'nullable|string',
            'location'               => 'nullable|string|max:100',
            'seniority'              => 'nullable|string|max:50',
            'industry'               => 'nullable|string|max:100',
            'contract_type'          => 'nullable|in:perm,contract,interim',
            'openings_count'         => 'nullable|integer|min:1',
            'is_remote'              => 'nullable|boolean',
            'salary_min'             => 'nullable|numeric|min:0',
            'salary_max'             => 'nullable|numeric|min:0',
            'salary_currency'        => 'nullable|string|max:3',
            'reward_min'             => 'nullable|numeric|min:0',
            'reward_max'             => 'nullable|numeric|min:0',
            'reward_pct'             => 'nullable|numeric|between:0,100',
            'must_haves'             => 'nullable|array',
            'nice_to_haves'          => 'nullable|array',
            'green_flags'            => 'nullable|array',
            'red_flags'              => 'nullable|array',
            'screening_questions'    => 'nullable|array',
            'ideal_candidates'       => 'nullable|string',
            'ideal_source_companies' => 'nullable|array',
            'is_exclusive'           => 'nullable|boolean',
            'is_featured'            => 'nullable|boolean',
            'is_fast_track'          => 'nullable|boolean',
            'timer_a_days'           => 'nullable|integer|min:1|max:30',
            'timer_b_active'         => 'nullable|boolean',
            'timer_b_days'           => 'nullable|integer|min:1|max:30',
            'timer_b_penalty_d6'     => 'nullable|numeric|between:0,100',
            'timer_b_penalty_d7'     => 'nullable|numeric|between:0,100',
            'timer_b_penalty_d8plus' => 'nullable|numeric|between:0,100',
            'timer_c_active'         => 'nullable|boolean',
            'timer_c_sla_days'       => 'nullable|integer|min:1|max:30',
        ];
    }
}
