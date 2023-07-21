import {html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

declare var tnt: any;

export type Phylotree = {
    name: string,
    length?: number,
    color?: string,
    children?: Phylotree[]
}



@customElement('lis-phylotree')
export class LisPhylotree extends LitElement {

    @state()
    private _data: string|Phylotree = "";
    

    @property()
    set tree(tree: string|Phylotree){
        if(typeof tree == "string")
        {
            this._data = tnt.tree.parse_newick(tree); 
        }
        else{
            this._data = tree;
        }
    }

    override render() { 
        this.makeTree(this._data)
        return html``

    ;   
    }
    override createRenderRoot() {
        return this;
      }
    
    makeTree(theData: string|Phylotree)
    {
        var height = 30;

        // Create tree
        var tree = tnt.tree();
        tree
                    .data (theData)
                    .layout (tnt.tree.layout.vertical()
                        .width(430)
                        .scale(false))
                    .node_display (tnt.tree.node_display.circle()
                        .size(5)
                        .fill(function (node: { data: any; }) {
                            if(node.data().color == null || node.data().color == "")
                            {
                                return "gray"
                            }
                            return node.data().color;
                        })
                    )
                        
                .label (tnt.tree.label.text()
                    .height(height)
                );
    

    var vis = tnt()
        .tree(tree)

    vis(this);
    // vis.update();
    
    }
}