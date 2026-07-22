import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisResizeObserverController} from '../controllers';
import {globalSubstitution} from '../utils/decorators';

declare const d3: any; // version 7

/**
 * The structure a single numeric bin must have when given to the
 * {@link LisHistogramElement | `LisHistogramElement`} component. Note this
 * is *not* quite what {@link !d3.bin | `d3.bin()`} returns directly.
 * Example map to convert to D3:
 * `bin(values).map((b) => ({x0: b.x0, x1: b.x1, count: b.length}))`.
 */
export type NumericHistogramBin = {
  x0: number;
  x1: number;
  count: number;
};

/**
 * The structure a single ordinal bin must have when given to
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
 * in {@link data | `data`}.
 */
export type HistogramBin = NumericHistogramBin | OrdinalHistogramBin;

/**
 * The structure histogram data must have when given to the
 * {@link LisHistogramElement | `LisHistogramElement`} component.
 */
export type HistogramData = HistogramBin[];

/**
 * The direction the {@link LisHistogramElement | `LisHistogramElement`}
 * component draws its bars in. `'vertical'` draws bars that grow upward,
 * with the bin/category axis along the bottom and the count axis along the
 * left. `'horizontal'` draws bars that grow rightward, with the bin/category
 * axis along the left and the count axis along the top.
 */
