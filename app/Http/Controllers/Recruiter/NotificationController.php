<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        $recruiter = auth()->user()->recruiter->load('user');

        return Inertia::render('Recruiter/Notifications/Index', [
            'recruiter'     => $recruiter,
            'notifications' => [],
        ]);
    }

    public function read(string $id)
    {
        return redirect()->back();
    }

    public function readAll()
    {
        return redirect()->back()->with('success', 'All notifications marked as read.');
    }
}
