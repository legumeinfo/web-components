import {html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisResizeObserverController} from './controllers';


declare var tnt: any;
declare var d3: any;


export type Phylotree = {
    name: string,
    length?: number,
    color?: string,
    children?: Phylotree[]
}


/**
 * The signature of the function of the
 * {@link LisPhylotreeElement | `LisPhylotreeElement`} class uses to color nodes by name.
 * Note that if a node already has a color it will be given precedence over the color
 * provided by this function.
 *
 * @param name The name of the being colored.
 *
 * @returns A string containing a valid CSS color value.
 */
export type ColorFunction = (name: string) => string;



@customElement('lis-phylotree')
export class LisPhylotree extends LitElement {

    // bind to the tree container div element in the template
    private _treeContainerRef: Ref<HTMLDivElement> = createRef();

    // a controller that allows element resize events to be observed
    protected resizeObserverController = new LisResizeObserverController(this, this.resize);
    
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

    @property({type: Function, attribute: false})
    colorFunction?: ColorFunction;

    private resize(entries: ResizeObserverEntry[]) {
      entries.forEach((entry: ResizeObserverEntry) => {
        if (entry.target == this._treeContainerRef.value && entry.contentBoxSize) {
          this.requestUpdate();
        }
      });
    }

    private treeContainerReady() {
      if (this._treeContainerRef.value) {
        this.resizeObserverController.observe(this._treeContainerRef.value);
      }
    }

    override render() { 
        this.makeTree(this._data);
        return html`<div style="overflow: hidden;" ${ref(this._treeContainerRef)} ${ref(this.treeContainerReady)}></div>`
    ;   
    }
    override createRenderRoot() {
        return this;
      }
      

    makeTree(theData: string|Phylotree)
    {
      if (this._treeContainerRef.value) {
        this._treeContainerRef.value.innerHTML = "";
        var height = 30;

        var tree = tnt.tree();
        tree
                    .data (theData)
                    .layout (tnt.tree.layout[this.layout]()
                    
                    .width(this._treeContainerRef.value.offsetWidth)
                        .scale(this.scale))
                    .node_display (tnt.tree.node_display.circle()
                        .size(5)
                        .fill((node: { data: any; }) => {
                            if(node.data().color == null || node.data().color == "")
                            {
                                if (this.colorFunction !== undefined && node.data().name) {
                                  return this.colorFunction(node.data().name);
                                }
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

    vis(this._treeContainerRef.value);
      }

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
