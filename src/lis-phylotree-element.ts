import {html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisResizeObserverController} from './controllers';
import {circle} from './tnt/node-display';
import {globalSubstitution} from './utils/decorators';

declare const tnt: any;
//declare const d3: any;

export type Phylotree = {
  name: string;
  length?: number;
  color?: string;
  children?: Phylotree[];
};

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

/**
 * The signature of the function of the
 * {@link LisPhylotreeElement | `LisPhylotreeElement`} class calls when a node in the
 * phylotree has been clicked.
 *
 * @param node An instand of the TnT Tree Node class for the node that was clicked.
 */
export type ClickFunction = (node: unknown) => void;

@customElement('lis-phylotree-element')
export class LisPhylotreeElement extends LitElement {
  // bind to the tree container div element in the template
  private _treeContainerRef: Ref<HTMLDivElement> = createRef();

  // a controller that allows element resize events to be observed
  protected resizeObserverController = new LisResizeObserverController(
    this,
    this.resize,
  );

  // HACK: this variable is used to prevent label clicks from triggering node clicks
  private _labelClicked = false;

  @state()
  private _data: string | Phylotree = '';

  @property()
  layout: 'vertical' | 'radial' = 'vertical';

  @property()
  scale: boolean = false;

  @property()
  set tree(tree: string | Phylotree) {
    if (typeof tree == 'string') {
      this._data = tnt.tree.parse_newick(tree);
    } else {
      this._data = tree;
    }
  }

  // a function used to assign colors to nodes based on their name
  @property({type: Function, attribute: false})
  colorFunction?: ColorFunction;

  // a function called when a node is clicked;
  // the TnT Tree Node object that was clicked is passed as the argument
  @property({type: Function, attribute: false})
  nodeClickFunction?: ClickFunction;

  // a function called when a leaf node label is clicked;
  // the TnT Tree Node object the clicked label belongs to is passed as the argument
  @property({type: Function, attribute: false})
  labelClickFunction?: ClickFunction;

  private resize(entries: ResizeObserverEntry[]) {
    entries.forEach((entry: ResizeObserverEntry) => {
      if (
        entry.target == this._treeContainerRef.value &&
        entry.contentBoxSize
      ) {
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
    return html`<div
      style="overflow: hidden;"
      ${ref(this._treeContainerRef)}
      ${ref(this.treeContainerReady)}
    ></div>`;
  }
  override createRenderRoot() {
    return this;
  }

  @globalSubstitution('d3', 'd3v3')
  makeTree(theData: string | Phylotree) {
    if (this._treeContainerRef.value) {
      const height = 30;

      // reset the tree container
      this._treeContainerRef.value.innerHTML = '';

      // styles a D3 selection if the given clickFunction is defined
      const selectionClickStyleFactory = (clickFunction?: ClickFunction) => {
        return (selection: any) => {
          if (clickFunction !== undefined) {
            return selection.style('cursor', 'pointer');
          }
          return selection;
        };
      };

      // configure the nodes
      // NOTE: this uses a local copy of the tnt.tree.node_display.circle
      // function because node CSS attributes can't be modified programmatically
      // using only the TnT API
      const nodes = circle(selectionClickStyleFactory(this.nodeClickFunction))
        .size(5)
        .fill((node: {data: any}) => {
          if (node.data().color == null || node.data().color == '') {
            if (this.colorFunction !== undefined && node.data().name) {
              return this.colorFunction(node.data().name);
            }
            return 'white';
          }
          return node.data().color;
        });

      // configure the node labels
      const labels = tnt.tree.label.text().height(height);
      const defaultLabelDisplay = labels.display();
      const labelClickFunction = this.labelClickFunction;
      labels.display(function (...args: unknown[]) {
        // @ts-expect-error 'this' implicitly has type 'any'
        const selection = defaultLabelDisplay.call(this, ...args);
        return selectionClickStyleFactory(labelClickFunction)(selection);
      });

      // create the tree
      const tree = tnt
        .tree()
        .data(theData)
        .layout(
          tnt.tree.layout[this.layout]()
            .width(this._treeContainerRef.value.offsetWidth)
            .scale(this.scale),
        )
        .node_display(nodes)
        .label(labels);

      // add a node click listener
      if (this.nodeClickFunction !== undefined) {
        const instance = this;
        tree.on('click', function (node: unknown) {
          if (!instance._labelClicked) {
            // @ts-expect-error 'this' implicitly has type 'any'
            instance.nodeClickFunction.call(this, node);
          }
          instance._labelClicked = false;
        });
      }

      // add a label click listener
      const instance = this;
      labels.on('click', function (node: unknown) {
        instance._labelClicked = true;
        if (instance.labelClickFunction !== undefined) {
          // @ts-expect-error 'this' implicitly has type 'any'
          instance.labelClickFunction.call(this, node);
        }
      });

      const vis = tnt().tree(tree);

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

declare global {
  interface HTMLElementTagNameMap {
    'lis-phylotree-element': LisPhylotreeElement;
  }
}
