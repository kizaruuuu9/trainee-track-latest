import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

        // Quick login
        await page.waitForSelector('button', { timeout: 2000 });
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Admin Login')) {
                await btn.click();
                break;
            }
        }

        await page.waitForTimeout(2000); // Wait for dashboard and fetch

        // Click Manage Trainees
        const navItems = await page.$$('.sidebar-nav-item');
        for (const item of navItems) {
            const text = await page.evaluate(el => el.textContent, item);
            if (text.includes('Manage Trainees')) {
                await item.click();
                break;
            }
        }

        await page.waitForTimeout(2000); // Wait for table

        // Dump Table
        const tableHTML = await page.evaluate(() => {
            const table = document.querySelector('.data-table');
            return table ? table.innerHTML : 'NO TABLE FOUND';
        });

        console.log("TABLE HTML:");
        console.log(tableHTML);
    } catch (err) {
        console.error(err);
    } finally {
        await browser.close();
    }
})();
