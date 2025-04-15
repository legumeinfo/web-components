import {html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisResizeObserverController} from './controllers';
import {circle} from './tnt/node-display';
import {globalSubstitution} from './utils/decorators';

declare const tnt: any;
declare const d3: any; // version 3

/**
 * The structure a phylotree must have if given to the
 * {@link LisPhylotreeElement | `LisPhylotreeElement`} as an object.
 */
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
export type ClickFunction = (tree: unknown, node: unknown) => void;

/**
 * @htmlElement `<lis-phylotree-element>`
 *
 * A Web Component that draws a phylotree provided as either a Newick string or a
 * {@link Phylotree | `Phylotree`} object. Note that the component fills all of the
 * available horizontal space and will automatically redraw if the width of its parent
 * element changes.
 *
 * @example
 * The `<lis-phylotree-element>` tag requires the
 * {@link https://tntvis.github.io/tnt.tree/ | TnT Tree} library, which itself requires
 * <b>version 3</b> of {@link https://d3js.org/ | D3}. To allow multiple versions of D3 to
 * be used on the same page, the {@link LisPhylotreeElement | `LisPhylotreeElement`} class
 * uses the global `d3v3` variable if it has been set. Otherwise it uses the global `d3`
 * variable by default. The following is an example of how to include these dependencies
 * in the page and set the `d3v3` variable:
 * ```html
 * <!-- head -->
 *
 * <!-- D3 version 3-->
 * <script src="http://d3js.org/d3.v3.min.js"></script>
 *
 * <!-- another version of D3 -->
 * <script type="text/javascript">
 *   var d3v3 = d3;
 *   window.d3 = undefined;
 * </script>
 * <script src="http://d3js.org/d3.v7.min.js"></script>
 *
 * <!-- TnT -->
 * <link rel="stylesheet" href="http://tntvis.github.io/tnt/build/tnt.css" type="text/css" />
 * <script src="http://tntvis.github.io/tnt/build/tnt.min.js"></script>
 *
 * <!-- body -->
 *
 * <!-- add the Web Component to your HTML -->
 * <lis-phylotree-element></lis-phylotree-element>
 * ```
 *
 * @example
 * {@link !HTMLElement | `HTMLElement`} properties can only be set via JavaScript. This means the
 * {@link colorFunction | `colorFunction`}, {@link nodeClickFunction | `nodeClickFunction`}, and
 * {@link labelClickFunction | `labelClickFunction`} properties must be set on a
 * `<lis-phylotree-element>` tag's instance of the
 * {@link LisPhylotreeElement | `LisPhylotreeElement`} class. Similarly, if the
 * {@link tree | `tree`} property will be set to a {@link Phylotree | `Phylotree`} object, rather
 * than a Newick string, then it too must be set via the class instance. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-phylotree-element id="phylotree"></lis-phylotree-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // returns a color given label of a node'
 *   function nodeColor(label) {
 *     // returns a color for the given label
 *   }
 *   // label click function that gets passed the TnT Tree and the TnT Node
 *   // associated with the label and is called in the TnT context
 *   function labelClick(tree, node) {
 *     // `this` is the TnT context
 *   }
 *   // node click function that gets passed the TnT Tree and the clicked TnT node
 *   // and is called in the TnT context
 *   function nodeClick(tree, node) {
 *     // `this` is the TnT context
 *   }
 *   // get the phylotree element
 *   const phylotreeElement = document.getElementById('phylotree');
 *   // set the element's properties
 *   phylotreeElement.colorFunction = nodeColor;
 *   phylotreeElement.labelClickFunction = labelClick;
 *   phylotreeElement.nodeClickFunction = nodeClick;
 * </script>
 * ```
 *
 * @example
 * The {@link layout | `layout`}, {@link scale | `scale`}, and {@link edgeLengths | `edgeLengths`}
 * properties can be set as attributes of the `<lis-phylotree-element>` tag or as properties of the
 * tag's instance of the {@link LisPhylotreeElement | `LisPhylotreeElement`} class.
 * {@link layout | `layout`} sets the layout of the phylotree to `vertical` or `radial` (`vertical`
 * by default). {@link scale | `scale`} determines whether or not an edge length scale will be
 * shown with the tree (`false` by default). And {@link edgeLengths | `edgeLengths`} determines
 * whether edges should be drawn using unit length or using length data provided by the tree (unit,
 * i.e. `false`, by default). For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-phylotree-element
 *   tree="(B:6.0,(A:5.0,C:3.0,E:4.0)G:5.0,D:11.0);"
 *   layout="radial"
 *   scale
 *   edgeLengths
 * ></lis-phylotree-element>
 * <lis-phylotree-element id="phylotree"></lis-phylotree-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // get the gene search element
 *   const phylotreeElement = document.getElementById('phylotree');
 *   // set the element's properties
 *   phylotreeElement.layout = 'radial';
 *   phylotreeElement.scale = true;
 *   phylotreeElement.edgeLengths = true;
 * </script>
 * ```
 */
