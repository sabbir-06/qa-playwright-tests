import {test, expect } from '@playwright/test';

test("drag and drop with iframe", async({page})=>{
    await page.goto("https://www.globalsqa.com/demo-site/draganddrop/")

    const frame = page.frameLocator('[rel-title="Photo Manager"] iframe')
    const item = frame
        .locator('li')
        .filter({ has: frame.locator('h5', { hasText: /^High Tatras 2$/ }) })
    const gallery = frame.locator('#gallery li')
    const trashItems = frame.locator('#trash li')

    await expect(gallery).toHaveCount(4)
    await expect(trashItems).toHaveCount(0)

    await item.dragTo(frame.locator('#trash'))

    await expect(gallery).toHaveCount(3)
    await expect(trashItems).toHaveCount(1)

    //most preciout mouse control
    await frame.locator('li', {hasText: ("High Tatras 4")}).hover()
    await page.mouse.down()
    await frame.locator("#trash").hover()
    await expect(frame.locator('#trash li h5' )).toHaveText(["High Tatras 2", "High Tatras 4"])
})