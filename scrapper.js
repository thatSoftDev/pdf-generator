const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    const url = argv.url;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url);

    const pageLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a'), element => element.href));
    const matchingLinks = matchLinks(url, pageLinks);
    const storageDir = './pdfs/';
    let counter = 0;

    if (!fs.existsSync(storageDir)){
        fs.mkdirSync(storageDir);
    }

    for (let matchingLink of [...new Set(matchingLinks)]) {
        await createPDF(page, matchingLink, storageDir, counter);
        counter++
        console.log('\x1b[33m%s\x1b[0m', 'Files left: ' + ([...new Set(matchingLinks)].length - counter));
    }    

    await browser.close();
})();

async function createPDF(page, matchingLink, storageDir, counter) {
    try {
        await page.goto(matchingLink, {waitUntil: 'networkidle2'});
        await page.pdf({path: `${storageDir + counter}-${matchingLink.split('/')[matchingLink.split('/').length - 1]}.pdf`, format: 'A4'});
    } catch (error) {
        console.error(error);
    }
}

function matchLinks(url, pageLinks) {
    const regex = new RegExp(url, 'g');
    let matchingLinks = [];

    for (let pageLink of pageLinks) {
        if(pageLink.match(regex) && !pageLink.includes('#')) {
            matchingLinks.push(pageLink)
        }
    };

    return matchingLinks;
}