export type HistogramOrientation = 'vertical' | 'horizontal';

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
 * Draws a histogram for a set of pre-computed {@link HistogramData | `HistogramData`}. The component performs
 * no data fetching or binning of its own; it only renders the bins it's given
 * via its {@link data | `data`} property. The component
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
 * (thresholds, domain, etc.) with the caller instead of the component. Note that
 * D3's bins are array-like objects with the count only implicit as `bin.length`,
 * so the output must be mapped to `{x0, x1, count}`:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-histogram-element id="histogram"></lis-histogram-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // raw values to visualize
 *   const values = [1, 2, 2, 3, 3, 3, 4, 4, 5];
 *   // bin the values using D3, then map to {x0, x1, count}
 *   const bin = d3.bin();
 *   const data = bin(values).map((b) => ({x0: b.x0, x1: b.x1, count: b.length}));
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
 * longer than 25 characters are truncated with an ellipsis; hovering a
 * truncated label shows the full text. In the default `'vertical'`
 * orientation truncated labels are also drawn at an angle to keep them
 * readable:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-histogram-element id="histogram"></lis-histogram-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   const data = [
 *     {label: 'Glycine', count: 67},
 *     {label: 'Phaseolus', count: 10},
 *     {label: 'Medicago', count: 37},
 *   ];
 *   const histogramElement = document.getElementById('histogram');
 *   histogramElement.data = data;
 *   histogramElement.xLabel = 'Genera';
 *   histogramElement.yLabel = 'Genomes';
 * </script>
 * ```
 *
 * @example
 * The {@link orientation | `orientation`} property toggles between bars that
 * grow upward (`'vertical'`, the default, count axis on the left) and bars
 * that grow rightward (`'horizontal'`, count axis on top):
 * ```html
 * <lis-histogram-element orientation="horizontal"></lis-histogram-element>
 * ```
 *
 * @example
 * Setting {@link resizable | `resizable`} shows a drag handle along the
 * bottom edge that lets users interactively resize the chart by dragging.
 * A `heightChange` event fires when the drag ends:
 * ```html
 * <lis-histogram-element
 *   resizable
 *   onheightchange="console.log(event.detail.height)"
 * ></lis-histogram-element>
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
  static readonly ORDINAL_ROTATED_MARGIN = 90;
  static readonly ORDINAL_HORIZONTAL_MARGIN = 140;
  // ordinal category labels are truncated to this many characters, ellipsis included
  static readonly MAX_LABEL_LENGTH = 25;
  static readonly LABEL_ANGLE = -40;
  // the shortest height the drag handle will resize the component to
  static readonly MIN_HEIGHT = 100;

  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    .resize-handle {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 10px;
      cursor: ns-resize;
      touch-action: none;
    }

    .resize-handle::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 3px;
      width: 32px;
      height: 3px;
      border-radius: 2px;
      background: var(--lis-histogram-resize-handle-color, #ccc);
      transform: translateX(-50%);
    }

    .resize-handle:hover::after,
    .resize-handle.dragging::after {
      background: var(--lis-histogram-resize-handle-hover-color, #888);
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

  private _containerRef: Ref<HTMLDivElement> = createRef();

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
   * The direction to draw the bars in. `'vertical'` (the default) draws bars
   * upward, with the bin/category axis along the bottom and the
   * count axis along the left. `'horizontal'` draws bars rightward,
   * with the bin/category axis along the left and the count axis
   * along the top.
   *
   * @attribute
   */
  @property({type: String})
  orientation: HistogramOrientation = 'vertical';

  /**
   * An optional label for the bin/category axis. Drawn beneath the axis when
   * {@link orientation | `orientation`} is `'vertical'` (the default), or
   * beside it when `'horizontal'`.
   *
   * @attribute
   */
  @property({type: String})
  xLabel = '';

  /**
   * An optional label for the count axis. Drawn beside the axis when
   * {@link orientation | `orientation`} is `'vertical'` (the default), or
   * above it when `'horizontal'`.
   *
   * @attribute
   */
  @property({type: String})
  yLabel = '';

  /**
   * The height of the component in pixels. The component always fills the
   * available width of its parent element. When {@link resizable | `resizable`}
   * is set, this value updates live as the user drags the resize handle.
   *
   * @attribute
   */
  @property({type: Number})
  height = 300;

  /**
   * Whether to show a drag handle along the bottom edge that lets users
   * interactively resize the component by changing {@link height | `height`}.
   * Off by default. A `heightChange` event (`detail: {height: number}`) is
   * dispatched when a drag finishes, so a page can persist the chosen height
   * if it wants to.
   *
   * @attribute
   */
  @property({type: Boolean})
  resizable = false;

  @state()
  private _dragging = false;

  private _dragStartY = 0;
  private _dragStartHeight = 0;

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

  private _onHandlePointerDown(event: PointerEvent) {
    if (!this.resizable) {
      return;
    }
    event.preventDefault();
    this._dragging = true;
    this._dragStartY = event.clientY;
    this._dragStartHeight = this.height;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  private _onHandlePointerMove(event: PointerEvent) {
    if (!this._dragging) {
      return;
    }
    const delta = event.clientY - this._dragStartY;
    this.height = Math.max(
      LisHistogramElement.MIN_HEIGHT,
      this._dragStartHeight + delta,
    );
  }

  private _onHandlePointerUp(event: PointerEvent) {
    if (!this._dragging) {
      return;
    }
    this._dragging = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    this._dispatchHeightChange();
  }

  private _dispatchHeightChange() {
    const options = {
      detail: {height: this.height},
      bubbles: true,
      composed: true,
    };
    const event = new CustomEvent('heightChange', options);
    this.dispatchEvent(event);
  }

  override render() {
    this._drawHistogram();
    return html`
      <div ${ref(this._containerRef)} ${ref(this._containerReady)}></div>
      ${this.resizable
        ? html`<div
            class="resize-handle ${this._dragging ? 'dragging' : ''}"
            @pointerdown=${this._onHandlePointerDown}
            @pointermove=${this._onHandlePointerMove}
            @pointerup=${this._onHandlePointerUp}
            @pointercancel=${this._onHandlePointerUp}
          ></div>`
        : null}
    `;
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

  private _truncateOrdinalTicks(axis: any, rotate: boolean) {
    axis
      .selectAll('.tick')
      .each((label: string, i: number, nodes: SVGGElement[]) => {
        const tick = d3.select(nodes[i]);
        const truncated = this._truncateLabel(label);
        const text = tick.select('text').text(truncated);
        if (rotate) {
          text
            .attr('transform', `rotate(${LisHistogramElement.LABEL_ANGLE})`)
            .style('text-anchor', 'end')
            .attr('dx', '-0.5em')
            .attr('dy', '0.4em');
        }
        if (truncated !== label) {
          tick.classed('tick--truncated', true);
          text.append('title').text(label);
        }
      });
  }

  private _margins(ordinal: boolean, horizontal: boolean) {
    const {top, right, bottom, left} = LisHistogramElement.MARGIN;
    if (!horizontal) {
      return {
        top,
        right,
        bottom: ordinal ? LisHistogramElement.ORDINAL_ROTATED_MARGIN : bottom,
        left,
      };
    }
    return {
      top: left,
      right,
      bottom: right,
      left: ordinal ? LisHistogramElement.ORDINAL_HORIZONTAL_MARGIN : bottom,
    };
  }

  @globalSubstitution('d3', 'd3v7')
  private _drawHistogram() {
    if (this._containerRef.value === undefined) {
      return;
    }

    this._containerRef.value.innerHTML = '';

    if (!this.data.length) {
      return;
    }

    const ordinal = isOrdinalBin(this.data[0]);
    const horizontal = this.orientation === 'horizontal';

    const {top, right, bottom, left} = this._margins(ordinal, horizontal);
    const width = this._containerWidth();
    const height = this.height;

    const svg = d3.create('svg').attr('width', width).attr('height', height);
    this._containerRef.value.append(svg.node());

    const binRange = horizontal
      ? [top, height - bottom]
      : [left, width - right];
    const binScale = ordinal
      ? d3
          .scaleBand()
          .domain((this.data as OrdinalHistogramBin[]).map((d) => d.label))
          .range(binRange)
          .padding(0.1)
      : d3
          .scaleLinear()
          .domain([
            (this.data[0] as NumericHistogramBin).x0,
            (this.data[this.data.length - 1] as NumericHistogramBin).x1,
          ])
          .range(binRange);

    const countRange = horizontal
      ? [left, width - right]
      : [height - bottom, top];
    const countScale = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d: HistogramBin) => d.count) ?? 0])
      .nice()
      .range(countRange);

    // bars
    svg
      .append('g')
      .selectAll('rect')
      .data(this.data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d: HistogramBin) => {
        if (horizontal) {
          return countScale(0);
        }
        return isOrdinalBin(d) ? binScale(d.label) : binScale(d.x0) + 1;
      })
      .attr('width', (d: HistogramBin) => {
        if (horizontal) {
          return Math.max(0, countScale(d.count) - countScale(0));
        }
        return isOrdinalBin(d)
          ? binScale.bandwidth()
          : Math.max(0, binScale(d.x1) - binScale(d.x0) - 1);
      })
      .attr('y', (d: HistogramBin) => {
        if (horizontal) {
          return isOrdinalBin(d) ? binScale(d.label) : binScale(d.x0) + 1;
        }
        return countScale(d.count);
      })
      .attr('height', (d: HistogramBin) => {
        if (horizontal) {
          return isOrdinalBin(d)
            ? binScale.bandwidth()
            : Math.max(0, binScale(d.x1) - binScale(d.x0) - 1);
        }
        return countScale(0) - countScale(d.count);
      });

    // axes
    if (!horizontal) {
      const binAxis = svg
        .append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${height - bottom})`)
        .call(d3.axisBottom(binScale));
      if (ordinal) {
        this._truncateOrdinalTicks(binAxis, true);
      }
      svg
        .append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${left}, 0)`)
        .call(d3.axisLeft(countScale));
    } else {
      svg
        .append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${top})`)
        .call(d3.axisTop(countScale));
      const binAxis = svg
        .append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${left}, 0)`)
        .call(d3.axisLeft(binScale));
      if (ordinal) {
        this._truncateOrdinalTicks(binAxis, false);
      }
    }

    // axis label helpers
    const drawBottomLabel = (text: string) => {
      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', (left + (width - right)) / 2)
        .attr('y', height - 2)
        .text(text);
    };
    const drawTopLabel = (text: string) => {
      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', (left + (width - right)) / 2)
        .attr('y', 12)
        .text(text);
    };
    const drawLeftLabel = (text: string) => {
      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -((top + (height - bottom)) / 2))
        .attr('y', 12)
        .text(text);
    };

    if (!horizontal) {
      if (this.xLabel) {
        drawBottomLabel(this.xLabel);
      }
      if (this.yLabel) {
        drawLeftLabel(this.yLabel);
      }
    } else {
      if (this.xLabel) {
        drawLeftLabel(this.xLabel);
      }
      if (this.yLabel) {
        drawTopLabel(this.yLabel);
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-histogram-element': LisHistogramElement;
  }
}
