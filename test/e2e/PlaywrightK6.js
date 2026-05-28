import http from 'k6/http';
import { check, sleep } from 'k6';
import {browser} from 'k6/browser';


export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            exec: 'browserTest',
            vus: 2,
            maxDuration: '1m',
            iterations: 4,
            options: {
                browser: {
                    type: 'chromium',
                    headless: true, // Run in headless mode for better performance
                },
            },
        },
        be: {
            executor: 'constant-vus',
            exec: 'apiTest',
            vus: 10,
            duration: '1m',
        },
    },
    thresholds: {
        // 'http_req_duration': ['p(95)<100'], // 95% of requests should be below 100ms
        // 'http_req_failed': ['rate<0.01'], // Less than 1% of requests should fail
        'checks': ['rate>=1'], // Custom thresholds for checks
        'browser_web_vital_fcp': ['p(95)<1000'], // 95% of FCP measurements should be below 1000ms (first contentful paint)
        'browser_web_vital_lcp': ['p(95)<2500'], // 95% of LCP measurements should be below 2500ms (largest contentful paint,main content load time)
        ///also you can set thresholds for specific URLs if needed, for example:
        // 'browser_web_vital_lcp{url:https://quickpizza.grafana.com/login}': ['p(95)<2500'], // 95% of LCP measurements should be below 2500ms (largest contentful paint,main content load time)

        // 'browser_web_vital_fid': ['p(95)<100'], // 95% of FID measurements should be below 100ms (first input delay)
        'browser_web_vital_cls': ['p(95)<0.1'], // 95% of CLS measurements should be below 0.1 (cumulative layout shift,layout stability)
        'browser_web_vital_ttfb': ['p(95)<200'], // 95% of TTFB measurements should be below 200ms (time to first byte, server response time)
    },

};



export async function browserTest() {

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://quickpizza.grafana.com/login');
    console.log("Go to login page");
    await page.locator('input[name="username"]').fill('default');
    console.log("Fill username");
    await page.locator('input[name="password"]').fill('12345678');
    console.log("Fill password");
    await page.locator('button[type="submit"]').click();
    console.log("Click login button");

    const logoutButton = page.locator('//button[contains(., "Logout")]');
    await logoutButton.waitFor();
    const logoutBtnIsPresent = await logoutButton.isVisible();
    console.log("Logout button is present: " + logoutBtnIsPresent);
    check(logoutBtnIsPresent, {
        'is logout button present': (b) => b === true,
    });

    // Trigger an additional user interaction so INP can be observed more reliably.
    await logoutButton.click();
    await page.locator('button[type="submit"]').waitFor();
    sleep(1);
    await page.close();


    
}

export function apiTest() {
    const response = http.get("https://quickpizza.grafana.com/login");
    check(response, {
        'is status 200': (r) => r.status === 200,
    });
    
    sleep(1);
}