# Complete Testing Strategy for Elixr App

This document outlines the comprehensive testing strategy for the Elixr juice delivery app, covering local development, CI/CD, and production environments.

## 🎯 Overview

Our testing strategy provides multiple layers of quality assurance:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test complete user workflows  
3. **E2E Tests** - Test full application functionality
4. **Production Health Checks** - Monitor live application health
5. **Netlify-Specific Tests** - Validate deployments

## 📋 Test Types and Usage

### 1. Unit Tests

**Purpose**: Test individual functions, utilities, and React components in isolation.

**Location**: `__tests__/unit/`, `src/components/__tests__/`, `src/lib/__tests__/`

**Run Commands**:
```bash
npm test                    # Run all Jest tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npm run test:comprehensive  # Run unit + integration tests with coverage
```

**What's Tested**:
- Utility functions (`formatPrice`, `validateEmail`, etc.)
- Cart calculations and validations
- Subscription logic
- API request/response handling
- React component rendering
- Form validation logic
- Business logic functions

**Example**:
```bash
npm test __tests__/unit/core-functionality.test.ts
```

### 2. Integration Tests

**Purpose**: Test complete user workflows and component interactions.

**Location**: `__tests__/integration/`

**Run Commands**:
```bash
npm run test:integration
jest __tests__/integration/
```

**What's Tested**:
- Complete user registration and login flow
- Product browsing and cart management
- Checkout and payment processes
- Subscription creation and management
- Contact form submissions
- Error handling across components
- Mobile responsiveness
- Accessibility features

**Example**:
```bash
jest __tests__/integration/user-journey.test.tsx
```

### 3. Production Health Checks

**Purpose**: Verify application health in any environment (local/production).

**Location**: `comprehensive-health-check.js`

**Run Commands**:
```bash
npm run test:production
npm run health:comprehensive
node comprehensive-health-check.js
```

**What's Tested**:
- Website accessibility
- All critical pages load correctly
- API endpoints respond properly
- Authentication system works
- Cart and checkout functionality
- Subscription system
- Security measures (test routes blocked in prod)
- Performance metrics
- Database connectivity
- Email system (safe mode in production)

**Environment Variables**:
```bash
TEST_BASE_URL=https://your-app.netlify.app
NODE_ENV=production
SKIP_DESTRUCTIVE=true
```

### 4. Netlify-Specific Tests

**Purpose**: Validate Netlify deployments and environment-specific functionality.

**Location**: `scripts/netlify-production-test.js`

**Run Commands**:
```bash
npm run health:production
node scripts/netlify-production-test.js
```

**What's Tested**:
- Netlify-specific environment variables
- Deploy context validation
- Static asset delivery
- Function deployments
- Security configurations
- Performance on Netlify CDN

**Netlify Integration**:
Can be run as a Netlify function or build plugin.

### 5. Legacy Health Check

**Purpose**: Basic health monitoring for existing systems.

**Location**: `health-check.js`

**Run Commands**:
```bash
npm run health:check
node health-check.js
```

## 🚀 Running Tests Locally

### Quick Start
```bash
# Install dependencies
npm install

# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run comprehensive health check
npm run test:production

# Run all test types
npm run test:all
```

### Development Workflow
```bash
# During development - watch mode
npm run test:watch

# Before committing
npm run test:comprehensive

# Before deploying
npm run test:production
```

## 🌐 Production Testing

### For Production Deployments

1. **Automated Testing on Deploy**:
```bash
# In your CI/CD pipeline
npm run test:all
npm run health:production
```

2. **Manual Production Health Check**:
```bash
TEST_BASE_URL=https://your-production-url.netlify.app npm run test:production
```

3. **Netlify Post-Deploy Check**:
```bash
# Automatically runs after Netlify deploy
npm run health:netlify
```

### Environment Configuration

**For Local Testing**:
```bash
# .env.local
TEST_BASE_URL=http://localhost:9002
NODE_ENV=development
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpass123
```

**For Production Testing**:
```bash
# Environment variables in Netlify
TEST_BASE_URL=https://your-app.netlify.app
NODE_ENV=production
SKIP_DESTRUCTIVE=true
```

## 📊 Test Coverage and Reporting

