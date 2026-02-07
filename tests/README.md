# SEO Testing Suite

This directory contains comprehensive tests for SEO functionality in the Drishiq application.

## Test Files

### `seo.test.ts` - Full Playwright E2E Tests
Comprehensive end-to-end tests using Playwright that validate:
- Sitemap XML structure and content
- Blog post metadata (title, description, OG image)
- Home page SEO metadata
- Localized page metadata
- Robots.txt configuration
- URL normalization and redirects
- OG image accessibility
- Structured data validation
- All public and localized pages return 200 status

### `seo-basic.test.js` - Basic Node.js Tests
Lightweight tests that can run without Playwright for quick validation:
- Sitemap XML validation
- Robots.txt validation
- Home page metadata checks
- URL normalization tests

## Prerequisites

### For Full Tests (Playwright)
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### For Basic Tests (Node.js only)
No additional dependencies required.

## Running Tests

### Full E2E Tests
```bash
# Run all SEO tests
npm run test:seo

# Run specific test file
npx playwright test tests/seo.test.ts

# Run with specific browser
npx playwright test tests/seo.test.ts --project=chromium

# Run in headed mode (see browser)
npx playwright test tests/seo.test.ts --headed
```

### Basic Tests
```bash
# Run basic tests
npm run test:seo:basic

# Or run directly
node tests/seo-basic.test.js
```

## Test Configuration

### Environment Variables
- `BASE_URL`: Base URL for testing (default: `http://localhost:3000`)
- `NODE_ENV`: Environment (default: `test`)

### Playwright Configuration
- Configuration file: `playwright.config.ts`
- Supports multiple browsers: Chrome, Firefox, Safari, Edge
- Mobile viewport testing
- Automatic dev server startup

### Jest Configuration
- Configuration file: `jest.config.js`
- Next.js integration
- TypeScript support
- Module path mapping

## Test Coverage

### Sitemap Validation
- ✅ XML structure validation
- ✅ At least 12 locale entries
- ✅ All supported locales present
- ✅ Public pages included
- ✅ Localized public pages included

### Metadata Validation
- ✅ Title tags present and valid
- ✅ Meta descriptions (50-160 characters)
- ✅ OpenGraph images accessible
- ✅ Canonical URLs correct
- ✅ Hreflang alternates present
- ✅ Twitter Card metadata
- ✅ Article JSON-LD structured data

### URL Normalization
- ✅ Uppercase to lowercase redirects
- ✅ Trailing slash removal
- ✅ Multiple slash normalization
- ✅ Query parameter preservation
- ✅ Locale + page normalization

### Accessibility
- ✅ All public pages return 200
- ✅ All localized pages return 200
- ✅ All OG images accessible
- ✅ Robots.txt properly configured

## Continuous Integration

### GitHub Actions Example
```yaml
name: SEO Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:seo
```

### Pre-commit Hook
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
echo "npm run test:seo:basic" > .husky/pre-commit
chmod +x .husky/pre-commit
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Or use different port
   BASE_URL=http://localhost:3001 npm run test:seo
   ```

2. **Playwright browser not installed**
   ```bash
   npx playwright install
   ```

3. **Tests timing out**
   - Increase timeout in `playwright.config.ts`
   - Check if dev server is running
   - Verify BASE_URL is correct

4. **Missing OG images**
   - Ensure all OG images exist in `public/og/`
   - Check image file permissions
   - Verify image URLs in sitemap

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:api npx playwright test tests/seo.test.ts

# Run specific test with debug
npx playwright test tests/seo.test.ts --grep "sitemap" --debug
```

## Adding New Tests

### For Playwright Tests
1. Add test cases to `seo.test.ts`
2. Use `test()` and `expect()` from `@playwright/test`
3. Follow existing patterns for page navigation and assertions

### For Basic Tests
1. Add test functions to `seo-basic.test.js`
2. Use `makeRequest()` helper for HTTP requests
3. Add to `tests` array in `runAllTests()`

## Performance Considerations

- Tests run in parallel by default
- Use `page.waitForLoadState('networkidle')` for dynamic content
- Mock external APIs when possible
- Use `request` context for API-only tests
- Consider test data cleanup between tests






