import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await page.getByText('Forms').click();
  await page.getByText('Form Layouts').click();

})

// test.describe('suite 1',()=>{
//   test.beforeEach(async({page})=>{
//     // This will run before each test in this suite
//     await page.getByText('Forms').click();
//   })

//  test('first test', async ({ page }) => {
//   // Test logic goes here
//   await page.getByText('Form Layouts').click();
//   });

//   test('navigate to datepicker', async ({ page }) => {
//   await page.getByText('Datepicker').click();
//   });

// })


// test.describe('suite 2', () => {
//   test.beforeEach (async({page})=> {
//    await page.getByText('Modal & Overlays').click();
//   })
//  test('navigate to dialog', async ({ page }) => {
//   await page.getByText('Dialog').click();
//   });

//   test('navigate to windows', async ({ page }) => {
//   await page.getByText('Window').click();
//   });

// });


// test('locatores systex rules', async ({ page }) => {
//   page.locator('input')
// })

// test.skip('user facing locators', async({page})=>{

// await page.getByRole ('textbox', { name: 'Email' }).first().click();
// await page.getByRole('button', {name: 'Sign in' }).first().click();
// await page.getByLabel("email").first().click();
// await page.getByPlaceholder('Jane Doe').click();
// await page.getByText('Using the grid').click();
// await page.getByTitle('IoT Dashboard').click();

// })



// test('locator syntex rules', async({page}) => {
// //await page.locator('nb-card', {hasText: "Using the Grid"}).getByRole('textbox', {name:"Email"}).click();
// await page.locator('nb-card', {has: page.locator('#inputEmail1')}).getByRole('textbox', {name:"Email"}).click();
// })

//playwright has two type of assertion one general assertion 


test('assertion', async({page}) => {
const value = 5;
expect(value).toBeCloseTo(5)
})