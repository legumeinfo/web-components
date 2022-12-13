import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

declare var tnt: any;

// webcomponent
@customElement('lis-phylotree-element')
export class LisPhylotreeElement extends LitElement {

//disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  // properties set and get
  @property({type: String, attribute: true})
  treeName = '';

  @property({type: String, attribute: true, reflect: true})
  newick = '';

  override attributeChangedCallback(propname: string, oldVal: string, newVal: string) {
    this.requestUpdate(propname, oldVal);
    if (propname == 'newick') {
      this.newick = newVal;
    }
    if (propname == 'treename') {
      this.treeName = newVal;
    }
    console.log(this.treeName, this.newick);
    this._drawTree();
    return newVal;
  }

  private _drawTree() {
    const treeDiv = this;
    const newick = this.newick;
    const treeName = this.treeName;
    if (!newick) {return false};
    if (!treeName) {return false};
    if (!treeDiv) {return false};
    console.log(newick, treeName, treeDiv);
    treeDiv.innerHTML = '';
    // The tree
    const tree =
      tnt.tree()
        .data(tnt.tree.parse_newick(newick))
        .layout (tnt.tree.layout.vertical().width(430).scale(false))
        .label (tnt.tree.label.text().height(30));
    console.log(tree, treeDiv);
    // The board
    const board =
    tnt.board()
        .width(400)
        .from(0)
        .to(1000)
        .max(1000);
    console.log(board);
    // The function to create tracks for each tree leaf
    const track = function (leaf: any) {
      const data = leaf.data();
      console.log(data);
  
      return tnt.board.track()
        .color('white')
        .data(tnt.board.track.data.sync()
          .retriever(function() {
  //          const elems: array = [];
            // populate elems and then return them
            return [];
          })
        )
        .display(tnt.board.track.feature.block()
          .color('steelblue')
          .index(function(d: any) {
            return d.start;
          })
        );
    }
    // The TnT Vis
    const vis =
      tnt()
        .tree(tree)
        //.board(board)
        .track(track);
    vis(treeDiv);
    return true;
  }

  private _testTree() {
    console.log(this);
    if (this.newick) {
      this.newick = "(Z,(D,C,E),B);"
    } else {
      this.newick = "(B,(A,C,E),D);";
    }
  }

  override render() {

    return html`
      <button @click="${this._testTree}">Draw Tree</button>
      `;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'lis-phylotree-element': LisPhylotreeElement;
  }
}
