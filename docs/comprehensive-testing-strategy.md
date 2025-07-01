# Comprehensive Testing Strategy for Elixr App

## Overview

This document outlines our multi-layered testing strategy that covers unit testing, integration testing, end-to-end testing, and health checks. Our testing framework is designed to work both locally and in production environments (especially Netlify).

## Testing Architecture

### 1. Test Types

#### **Unit Tests** 📦
- **Purpose**: Test individual components, functions, and modules in isolation
- **Tools**: Jest + React Testing Library
- **Location**: `__tests__/` directories and `.test.ts/.test.tsx` files
- **Coverage**: Components, utilities, hooks, contexts
- **Run**: `npm run test:unit` or `npm test`

#### **Integration Tests** 🔗  
- **Purpose**: Test interactions between multiple components/modules
- **Tools**: Jest with mocked APIs
- **Location**: `__tests__/integration/` directory
- **Coverage**: API workflows, component interactions, payment flows
- **Run**: `npm run test:integration`

#### **End-to-End Tests** 🌐
- **Purpose**: Test complete user journeys and system functionality
- **Tools**: Custom health check scripts
- **Location**: `health-check.js`, `scripts/netlify-health-check.js`
- **Coverage**: Full application flows, API endpoints, deployment health
- **Run**: `npm run test:e2e` or `npm run health:check`

### 2. Test Runners

#### **Comprehensive Test Runner** (`scripts/test-runner.js`)
```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration  
npm run test:e2e

# Run with coverage
npm run test:all -- --coverage

# Run in watch mode (development)
npm run test:unit -- --watch

# Run with verbose output
npm run test:all -- --verbose
```

#### **Health Check Scripts**
```bash
# Local/development health check
npm run health:check

# Netlify-optimized health check
npm run health:netlify
```

## Testing Environments

### Local Development
- **Environment**: `NODE_ENV=development`
- **Base URL**: `http://localhost:9002`
- **Features**: 
  - Full test suite including destructive tests
  - Test pages accessible
  - Mock email mode
  - Detailed logging

### Staging/Preview
- **Environment**: `NODE_ENV=staging`
- **Base URL**: Preview deploy URL
- **Features**:
  - Non-destructive tests only
  - Test pages protected
  - Real email integration testing
  - Performance monitoring

### Production
- **Environment**: `NODE_ENV=production`
- **Base URL**: Live site URL
- **Features**:
  - Read-only health checks only
  - Test pages completely blocked
  - Security validation
  - Uptime monitoring

## Test Structure

### Unit Tests Structure
```
src/
├── components/
│   ├── __tests__/
│   │   ├── Button.test.tsx
│   │   ├── JuiceCard.test.tsx
│   │   └── CartItem.test.tsx
│   └── ...
├── hooks/
│   ├── __tests__/
│   │   └── useCart.test.ts
│   └── ...
├── lib/
│   ├── __tests__/
│   │   ├── utils.test.ts
│   │   └── constants.test.ts
│   └── ...
└── app/
    └── (routes)/
        └── __tests__/
            └── Page.test.tsx
```

### Integration Tests Structure
```
__tests__/
├── integration/
│   ├── payment-failure.test.ts
│   ├── order-flow.test.ts
│   └── subscription-flow.test.ts
├── api/
│   └── core.test.ts
└── components/
    └── components.test.tsx
```

## Testing Features

### 1. Payment System Testing
- **Unit Tests**: Payment form validation, price calculations
- **Integration Tests**: Payment flow with mocked APIs
- **E2E Tests**: Full payment cycle including webhooks
- **Health Checks**: Payment gateway connectivity

### 2. User Authentication Testing  
- **Unit Tests**: Auth context, login/signup forms
- **Integration Tests**: Auth flow with mocked Supabase
- **E2E Tests**: Login/logout cycles, protected routes
- **Health Checks**: Auth endpoint availability

### 3. Order Management Testing
- **Unit Tests**: Order components, cart logic
- **Integration Tests**: Order creation and status updates
- **E2E Tests**: Complete order lifecycle
- **Health Checks**: Order API functionality

