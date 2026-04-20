<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Clients/Index', [
            'clients' => Client::withCount('mandates')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function show(Client $client): Response
    {
        return Inertia::render('Admin/Clients/Show', [
            'client'   => $client->load('user'),
            'mandates' => $client->mandates()->with('activeClaim.recruiter.user')->latest()->paginate(10),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'company_name'  => 'required|string|max:200',
            'industry'      => 'nullable|string|max:100',
            'contact_name'  => 'required|string|max:100',
            'contact_email' => 'required|email|max:255',
            'contact_title' => 'nullable|string|max:100',
            'accent_color'  => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $client = Client::create($request->validated());

        return redirect()->route('admin.clients.show', $client)
            ->with('success', 'Client created.');
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        $request->validate([
            'company_name'  => 'required|string|max:200',
            'industry'      => 'nullable|string|max:100',
            'contact_name'  => 'required|string|max:100',
            'contact_email' => 'required|email|max:255',
            'contact_title' => 'nullable|string|max:100',
            'accent_color'  => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $client->update($request->validated());

        return redirect()->back()->with('success', 'Client updated.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();
        return redirect()->route('admin.clients.index')->with('success', 'Client deleted.');
    }

    public function sendGsheet(Client $client): RedirectResponse
    {
        // GSheet integration implemented in Phase 8
        return redirect()->back()->with('success', 'GSheet feature will be available in Phase 8.');
    }
}
