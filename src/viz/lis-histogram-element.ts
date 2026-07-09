import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisResizeObserverController} from '../controllers';
import {globalSubstitution} from '../utils/decorators';

declare const d3: any; // version 7

/**
 * The structure a single numeric bin must have when given to the
 * {@link LisHistogramElement | `LisHistogramElement`} component. This is
 * intentionally the same shape produced by {@link !d3.bin | `d3.bin()`}, so
 * the output of D3's bin generator can be passed to the component as-is.
 */
export type NumericHistogramBin = {
  x0: number;
  x1: number;
  count: number;
};

/**
 * The structure a single ordinal (categorical) bin must have when given to
 * the {@link LisHistogramElement | `LisHistogramElement`} component.
 */
export type OrdinalHistogramBin = {
  label: string;
  count: number;
};

/**
 * The structure a single bin must have when given to the
 * {@link LisHistogramElement | `LisHistogramElement`} component. Bins are
 * either numeric ({@link NumericHistogramBin | `NumericHistogramBin`}) or
 * ordinal ({@link OrdinalHistogramBin | `OrdinalHistogramBin`}); the
 * component detects which kind it's been given by inspecting the first bin
 * in {@link data | `data`}, so a single instance of the component can't mix
 * the two.
 */
export type HistogramBin = NumericHistogramBin | OrdinalHistogramBin;

/**
 * The structure histogram data must have when given to the
 * {@link LisHistogramElement | `LisHistogramElement`} component.
 */
export type HistogramData = HistogramBin[];

/**
 * A type guard that distinguishes an {@link OrdinalHistogramBin | `OrdinalHistogramBin`}
 * from a {@link NumericHistogramBin | `NumericHistogramBin`}.
 */
function isOrdinalBin(bin: HistogramBin): bin is OrdinalHistogramBin {
  return 'label' in bin;
}

/**
 * @htmlElement `<lis-histogram-element>`
 *
 * A "dumb"/presentational Web Component that draws a histogram for a set of
 * pre-computed {@link HistogramData | `HistogramData`}. The component performs
 * no data fetching or binning of its own; it only renders the bins it's given
 * via its {@link data | `data`} property. This keeps the component reusable
 * regardless of where its data comes from or how it was binned. The component
 * automatically redraws when its data changes or when the width of its parent
 * element changes.
 *
 * @example
 * The `<lis-histogram-element>` tag requires <b>version 7</b> of {@link https://d3js.org/ | D3}.
 * To allow multiple versions of D3 to be used on the same page, the
 * {@link LisHistogramElement | `LisHistogramElement`} class uses the global `d3v7` variable if it
 * has been set. Otherwise it uses the global `d3` variable by default. The following is an example
 * of how to include D3 in the page and set the `d3v7` variable:
 * ```html
 * <!-- head -->
 *
 * <!-- D3 version 7 -->
 * <script src='http://d3js.org/d3.v7.min.js'></script>
 *
 * <!-- another version of D3 -->
 * <script type='text/javascript'>
 *   var d3v7 = d3;
 *   window.d3 = undefined;
 * </script>
 * <script src='http://d3js.org/d3.v3.min.js'></script>
 *
 * <!-- body -->
 *
 * <!-- add the Web Component to your HTML -->
 * <lis-histogram-element></lis-histogram-element>
 * ```
 *
 * @example
 * Because the component is "dumb", it expects to be given bins, not raw values.
 * D3's own bin generator can be used to produce them, which keeps binning logic
 * (thresholds, domain, etc.) with the caller instead of the component:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-histogram-element id="histogram"></lis-histogram-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // raw values to visualize
 *   const values = [1, 2, 2, 3, 3, 3, 4, 4, 5];
 *   // bin the values using D3
 *   const bin = d3.bin();
 *   const data = bin(values);
 *   // get the histogram element
 *   const histogramElement = document.getElementById('histogram');
 *   // set the element's data property
 *   histogramElement.data = data;
 *   histogramElement.xLabel = 'Value';
 *   histogramElement.yLabel = 'Count';
 * </script>
 * ```
 *
 * @example
 * Ordinal (categorical) data is also supported: give {@link data | `data`} an
 * array of {@link OrdinalHistogramBin | `OrdinalHistogramBin`} objects
 * (`{label: string, count: number}`) instead. The component detects the
 * ordinal case automatically by inspecting the first bin. Category labels
 * longer than 25 characters are truncated with an ellipsis and drawn at an
 * angle to keep them readable; hovering a truncated label shows the full
 * text:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-histogram-element id="histogram"></lis-histogram-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   const data = [
 *     {label: 'Glycine max', count: 812},
 *     {label: 'Phaseolus vulgaris', count: 431},
 *     {label: 'Medicago truncatula', count: 298},
 *   ];
 *   const histogramElement = document.getElementById('histogram');
 *   histogramElement.data = data;
 *   histogramElement.xLabel = 'Species';
 *   histogramElement.yLabel = 'Count';
 * </script>
 * ```
 *
 * @example
 * The {@link height | `height`}, {@link xLabel | `xLabel`}, and
 * {@link yLabel | `yLabel`} properties can be set as attributes of the
 * `<lis-histogram-element>` tag:
 * ```html
 * <lis-histogram-element
 *   height="200"
 *   xLabel="Value"
 *   yLabel="Count"
 * ></lis-histogram-element>
 * ```
 *
 * @example
 * The bar color(s) can be customized via the `--lis-histogram-bar-color` and
 * `--lis-histogram-bar-hover-color` CSS custom properties:
 * ```css
 * lis-histogram-element {
 *   --lis-histogram-bar-color: #4c72b0;
 *   --lis-histogram-bar-hover-color: #dd8452;
 * }
 * ```
 */
