# morlana-one

## Bot Detection

Many banks have sophisticated bot-detection that will block Playwright-controlled browsers from logging in, even if the user inputs are done by real humans.

So far, manually removing the [webdriver](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/webdriver) property through an [init script](https://playwright.dev/docs/evaluating) has been sufficient in tackling most cases. However, if more aggressive measures are found to be necessary in the future, refer to [this link](https://www.zenrows.com/blog/avoid-playwright-bot-detection#fortified-playwright) for potential next steps.
