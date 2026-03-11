import { test, expect, request } from '@playwright/test';
import tags from '../test-data/tags.json'

let accessToken

// Single beforeEach for all tests - handles basic navigation and login
test.beforeEach(async({page, request}) =>{
    // API login in beforeEach to share token across tests
    const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: {user: {email: "rock@wmail.com", password: "rockmountain12"}}
    })
    const responseBody = await loginResponse.json()
    accessToken = responseBody.user.token

    // Apply token to browser storage so UI is authenticated without UI login steps
    await page.addInitScript((token) => {
        window.localStorage.setItem('jwtToken', token)
    }, accessToken)

    // Navigate after token is set
    await page.goto('https://conduit.bondaracademy.com/')
})

// Test 1: Mock API - Replace tags API with mock data
test('mock API - replace tags with mock data', async({page}) =>{
    // Mock the tags API to return custom data
    await page.route('https://conduit-api.bondaracademy.com/api/tags', async route=>{
        await route.fulfill({
            body: JSON.stringify(tags)
        })
    })
    
    // Reload page to trigger the mocked API call
    await page.reload();
    
    // Verify page loaded correctly
    await expect(page.locator('.navbar-brand')).toHaveText('conduit');
})

// Test 2: Modify API response - Intercept and change article data
test('modify API response - change article title and description', async({page}) =>{
    // Intercept articles API and modify the response
    await page.route('**/api/articles*', async route =>{
        const response = await route.fetch()
        const responseBody = await response.json()
        
        // Modify the first article's data
        responseBody.articles[0].title = "Modified Article Title"
        responseBody.articles[0].description = "Modified Article Description"
        
        await route.fulfill({
            status: response.status(),
            headers: response.headers(),
            body: JSON.stringify(responseBody)
        })
    })
    
    // Navigate to Global Feed to trigger the API call
    await page.getByText('Global Feed').click();
    
    // Verify the modified data appears on page
    await expect(page.locator('app-article-preview h1').first()).toContainText('Modified Article Title')
    await expect(page.locator('app-article-preview p').first()).toContainText('Modified Article Description')
})

// Test 3: Perform API request - Create and delete article using API
test('perform API request - create and delete article via API', async ({page, request}) =>{
    // Login via API moved to beforeEach
    // const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    //     data: {user: {email: "rock@wmail.com", password: "rockmountain12"}}
    // })
    // const responseBody = await loginResponse.json()
    // const accessToken = responseBody.user.token
    
    const articleTitle = `API Created Article ${Date.now()}`

    // Create article via API request
    const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
        data: {
            "article": {
                "title": articleTitle,
                "description": "Created via API request",
                "body": "Article body content",
                "tagList": []
            }
        },
        headers: {
            authorization: `Token ${accessToken}`
        }
    })
    expect(articleResponse.status()).toEqual(201)
    
    // Verify article appears in UI
    await page.getByText('Global Feed').click();
    await page.waitForLoadState('networkidle');
    const createdArticle = page.locator('app-article-preview h1', { hasText: articleTitle }).first();
    await expect(createdArticle).toBeVisible();
    await createdArticle.click();
    
    // Delete article via UI
    await page.getByRole('button', {name: " Delete Article "}).first().click();
    await page.waitForLoadState('networkidle');
    
    // Verify article is deleted
    await page.getByText('Global Feed').click();
    await expect(page.locator('app-article-preview h1', { hasText: articleTitle })).toHaveCount(0)
})

