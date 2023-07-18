import {html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

declare var tnt: any;

export type Phylotree = {
    name: string,
    length?: number,
    children?: Phylotree[]
}



@customElement('lis-phylotree')
export class LisPhylotree extends LitElement {
    @state()
    private _data = {};
    
    @property()
    tree: string|Phylotree;


    set data(tree: string|Phylotree){
        if(typeof tree == "string")
        {
            this._data = tnt.tree.parse_newick(tree)
        }

    }

    override render() { 
        this.makeTree(this.tree)
        return html``
                
    ;
    }
    override createRenderRoot() {
        return this;
      }
    
    makeTree(newick: string)
    {
        var height = 30;

        // Create tree
        var tree = tnt.tree();

    tree
                .data (tnt.tree.parse_newick (newick))
                .layout (tnt.tree.layout.vertical()
                    .width(430)
                    .scale(false))
                .label (tnt.tree.label.text()
                    .height(height)
                );
    

    var vis = tnt()
        .tree(tree)

    vis(this);
    // vis.update();
    
    }
}