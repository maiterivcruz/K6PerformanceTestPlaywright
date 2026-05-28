import { browser } from 'k6/browser';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    browser_web_vital_lcp: ['p(75) <= 2500'],
    browser_web_vital_fid: ['p(75) <= 100'],
  },
};

export default async function () {
  const page = await browser.newPage();

  try {
    // Navigate to the login page
    await page.goto('https://test.k6.io/my_messages.php');

    // Fill in the login form
    await page.locator('input[name="login"]').type('admin');
    await page.locator('input[name="password"]').type('123');

    // Submit the form and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      page.locator('input[type="submit"]').click(),
    ]);

    // Verify the user is logged in
    const header = await page.locator('h2').textContent();
    check(page, {
      'logged in successfully': () => header === 'Welcome, admin!',
    });

    sleep(1);

    // Navigate to another page
    await page.goto('https://test.k6.io/');

    const title = await page.title();
    check(page, {
      'home page title is correct': () => title.includes('k6'),
    });
  } finally {
    await page.close();
  }
}
