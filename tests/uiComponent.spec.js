import {test, expect } from '@playwright/test';
import { table } from 'console';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:4200/');

})

test.describe('form layouts page', () => {
          test.beforeEach(async({page}) => {
          await page.getByText('Forms').click();
          await page.getByText('Form Layouts').click();
    })
test('input fields', async({page}) => {
    const usingTheGridEmailInput = page.locator('nb-card', {hasText: "Using the Grid"}).getByRole('textbox', {name: 'Email'})
    await usingTheGridEmailInput.fill('test@test@tmail.com');
    await usingTheGridEmailInput.clear();
    await usingTheGridEmailInput.pressSequentially('test2@tmail.com', {delay:500});

    //generec assertion
    const inputValue = await usingTheGridEmailInput.inputValue()
    expect (inputValue).toEqual('test2@tmail.com')

    //locator assertion
    await expect(usingTheGridEmailInput).toHaveValue('test2@tmail.com')
})  

test('radio button', async({page}) => {
  const usingTheGridForm = page.locator('nb-card', {hasText: 'Using the Grid'})
 // usingTheGridForm.highlight
  await usingTheGridForm.getByRole('radio', {name: 'Option 1'}).check({force:true})
  //await usingTheGridForm.getByLabel('Option 1').check({force:true})
  
  //generic assertion
  const radioStatus = await usingTheGridForm.getByRole('radio', {name: "Option 1"}).isChecked()
  expect(radioStatus).toBeTruthy()

  //locaotr assertion
  await expect(usingTheGridForm.getByRole('radio', {name: "Option 1"})).toBeChecked()
})
})

test('checkbox', async ({page}) =>{
  await page.getByText('Modal & Overlays').click()
  await page.getByText('Toastr').click();
  await page.getByRole('checkbox', {name: "Hide on click"}).check({force: true});
  const assertionCheckbox = page.getByRole('checkbox', {name: "Hide on click"})
  expect(assertionCheckbox).toBeChecked();
})


//for...of - For Array Values; Use when iterating over array values or iterables:
//for...in - For Object Properties (Keys), Use when iterating over object keys
test('lists and dropdown', async ({page}) =>{
  const dropDownMenu = page.locator('ngx-header nb-select')
  await dropDownMenu.click();
  page.getByRole('list') //when the list has a UL tag
  page.getByRole('listitem') //when the list has LI tag

  //const listItems = page.getByRole('list').locator('nb-option')
  const listItems = page.locator('nb-option-list nb-option ')
  await expect(listItems).toHaveText(["Light", "Dark", "Cosmic", "Corporate"])
  await listItems.filter({hasText: "Cosmic"}).click();
  const header = page.locator('nb-layout-header')
  await expect(header).toHaveCSS('background-color', 'rgb(50, 50, 89)')

  const colors = {
    "Light": "rgb(255, 255, 255)",
    "Dark": "rgb(34, 43, 69)",
    "Cosmic": "rgb(50, 50, 89)" ,
    "Corporate": "rgb(255, 255, 255)"
  }
  await dropDownMenu.click();
  for (const color in colors){
    await listItems.filter({hasText: color}).click();
    await expect(header).toHaveCSS('background-color', colors[color])
    if (color != "Corporate")
    await dropDownMenu.click();
  }

})

test('tooltip', async({page}) =>{
  await page.getByText('Modal & Overlays').click()
  await page.getByText('Tooltip').click();
  const toolTopCard = page.locator('nb-card', {hasText: "Tooltip Placements"})
  await toolTopCard.getByRole('button', {name: 'Top'}).hover();
  page.getByRole("tooltip") //if we have role tooptip created
  const tooltip = await page.locator('nb-tooltip').textContent()
  expect(tooltip).toEqual('This is a tooltip')
})

test('dialog box', async ({page}) =>{
//dialog box easy to automate but it tricky dificult when diolog box is belong to browser not webpage
  await page.getByText('Tables & Data').click()
  await page.getByText('Smart Table').click();
  // Creating lisener 
  page.on("dialog", diolog =>{
    expect(diolog.message()).toEqual('Are you sure you want to delete?')
    diolog.accept()
    })

    await page.getByRole('table').locator('tr', {hasText: "mdo@gmail.com"}).locator('.nb-trash').click();
  
    await expect(page.locator('table tr').first()).not.toHaveText('mdo@gmail.com')
})