// Test 4: Intercept browser API response - Capture article creation response
test('intercept browser API response - capture article slug from response', async({page, request}) =>{
    const interceptedTitle = `Intercepted Article ${Date.now()}`

    // Create article via UI
    await page.getByText('New Article').click();
    await page.getByRole('textbox', {name: "Article Title"}).fill(interceptedTitle)
    await page.getByRole('textbox', {name: "What's this article about?"}).fill("Testing response interception")
    await page.getByRole('textbox', {name: "Write your article (in markdown)"}).fill("Article content for testing")
    await page.getByRole('button', {name: ' Publish Article ' }).click();
    
    // Intercept the browser's API response to extract article slug
    const articleResponse = await page.waitForResponse(
        response => response.url().includes('/api/articles') && response.request().method() === 'POST'
    )
    const articleResponseBody = await articleResponse.json()
    const slugId = articleResponseBody.article.slug
    
    // Verify article was created
    await expect(page.locator('.article-page h1')).toContainText(interceptedTitle)
    
    // Navigate to home and verify article appears
    await page.getByText('Home').click();
    await page.getByText('Global Feed').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('app-article-preview h1', { hasText: interceptedTitle })).toBeVisible()
    
    // Clean up - delete article using API with the intercepted slug
    // API login moved to beforeEach
    // const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    //     data: {user: {email: "rock@wmail.com", password: "rockmountain12"}}
    // })
    // const loginBody = await loginResponse.json()
    // const accessToken = loginBody.user.token
    
    const deleteResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`, {
        headers: {
            authorization: `Token ${accessToken}`
        }
    })
    expect(deleteResponse.status()).toEqual(204)
})

//=======================
// Test 1: Mock API - replace tags with mock data

// Simple answer:
// “In this test, I intercept the tags API and return my own mock response from `tags.json`. Then I reload the page so the application uses the mocked data. This shows I know how to isolate the UI from backend dependency and make tests more stable.”

// What interviewer may ask:
// - Why mock this API?
//   To avoid dependency on real backend data and reduce flakiness.
// - Why reload the page?
//   Because the tags request happens during page load, so reload triggers the mocked call.
// - What does `route.fulfill()` do?
//   It returns a custom response to the browser instead of calling the real server.

// **Test 2: Modify API response - change article title and description**

// Simple answer:
// “In this test, I let the real articles API run, but I intercept the response and modify part of the data before the browser receives it. I change the first article title and description, then verify that the UI shows the modified values. This demonstrates response interception and dynamic API mocking.”

// What interviewer may ask:
// - Why use `route.fetch()`?
//   To get the original server response first, then edit it.
// - Why not fully mock the endpoint?
//   Because here I want to show I can modify real backend data, not replace the whole response.
// - What does this test prove?
//   It proves the UI reacts to API data and that I can control that data in Playwright.

// **Test 3: Perform API request - create and delete article via API**

// Simple answer:
// “In this test, I create the article through the backend API using the auth token, then I verify in the UI that the article appears. After that, I delete the article from the UI and confirm it is removed. This is a hybrid test: API for fast setup, UI for user-facing validation.”

// What interviewer may ask:
// - Why create the article by API?
//   Because it is faster and more reliable than creating test data through the UI.
// - Why still verify in the UI?
//   Because the user experience is in the UI, so I want to confirm the created data is visible there.
// - Why use the token in headers?
//   Because the create article endpoint requires authentication.

// **Test 4: Intercept browser API response - capture article slug from response**

// Simple answer:
// “In this test, I create the article through the UI, then I capture the browser’s POST response to the article API and extract the article slug from it. I use that slug to delete the article by API. This shows I can combine UI actions, response interception, and API cleanup.”

// What interviewer may ask:
// - Why capture the slug from the response?
//   Because the delete API needs the article slug, and the response gives it directly.
// - Why delete by API instead of UI?
//   Cleanup through API is usually faster and simpler.
// - What does `page.waitForResponse()` do here?
//   It waits for the article creation request to complete and lets me inspect that response.

// **Shared setup answer**

// If they ask about the `beforeEach` in this file:

// “I log in by API in `beforeEach`, extract the token, and inject it into `localStorage` using `page.addInitScript`. Then I open the site already authenticated. This avoids repeating UI login and keeps every test focused on its real purpose.”

// **Best short overall answer**

// “This file shows four API-testing skills in Playwright: mocking a request, modifying a live response, creating test data through API and verifying in UI, and capturing a browser API response for cleanup. The common pattern is using API where it is faster and UI where it is meaningful for user validation.”

// If you want, I can turn this into:
// - very simple English answers
// - mock interviewer Q&A for each test
// - a 1-minute spoken answer for the whole file

// •	Why login by API in beforeEach?
// Because it is faster and more stable than UI login, and every test needs an authenticated user.
// •	Why use page.addInitScript?
// Because it sets local storage before the page loads, so the app starts already logged in.
// •	Why use local storage here?
// Because this application stores auth token in localStorage.jwtToken.
// •	Why mock /api/tags?
// To control the test data and reduce flakiness.
// •	What is route.fetch()?
// It gets the original server response first, so I can modify it before returning it to the browser.
// •	Why create article by API and verify in UI?
// Because API is faster for setup, and UI is where I validate the user-facing behavior.
// •	Why delete by API?
// Cleanup is faster and more reliable through API.
// •	Why capture the slug?
// Because the delete endpoint needs the article slug.
// •	What is a weakness here?
// accessToken is stored in a shared variable and credentials are hardcoded.



////////////
// Mock API number 1
// test('mock API - replace tags with mock data', async({page}) =>{
//     // Mock the tags API to return custom data
//     await page.route('https://conduit-api.bondaracademy.com/api/tags', async route=>{
//         await route.fulfill({
//             body: JSON.stringify(tags)
//         })
//     })

// this is what happens:
// •	Playwright watches for requests to https://conduit-api.bondaracademy.com/api/tags
// •	when the page tries to call that API, Playwright catches it
// •	instead of letting the real backend answer, your code responds manually
// •	route.fulfill(...) sends a fake response back to the browser
// •	body: JSON.stringify(tags) means the browser receives your local tags object as JSON text
// “This code mocks the tags API. When the browser requests /api/tags, Playwright intercepts it and returns my custom JSON instead of calling the real server.”

// route.fulfill(): You return your own response. The real server is not used. Use it when you want to mock data.

// •	route.continue(): You let the request go to the real server.
// You can optionally modify request details like headers, method, or URL before sending it. Use it when you want the real backend response.

// •	route.abort(): You cancel the request completely. No response is returned from the server. Use it when you want to simulate network failure or block unnecessary resources.
// •	Why JSON.stringify(tags) is needed: Because the response body must be sent as text, not as a JavaScript object. Your tags variable is a JS object like this: { tags: ['automation', 'playwright'] } But HTTP response bodies are sent as strings or binary data.

///======================================//
//test 2
// What this test does
// “In this test, I intercept the articles API response, read the real response from the server, change some fields in the response body, and then send the modified response back to the browser. After that, I verify the UI shows the changed title and description.”
// Why I did this
// “I did this to show that I can control backend data during a UI test without changing the actual backend. It is useful for testing edge cases, special scenarios, or making test data predictable.”
// How it works
// •	articles*', ...) intercepts the browser request
// •	route.fetch() gets the original backend response
// •	response.json() converts that response into a JS object
// •	I change responseBody.articles[0].title and description
// •	route.fulfill(...) sends the modified response to the browser
// •	then I verify the UI renders those changed values
// Simple interview answer
// “This test intercepts the real articles API response, edits the first article’s title and description, and then checks whether the UI shows the modified data. It demonstrates response interception and dynamic mocking.”
// If they ask why not fully mock
// “I used route.fetch() because I wanted to keep the real response structure and only change specific fields. That is useful when I want partial control instead of replacing everything.”
// If they ask what skill this shows
// “It shows I understand Playwright network interception, response modification, and UI verification based on controlled backend data.”
// If you want, I can also give you:
// •	a very short 2-line answer
// •	likely follow-up questions for this exact test
// •	line-by-line explanation of that block
// Why did you use page.route() here?
// To intercept the browser request and control the response before the UI receives it.
// Why did you use route.fetch()?
// To get the real backend response first, then modify only the fields I need.
// Why not fully mock the whole API response?
// Because I wanted to keep the real response structure and only change specific values.
// What exactly are you modifying?
// The first article’s title and description.
// Why modify only the first article?
// It is a simple way to prove the interception works and to verify the UI updates with controlled data.
// What does response.json() do?
// It converts the API response body into a JavaScript object so I can edit it.
// Why do you use route.fulfill() after that?
// To send the modified response back to the browser.

// What would happen if you used route.continue() instead?
// The request would go to the real server without changing the response body.
// What would happen if page.route() was added after clicking Global Feed?
// The request might already be sent, and the interception might not work.
// Why click Global Feed?
// Because that action triggers the articles API request.
// How do you know the UI is showing modified data, not real data?
// Because I assert the first article title and description match the exact values I injected.
// What kind of problems can this test help you cover?
// Edge cases, unusual backend data, UI rendering checks, and deterministic test scenarios.
// What is one weakness of this test?
// It depends on the articles array having at least one article.
// How would you improve that?
// I could check the response contains at least one article before modifying it, or fully mock the response with known data.
// Is this more of a UI test or API test?
// It is mainly a UI test with network interception, because the final validation is in the browser UI.
// Why is this useful in interview discussion?
// Because it shows I understand Playwright beyond basic clicking and assertions, especially network control and response manipulation.


//===================================//



//=======================================================
//test 3
// Use this simple interview answer:

// “In this test, I create the article through the backend API instead of creating it through the UI. I send a POST request with the article data and the authentication token in the headers. After that, I open the UI and verify that the new article is visible. Then I delete the article and confirm it is removed. This approach is useful because API setup is faster, and UI verification still confirms the user-facing behavior.”

// How to explain step by step

// First, I log in through API in beforeEach
// I get the token from the login response
// I use that token in the authorization header
// I send a POST request to create the article
// I check that the response status is 201
// Then I go to the UI and confirm the article appears
// I delete the article
// Finally, I verify the article no longer appears
// What interviewer may ask

// Why create the article by API?
// Because it is faster and more reliable than creating test data through the UI.

// Why verify in the UI after API creation?
// Because I want to confirm that the user can actually see the created article in the application.

// Why do you need the token?
// Because the create article endpoint requires authentication.

// Why check for status 201?
// Because 201 means the resource was created successfully.

// Why use a unique title with Date.now()?
// To avoid duplicates and make the test data unique for each run.

// Why is this approach good for testing?
// It keeps setup fast and focuses UI validation on what really matters.

// Best short answer
// “I use API to create test data quickly, then UI to verify the result from the user’s perspective. That gives me both speed and realistic validation.”

// One correction:
// In your current file, this test creates the article by API, but deletes it through UI, not API. So in interview, say it accurately:

// “This test creates the article by API and deletes it through UI.”

// If you want, I can also prepare:

// exact mock interviewer questions for this test
// a spoken answer version
// a line-by-line explanation of this specific test
//============================================

// Use these as separate interview-ready explanations for each test in [workingWithAPi.spec.js](/c:/Users/USER/Desktop/sab/pw-practice-app/tests/workingWithAPi.spec.js).

// **Test 1: Mock API - replace tags with mock data**

// Simple answer:
// “In this test, I intercept the tags API and return my own mock response from `tags.json`. Then I reload the page so the application uses the mocked data. This shows I know how to isolate the UI from backend dependency and make tests more stable.”

// What interviewer may ask:
// - Why mock this API?
//   To avoid dependency on real backend data and reduce flakiness.
// - Why reload the page?
//   Because the tags request happens during page load, so reload triggers the mocked call.
// - What does `route.fulfill()` do?
//   It returns a custom response to the browser instead of calling the real server.

// **Test 2: Modify API response - change article title and description**

// Simple answer:
// “In this test, I let the real articles API run, but I intercept the response and modify part of the data before the browser receives it. I change the first article title and description, then verify that the UI shows the modified values. This demonstrates response interception and dynamic API mocking.”

// What interviewer may ask:
// - Why use `route.fetch()`?
//   To get the original server response first, then edit it.
// - Why not fully mock the endpoint?
//   Because here I want to show I can modify real backend data, not replace the whole response.
// - What does this test prove?
//   It proves the UI reacts to API data and that I can control that data in Playwright.

// **Test 3: Perform API request - create and delete article via API**

// Simple answer:
// “In this test, I create the article through the backend API using the auth token, then I verify in the UI that the article appears. After that, I delete the article from the UI and confirm it is removed. This is a hybrid test: API for fast setup, UI for user-facing validation.”

// What interviewer may ask:
// - Why create the article by API?
//   Because it is faster and more reliable than creating test data through the UI.
// - Why still verify in the UI?
//   Because the user experience is in the UI, so I want to confirm the created data is visible there.
// - Why use the token in headers?
//   Because the create article endpoint requires authentication.

// **Test 4: Intercept browser API response - capture article slug from response**

// Simple answer:
// “In this test, I create the article through the UI, then I capture the browser’s POST response to the article API and extract the article slug from it. I use that slug to delete the article by API. This shows I can combine UI actions, response interception, and API cleanup.”

// What interviewer may ask:
// - Why capture the slug from the response?
//   Because the delete API needs the article slug, and the response gives it directly.
// - Why delete by API instead of UI?
//   Cleanup through API is usually faster and simpler.
// - What does `page.waitForResponse()` do here?
//   It waits for the article creation request to complete and lets me inspect that response.

// **Shared setup answer**

// If they ask about the `beforeEach` in this file:

// “I log in by API in `beforeEach`, extract the token, and inject it into `localStorage` using `page.addInitScript`. Then I open the site already authenticated. This avoids repeating UI login and keeps every test focused on its real purpose.”

// **Best short overall answer**

// “This file shows four API-testing skills in Playwright: mocking a request, modifying a live response, creating test data through API and verifying in UI, and capturing a browser API response for cleanup. The common pattern is using API where it is faster and UI where it is meaningful for user validation.”

// If you want, I can turn this into:
// - very simple English answers
// - mock interviewer Q&A for each test
// - a 1-minute spoken answer for the whole file