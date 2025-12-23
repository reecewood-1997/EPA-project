# API Testing Guide - PwC Volunteer Platform

## Base URL
```
http://localhost:5001
```

## Step 1: Get Authentication Token

First, login to get your JWT token:

```bash
curl -X POST http://localhost:5001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"reecewood_97@icloud.com\",\"password\":\"password123\"}"
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "reecewood_97@icloud.com",
    "firstName": "Reece",
    "lastName": "Wood",
    "role": "admin"
  }
}
```

**Copy the token value and use it in all subsequent requests!**

---

## Notification Endpoints

### 1. Get All Notifications
```bash
curl -X GET http://localhost:5001/api/notifications ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Get Unread Notification Count
```bash
curl -X GET http://localhost:5001/api/notifications/unread/count ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Mark Notification as Read
```bash
curl -X PUT http://localhost:5001/api/notifications/1/read ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Mark All Notifications as Read
```bash
curl -X PUT http://localhost:5001/api/notifications/read-all ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Event Invitation Endpoints

### 5. Search for Users to Invite
```bash
curl -X GET "http://localhost:5001/api/users/search?query=reece" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "UserID": 1,
      "FirstName": "Reece",
      "LastName": "Wood",
      "Email": "reecewood_97@icloud.com",
      "Department": "IT",
      "Location": "London"
    }
  ]
}
```

### 6. Send Event Invitations
```bash
curl -X POST http://localhost:5001/api/events/1/invite ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"userIds\":[2,3],\"message\":\"Join me for this event!\"}"
```

**Note:** Replace `1` with actual event ID and `[2,3]` with actual user IDs

### 7. Get Received Invitations
```bash
curl -X GET http://localhost:5001/api/invitations/received ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "InvitationID": 1,
      "EventID": 1,
      "Status": "Pending",
      "Message": "Join me for this event!",
      "EventTitle": "Community Garden Cleanup",
      "StartDateTime": "2025-12-01T10:00:00",
      "Location": "Central Park",
      "InviterFirstName": "John",
      "InviterLastName": "Doe"
    }
  ]
}
```

### 8. Accept/Decline Invitation
```bash
# Accept
curl -X PUT http://localhost:5001/api/invitations/1/respond ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"Accepted\"}"

# Decline
curl -X PUT http://localhost:5001/api/invitations/1/respond ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"Declined\"}"
```

---

## Using Postman (Recommended)

1. **Install Postman**: Download from https://www.postman.com/downloads/

2. **Create a new Collection**: "PwC Volunteer Platform"

3. **Add Authentication**:
   - Go to Collection settings
   - Authorization tab
   - Type: Bearer Token
   - Token: Paste your JWT token

4. **Import Requests**: Create new requests with the endpoints above

5. **Environment Variables**: Create variables for:
   - `baseUrl`: http://localhost:5001
   - `token`: Your JWT token

---

## Browser Testing (DevTools Console)

You can also test from the browser console while the app is running:

```javascript
// 1. Get token from localStorage
const token = localStorage.getItem('token');

// 2. Test notification endpoint
fetch('http://localhost:5001/api/notifications', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Notifications:', data));

// 3. Search users
fetch('http://localhost:5001/api/users/search?query=user', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Users:', data));

// 4. Get invitations
fetch('http://localhost:5001/api/invitations/received', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Invitations:', data));
```

---

## Testing Workflow

### Complete Invitation Flow Test:

1. **User A (Inviter)**: Login and get token
2. **User A**: Search for User B: `GET /api/users/search?query=<name>`
3. **User A**: Send invitation: `POST /api/events/:id/invite` with User B's ID
4. **User B**: Login and get token
5. **User B**: Check invitations: `GET /api/invitations/received`
6. **User B**: Accept invitation: `PUT /api/invitations/:id/respond`
7. **User B**: Check notifications: `GET /api/notifications`

---

## Common Responses

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Troubleshooting

**401 Unauthorized**: Token is missing or invalid - login again to get a new token

**404 Not Found**: Check the endpoint URL and IDs

**400 Bad Request**: Check request body format and required fields

**500 Internal Server Error**: Check server logs for details
