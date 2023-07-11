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
        
        <!-- example script from TnT -->
        <script>
        var tree = tnt.tree()
            .data(tnt.tree.parse_newick("((human, chimp),mouse)"))
            .width(500)

        // The board
        var board = tnt.board()
            .width(400)
            .from(0)
            .to(1000)
            .max(1000);

        // The function to create tracks for each tree leaf
        var track = function (leaf) {
            var data = leaf.data();

            return tnt.board.track()
                .color("white")
                .data(tnt.board.track.data.sync()
                    .retriever (function () {
                        var elems = [];
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
        var vis = tnt()
            .tree(tree)
            .board(board)
            .track(track);
            vis(document.getElementById("mydiv"));
    </script>
    `;
    }

}
