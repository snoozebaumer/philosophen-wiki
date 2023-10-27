const {Builder, By} = require('selenium-webdriver');
const {Options} = require('selenium-webdriver/firefox');

async function isClickable(element) {
    const style = await element.getAttribute('style');
    return style !== null && !style.includes('text-decoration: underline');
}

async function doesNotContainImage(link) {
    const imageTags = await link.findElements(By.tagName('img'));
    return imageTags.length === 0;
}

async function isInsideParentheses(link) {
    const parentText = await link.findElement(By.xpath('..')).getText();
    const linkText = await link.getText();
    console.log()
    let regexRound = new RegExp('\\((.*' + linkText + '.*)\\)');
    let regexSquare = new RegExp('\\[(.*' + linkText + '.*)\\]');

    return (parentText.match(regexRound) || parentText.match(regexSquare));
}

const maxClicks = 200;

(async function () {
    const options = new Options();
    const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();

    try {
        await driver.get('https://de.wikipedia.org/wiki/Spezial:Zuf%C3%A4llige_Seite');
        //await driver.get('https://de.wikipedia.org/wiki/Sprachwissenschaft');
        let clickCount = 0;

        while (clickCount < maxClicks) {
            const articleLinks = await driver.findElements(By.css('#mw-content-text a:not(#toc a,figure a, .navigation-not-searchable a, table a)')); //.navigation-not-searchable a schliesst die Weiterleitungshinweise(Artikelbeginn) aus.
            let validLinks = [];


            for (let link of articleLinks.slice(0, 30)) {
                const linkText = await link.getText();
                console.log("System --> Link: " + linkText)

                if (!(await isInsideParentheses(link))) {
                    console.log("System --> textInsideParentheses --> " + linkText);
                    if (await isClickable(link)) {
                        console.log("System --> isClickable(link) --> " + linkText);
                        if (await doesNotContainImage(link)) {
                            console.log("System --> doesNotContainImage(link) --> " + linkText);
                            validLinks.push(link);
                            break;
                        }
                    }
                }
            }

            if (validLinks.length === 0) {
                console.log('No valid links found on this page. Exiting.');
                break;
            }

            const link = validLinks[0];
            const text = await link.getText();
            console.log("link clicked:" + text)
            await link.click();
            console.log("_______________________________________________________________________________________________________________________________________________________________________")

            clickCount++;

            if ((await driver.getTitle()).includes('Philosophie')) {
                console.log('Reached the "Philosophie" page. Exiting.');
                break;
            }

            await driver.sleep(4000); // Wait for the page to load
        }
    } finally {
        await driver.quit();
    }
})();