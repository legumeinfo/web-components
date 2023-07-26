import {html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';


declare var tnt: any;
declare var d3: any;


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
    layout: "vertical"|"radial" = "vertical";

    @property()
    scale: boolean = false;

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
      

    makeTree(theData: string|Phylotree, width?: number)
    {     
          let prevWidth = 0;
          
          const widthObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
              const width = entry.borderBoxSize?.[0].inlineSize;
              if (typeof width === 'number' && width !== prevWidth) {
                prevWidth = width;
                this.makeTree(theData, width);
              }
            }
          });
        widthObserver.observe(this);
        var height = 30;

        var tree = tnt.tree();
        tree
                    .data (theData)
                    .layout (tnt.tree.layout[this.layout]()
                    
                    .width(width)
                        .scale(this.scale))
                    .node_display (tnt.tree.node_display.circle()
                        .size(5)
                        .fill(function (node: { data: any; }) {
                            if(node.data().color == null || node.data().color == "")
                            {
                                return "white";
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

    // var scaleBar = vis.scale_bar(50, "pixel").toFixed(3);
    // var legend = d3.select(this);
    
    // legend
    //     .append("div")
    //     .style({ 
    //         width:"50px",
    //         height:"5px",
    //         "background-color":"steelblue",
    //         margin:"6px 5px 5px 25px",
    //         float: "left"
    //     });
    
    // legend
    //     .append("text")
    //     .style({
    //         "font-size": "12px"
    //     })
    //     .text(scaleBar);

    }
}