### 4. Subscription System Testing
- **Unit Tests**: Subscription components and logic
- **Integration Tests**: Subscription creation and management
- **E2E Tests**: Subscription workflows
- **Health Checks**: Subscription API health

## Production Safety

### Test Page Protection
All test pages are protected in production:
- `/test-webhook` → 403 Forbidden
- `/test-email` → 403 Forbidden  
- `/test-subscription` → 403 Forbidden
- `/test-subscription-cart` → 403 Forbidden

### Test API Protection
Test APIs return 403 in production:
- `/api/test-delivery-scheduler`
- Other test endpoints

### Environment-Specific Behavior
```javascript
// Development: Full access to test features
if (process.env.NODE_ENV === 'development') {
  // Test pages accessible
  // Destructive tests allowed
  // Mock email mode
}

// Production: Locked down
if (process.env.NODE_ENV === 'production') {
  // Test pages blocked
  // Read-only health checks only
  // Real email mode
}
```

## CI/CD Integration

### Netlify Integration
Our health checks are optimized for Netlify:

```bash
# In Netlify build settings
Build command: npm run build:production
Post-processing: npm run health:netlify
```

### GitHub Actions (Optional)
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:all
      - run: npm run health:check
```

## Test Configuration

### Jest Configuration
- **Framework**: Jest + React Testing Library
- **Environment**: jsdom for browser simulation
- **Coverage**: Components, utilities, hooks
- **Mocking**: API calls, external services

### Environment Variables for Testing
```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Optional for testing
TEST_BASE_URL=http://localhost:9002
TEST_USER_EMAIL=test@elixr.com
TEST_USER_PASSWORD=testpass123
SKIP_E2E=false
COVERAGE=false
```

## Running Tests

### Development Workflow
```bash
# Start development server
npm run dev

# Run tests in watch mode (separate terminal)
npm run test:watch

# Run full test suite before committing
npm run test:all

# Check health before deployment
npm run health:check
```

### CI/CD Workflow
```bash
# Build application
npm run build:production

# Run comprehensive test suite
npm run test:all -- --ci

# Run health check on built application
npm run health:netlify
```

## Test Data Management

### Mock Data
- User profiles for testing
- Sample orders and products
- Test payment scenarios
- Subscription test cases

### Database Testing
- Mocked Supabase calls in unit tests
- Test database for integration tests
- Real database for E2E (with cleanup)

## Monitoring and Reporting

### Test Reports
- **Local**: Console output with detailed results
- **CI/CD**: JSON reports for integration
- **Coverage**: HTML reports for analysis

### Health Check Reports
- **Development**: Detailed failure information
- **Production**: Summary status only
- **Netlify**: Build log integration

## Best Practices

### 1. Test Writing
- Write tests before fixing bugs
- Test both happy path and edge cases
- Mock external dependencies
- Keep tests isolated and deterministic

### 2. Test Maintenance
- Update tests when features change
- Remove obsolete tests
- Keep test data current
- Review test coverage regularly

### 3. Performance
- Optimize test execution time
- Parallel test execution where possible
- Smart test selection in CI/CD
- Cache dependencies

## Troubleshooting

### Common Issues

1. **Test Failures in CI/CD**
   - Check environment variables
   - Verify network access
   - Review timeout settings

2. **Health Check Failures**
   - Verify deployment URL
   - Check function deployment
   - Validate environment setup

3. **Integration Test Issues**
   - Mock API responses properly
   - Handle async operations correctly
   - Ensure test isolation

### Debug Commands
```bash
# Run tests with verbose output
npm run test:all -- --verbose

# Run specific test file
npx jest src/components/__tests__/Button.test.tsx

# Run health check with debug info
DEBUG=true npm run health:check
```

## Conclusion

This comprehensive testing strategy ensures:
- **Quality**: Thorough coverage at all levels
- **Reliability**: Consistent testing across environments  
- **Safety**: Production protection and validation
- **Efficiency**: Automated testing and health monitoring
- **Maintainability**: Clear structure and documentation

The testing framework scales with the application and provides confidence in deployments across all environments.
