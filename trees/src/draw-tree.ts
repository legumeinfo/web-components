type Species = {genus: string, species: string};


export class DrawTree extends HTMLElement {
    connectedCallback(){
	this._draw();
    }

    private _draw() {
	const treeElement = document.querySelector('phylo-tree');
	const treeName = treeElement.getAttribute('treename');
	const treeData = treeElement.getAttribute('treedata');
	this.innerHTML = `<div id="` + treeName + `"></div>`;
        const tree = tnt.tree();
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

customElements.define('phylo-tree', DrawTree);