test("table-1" , async({page}) =>{
   await page.getByText('Tables & Data').click()
   await page.getByText('Smart Table').click();
   // how to get row by any test in this row
   const targerRow = page.getByRole('row', {name: 'mdo@gmail.com'})
   await targerRow.locator(".nb-edit").click();
   await page.locator('input-editor').getByPlaceholder('Age').clear()
   await page.locator('input-editor').getByPlaceholder('Age').fill('35')
   await page.locator(".nb-checkmark").click();
   //get the row based on the Value in the specific column
   await page.locator('nav ul').getByText('2').click();
   const targetRowById = page.getByRole('row', {name: "11"}).filter({has: page.locator('td').nth(1).getByText('11')})
   targetRowById.locator('.nb-edit').click();
   await page.locator('input-editor').getByPlaceholder('E-mail').clear()
   await page.locator('input-editor').getByPlaceholder('E-mail').fill('ska@mmm.com')
   await page.locator('.nb-checkmark').click();
   await expect(targetRowById.locator('td').nth(5)).toHaveText('ska@mmm.com')

   //test filter of the table

   const ages = ["20", "30", '40', "200"]

   for (let age of ages){
     await page.locator('input-filter').getByPlaceholder('age').clear()
    await page.locator('input-filter').getByPlaceholder('age').fill(age)
    await page.waitForTimeout(500)
    // this locator gives us all the rows inside the table
    const agerows = page.locator("tbody tr")
    for (let row of await agerows.all()){
      const cellValue = await row.locator('td').last().textContent()
      //expect (cellValue).toEqual(age)
      if (age== '200'){
        expect(await page.getByRole('table').textContent()).toContain('No data found')
       } else{
        expect(cellValue).toEqual(age)
       }
    }
   }


})

test.only("date-picker", async({page})=>{
  await page.getByText('Forms').click()
  await page.getByText("Datepicker").click()

  const calendarInputField = page.locator('nb-card-body').getByPlaceholder("Form Picker")
  await calendarInputField.click()
  await page.locator('[class="day-cell ng-star-inserted"]').getByText("30", {exact: true}).click()
  await expect(calendarInputField).toHaveValue('Mar 30, 2026')

})


test("smart date-picker", async({page})=>{
  await page.getByText('Forms').click()
  await page.getByText("Datepicker").click()

  const calendarInputField = page.getByPlaceholder('Form Picker')
  await calendarInputField.click();

  let date = new Date()
  date.setDate(date.getDate() + 1)

  const expectedDate = date.getDate().toString()

const expectedMonthshot = date.toLocaleString('En-US', {month: "short"})
const expectedYear = date.getFullYear()
const dateToAssert = `${expectedMonthshot} ${expectedDate}, ${expectedYear}`


  
  await page.locator('[class="day-cell ng-star-inserted"]').getByText(expectedDate, {exact: true}).click()
  await expect (calendarInputField).toHaveValue(dateToAssert)

})


test("smart date-picker can select next month", async({page})=>{
  await page.getByText('Forms').click()
  await page.getByText("Datepicker").click()

   const calendarInputField = page.getByPlaceholder('Form Picker')
  await calendarInputField.click();
  //creates a Date object with today's date and current time.
  let date = new Date()
  //
  date.setDate(date.getDate() + 14)

  //date.getDate() Returns: 20 (a number) 
  //date.getDate().toString() Returns: "20" (a string)

  const expectedDate = date.getDate().toString()

const expectedMonthshot = date.toLocaleString('en-US', {month: "short"})
const expectedMonthlong = date.toLocaleString('en-US', {month: "long"})
const expectedYear = date.getFullYear()
const dateToAssert = `${expectedMonthshot} ${expectedDate}, ${expectedYear}`

let calendarMonthYear = await page.locator('nb-calendar-view-mode').textContent()
const expectedMonthYear = `${expectedMonthlong} ${expectedYear}`
while (!calendarMonthYear.includes(expectedMonthYear)) {
await page.locator("nb-calendar-pageable-navigation [data-name='chevron-right']").click();
calendarMonthYear = await page.locator('nb-calendar-view-mode').textContent()
}
 
  await page.locator('[class="day-cell ng-star-inserted"]').getByText(expectedDate, {exact: true}).click()
  await expect (calendarInputField).toHaveValue(dateToAssert)

})

test("sliders", async ({page})=>{
const tenparatureGauge = page.locator('[tabtitle="Temperature"] ngx-temperature-dragger circle' )
await tenparatureGauge.evaluate(node =>{
  node.setAttribute('cx', '242.630')
  node.setAttribute('cy', '242.630')
})
await tenparatureGauge.click();
//mouse movement
const tempBix = page.locator('[tabtitle="Temperature"] ngx-temperature-dragger circle' )
await tempBix.scrollIntoViewIfNeeded()
const box = await tempBix.boundingBox()
const x =box.x + box.width /2
const y = box.y + box.height /2
await page.mouse.move(x, y)
await page.mouse.down()  
await page.mouse.move(x+100, y)
await page.mouse.move(x+100, y+100)
await page.mouse.up()
const tempText = page.locator('[tabtitle="Temperature"] .temperature')
await expect(tempText).toContainText('30')
})