### Coverage Reports
```bash
# Generate detailed coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Test Results
All test runners generate detailed reports including:
- Pass/fail status for each test
- Performance metrics
- Error details
- Environment information
- Recommendations for improvements

### CI/CD Integration
Tests automatically run on:
- Pull requests
- Merges to main branch
- Netlify deployments
- Scheduled intervals (via GitHub Actions)

## 🔧 Writing New Tests

### Unit Test Example
```javascript
// __tests__/unit/my-feature.test.ts
import { myFunction } from '../../src/lib/my-feature';

describe('My Feature', () => {
  test('should handle valid input', () => {
    expect(myFunction('valid')).toBe('expected-result');
  });

  test('should handle edge cases', () => {
    expect(myFunction(null)).toBe('default-value');
  });
});
```

### Integration Test Example
```javascript
// __tests__/integration/my-flow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('User Flow', () => {
  test('complete workflow', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Expected Result')).toBeInTheDocument();
  });
});
```

### Health Check Example
```javascript
// Add to comprehensive-health-check.js
async testMyFeature() {
  const response = await this.makeRequest('/api/my-endpoint');
  if (!response.ok) {
    throw new Error(`My feature failed: ${response.status}`);
  }
}

// Then add to runAllTests()
await this.runTest('My Feature', () => this.testMyFeature(), 
  { critical: true, category: 'functionality' });
```

## 🎯 Test Strategy by Feature

### Authentication
- **Unit**: Email validation, password strength
- **Integration**: Login/signup flows, session management
- **Production**: Auth endpoints, security measures

### Cart & Checkout
- **Unit**: Price calculations, cart operations
- **Integration**: Add to cart, checkout process
- **Production**: Order creation, payment gateway

### Subscriptions
- **Unit**: Subscription calculations, date logic
- **Integration**: Subscription creation, management
- **Production**: Subscription APIs, recurring orders

### Email System
- **Unit**: Email template generation
- **Integration**: Email sending workflows
- **Production**: Email API health (safe mode)

### Performance
- **Unit**: Utility function performance
- **Integration**: Component rendering speed
- **Production**: Page load times, API response times

## 🚨 Critical Test Requirements

### Before Every Deploy
1. All unit tests must pass
2. Integration tests must pass
3. Production health check must pass
4. No critical security issues
5. Performance metrics within limits

### Production Monitoring
1. Run health checks after every deploy
2. Monitor critical user journeys
3. Verify security measures
4. Check performance metrics
5. Validate API functionality

## 🔍 Debugging Failed Tests

### Local Debugging
```bash
# Run specific test with verbose output
npm test -- --verbose my-test.test.ts

# Debug integration tests
npm run test:integration -- --verbose

# Debug production issues
DEBUG=true npm run test:production
```

### Production Debugging
```bash
# Check production health with detailed output
TEST_BASE_URL=https://your-app.netlify.app node comprehensive-health-check.js --output=report.json

# View detailed error logs
cat report.json | jq '.results[] | select(.status == "FAIL")'
```

## 📈 Continuous Improvement

### Metrics to Track
- Test coverage percentage
- Test execution time
- Production health score
- Performance metrics
- Error rates

### Regular Reviews
- Weekly: Review failed tests and coverage
- Monthly: Update test scenarios
- Quarterly: Evaluate testing strategy
- Annually: Major test infrastructure updates

## 🎉 Benefits

This comprehensive testing strategy provides:

✅ **Confidence** - Know your code works before deploying  
✅ **Quality** - Catch issues early in development  
✅ **Performance** - Monitor and maintain app speed  
✅ **Security** - Verify protection measures work  
✅ **Reliability** - Ensure consistent user experience  
✅ **Maintenance** - Easy debugging and issue resolution  

## 🔗 Quick Reference

| Test Type | Command | Use Case |
|-----------|---------|----------|
| Unit | `npm test` | Development |
| Integration | `npm run test:integration` | Feature validation |
| Production | `npm run test:production` | Deploy validation |
| Netlify | `npm run health:production` | Post-deploy check |
| All | `npm run test:all` | Complete validation |
| Coverage | `npm run test:coverage` | Quality assessment |

---

**Remember**: Good tests are investments in your application's future. They save time, prevent bugs, and give you confidence to ship features quickly and safely.
