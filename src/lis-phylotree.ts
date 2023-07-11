import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

declare var tnt: any;

@customElement('lis-phylotree')
export class LisPhylotree extends LitElement {
    @property()
    input: string = "(:0.1,:0.2,(:0.3,:0.4):0.5)";


    
    override render() {
        this.makeTree(this.input)
        return html``
                
    ;
    }
    makeTree(theInput: string)
    {
        var tree = tnt.tree()
            .data(tnt.tree.parse_newick(theInput))
            .width(500)

        // The board
        var board = tnt.board()
            .width(400)
            .from(0)
            .to(1000)
            .max(1000);

        // The function to create tracks for each tree leaf
        var track = function (_leaf: { data: () => any; }) {

            return tnt.board.track()
                .color("white")
                .data(tnt.board.track.data.sync()
                    .retriever (function () {
                        var elems: never[] = [];
                        // populate elems and then return them
                        return elems;
                    })
                )
                .display(tnt.board.track.feature.block()
                    .color("steelblue")
                    .index(function (d: { start: any; }) {
                        return d.start;
                    })
                );
        }


        // The TnT Vis
        var vis = tnt()
            .tree(tree)
            .board(board)
            .track(track);
            vis(this);
    }


}