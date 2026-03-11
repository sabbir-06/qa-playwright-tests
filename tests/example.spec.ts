import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.setContent('<html><head><title>Playwright Test Page</title></head><body><h1>Hello Playwright</h1></body></html>');

  await expect(page).toHaveTitle('Playwright Test Page');
});

test('finds heading', async ({ page }) => {
  await page.setContent('<html><body><h1>Hello Playwright</h1><p>Welcome to automated testing.</p></body></html>');

  await expect(page.getByRole('heading', { name: 'Hello Playwright' })).toBeVisible();
});

test('clicks a button', async ({ page }) => {
  await page.setContent(`
    <html>
      <body>
        <button id="btn">Click me</button>
        <p id="result"></p>
        <script>
          document.getElementById('btn').addEventListener('click', () => {
            document.getElementById('result').textContent = 'Button clicked!';
          });
        </script>
      </body>
    </html>
  `);

  await page.getByRole('button', { name: 'Click me' }).click();

  await expect(page.locator('#result')).toHaveText('Button clicked!');
});

test('fills a form', async ({ page }) => {
  await page.setContent(`
    <html>
      <body>
        <form>
          <label for="name">Name:</label>
          <input id="name" type="text" />
          <button type="submit">Submit</button>
        </form>
        <p id="output"></p>
        <script>
          document.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            document.getElementById('output').textContent = 'Hello, ' + document.getElementById('name').value + '!';
          });
        </script>
      </body>
    </html>
  `);

  await page.getByLabel('Name:').fill('World');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.locator('#output')).toHaveText('Hello, World!');
});

