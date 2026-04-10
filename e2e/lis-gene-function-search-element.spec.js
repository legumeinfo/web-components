import {test, expect} from '@playwright/test';

// Wait for the genus dropdown to be populated — used as a readiness signal
// that the component has connected and the API is available.
async function waitForFormData(page) {
  await page
    .locator('select[name="genus"] option[value="Glycine"]')
    .waitFor({state: 'attached', timeout: 10000});
}

test.describe('genus search', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    await page.locator('select[name="genus"]').selectOption('Glycine');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
  });

  test('displays known first result', async ({page}) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toHaveText('AS1a');
    await expect(firstRow.locator('td').nth(1)).toHaveText('asparaginase synthetase 1a');
    await expect(firstRow.locator('td').nth(6)).toHaveText('Relationship between asparagine metabolism and protein concentration in soybean seed');
  });

  test('displays the correct total result count', async ({page}) => {
    await expect(page.getByText('175 results')).toBeVisible();
  });

  test('displays the correct page range in results info', async ({page}) => {
    await expect(page.getByText('1-10 of 175 results')).toBeVisible();
  });
});

test.describe('genus + species search', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    await page.locator('select[name="genus"]').selectOption('Glycine');
    await page.locator('select[name="species"] option[value="max"]').first().waitFor({state: 'attached'});
    await page.locator('select[name="species"]').first().selectOption('max');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
  });

  test('displays the correct result count for Glycine max', async ({page}) => {
    await expect(page.getByText('173 results')).toBeVisible();
  });

  test('displays known first result', async ({page}) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toHaveText('AS1a');
    await expect(firstRow.locator('td').nth(1)).toHaveText('asparaginase synthetase 1a');
  });
});

test.describe('traits search', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    await page.locator('input[name="traits"]').fill('flowering');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
  });

  test('returns results matching the trait', async ({page}) => {
    await expect(page.getByText('55 results')).toBeVisible();
  });

  test('displays known first result for flowering trait', async ({page}) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toHaveText('E1');
    await expect(firstRow.locator('td').nth(1)).toHaveText('Earliness 1');
  });
});

test.describe('gene identifier search', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    await page.locator('input[name="geneIdentifier"]').fill('Glyma11g27480');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
  });

  test('returns the specific known result', async ({page}) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toHaveText('AS1a');
    await expect(firstRow.locator('td').nth(1)).toHaveText('asparaginase synthetase 1a');
    await expect(firstRow.locator('td').nth(6)).toHaveText('Relationship between asparagine metabolism and protein concentration in soybean seed');
  });
});

test.describe('no results', () => {
  test('shows no results for a non-existent search term', async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    await page.locator('input[name="geneIdentifier"]').fill('DOES_NOT_EXIST_XYZ');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('tbody tr')).toHaveCount(0, {timeout: 10000});
  });
});

test.describe('pagination', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    await page.locator('select[name="genus"]').selectOption('Glycine');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
  });

  test('page 2 shows a different result range', async ({page}) => {
    await page.locator('a', {hasText: 'Next'}).click();
    await expect(page.getByText('11-20 of 175 results')).toBeVisible({timeout: 10000});
  });

  test('page 2 shows different results from page 1', async ({page}) => {
    await page.locator('a', {hasText: 'Next'}).click();
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
    // Page 1 starts with AS1a; page 2 starts with E1
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toHaveText('E1');
    await expect(firstRow.locator('td').nth(1)).toHaveText('Earliness 1');
  });

  test('new search resets to page 1', async ({page}) => {
    await page.locator('a', {hasText: 'Next'}).click();
    await expect(page.getByText('11-20 of 175 results')).toBeVisible({timeout: 10000});
    // Submit a new search — should return to page 1
    await page.locator('input[name="traits"]').fill('flowering');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('1-10 of 55 results')).toBeVisible({timeout: 10000});
  });

  test('new search replaces previous results', async ({page}) => {
    await page.locator('input[name="traits"]').fill('flowering');
    await page.locator('button[type="submit"]').click();
    // Previous result AS1a should be gone; E1 (first flowering result) should appear
    await expect(page.locator('tbody tr').first().locator('td').nth(0)).toHaveText('E1', {timeout: 10000});
    await expect(page.getByText('AS1a')).toHaveCount(0);
  });
});

test.describe('URL query string', () => {
  test('search parameters are reflected in the URL', async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    await page.locator('select[name="genus"]').selectOption('Glycine');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
    await expect(page).toHaveURL(/genus=Glycine/);
  });

  test('loading a page with query string params auto-submits the search', async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html?genus=Glycine&page=1');
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toHaveText('AS1a');
  });

  test('loading page 2 via query string shows the correct results', async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html?genus=Glycine&page=2');
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
    await expect(page.getByText('11-20 of 175 results')).toBeVisible();
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toHaveText('E1');
  });
});

test.describe('genus property locking', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    // Set the genus property programmatically to simulate a host page
    // restricting the component to a specific genus
    await page.evaluate(() => {
      document.querySelector('lis-gene-function-search-element').genus = 'Glycine';
    });
    // When genus is locked the component replaces the named select with a
    // disabled select + hidden input — wait for that re-render to complete
    await page.locator('select:disabled').waitFor();
  });

  test('genus selector is disabled when genus property is set', async ({page}) => {
    // The named select is replaced by a nameless disabled select + hidden input
    await expect(page.locator('select[name="genus"]')).toHaveCount(0);
    await expect(page.locator('select:disabled').first()).toBeAttached();
  });

  test('genus selector shows the locked genus value', async ({page}) => {
    // The locked value is carried by the hidden input that replaces name="genus"
    await expect(page.locator('input[type="hidden"][name="genus"]')).toHaveValue('Glycine');
  });

  test('search is restricted to the locked genus', async ({page}) => {
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('tbody tr').first()).toBeVisible({timeout: 10000});
    await expect(page.getByText('175 results')).toBeVisible();
  });
});

test.describe('species selector', () => {
  test('species resets when genus changes', async ({page}) => {
    await page.goto('/dev/lis-gene-function-search-element.html');
    await waitForFormData(page);
    // Select Glycine and then a species
    await page.locator('select[name="genus"]').selectOption('Glycine');
    await page.locator('select[name="species"] option[value="max"]').first().waitFor({state: 'attached'});
    await page.locator('select[name="species"]').first().selectOption('max');
    // Change the genus — species should reset to "-- any --"
    await page.locator('select[name="genus"]').selectOption('');
    await expect(page.locator('select[name="species"]').first()).toHaveValue('');
  });
});
