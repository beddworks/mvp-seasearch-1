<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExceptionRule;
use App\Models\ExceptionRuleAudit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExceptionRuleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Settings/ExceptionRules', [
            'rules' => ExceptionRule::with('creator')->latest()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
            'rule_type'   => 'required|in:recruiter_trust,role_type,both',
            'trust_level' => 'nullable|in:trusted',
            'role_type'   => 'nullable|in:fast_track',
        ]);

        $rule = ExceptionRule::create([
            ...$request->validated(),
            'created_by' => auth()->id(),
            'is_active'  => false,
        ]);

        ExceptionRuleAudit::create([
            'rule_id'    => $rule->id,
            'changed_by' => auth()->id(),
            'action'     => 'created',
            'new_value'  => $rule->toArray(),
        ]);

        return redirect()->back()->with('success', 'Exception rule created.');
    }

    public function toggle(ExceptionRule $rule): RedirectResponse
    {
        $old = $rule->toArray();
        $rule->update(['is_active' => !$rule->is_active]);

        ExceptionRuleAudit::create([
            'rule_id'    => $rule->id,
            'changed_by' => auth()->id(),
            'action'     => 'toggled',
            'old_value'  => $old,
            'new_value'  => $rule->fresh()->toArray(),
        ]);

        $status = $rule->is_active ? 'enabled' : 'disabled';
        return redirect()->back()->with('success', "Rule {$status}.");
    }

    public function destroy(ExceptionRule $rule): RedirectResponse
    {
        ExceptionRuleAudit::create([
            'rule_id'    => $rule->id,
            'changed_by' => auth()->id(),
            'action'     => 'deleted',
            'old_value'  => $rule->toArray(),
        ]);

        $rule->delete();
        return redirect()->back()->with('success', 'Rule deleted.');
    }
}
