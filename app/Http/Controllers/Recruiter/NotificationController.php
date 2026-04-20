<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('Recruiter/Notifications/Index', [
            'notifications' => AppNotification::where('user_id', $user->id)
                ->latest()
                ->paginate(30),
            'unread_count' => AppNotification::where('user_id', $user->id)
                ->where('is_read', false)
                ->count(),
        ]);
    }

    public function read(string $id): JsonResponse
    {
        $notif = AppNotification::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $notif->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function readAll(): JsonResponse
    {
        AppNotification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
