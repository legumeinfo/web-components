import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('lis-phylotree')
export class LisPhylotree extends LitElement {
    @property()
    
    override render() {
        return html`
        <link rel="stylesheet" href="http://tntvis.github.io/tnt.tree/build/tnt.tree.css" type="text/css" />
        <script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
        <script src="http://tntvis.github.io/tnt.tree/build/tnt.tree.min.js" charset="utf-8"></script>
        `;
    }
}