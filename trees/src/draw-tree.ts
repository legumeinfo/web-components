import * as d3 from 'd3'
import * as tnt from 'tntvis'


// types

declare var window: any;


// decorators

function injectD3() {
  return function(target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = function(...args: any[]) {
      // swap in the require d3 version
      const globalD3 = window.d3;
      window.d3 = d3;
      // execute the method
      const result = original.apply(this, args);
      // swap back the original d3 version
      window.d3 = globalD3;
      // output the method's result
      return result;
    };

    return descriptor;
  };
}


// web components

export class PhyloTree extends HTMLElement {

  // attributes

  get newick(): string {
    return this.getAttribute('newick');
  }

  set newick(newick: string) {
    this.setAttribute('newick', newick);
  }

  static get observedAttributes() {
    return ['treename', 'newick'];
  }

  // callbacks

  connectedCallback(){
    this._draw();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this._draw();
  }

  // methods

  @injectD3()
  private _draw() {
    // remove any existing content from this element
    this.innerHTML = '';
    // get the element's attributes
    const treeName = this.getAttribute('treename');
    const newick = this.getAttribute('newick');
    // only draw if there's a tree to draw
    if (!newick) {
      return;
    }
    // create a container for the tree
    const treeDiv = document.createElement('div');
    treeDiv.setAttribute('id', treeName);
    this.appendChild(treeDiv);
    // The tree
    const tree =
      tnt.tree()
        .data(tnt.tree.parse_newick(newick))
        .layout (tnt.tree.layout.vertical().width(430).scale(false))
        .label (tnt.tree.label.text().height(30));
    // The board
    const board =
      tnt.board()
        .width(400)
        .from(0)
        .to(1000)
        .max(1000);

    // The function to create tracks for each tree leaf
    const track = function (leaf) {
      const data = leaf.data();

      return tnt.board.track()
        .color('white')
        .data(tnt.board.track.data.sync()
          .retriever(function() {
            const elems = [];
            // populate elems and then return them
            return elems;
          })
        )
        .display(tnt.board.track.feature.block()
          .color('steelblue')
          .index(function(d) {
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
    }
}


customElements.define('lis-phylo-tree', PhyloTree);