@customElement('lis-phylotree-element')
export class LisPhylotreeElement extends LitElement {
  static readonly AXIS_SAMPLE_PIXELS = 30;
  static readonly AXIS_TICKS = 12;
  static readonly SCALE_HEIGHT = 40;
  static readonly TNT_LEFT_RIGHT_MARGIN = 3;
  static readonly TNT_TRANSITION_DURATION = 500;
  static readonly TNT_TRANSLATE = 20;

  // disable shadow DOM to inherit global styles, i.e. TnT styles
  override createRenderRoot() {
    return this;
  }

  // bind to the tree container div element in the template
  private _treeContainerRef: Ref<HTMLDivElement> = createRef();

  // bind to the scale container div element in the template
  private _scaleContainerRef: Ref<HTMLDivElement> = createRef();

  // a controller that allows element resize events to be observed
  protected resizeObserverController = new LisResizeObserverController(
    this,
    this._resize,
  );

  // HACK: this variable is used to prevent label clicks from triggering node clicks
  private _labelClicked = false;

  @state()
  private _data?: Phylotree;

  // the current instance of the TnT Tree
  private _tree: unknown;

  /**
   * The layout the tree should be drawn in.
   *
   * @attribute
   */
  @property()
  layout: 'vertical' | 'radial' = 'vertical';

  /**
   * Determines whether or not a scale for the edge lengths will be drawn.
   *
   * @attribute
   */
  @property({type: Boolean})
  scale: boolean = false;

  /**
   * Determines whether or not edge lengths are given by the tree. If not, each
   * edge will be given unit length.
   *
   * @attribute
   */
  @property({type: Boolean})
  edgeLengths: boolean = false;

  /**
   * Sets the pixel height of each label element.
   *
   * @attribute
   */
  @property({type: Number})
  labelHeight: number = 15;

  /**
   * The tree data.
   *
   * @attribute
   */
  @property()
  set tree(tree: string | Phylotree) {
    if (typeof tree == 'string') {
      this._data = tnt.tree.parse_newick(tree);
    } else {
      this._data = tree;
    }
  }

  /**
   * A function used to assign colors to nodes based on their name.
   */
  @property({type: Function, attribute: false})
  colorFunction?: ColorFunction;

  /**
   * A function called when a node is clicked;
   * the TnT Tree Node object that was clicked is passed as the argument.
   */
  @property({type: Function, attribute: false})
  nodeClickFunction?: ClickFunction;

  /**
   * A function called when a leaf node label is clicked;
   * the TnT Tree Node object the clicked label belongs to is passed as the argument.
   */
  @property({type: Function, attribute: false})
  labelClickFunction?: ClickFunction;

  /**
   * Determines if label click events are propagated to the node they are associated with.
   * If so, this will trigger the node label click function. If a label click function and
   * a node click function has been assigned, both click functions will be called.
   *
   * @attribute
   */
  @property({type: Boolean})
  labelClickPropagation: boolean = false;

  private _resize(entries: ResizeObserverEntry[]) {
    entries.forEach((entry: ResizeObserverEntry) => {
      // @ts-expect-error Property 'layout' does not exist on type '{}'
      const drawnWidth = this._tree?.layout().width();
      if (
        entry.target == this._treeContainerRef.value &&
        drawnWidth !== this._treeWidth()
      ) {
        this.requestUpdate();
      }
    });
  }

  private _treeContainerReady() {
    if (this._treeContainerRef.value) {
      this.resizeObserverController.observe(this._treeContainerRef.value);
    }
  }

  override render() {
    this._drawTree();
    this._drawScale();
    return html` <div
        style="overflow: hidden; margin: 0 ${LisPhylotreeElement.TNT_LEFT_RIGHT_MARGIN}px"
        ${ref(this._scaleContainerRef)}
      ></div>
      <div
        style="overflow: hidden;"
        ${ref(this._treeContainerRef)}
        ${ref(this._treeContainerReady)}
      ></div>`;
  }

  @globalSubstitution('d3', 'd3v3')
  private _emitNodeClick(context: unknown, node: unknown) {
    this.nodeClickFunction?.call(context, this._tree, node);
  }

  @globalSubstitution('d3', 'd3v3')
  private _emitLabelClick(context: unknown, node: unknown) {
    this.labelClickFunction?.call(context, this._tree, node);
  }

  private _treeWidth(): number {
    if (this._treeContainerRef.value === undefined) {
      return 0;
    }
    // compenstate for sub-container margins
    return (
      this._treeContainerRef.value.offsetWidth -
      LisPhylotreeElement.TNT_LEFT_RIGHT_MARGIN * 2
    );
  }

