const {Builder, By, until} = require('selenium-webdriver');
const {Options} = require('selenium-webdriver/firefox');


const GOAL = "Philosophie"; // The goal page
const MAX_CLICKS = 200; // The maximum number of clicks before the program exits without finding the goal page

const RANOOM_PAGE = "https://de.wikipedia.org/wiki/Spezial:Zuf%C3%A4llige_Seite";

/**
 * Checks if an element is clickable. A Link on wikipedia is clickable if it is visible and not underlined.
 * @param element
 * @returns {Promise<boolean>}
 */
async function isClickable(element) {
    const style = await element.getAttribute('style');
    return style !== null && !style.includes('text-decoration: underline') && await element.isDisplayed();
}

/**
 * Checks if an element contains an image. This is used to not be caught in an image viewer that obfuscates the article text.
 * @param link
 * @returns {Promise<boolean>}
 */
async function containsImage(link) {
    const imageTags = await link.findElements(By.tagName('img'));
    return imageTags.length > 0;
}

/**
 *
 * @param link
 * @returns {Promise<boolean>}
 */
async function isCitation(link) {
    const linkHrefText = await link.getAttribute('href');

    return linkHrefText.includes('#cite_note');
}

/**
 * Removes content within brackets or braces from the page source. Links in parentheses are explicitly excluded in the assignment.
 * I'm guessing the reason is that they tend to be dates and locations, which aren't helpful in finding the specific goal page.
 * Parentheses also tend to have the phonetic spelling of names in them, which would be a curve ball.
 * May prolong the search for a different goal page.
 * @param driver
 * @returns {Promise<void>}
 */
async function removeBracesAndBrackets(driver) {
    const pageSource = await driver.getPageSource();

    /* Use regex to remove content within brackets or braces,matches most cases, there are some weird edge cases with nested braces. excludes parentheses within <a> tags as we want to click those
    *  may need to be further optimized, as regex often misses matches in nested braces for some reason (should work in theory), But it reaches the goal page in a reasonable amount of clicks for now.
     */
    const cleanPageSource = pageSource.replace(/(\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\})(?![^<]*<\/a>)/g, '');

    // Load the modified page source into the browser
    await driver.executeScript('document.documentElement.innerHTML = arguments[0]', cleanPageSource);
    await driver.sleep(1000);
}

/**
 * Checks if the current page is the goal page.
 * @param driver
 * @param pageTitle
 * @returns {Promise<*>}
 */
function isGoalPage(pageTitle) {
    return pageTitle.includes(GOAL);
}

/**
 * compares the link href to a list of visited links to check if the link has been visited before.
 * @param linkHref
 * @param visitedLinks
 * @returns {*}
 */
function hasLinkBeenVisited(linkHref, visitedLinks) {
    return visitedLinks.includes(linkHref);
}

function isWikipediaLink(linkHref) {
    return linkHref.includes('wikipedia.org');
}

async function isValidLink(link, linkHrefText, visitedLinks) {
    return await isClickable(link) && !(await containsImage(link)) && !(await isCitation(link)) && !hasLinkBeenVisited(linkHrefText, visitedLinks) && isWikipediaLink(linkHrefText);
}

(async function () {
    const options = new Options();
    const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();

    try {
        await driver.get(RANOOM_PAGE);

        const startPage = await driver.getTitle();
        // are we already on the goal page? -> exit
        if (await isGoalPage(startPage)) {
            console.log('Already on the ' + GOAL + ' page. Exiting.');
            return;
        }

        let visitedLinks = [];
        let clickCount = 0;
        while (clickCount < MAX_CLICKS) {
            await removeBracesAndBrackets(driver);

            /*
            * .navigation-not-searchable a excludes redirection message at article start, figure a excludes text under images (placed before article text in DOM, thus excluded to emulate human behaviour),
            * toc a excludes table of contents, table a excludes links in tables (tends to be placed before article text in DOM), i a excludes cursive links (external links, or irrelevant links)
            * */
            const articleLinks = await driver.findElements(By.css('#mw-content-text a:not(#toc a,figure a, .navigation-not-searchable a, table a, i a)'));

            let validLinks = [];

            // only select the first 30 links to optimize performance, as there usually tends to be a valid link within the first 30
            for (let link of articleLinks.slice(0, 30)) {
                const linkHrefText = await link.getAttribute('href');

                if (await isValidLink(link, linkHrefText, visitedLinks)) {
                    validLinks.push(link);
                    visitedLinks.push(linkHrefText);
                    break;
                }
            }

            if (validLinks.length === 0) {
                console.log('No valid links found on this page. Exiting.');
                break;
            }

            const link = validLinks[0];
            const text = await link.getText();

            await link.click();
            console.log("link clicked:" + text)

            clickCount++;

            if ((await isGoalPage(await driver.getTitle()))) {
                console.log('Reached the ' + GOAL +  ' page from \"' + startPage +'\" in ' + clickCount + ' clicks. Exiting.');
                break;
            }

            // wait for the page title to be displayed with timeout 2s, to make sure the page has loaded
            await driver.wait(until.elementLocated(By.className('mw-page-title-main')), 2000);
        }
    } finally {
        await driver.quit();
    }
})();