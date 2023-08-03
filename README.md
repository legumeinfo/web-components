# `@legumeinfo/web-components`

**`@legumeinfo/web-components` is an [open-source](https://github.com/legumeinfo/web-components) Web Component library** for interacting with and visualizing biological data.
The Web Components can be used as is in your HTML or extended in your own JavaScript/TypeScript library.

## Documentation

Full user documentation for `@legumeinfo/web-components` is available on [our documentation site](https://legumeinfo.github.io/web-components/).
Technical documentation for developers is available on [GitHub](https://github.com/legumeinfo/web-components).
This README shows the basics of installing the library and using Web Components, but most features are only documented on our docs site.

## Getting started

`@legumeinfo/web-components` does not use the [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_Components/Using_shadow_DOM) in preference for inheriting global styles.
Specifically, `@legumeinfo/web-components` assumes [UIkit](https://getuikit.com/) has been loaded in the document, so be sure to install this before using the library.

Install the library as follows:

```
npm install @legumeinfo/web-components
```

The library can then be used in your HTML as follows:

```html
<head>
    <!-- UIkit -->
    <link rel="stylesheet" type="text/css" href="uikit/dist/css/uikit.min.css">
    <script src="uikit/dist/js/uikit.min.js"></script>
    <!-- @legumeinfo/web-components -->
    <script type="module" src="@legumeinfo/web-components/dist/web-components.min.js"></script>
</head>
<body>
    <lis-gene-search-element></lis-gene-search-element>
</body>
```

The library can be used in your JavaScript/TypeScrip library as follows:

```typescript
import { LisGeneSearchElement } from '@legumeinfo/web-components';

class MySearchElement extends LisGeneSearchElement { }
```
