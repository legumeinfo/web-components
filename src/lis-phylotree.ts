import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

declare var tnt: any;
var height = 30;

// Create tree and board
var tree = tnt.tree();
var board = tnt.board();

var data = {
    'homo_sapiens' : [
	{
	    type  : 'high',
	    start : 700,
	    end   : 800
	},
	{
	    start : 350,
	    end   : 423
	}
    ],
    'pan_troglodytes' : [
	{
	    start : 153,
	    end   : 160
	},
	{
	    start : 250,
	    end   : 333
	},
	{
	    start : 550,
	    end   : 633
	}
    ],
    'callithrix_jacchus' : [
	{
	    type  : 'high',
	    start : 250,
	    end   : 333
	}
    ],
    'mus_musculus' : [
	{
	    type  : 'high',
	    start : 24,
	    end   : 123
	},
	{
	    start : 553,
	    end   : 564
	}
    ],
    'taeniopygia_guttata' : [
	{
	    start : 450,
	    end   : 823
	}
    ],
    'danio_rerio' : [
	{
	    start : 153,
	    end   : 165
	}
    ]
};

@customElement('lis-phylotree')
export class LisPhylotree extends LitElement {
    @property()
    input: string = "(((((homo_sapiens,pan_troglodytes),callithrix_jacchus),mus_musculus),taeniopygia_guttata),danio_rerio);";


    
    override render() {
        this.makeTree(this.input)
        return html``
                
    ;
    }
    makeTree(newick: string)
    {
    tree
                .data (tnt.tree.parse_newick (newick))
                .layout (tnt.tree.layout.vertical()
                    .width(430)
                    .scale(false))
                .label (tnt.tree.label.text()
                    .height(height)
                );


    var track = function (leaf_node: { data: () => any; }) {
        var leaf = leaf_node.data();
        var sp = leaf.name;
        return tnt.board.track()
            .color("#EBF5FF")
            .data (tnt.board.track.data.sync()
                .retriever (function () {
                    return data[sp] || [];
                })
            )
            .display(tnt.board.track.feature.ensembl()
                .color("green")
                .index(function (d: { start: any; }) {
                    return d.start;
                })
            );
    };

    var axis_top = tnt.board.track()
        .height(0)
        .color("white")
        .display(tnt.board.track.feature.axis()
            .orientation("top")
        );

    var axis_bottom = tnt.board.track()
        .height(18)
        .color("white")
        .display(tnt.board.track.feature.axis()
            .orientation("bottom")
        );

    var vis = tnt()
        .tree(tree)
        .key('name')
        .top(axis_top)
        .bottom(axis_bottom)
        .board(board)
        .track(track);

    vis(this);
    }
}