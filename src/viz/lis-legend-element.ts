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
  @property()
  layout: 'vertical' | 'horizontal' = 'vertical';

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
  @property({type: Boolean})
  compact: boolean = false;

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
  @property({type: Function, attribute: false})
  colorFunction?: LegendColorFunction;

  /**
   * A function called when an entry is clicked;
   * the entry that was clicked is passed as the argument.
   */
  @property({type: Function, attribute: false})
  clickFunction?: LegendClickFunction;

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

    // create the SVG element
    const width = this._legendWidth();
    const svg = d3.create('svg').attr('width', width);
    this._legendContainerRef.value.append(svg.node());

    // variables
    const radius = this.glyph == 'circle' ? LisLegendElement.GLYPH_SIZE / 2 : 0;
    const padding = Math.max(radius, LisLegendElement.GLYPH_MARGIN);
    const color = this.compact ? '#FFFFFF' : 'inherit';

    // add a group for each entry
    let x = 0;
    let row = 0;
    this.data.entries.forEach((e, i) => {
      // create the entry
      const entry = svg.append('g');
      if (this.clickFunction !== undefined) {
        entry
          .style('cursor', 'pointer')
          .on('click', () => this.clickFunction?.(e));
      }
      // add label
      let offset = LisLegendElement.GLYPH_SIZE + LisLegendElement.GLYPH_MARGIN;
      if (this.compact) {
        offset = padding;
      }
      const text = entry
        .append('text')
        .attr('line-height', LisLegendElement.GLYPH_SIZE)
        .attr('font-size', LisLegendElement.GLYPH_SIZE / 1.2) // 1.2 is roughly what web browsers use
        .style('dominant-baseline', 'middle')
        .attr('x', offset)
        .attr('y', LisLegendElement.GLYPH_SIZE / 2)
        .text(e.label)
        .style('fill', color);
      // add glyph
      let w = LisLegendElement.GLYPH_SIZE;
      if (this.compact) {
        w = text.node().getComputedTextLength() + padding * 2;
      }
      entry
        .append('rect')
        .attr('width', w)
        .attr('height', LisLegendElement.GLYPH_SIZE)
        .attr('rx', radius)
        .style('fill', () => e.color || this.colorFunction?.(e));
      text.raise();
      // set the group position now that we know its size
      if (this.layout == 'horizontal') {
        const paddedWidth =
          entry.node().getBBox().width + LisLegendElement.GLYPH_MARGIN;
        if (x + paddedWidth > width) {
          x = 0;
          row += 1;
        }
        const y =
          row * LisLegendElement.GLYPH_SIZE +
          (row + 1) * LisLegendElement.GLYPH_MARGIN;
        entry.attr('transform', `translate(${x}, ${y})`);
        x += paddedWidth;
      } else {
        const y =
          i * LisLegendElement.GLYPH_SIZE +
          (i + 1) * LisLegendElement.GLYPH_MARGIN;
        entry.attr('transform', `translate(0, ${y})`);
      }
    });

    // set the SVG height now that all element have been added
    const n = this.layout == 'horizontal' ? row + 1 : this.data.entries.length;
    const height =
      n * LisLegendElement.GLYPH_SIZE + (n + 1) * LisLegendElement.GLYPH_MARGIN;
    svg.attr('height', height);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-legend-element': LisLegendElement;
  }
}
