<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{ $subject }}</title>
<style>
    body { margin: 0; padding: 0; background: #F2F0EC; font-family: 'DM Sans', Arial, sans-serif; color: #0D0C0A; }
    .wrap { max-width: 580px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E0DDD6; }
    .header { background: #0B4F8A; padding: 28px 32px; }
    .header h1 { margin: 0; color: #fff; font-size: 18px; font-weight: 600; letter-spacing: -0.2px; }
    .body { padding: 32px; }
    .body p { font-size: 14px; line-height: 1.7; color: #0D0C0A; white-space: pre-line; margin: 0 0 16px; }
    .footer { padding: 20px 32px; border-top: 1px solid #E0DDD6; font-size: 11px; color: #6B6860; text-align: center; }
    .footer a { color: #1A6DB5; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
    <div class="header">
        <h1>Sea Search</h1>
    </div>
    <div class="body">
        <p>{{ $body }}</p>
    </div>
    <div class="footer">
        Sea Search · <a href="https://seasearch.asia">seasearch.asia</a>
        &nbsp;·&nbsp; Sent to {{ $client->contact_email }}
    </div>
</div>
</body>
</html>
