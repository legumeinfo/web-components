type Species = {genus: string, species: string};
import * as d3 from 'd3'
import * as tnt from 'tntvis'


declare var window: any;


function injectD3() {
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
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


export class PhyloTree extends HTMLElement {
    connectedCallback(){
	this._draw();
    }

    @injectD3()
    private _draw() {
	const treeElement = document.querySelector('lis-phylo-tree');
	const treeName = treeElement.getAttribute('treename');
	const treeData = treeElement.getAttribute('treedata');
	this.innerHTML = `<div id="` + treeName + `"></div>`;
        const tree = tnt.tree()
               .data(tnt.tree.parse_newick(treeData))
               .layout (tnt.tree.layout.vertical()
                                        .width(430)
                                        .scale(false))
               .label (tnt.tree.label.text()
                       .height(30)
                      );
  // The board
        const board = tnt.board()
                          .width(400)
                          .from(0)
                          .to(1000)
                          .max(1000);

  // The function to create tracks for each tree leaf
        const track = function (leaf) {
          const data = leaf.data();

          return tnt.board.track()
                           .color("white")
                           .data(tnt.board.track.data.sync()
                             .retriever (function () {
                               const elems = [];
                               // populate elems and then return them
                               return elems;
                             })
                           )
                           .display(tnt.board.track.feature.block()
                            .color("steelblue")
                            .index(function (d) {
                              return d.start;
                            })
                           );
        }

  // The TnT Vis
        const vis = tnt()
                     .tree(tree)
                     //.board(board)
                     .track(track);

        vis(document.getElementById(treeName));
    }
}

customElements.define('lis-phylo-tree', PhyloTree);