  private _actualTreeWidth(): number {
    if (this._treeContainerRef.value === undefined) {
      return 0;
    }
    // compenstate for tree position and padding
    return (
      this._treeWidth() -
      LisPhylotreeElement.TNT_TRANSLATE -
      // @ts-expect-error Object is of type 'unknown'
      this._tree.layout().max_leaf_label_width()
    );
  }

  @globalSubstitution('d3', 'd3v3')
  private _drawTree() {
    if (
      this._data === undefined ||
      this._treeContainerRef.value === undefined
    ) {
      return;
    }

    // reset the container
    this._treeContainerRef.value.innerHTML = '';

    // set the width of the tree
    const width = this._treeWidth();

    // styles a D3 selection if the given clickFunction is defined
    const selectionClickStyleFactory = (clickFunction: unknown) => {
      return (selection: any) => {
        if (clickFunction) {
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
    const labels = tnt.tree.label.text().height(this.labelHeight);
    const defaultLabelDisplay = labels.display();
    const clickable =
      this.labelClickFunction ||
      (this.nodeClickFunction && this.labelClickPropagation);
    labels.display(function (...args: unknown[]) {
      // @ts-expect-error 'this' implicitly has type 'any'
      const selection = defaultLabelDisplay.call(this, ...args);
      return selectionClickStyleFactory(clickable)(selection);
    });

    // create the tree
    this._tree = tnt
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
      // @ts-expect-error Object is of type 'unknown'
      this._tree.on('click', function (node: unknown) {
        if (!instance._labelClicked || instance.labelClickPropagation) {
          // @ts-expect-error 'this' implicitly has type 'any'
          instance._emitNodeClick(this, node);
        }
        instance._labelClicked = false;
      });
    }

    // add a label click listener
    const instance = this;
    labels.on('click', function (node: unknown) {
      instance._labelClicked = true;
      if (
        instance.labelClickFunction !== undefined ||
        (instance.nodeClickFunction && instance.labelClickPropagation)
      ) {
        // @ts-expect-error 'this' implicitly has type 'any'
        instance._emitLabelClick(this, node);
      }
    });

    // draw the tree in the container
    // @ts-expect-error Object is of type 'unknown'
    this._tree(this._treeContainerRef.value);
  }

  /**
   * Recursively computes the maximum distance from the root node.
   *
   * @param node The next node in the recursive traversal.
   */
  private _maxRootDist(node: any): number {
    if (node.is_leaf()) {
      return node.root_dist();
    }
    const rootDists = node.children().map((c: any) => this._maxRootDist(c));
    return Math.max(...rootDists);
  }

  // NOTE: this should be called from contexts with correct version of D3
  private _xAxis() {
    if (this._scaleContainerRef.value === undefined) {
      return;
    }

    // @ts-expect-error Object is of type 'unknown'
    const domain = this._maxRootDist(this._tree?.root());

    // @ts-expect-error Object is of type 'unknown'
    const distance = this._tree.scale_bar(
      LisPhylotreeElement.AXIS_SAMPLE_PIXELS,
      'pixel',
    );
    const range = this._actualTreeWidth();
    const scale = d3.scale.linear().domain([0, domain]).range([0, range]);
    const axis = d3.svg
      .axis()
      .scale(scale)
      .ticks(LisPhylotreeElement.AXIS_TICKS)
      .orient('bottom');

    return axis;
  }

  @globalSubstitution('d3', 'd3v3')
  private _drawScale() {
    if (
      !this.scale ||
      this._tree === undefined ||
      this._scaleContainerRef.value === undefined
    ) {
      return;
    }

    // reset the container
    this._scaleContainerRef.value.innerHTML = '';

    const width = this._treeWidth();
    const actualWidth = this._actualTreeWidth();

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
      .attr('width', actualWidth)
      .attr('class', 'x-axis');
    this._updateXAxis(0);
  }

  @globalSubstitution('d3', 'd3v3')
  private _updateXAxis(
    duration: number = LisPhylotreeElement.TNT_TRANSITION_DURATION,
  ) {
    d3.select(this._scaleContainerRef.value)
      .select('.x-axis')
      .transition()
      .duration(duration)
      .call(this._xAxis());
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

  /**
   * Calls the `.update()` method on the component's instance of the TnT Tree. This should be used
   * in preference of calling the `.update()` method directly when using the scale property because
   * this method will also update the scale to reflect updates in the tree.
   */
  @globalSubstitution('d3', 'd3v3')
  updateTree() {
    // update the tree
    // @ts-expect-error Object is of type 'unknown'
    this._tree.update();
    // update the x-axis
    setTimeout(() => {
      this._updateXAxis();
    }, LisPhylotreeElement.TNT_TRANSITION_DURATION);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-phylotree-element': LisPhylotreeElement;
  }
}
