# philosophen-wiki

philosophen-wiki is a browser automation project using [Selenium](https://www.selenium.dev/) automating the [Wiki Game](https://en.wikipedia.org/wiki/Wikipedia:Wiki_Game).

Starting on a random article on wikipedia, it clicks on the first link, as long as they aren't cursive, in braces[^1] or lead to an external website. This goes on until a maximum amount of clicks or until it reaches the goal article, which can be defined in main.js:
    
```javascript 
5: const GOAL = "Philosophie"; // The goal page
6: const MAX_CLICKS = 200; // The maximum number of clicks before the program exits without finding the goal page
```

In order to prevent click through loops within similar topics (which the first link usually seems to lead to), the previously visited links are tracked. If the first link has already been visited, the program skips onto the next link.

> :warning: Due to the simplicity of the program, it will probably not find very specific goal pages, as the first link usually leads to a more general topic.

[^1]: Used to implement [Wiki Game rules](https://en.wikipedia.org/wiki/Wikipedia:Wiki_Game#The_Don'ts): Cursive links tend to be links to external sources or outside of page source. Braces usually contain dates.

## How to run
Run npm install to install selenium-webdriver:
```bash
npm install
```
Then run the program:
```bash
npm start
```
