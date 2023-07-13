import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

declare var tnt: any;


@customElement('lis-phylotree')
export class LisPhylotree extends LitElement {
    @property()
    input: any = prompt("Enter nweick tree: (ie: (B:0.2,(C:0.3,D:0.4)E:0.5)F:0.1)A; )");


    
    override render() {
        this.makeTree(this.input)
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