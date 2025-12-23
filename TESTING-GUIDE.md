# Testing Guide - PwC Volunteer Platform

This guide covers all testing strategies implemented for the PwC One Firm One Day volunteer platform.

## Table of Contents
1. [Unit Testing (Jest)](#unit-testing-jest)
2. [Integration Testing (Postman)](#integration-testing-postman)
3. [Load Testing (Artillery)](#load-testing-artillery)
4. [Security Auditing (Dependabot)](#security-auditing-dependabot)

---

## Unit Testing (Jest)

### Setup
Jest and React Testing Library are already configured via Create React App.

### Running Tests

```bash
# Run all tests
cd client
npm test

# Run tests in watch mode (default)
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test NotificationBell.test

# Run tests matching a pattern
npm test --testNamePattern="should render"
```

### Test Files
- `client/src/components/NotificationBell.test.tsx` - Notification bell component tests
- `client/src/components/InvitationCard.test.tsx` - Invitation card component tests

### Writing New Tests

Create a new file with `.test.tsx` or `.test.ts` extension next to the component:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Coverage Goals
- **Target**: 80% code coverage
- **Current**: Run `npm test -- --coverage --watchAll=false` to check

---

## Integration Testing (Postman)

### Setup

1. **Install Postman**: Download from https://www.postman.com/downloads/

2. **Import Collection**:
   - Open Postman
   - Click "Import" button
   - Select `server/Postman-Collection.json`
   - Collection will be imported with all endpoints

3. **Configure Environment**:
   - Collection variables are pre-configured:
     - `baseUrl`: http://localhost:5001
     - `authToken`: Auto-populated after login
     - `testEventId`: Auto-populated from event list
     - `testUserId`: Auto-populated from user search

### Running Tests

**Option 1: Run Entire Collection**
1. Click on the collection name
2. Click "Run" button
3. Select all requests
4. Click "Run PwC Volunteer Platform API"

**Option 2: Run Individual Requests**
1. Navigate to specific endpoint
2. Click "Send"
3. View response and test results

**Option 3: Command Line (Newman)**
```bash
# Install Newman
npm install -g newman

# Run collection
newman run server/Postman-Collection.json

# Run with environment file
newman run server/Postman-Collection.json -e environment.json

# Generate HTML report
newman run server/Postman-Collection.json --reporters cli,html
```

### Test Workflow

The collection includes automated tests for:

1. **Authentication**:
   - Login (saves token automatically)
   - Register new user

2. **Events**:
   - Get all events
   - Get event by ID
   - Register for event
   - Get event participants

3. **Notifications**:
   - Get all notifications
   - Get unread count
   - Mark all as read

4. **Invitations**:
   - Search users
   - Send invitations
   - Get received invitations

### Expected Results
All tests should pass with:
- Status codes: 200/201
- `success: true` in response
- Appropriate data structures

---

## Load Testing (Artillery)

### Setup

```bash
# Install Artillery globally
npm install -g artillery

# Or install in project
npm install --save-dev artillery
```

### Create Load Test Script

Create `server/load-test.yml`:

```yaml
config:
  target: "http://localhost:5001"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"
    - duration: 60
      arrivalRate: 20
      name: "Peak load"
  variables:
    testEmail: "reecewood_97@icloud.com"
    testPassword: "password123"

scenarios:
  - name: "User browses events"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ testEmail }}"
            password: "{{ testPassword }}"
          capture:
            - json: "$.token"
              as: "authToken"

      - get:
          url: "/api/events"
          headers:
            Authorization: "Bearer {{ authToken }}"

      - get:
          url: "/api/notifications/unread/count"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

### Running Load Tests

```bash
# Run load test
artillery run server/load-test.yml

# Generate detailed report
artillery run --output report.json server/load-test.yml
artillery report report.json

# Quick test (10 requests)
artillery quick --count 10 --num 5 http://localhost:5001/api/events
```

### Interpreting Results

Key metrics to monitor:
- **Response Time**: p95 should be < 500ms
- **Request Rate**: Should handle 20+ req/sec
- **Error Rate**: Should be < 1%
- **HTTP Status Codes**: All should be 2xx or expected errors

### Performance Targets
- **Login**: < 200ms (p95)
- **Event List**: < 300ms (p95)
- **Event Registration**: < 250ms (p95)
- **Notifications**: < 150ms (p95)

---

## Security Auditing (Dependabot)

### GitHub Dependabot

Dependabot is configured in `.github/dependabot.yml` and will:
- Run weekly on Mondays at 9:00 AM
- Check both client and server dependencies
- Create PRs for security updates automatically
- Group minor/patch updates together

### Manual Security Audit

```bash
# Client dependencies
cd client
npm audit

# Fix non-breaking issues
npm audit fix

# Fix all issues (may have breaking changes)
npm audit fix --force

# Server dependencies
cd server
npm audit
npm audit fix
```

### Viewing Vulnerabilities

**In GitHub**:
1. Go to repository → Security tab
2. View Dependabot alerts
3. Review and merge PR

S created by Dependabot

**Locally**:
```bash
npm audit --json > audit-report.json
```

### Security Best Practices
1. Keep dependencies up to date
2. Review Dependabot PRs weekly
3. Run `npm audit` before deployments
4. Never commit `.env` files with secrets
5. Use environment variables for sensitive data

---

## Continuous Integration

### GitHub Actions Workflow (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Client Dependencies
        run: |
          cd client
          npm ci

      - name: Run Client Tests
        run: |
          cd client
          npm test -- --coverage --watchAll=false

      - name: Install Server Dependencies
        run: |
          cd server
          npm ci

      - name: Run Security Audit
        run: |
          cd client && npm audit --audit-level=high
          cd ../server && npm audit --audit-level=high
```

---

## Test Coverage Report

### Generate Coverage Report

```bash
cd client
npm test -- --coverage --watchAll=false --coverageReporters=html
```

Open `client/coverage/lcov-report/index.html` in browser to view detailed report.

### Coverage Thresholds

Configure in `client/package.json`:

```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

---

## Troubleshooting

### Jest Tests Failing

**Problem**: `Cannot find module` errors
**Solution**:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Tests timeout
**Solution**: Increase timeout in test file:
```typescript
jest.setTimeout(10000); // 10 seconds
```

### Postman Tests Failing

**Problem**: 401 Unauthorized
**Solution**: Run "Login" request first to refresh auth token

**Problem**: 404 Not Found
**Solution**: Ensure server is running on http://localhost:5001

### Load Testing Issues

**Problem**: Connection refused
**Solution**: Increase server connection limits or reduce load

**Problem**: High error rate
**Solution**: Check server logs and database connection pool

---

## Next Steps

1. ✅ Run all Jest unit tests
2. ✅ Import and run Postman collection
3. ✅ Set up Artillery for load testing
4. ✅ Enable Dependabot in GitHub repository
5. Set up CI/CD pipeline with GitHub Actions
6. Achieve 80%+ test coverage
7. Run load tests monthly to track performance

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Postman Learning Center](https://learning.postman.com/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)