@customElement('lis-histogram-element')
export class LisHistogramElement extends LitElement {
  static readonly MARGIN = {top: 10, right: 10, bottom: 30, left: 44};
  // ordinal category labels are rotated, so they need more room
  static readonly ORDINAL_BOTTOM_MARGIN = 90;
  // ordinal category labels are truncated to this many characters, ellipsis included
  static readonly MAX_LABEL_LENGTH = 25;
  static readonly LABEL_ANGLE = -40;

  static override styles = css`
    :host {
      display: block;
    }

    .bar {
      fill: var(--lis-histogram-bar-color, steelblue);
    }

    .bar:hover {
      fill: var(--lis-histogram-bar-hover-color, darkorange);
    }

    .axis text {
      font-size: 0.75em;
    }

    .axis path,
    .axis line {
      stroke: currentColor;
    }

    .axis-label {
      font-size: 0.85em;
    }

    .axis .tick--truncated text {
      cursor: default;
    }
  `;

  // bind to the container div element in the template
  private _containerRef: Ref<HTMLDivElement> = createRef();

  // a controller that allows element resize events to be observed
  protected resizeObserverController = new LisResizeObserverController(
    this,
    this._resize,
  );

  /**
   * The pre-binned data to render. Each bin is either numeric
   * (`{x0: number, x1: number, count: number}`, e.g. as produced by
   * {@link !d3.bin | `d3.bin()`}) or ordinal (`{label: string, count: number}`).
   * All bins in the array must be the same kind; the component decides which
   * kind it's been given by inspecting the first bin.
   *
   * @attribute
   */
  @property({attribute: false})
  data: HistogramData = [];

  /**
   * An optional label drawn beneath the X axis.
   *
   * @attribute
   */
  @property({type: String})
  xLabel = '';

  /**
   * An optional label drawn beside the Y axis.
   *
   * @attribute
   */
  @property({type: String})
  yLabel = '';

  /**
   * The height of the component in pixels. The component always fills the
   * available width of its parent element.
   *
   * @attribute
   */
  @property({type: Number})
  height = 300;

