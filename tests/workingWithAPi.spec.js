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

