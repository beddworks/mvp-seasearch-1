<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SeaSearch Daily Digest</title>
<style>
    body { margin: 0; padding: 0; background: #F2F0EC; font-family: 'DM Sans', Arial, sans-serif; color: #0D0C0A; }
    .wrap { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD6; }
    .header { background: #0B4F8A; padding: 28px 32px; }
    .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,.7); font-size: 13px; }
    .body { padding: 28px 32px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #6B6860; margin: 24px 0 10px; }
    .section-title:first-child { margin-top: 0; }
    .item-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 14px; border-radius: 7px; margin-bottom: 6px; }
    .item-row.alert { background: #FBE8E8; }
    .item-row.warn  { background: #FDF0E8; }
    .item-row.info  { background: #E8F2FB; }
    .item-row.ok    { background: #EAF4EB; }
    .item-label { font-size: 13px; }
    .item-count { font-size: 16px; font-weight: 700; font-family: monospace; }
    .count-alert { color: #B52525; }
    .count-warn  { color: #B85C1A; }
    .count-info  { color: #1A6DB5; }
    .count-ok    { color: #2E7D33; }
    .cta { margin-top: 28px; text-align: center; }
    .btn { display: inline-block; background: #1A6DB5; color: #fff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 24px; border-radius: 7px; margin: 0 4px; }
    .btn-ghost { background: #F2F0EC; color: #0D0C0A; }
    .footer { padding: 20px 32px; border-top: 1px solid #E0DDD6; font-size: 11px; color: #6B6860; text-align: center; }
</style>
</head>
<body>
<div class="wrap">
    <div class="header">
        <h1>SeaSearch Daily Digest</h1>
        <p>{{ $date }} &nbsp;·&nbsp; Hi {{ $admin->name }}</p>
    </div>

    <div class="body">

        {{-- Unclaimed roles --}}
        @if($digest['unclaimed_24h'] > 0 || $digest['unclaimed_48h'] > 0 || $digest['unclaimed_72h'] > 0)
        <div class="section-title">Unclaimed roles</div>

        @if($digest['unclaimed_72h'] > 0)
        <div class="item-row alert">
            <span class="item-label">Auto-paused (72 h+)</span>
            <span class="item-count count-alert">{{ $digest['unclaimed_72h'] }}</span>
        </div>
        @endif

        @if($digest['unclaimed_48h'] > 0)
        <div class="item-row warn">
            <span class="item-label">Approaching (48 h+)</span>
            <span class="item-count count-warn">{{ $digest['unclaimed_48h'] }}</span>
        </div>
        @endif

        @if($digest['unclaimed_24h'] > 0)
        <div class="item-row info">
            <span class="item-label">Newly unclaimed (24 h+)</span>
            <span class="item-count count-info">{{ $digest['unclaimed_24h'] }}</span>
        </div>
        @endif
        @endif

        {{-- Pending approvals --}}
        @if($digest['pending_claims'] > 0 || $digest['pending_cdd_reviews'] > 0)
        <div class="section-title">Pending approvals</div>

        @if($digest['pending_claims'] > 0)
        <div class="item-row warn">
            <span class="item-label">Role claims awaiting approval</span>
            <span class="item-count count-warn">{{ $digest['pending_claims'] }}</span>
        </div>
        @endif

        @if($digest['pending_cdd_reviews'] > 0)
        <div class="item-row warn">
            <span class="item-label">CDD submissions awaiting review</span>
            <span class="item-count count-warn">{{ $digest['pending_cdd_reviews'] }}</span>
        </div>
        @endif
        @endif

        {{-- Timers --}}
        @if($digest['timer_a_overdue'] > 0 || $digest['timer_a_due_today'] > 0 || $digest['timer_b_warning'] > 0 || $digest['client_sla_breached'] > 0)
        <div class="section-title">Timer alerts</div>

        @if($digest['timer_a_overdue'] > 0)
        <div class="item-row alert">
            <span class="item-label">Timer A overdue — no profile submitted</span>
            <span class="item-count count-alert">{{ $digest['timer_a_overdue'] }}</span>
        </div>
        @endif

        @if($digest['timer_a_due_today'] > 0)
        <div class="item-row warn">
            <span class="item-label">Timer A deadline today</span>
            <span class="item-count count-warn">{{ $digest['timer_a_due_today'] }}</span>
        </div>
        @endif

        @if($digest['timer_b_warning'] > 0)
        <div class="item-row warn">
            <span class="item-label">Timer B warning — deadline tomorrow</span>
            <span class="item-count count-warn">{{ $digest['timer_b_warning'] }}</span>
        </div>
        @endif

        @if($digest['client_sla_breached'] > 0)
        <div class="item-row alert">
            <span class="item-label">Client SLA breached (Timer C)</span>
            <span class="item-count count-alert">{{ $digest['client_sla_breached'] }}</span>
        </div>
        @endif
        @endif

        {{-- Capacity issues --}}
        @if($digest['roles_queued_capacity'] > 0)
        <div class="section-title">Capacity</div>
        <div class="item-row info">
            <span class="item-label">Roles waiting — all recruiters at capacity</span>
            <span class="item-count count-info">{{ $digest['roles_queued_capacity'] }}</span>
        </div>
        @endif

        <div class="cta">
            <a href="{{ $dashUrl }}" class="btn">Go to dashboard</a>
            <a href="{{ $claimsUrl }}" class="btn btn-ghost">Review claims</a>
        </div>
    </div>

    <div class="footer">
        SeaSearch · Sent to {{ $admin->email }} · <a href="{{ $dashUrl }}" style="color:#1A6DB5">Platform</a>
    </div>
</div>
</body>
</html>
