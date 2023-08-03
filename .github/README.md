# LIS Web Components

This repository contains a Web Component library developed for the Legume Information System and other AgBio databases.
The Web Components are built using [Lit](https://lit.dev/) and the [UIkit](https://getuikit.com/) CSS framework.
UIkit, however, is only listed as a development dependency and must be installed independently when using this library.

## Setup

Install dependencies:

```bash
npm i
```

## Build

This project uses the TypeScript compiler to produce JavaScript that runs in modern browsers.

To build the JavaScript version of the library:

```bash
npm run build
```

To watch files and rebuild when the files are modified, run the following command in a separate shell:

```bash
npm run build:watch
```

All built files will be placed in the `lib/` directory.

## Testing

This project uses modern-web.dev's
[@web/test-runner](https://www.npmjs.com/package/@web/test-runner) for testing. See the
[modern-web.dev testing documentation](https://modern-web.dev/docs/test-runner/overview) for
more information.

Tests can be run with the `test` script, which will run tests against Lit's development mode (with more verbose errors) as well as against Lit's production mode:

```bash
npm test
```

For local testing during development, the `test:dev:watch` command will run tests in Lit's development mode (with verbose errors) on every change to the source files:

```bash
npm test:watch
```

Alternatively the `test:prod` and `test:prod:watch` commands will run tests in Lit's production mode.

## Dev Server

This project uses modern-web.dev's [@web/dev-server](https://www.npmjs.com/package/@web/dev-server) for previewing the project without additional build steps. Web Dev Server handles resolving Node-style "bare" import specifiers, which aren't supported in browsers. It also automatically transpiles JavaScript and adds polyfills to support older browsers. See [modern-web.dev's Web Dev Server documentation](https://modern-web.dev/docs/dev-server/overview/) for more information.

To run the dev server and open the project in a new browser tab:

```bash
npm run serve
```

There is a development HTML file located at `/dev/index.html` that can be viewed at http://localhost:8000/dev/index.html. Note that this command will serve the code using Lit's development mode (with more verbose errors). To serve the code against Lit's production mode, use `npm run serve:prod`.

## Editing

If you use VS Code, we highly recommend the [lit-plugin extension](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin), which enables some extremely useful features for lit-html templates:

- Syntax highlighting
- Type-checking
- Code completion
- Hover-over docs
- Jump to definition
- Linting
- Quick Fixes

The project is setup to recommend lit-plugin to VS Code users if they don't already have it installed.

## Linting

Linting of TypeScript files is provided by [ESLint](eslint.org) and [TypeScript ESLint](https://github.com/typescript-eslint/typescript-eslint). In addition, [lit-analyzer](https://www.npmjs.com/package/lit-analyzer) is used to type-check and lint lit-html templates with the same engine and rules as lit-plugin.

The rules are mostly the recommended rules from each project, but some have been turned off to make LitElement usage easier.

To lint the project run:

```bash
npm run lint
```

## Formatting

[Prettier](https://prettier.io/) is used for code formatting. It has been pre-configured according to the Lit's style.

Prettier has not been configured to run when committing files so be sure to run it before pushing any changes.

## Static Site

This project includes a website generated with the [TypeDoc](https://typedoc.org/) documentation generator. The site is generated to the `/docs` directory and intended to be checked in so that GitHub pages can serve the site [from `/docs` on the main branch](https://help.github.com/en/github/working-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

To enable the site, go to the GitHub settings and change the GitHub Pages &quot;Source&quot; setting to &quot;main branch `/docs` folder&quot;.</p>

To build the site, run:

```bash
npm run docs
```

To serve the site locally, run:

```bash
npm run docs:serve
```

The site will usually be served at http://localhost:8000.

## Bundling and minification

Bundling and minification is performed in a single step using [Rollup](https://rollupjs.org/guide/en/).
The follow commands will bundle and minify whatever code is already in the `lib/` directory and place the bundled code in the file `dist/web-components.min.js`.

To bundle and minify the code, run:
```bash
npm run bundle
```

To automatically re-bundle when the code in the `lib/` directory changes, run:
```bash
npm run bundle:watch
```
