import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisResizeObserverController} from '../controllers';
import {globalSubstitution} from '../utils/decorators';

declare const d3: any; // version 7

/**
 * The structure each entry in the data given to the
 * {@link LisLegendElement | `LisLegendElement`} component must have.
 */
export type LegendEntry = {
  label: string;
  color?: string;
};

/**
 * The structure legend data must have when given to the
 * {@link LisLegendElement | `LisLegendElement`} component.
 */
export type LegendData = {
  entries: LegendEntry[];
};

/**
 * The signature of the function used by the
 * {@link LisLegendElement | `LisLegendElement`} class to color legend entries.
 * Note that if an entry already has a color it will be given precedence over the color
 * provided by this function.
 *
 * @param entry The entry being colored.
 *
 * @returns A string containing a valid CSS color value.
 */
export type LegendColorFunction = (entry: LegendEntry) => string;

/**
 * The signature of the function the {@link LisLegendElement | `LisLegendElement`}
 * class calls when an entry in the legend has been clicked.
 *
 * @param entry The entry that was clicked.
 */
export type LegendClickFunction = (entry: LegendEntry) => void;

/**
 * @htmlElement `<lis-legend-element>`
 *
 * A Web Component that draws a legend for data provided as a {@link LegendData | `LegendData`}
 * object. Note that the component fills all of the available horizontal space and will
 * automatically redraw if the width of its parent element changes.
 *
 * @example
 * The `<lis-legend-element>` tag requires the <b>version 7</b> of {@link https://d3js.org/ | D3}.
 * To allow multiple versions of D3 to be used on the same page, the
 * {@link LisLegendElement | `LisLegendElement`} class uses the global `d3v7` variable if it has
 * been set. Otherwise it uses the global `d3` variable by default. The following is an example of
 * how to include D3 in the page and set the `d3v7` variable:
 * ```html
 * <!-- head -->
 *
 * <!-- D3 version ? -->
 * <script src='http://d3js.org/d3.v7.min.js'></script>
 *
 * <!-- another version of D3 -->
 * <script type='text/javascript'>
 *   var d3v7 = d3;
 *   window.d7 = undefined;
 * </script>
 * <script src='http://d3js.org/d3.v3.min.js'></script>
 *
 * <!-- body -->
 *
 * <!-- add the Web Component to your HTML -->
 * <lis-legend-element></lis-legend-element>
 * ```
 */
@customElement('lis-legend-element')
export class LisLegendElement extends LitElement {
  static readonly GLYPH_MARGIN = 5;
  static readonly GLYPH_SIZE = 15;

  // disable shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  // bind to the tree container div element in the template
  private _legendContainerRef: Ref<HTMLDivElement> = createRef();

  // a controller that allows element resize events to be observed
  protected resizeObserverController = new LisResizeObserverController(
    this,
    this._resize,
  );

  /**
   * The layout the legend should be drawn in.
   *
   * @attribute
   */
  //@property()
  //layout: 'vertical' | 'horizontal' = 'vertical';

  /**
   * The glyph to use for each element in the legend.
   *
   * @attribute
   */
  @property()
  glyph: 'circle' | 'square' = 'circle';

  /**
   * Draws the legend more compactly by putting the text of each entry inside of its glyph.
   *
   * @attribute
   */
  //@property({type: Boolean})
  //compact: boolean = false;

  /**
   * The legend data.
   *
   * @attribute
   */
  @property()
  data: LegendData = {entries: []};

  /**
   * A function used to assign colors to entries.
   */
  //@property({type: Function, attribute: false})
  //colorFunction?: LegendColorFunction;

  /**
   * A function called when an entry is clicked;
   * the entry that was clicked is passed as the argument.
   */
  //@property({type: Function, attribute: false})
  //clickFunction?: LegendClickFunction;

  private _resize(entries: ResizeObserverEntry[]) {
    entries.forEach((entry: ResizeObserverEntry) => {
      // TODO: compare legend width to container width
      //const drawnWidth = this._tree?.layout().width();
      if (entry.target == this._legendContainerRef.value) {
        this.requestUpdate();
      }
    });
  }

  private _legendContainerReady() {
    if (this._legendContainerRef.value) {
      this.resizeObserverController.observe(this._legendContainerRef.value);
    }
  }

  override render() {
    this._drawLegend();
    return html` <div
      style="overflow: hidden;"
      ${ref(this._legendContainerRef)}
      ${ref(this._legendContainerReady)}
    ></div>`;
  }

  private _legendWidth(): number {
    if (this._legendContainerRef.value === undefined) {
      return 0;
    }
    // compenstate for sub-container margins
    return this._legendContainerRef.value.offsetWidth;
  }

  @globalSubstitution('d3', 'd3v7')
  private _drawLegend() {
    if (this._legendContainerRef.value === undefined) {
      return;
    }

    // reset the container
    this._legendContainerRef.value.innerHTML = '';

    // set the width of the tree
    const width = this._legendWidth();
    const n = this.data.entries.length;
    const height =
      n * LisLegendElement.GLYPH_SIZE + (n + 1) * LisLegendElement.GLYPH_MARGIN;

    // create the SVG element
    const svg = d3.create('svg').attr('width', width).attr('height', height);

    // add legend to DOM
    this._legendContainerRef.value.append(svg.node());

    // variables
    const rx = this.glyph == 'circle' ? LisLegendElement.GLYPH_SIZE / 2 : 0;

    // add a group for each entry
    this.data.entries.forEach((e, i) => {
      const y =
        i * LisLegendElement.GLYPH_SIZE +
        (i + 1) * LisLegendElement.GLYPH_MARGIN;
      const entry = svg.append('g').attr('transform', `translate(0, ${y})`);
      // add glyph
      entry
        .append('rect')
        .attr('width', LisLegendElement.GLYPH_SIZE)
        .attr('height', LisLegendElement.GLYPH_SIZE)
        .attr('rx', rx)
        .style('fill', e.color);
      // add label
      entry
        .append('text')
        //.attr('font-size', LisLegendElement.GLYPH_SIZE)
        .attr('line-height', LisLegendElement.GLYPH_SIZE)
        .attr('font-size', LisLegendElement.GLYPH_SIZE / 1.2)
        .attr('x', LisLegendElement.GLYPH_SIZE + LisLegendElement.GLYPH_MARGIN)
        .style('dominant-baseline', 'middle')
        .attr('y', LisLegendElement.GLYPH_SIZE / 2)
        .text(e.label);
    });

    // add glyphs
    /*
    svg.selectAll('glyphs')
      .data(this.data.entries)
      .enter()
      .append('circle')
        .attr('cx', 100)
        // @ts-expect-error 'd' is declared but its value is never read
        .attr('cy', (d, i) => LisLegendElement.GLYPH_SIZE + i * LisLegendElement.GLYPH_MARGIN)
        .attr('r', 7)
        .style('fill', (d: LegendEntry) => d.color)
    */

    // add labels
    /*
    svg.selectAll('labels')
      .data(this.data.entries)
      .enter()
      .append('text')
        .attr('x', 120)
        .attr('y', function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
        .style('fill', function(d){ return color(d)})
        .text(function(d){ return d})
        .attr('text-anchor', 'left')
        .style('alignment-baseline', 'middle')
    */
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-legend-element': LisLegendElement;
  }
}
