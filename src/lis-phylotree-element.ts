import {html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisResizeObserverController} from './controllers';
import {circle} from './tnt/node-display';
import {globalSubstitution} from './utils/decorators';

declare const tnt: any;
declare const d3: any; // version 3

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
  static readonly AXIS_SAMPLE_PIXELS = 30;
  static readonly AXIS_TICKS = 12;
  static readonly LABEL_HEIGHT = 30;
  static readonly SCALE_HEIGHT = 40;
  static readonly TNT_LABEL_PADDING = 15;
  static readonly TNT_LEFT_RIGHT_MARGIN = 3;
  static readonly TNT_TRANSLATE = 20;

  // bind to the tree container div element in the template
  private _treeContainerRef: Ref<HTMLDivElement> = createRef();

  // bind to the scale container div element in the template
  private _scaleContainerRef: Ref<HTMLDivElement> = createRef();

  // a controller that allows element resize events to be observed
  protected resizeObserverController = new LisResizeObserverController(
    this,
    this.resize,
  );

  // HACK: this variable is used to prevent label clicks from triggering node clicks
  private _labelClicked = false;

  @state()
  private _data?: Phylotree;

  @property()
  layout: 'vertical' | 'radial' = 'vertical';

  @property({type: Boolean})
  scale: boolean = false;

  @property({type: Boolean})
  edgeLengths: boolean = false;

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
    this.makeTree();
    return html` <div
        style="overflow: hidden; margin: 0 ${LisPhylotreeElement.TNT_LEFT_RIGHT_MARGIN}px"
        ${ref(this._scaleContainerRef)}
      ></div>
      <div
        style="overflow: hidden;"
        ${ref(this._treeContainerRef)}
        ${ref(this.treeContainerReady)}
      ></div>`;
  }
  override createRenderRoot() {
    return this;
  }

  @globalSubstitution('d3', 'd3v3')
  makeTree() {
    if (
      this._data === undefined ||
      this._treeContainerRef.value === undefined ||
      this._scaleContainerRef.value === undefined
    ) {
      return;
    }

    // set the width of the tree, compenstating for sub-container margins
    const width =
      this._treeContainerRef.value.offsetWidth -
      LisPhylotreeElement.TNT_LEFT_RIGHT_MARGIN * 2;

    // reset the containers
    this._scaleContainerRef.value.innerHTML = '';
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
    const labels = tnt.tree.label
      .text()
      .height(LisPhylotreeElement.LABEL_HEIGHT);
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
      .data(this._data)
      .layout(
        tnt.tree.layout[this.layout]().width(width).scale(this.edgeLengths),
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

    // draw the tree in the container
    tree(this._treeContainerRef.value);

    if (!this.scale) {
      return;
    }

    // create the x-axis
    const distance = tree.scale_bar(
      LisPhylotreeElement.AXIS_SAMPLE_PIXELS,
      'pixel',
    );
    const translatedWidth =
      width -
      LisPhylotreeElement.TNT_TRANSLATE -
      LisPhylotreeElement.TNT_LABEL_PADDING;
    const scale = d3.scale
      .linear()
      .domain([0, (distance * width) / LisPhylotreeElement.AXIS_SAMPLE_PIXELS])
      .range([0, translatedWidth]);
    const axis = d3.svg
      .axis()
      .scale(scale)
      .ticks(LisPhylotreeElement.AXIS_TICKS)
      .orient('bottom');

    // draw the x-axis
    d3.select(this._scaleContainerRef.value)
      .append('svg')
      .attr('width', width)
      .attr('height', LisPhylotreeElement.SCALE_HEIGHT)
      .append('g')
      .attr(
        'transform',
        `translate(${LisPhylotreeElement.TNT_TRANSLATE}, ${LisPhylotreeElement.TNT_TRANSLATE})`,
      )
      .attr('width', translatedWidth)
      .attr('class', 'x axis')
      .call(axis);

    // set x-axis attributes
    d3.select(this._scaleContainerRef.value)
      .select('.domain')
      .attr('fill', 'none')
      .attr('stroke', 'black');
    d3.select(this._scaleContainerRef.value)
      .selectAll('g.tick > line')
      .attr('stroke', 'black');
    d3.selectAll(this._scaleContainerRef.value)
      .selectAll('g.tick > text')
      .style('font-size', '10px');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-phylotree-element': LisPhylotreeElement;
  }
}
