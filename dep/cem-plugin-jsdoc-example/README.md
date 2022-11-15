This is a copy of the Custom Elements Manifest (CEM) Analyzer plugin [cem-plugin-jsdoc-example](https://github.com/bennypowers/cem-plugins/tree/main/plugins/cem-plugin-jsdoc-example).
We're using a copy because the official plugin isn't compatible with the most recent version of the CEM Analyzer and we want parsed examples to be their own properties in the output JSON file, rather than having them added to their JSDoc node's description.

# cem-plugin-jsdoc-example

Adds (non-standard) "jsdoc-example" flag to class fields

## Example

`custom-elements-manifest.config.js`
```js
import { jsdocExamplePlugin } from 'cem-plugin-jsdoc-example';

export default {
  plugins: [
    jsdocExamplePlugin(),
  ]
}
```

`thing-doer.js`
```ts
/**
 * This is a description of the ThingDoer class.
 *
 * @element thing-doer
 *
 * @example Do a thing
 * ```html
 * <thing-doer id="my-thing-doer"></thing-doer>
 * ```
 *
 * @example Do another thing
 * ```javascript
 * const thingDoerInstance = document.getElementById('my-thing-doer');
 * ```
 */
export class ThingDoer { }
```

### Output
```json
{
  "schemaVersion": "1.0.0",
  "readme": "",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "thing-doer.js",
      "declarations": [
        {
          "kind": "class",
          "description": "This is a description of the ThingDoer class.",
          "name": "ThingDoer",
          "tagName": "thing-doer",
          "customElement": true,
          "examples" [
            {
              "description": Do a thing",
              "code": "```html\n<thing-doer></thing-doer>\n```"
            },
            {
              "description": Do another thing",
              "code": "```javascript\nconst thingDoerInstance = document.getElementById('my-thing-doer');\n```"
            }
          ]
        }
      ],
      "exports": [
        {
          "kind": "js",
          "name": "ThingDoer",
          "declaration": {
            "name": "ThingDoer",
            "module": "thing-doer.js"
          }
        }
      ]
    }
  ]
}
```
