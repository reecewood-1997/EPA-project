# API Testing Script for PwC Volunteer Platform
# PowerShell script to test backend endpoints

$baseUrl = "http://localhost:5001"

Write-Host "=== PwC Volunteer Platform API Testing ===" -ForegroundColor Cyan
Write-Host ""

# 1. Login and get token
Write-Host "1. Testing Login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{
        email = "reecewood_97@icloud.com"
        password = "password123"
    } | ConvertTo-Json)

if ($loginResponse.success) {
    $token = $loginResponse.token
    Write-Host "✓ Login successful! Token obtained." -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.firstName) $($loginResponse.user.lastName)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✗ Login failed!" -ForegroundColor Red
    exit
}

# Headers with auth token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Search for users to invite
Write-Host "2. Testing User Search..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/search?query=user" `
        -Method Get `
        -Headers $headers

    Write-Host "✓ Found $($searchResponse.data.Count) users" -ForegroundColor Green
    if ($searchResponse.data.Count -gt 0) {
        Write-Host "Sample user: $($searchResponse.data[0].FirstName) $($searchResponse.data[0].LastName)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "✗ User search failed: $_" -ForegroundColor Red
}

# 3. Get notifications
Write-Host "3. Testing Get Notifications..." -ForegroundColor Yellow
try {
    $notificationsResponse = Invoke-RestMethod -Uri "$baseUrl/api/notifications" `
        -Method Get `
        -Headers $headers

    Write-Host "✓ Retrieved $($notificationsResponse.data.Count) notifications" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Get notifications failed: $_" -ForegroundColor Red
}

# 4. Get unread notification count
Write-Host "4. Testing Unread Notification Count..." -ForegroundColor Yellow
try {
    $unreadResponse = Invoke-RestMethod -Uri "$baseUrl/api/notifications/unread/count" `
        -Method Get `
        -Headers $headers

    Write-Host "✓ Unread notifications: $($unreadResponse.count)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Get unread count failed: $_" -ForegroundColor Red
}

# 5. Get received invitations
Write-Host "5. Testing Get Received Invitations..." -ForegroundColor Yellow
try {
    $invitationsResponse = Invoke-RestMethod -Uri "$baseUrl/api/invitations/received" `
        -Method Get `
        -Headers $headers

    Write-Host "✓ Retrieved $($invitationsResponse.data.Count) invitations" -ForegroundColor Green
    if ($invitationsResponse.data.Count -gt 0) {
        Write-Host "Sample: Invited to '$($invitationsResponse.data[0].EventTitle)' - Status: $($invitationsResponse.data[0].Status)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "✗ Get invitations failed: $_" -ForegroundColor Red
}

# 6. Send invitation (uncomment and modify to test)
# Write-Host "6. Testing Send Invitation..." -ForegroundColor Yellow
# $eventId = 1  # Replace with actual event ID
# $userIds = @(2)  # Replace with actual user IDs to invite
# try {
#     $inviteResponse = Invoke-RestMethod -Uri "$baseUrl/api/events/$eventId/invite" `
#         -Method Post `
#         -Headers $headers `
#         -Body (@{
#             userIds = $userIds
#             message = "Join me for this awesome volunteering event!"
#         } | ConvertTo-Json)

#     Write-Host "✓ Invitations sent successfully!" -ForegroundColor Green
#     Write-Host ""
# } catch {
#     Write-Host "✗ Send invitation failed: $_" -ForegroundColor Red
# }

# 7. Get all events
Write-Host "6. Testing Get Events..." -ForegroundColor Yellow
try {
    $eventsResponse = Invoke-RestMethod -Uri "$baseUrl/api/events" `
        -Method Get `
        -Headers $headers

    Write-Host "✓ Retrieved $($eventsResponse.data.Count) events" -ForegroundColor Green
    if ($eventsResponse.data.Count -gt 0) {
        Write-Host "Sample event: $($eventsResponse.data[0].Title)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "✗ Get events failed: $_" -ForegroundColor Red
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your auth token (valid for 24 hours):" -ForegroundColor Yellow
Write-Host $token -ForegroundColor Gray
Write-Host ""
Write-Host "Use this token in Postman or curl requests with header:" -ForegroundColor Yellow
Write-Host "Authorization: Bearer $token" -ForegroundColor Gray
