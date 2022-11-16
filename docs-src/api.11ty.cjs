/**
 * This page generates its content from the custom-element.json file as read by
 * the _data/api.11tydata.js script.
 */
class Docs {

  /**
   * The method 11ty will use to generate the front matter of the template.
   */
  data() {
    return {
      layout: 'page.11ty.cjs',
      title: '<my-element> ⌲ Docs',
    };
  }

  /**
   * The method 11ty will call to render the template.
   */
  render(data) {
    const manifest = data.api['11tydata'].customElements;
    const elements = manifest.modules.reduce(
      (els, module) =>
        els.concat(
          module.declarations?.filter((dec) => dec.customElement) ?? []
        ),
      []
    );
    return `
      <h1>API</h1>
      ${elements
        .map(
          (element) => `
            <h2>&lt;${element.tagName}></h2>
            <div>
              ${element.description}
            </div>
            ${this.renderTable(
              'Attributes',
              ['name', 'description', 'type.text', 'default'],
              element.attributes
            )}
            ${this.renderTable(
              'Properties',
              ['name', 'attribute', 'description', 'type.text', 'default'],
              element.members.filter((m) => m.kind === 'field' && (m.privacy === undefined || m.privacy === 'public'))
            )}
            ${this.renderTable(
              'Methods',
              ['name', 'parameters', 'description', 'return.type.text'],
              element.members
                .filter((m) => m.kind === 'method' && m.privacy !== 'private')
                .map((m) => ({
                  ...m,
                  parameters: this.renderTable(
                    '',
                    ['name', 'description', 'type.text'],
                    m.parameters
                  ),
                }))
            )}
            ${this.renderTable('Events', ['name', 'description'], element.events)}
            ${this.renderTable(
              'Slots',
              [['name', '(default)'], 'description'],
              element.slots
            )}
            ${this.renderTable(
              'CSS Shadow Parts',
              ['name', 'description'],
              element.cssParts
            )}
            ${this.renderTable(
              'CSS Custom Properties',
              ['name', 'description'],
              element.cssProperties
            )}
            ${this.renderExamples(element.examples)}
          `
        ).join('')
      }
    `;
  }

  /**
   * Reads a (possibly deep) path off of an object.
   */
  get(obj, path) {
    let fallback = '';
    if (Array.isArray(path)) {
      [path, fallback] = path;
    }
    const parts = path.split('.');
    while (obj && parts.length) {
      obj = obj[parts.shift()];
    }
    return obj == null || obj === '' ? fallback : obj;
  }

  /**
   * Renders a table of data, plucking the given properties from each item in
   * `data`.
   */
  renderTable(name, properties, data) {
    if (data === undefined || data.length === 0) {
      return '';
    }
    return `
      ${name ? `<h3>${name}</h3>` : ''}
      <table>
        <tr>
          ${properties
            .map(
              (p) =>
                `<th>${this.capitalize(
                  (Array.isArray(p) ? p[0] : p).split('.')[0]
                )}</th>`
            )
            .join('')}
        </tr>
        ${data
          .map(
            (i) => `
          <tr>
            ${properties.map((p) => `<td>${this.get(i, p)}</td>`).join('')}
          </tr>
        `
          )
          .join('')}
      </table>
    `;
  }

  /**
   * Renders examples.
   */
  renderExamples(examples) {
    if (examples === undefined || examples.length === 0) {
      return '';
    }
    return `
      <h3>Examples</h3>
      ${examples
        .map(
          (example) => `
            <p>${example.caption}</p>
            ${this.highlight(example.language, example.code)}
          `
        )
      }
    `;
  }

  capitalize(s) {
    return s[0].toUpperCase() + s.substring(1);
  }

}

module.exports = Docs;
