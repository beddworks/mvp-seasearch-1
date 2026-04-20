<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AdminClientReportMail;
use App\Models\Client;
use App\Models\Mandate;
use App\Models\ReportTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ReportTemplateController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/ReportTemplates/Index', [
            'templates' => ReportTemplate::orderBy('type')->get(),
            'clients'   => Client::get(['id', 'company_name', 'contact_name', 'contact_email']),
            'mandates'  => Mandate::active()->get(['id', 'title']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'    => 'required|string|max:100',
            'type'    => 'required|in:unclaimed_role,role_dropped,role_update,general',
            'subject' => 'required|string|max:255',
            'body'    => 'required|string',
        ]);

        ReportTemplate::create([
            ...$request->validated(),
            'created_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Template created.');
    }

    public function update(ReportTemplate $reportTemplate, Request $request): RedirectResponse
    {
        $request->validate([
            'name'    => 'required|string|max:100',
            'subject' => 'required|string|max:255',
            'body'    => 'required|string',
        ]);

        $reportTemplate->update($request->validated());
        return redirect()->back()->with('success', 'Template updated.');
    }

    public function destroy(ReportTemplate $reportTemplate): RedirectResponse
    {
        $reportTemplate->delete();
        return redirect()->back()->with('success', 'Template deleted.');
    }

    public function preview(ReportTemplate $reportTemplate, Request $request): JsonResponse
    {
        $vars    = $request->input('variables', []);
        $subject = $this->substituteVars($reportTemplate->subject, $vars);
        $body    = $this->substituteVars($reportTemplate->body, $vars);
        return response()->json(['subject' => $subject, 'body' => $body]);
    }

    public function send(ReportTemplate $reportTemplate, Request $request): RedirectResponse
    {
        $request->validate([
            'client_id'      => 'required|uuid|exists:clients,id',
            'mandate_id'     => 'nullable|uuid|exists:mandates,id',
            'custom_message' => 'nullable|string',
        ]);

        // Email sending will be implemented in Phase 8 (Resend integration)
        return redirect()->back()->with('success', 'Email queued (email integration in Phase 8).');
    }

    private function substituteVars(string $text, array $vars): string
    {
        return str_replace(array_keys($vars), array_values($vars), $text);
    }
}