  private _resize(entries: ResizeObserverEntry[]) {
    entries.forEach((entry: ResizeObserverEntry) => {
      if (entry.target == this._containerRef.value) {
        this.requestUpdate();
      }
    });
  }

  private _containerReady() {
    if (this._containerRef.value) {
      this.resizeObserverController.observe(this._containerRef.value);
    }
  }

  override render() {
    this._drawHistogram();
    return html`<div
      ${ref(this._containerRef)}
      ${ref(this._containerReady)}
    ></div>`;
  }

  private _containerWidth(): number {
    return this._containerRef.value?.offsetWidth ?? 0;
  }

  private _truncateLabel(label: string): string {
    const max = LisHistogramElement.MAX_LABEL_LENGTH;
    if (label.length <= max) {
      return label;
    }
    return `${label.slice(0, max - 1)}…`;
  }

  @globalSubstitution('d3', 'd3v7')
  private _drawHistogram() {
    if (this._containerRef.value === undefined) {
      return;
    }

    // reset the container
    this._containerRef.value.innerHTML = '';

    if (!this.data.length) {
      return;
    }

    const ordinal = isOrdinalBin(this.data[0]);

    const {top, right, left} = LisHistogramElement.MARGIN;
    const bottom = ordinal
      ? LisHistogramElement.ORDINAL_BOTTOM_MARGIN
      : LisHistogramElement.MARGIN.bottom;
    const width = this._containerWidth();
    const height = this.height;

    // create the SVG element
    const svg = d3.create('svg').attr('width', width).attr('height', height);
    this._containerRef.value.append(svg.node());

    // x scale: a band scale for ordinal data, a linear scale for numeric data
    const x = ordinal
      ? d3
          .scaleBand()
          .domain((this.data as OrdinalHistogramBin[]).map((d) => d.label))
          .range([left, width - right])
          .padding(0.1)
      : d3
          .scaleLinear()
          .domain([
            (this.data[0] as NumericHistogramBin).x0,
            (this.data[this.data.length - 1] as NumericHistogramBin).x1,
          ])
          .range([left, width - right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d: HistogramBin) => d.count) ?? 0])
      .nice()
      .range([height - bottom, top]);

    // bars
    svg
      .append('g')
      .selectAll('rect')
      .data(this.data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d: HistogramBin) =>
        isOrdinalBin(d) ? x(d.label) : x(d.x0) + 1,
      )
      .attr('width', (d: HistogramBin) =>
        isOrdinalBin(d) ? x.bandwidth() : Math.max(0, x(d.x1) - x(d.x0) - 1),
      )
      .attr('y', (d: HistogramBin) => y(d.count))
      .attr('height', (d: HistogramBin) => y(0) - y(d.count));

    // x axis
    const xAxis = svg
      .append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${height - bottom})`)
      .call(d3.axisBottom(x));

    // angle and truncate ordinal category labels so long ones stay readable
    if (ordinal) {
      xAxis
        .selectAll('.tick')
        .each((label: string, i: number, nodes: SVGGElement[]) => {
          const tick = d3.select(nodes[i]);
          const truncated = this._truncateLabel(label);
          const text = tick
            .select('text')
            .attr('transform', `rotate(${LisHistogramElement.LABEL_ANGLE})`)
            .style('text-anchor', 'end')
            .attr('dx', '-0.5em')
            .attr('dy', '0.4em')
            .text(truncated);
          if (truncated !== label) {
            tick.classed('tick--truncated', true);
            text.append('title').text(label);
          }
        });
    }

    svg
      .append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${left}, 0)`)
      .call(d3.axisLeft(y));

    if (this.xLabel) {
      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', (left + (width - right)) / 2)
        .attr('y', height - 2)
        .text(this.xLabel);
    }

    if (this.yLabel) {
      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -((top + (height - bottom)) / 2))
        .attr('y', 12)
        .text(this.yLabel);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-histogram-element': LisHistogramElement;
  }
}
