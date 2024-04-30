import {LitElement, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {LisResizeObserverController} from '../controllers';
import * as d3 from 'd3';

/**
 * @htmlElement `<lis-histogram-element>` is a custom web component for creating histograms using D3.js.
 *
 * @example
 * Attributes:
 * - {@link data | `data`}: An array of objects where each object represents a bar in the histogram. Each object should have a `name` and `count` property.
 * - {@link xlabel | `xlabel`}: The label for the x-axis.
 * - {@link ylabel | `ylabel`}: The label for the y-axis.
 * - {@link width | `width`}: The width of the histogram in pixels.
 * - {@link height | `height`}: The height of the histogram in pixels.
 * - {@link orientation | `orientation`}: The orientation of the histogram. Can be either 'horizontal' or 'vertical'. Default is 'horizontal'.
 *
 * Example using JavaScript and HTML driven using `<lis-simple-table-element>`:
 *
 * ```html
 * <lis-simple-table-element id="table"></lis-simple-table-element>
 * <lis-histogram-element id="histogram"></lis-histogram-element>
 *
 * <script type="text/javascript">
 *     // get the simple table element
 *    window.onload = (event) => {
 *     const tableElement = document.getElementById('table');
 *     // set the element's properties
 *     tableElement.caption = 'My cheesy table';
 *     tableElement.dataAttributes = ['cheese', 'region', 'rating'];
 *     tableElement.header = {cheese: 'Cheese', region: 'Region', rating: 'Rating'};
 *     tableElement.data = [
 *       {cheese: 'Brie', region: 'France', rating: 7},
 *       {cheese: 'Burrata', region: 'Italy', rating: 8},
 *       {cheese: 'Feta', region: 'Greece', rating: 7},
 *       {cheese: 'Gouda', region: 'Netherlands', rating: 9},
 *       {cheese: 'Cheddar', region: 'America', rating: 6},
 *       {cheese: 'Goat', region: 'America', rating: 2}
 *     ];
 *
 *     const histoElement = document.getElementById('histogram');
 *     histoElement.width = 500;
 *     histoElement.height = 500;
 *     histoElement.xlabel = 'Cheese';
 *     histoElement.ylabel = 'Rating';
 *     histoElement.orientation = 'vertical';
 *     histoElement.data = tableElement.data.map((d) => ({"name": d.cheese, "count": d.rating}));
 *    }
 *   </script>
 * ```
 *
 * Example using only html:
 * ```html
 * <lis-histogram-element
 *   data='[{"name": "A", "count": 10}, {"name": "B", "count": 20}]'
 *   xlabel='Category'
 *   ylabel='Count'
 *   width='500'
 *   height='500'
 *   orientation='vertical'>
 * </lis-histogram-element>
 * ```
 */

export type HistogramData = {
  name: string;
  count: number;
};

@customElement('lis-histogram-element')
export class LisHistogramElement extends LitElement {
  // bind to the histogram container div element in the template
  private _histogramContainerRef: Ref<HTMLDivElement> = createRef();

  // a controller that allows element resize events to be observed
  protected resizeObserverController = new LisResizeObserverController(
    this,
    this.resize,
  );

  @state()
  private _data: HistogramData[] = [];

  @state()
  private _xlabel: string = 'X-axis';

  @state()
  private _ylabel: string = 'Y-axis';

  @state()
  private _width: number = 500;

  @state()
  private _height: number = 500;

  /**
   * The data to display in the histogram. Only attributes defined in the
   * {@link dataAttributes | `dataAttributes`} property will be parsed from the
   * objects.
   *
   * @attribute
   * @link HistogramData
   */
  @property()
  set data(data: HistogramData[]) {
    this._data = data; // parse data if needed here before setting it
  }

  /**
   * The label for the x-axis.
   *
   * @attribute
   * @link _xlabel
   */
  @property()
  set xlabel(xlabel: string) {
    this._xlabel = xlabel; // format axis label if needed here before setting it
  }

  /**
   * The label for the y-axis.
   *
   * @attribute
   * @link _ylabel
   */
  @property()
  set ylabel(ylabel: string) {
    this._ylabel = ylabel; // format axis label if needed here before setting it
  }

  /**
   * The width of the histogram in pixels.
   *
   * @attribute
   * @link _width
   */
  @property()
  set width(width: number) {
    this._width = +width; // format number width
  }

  /**
   * The height of the histogram in pixels.
   *
   * @attribute
   * @link _height
   */
  @property()
  set height(height: number) {
    this._height = +height; // format number height
  }

  /**
   * The orientation of the histogram. Can be either 'horizontal' or 'vertical'. Default is 'horizontal'.
   *
   * @attribute
   * @link orientation
   */
  @property()
  orientation: 'horizontal' | 'vertical' = 'horizontal'; // default orientation

  private resize(entries: ResizeObserverEntry[]) {
    entries.forEach((entry: ResizeObserverEntry) => {
      if (
        entry.target == this._histogramContainerRef.value &&
        entry.contentBoxSize
      ) {
        this.requestUpdate();
      }
    });
  }

  private histogramContainerReady() {
    if (this._histogramContainerRef.value) {
      this.resizeObserverController.observe(this._histogramContainerRef.value);
    }
  }

  override render() {
    this.renderHistogram(this._data);
    return html`<div
      ${ref(this._histogramContainerRef)}
      ${ref(this.histogramContainerReady)}
    ></div>`;
  }
  override createRenderRoot() {
    return this;
  }

  renderHistogram(theHistogram: HistogramData[]) {
    if (!this._histogramContainerRef.value) return;
    this._histogramContainerRef.value.innerHTML = '';
    const maxLabelLength = d3.max(theHistogram, (d) => d.name.length) as number;
    if (!maxLabelLength) return;
    const padding = 9 * maxLabelLength; // padding around the SVG
    const width = this._width - 2 * padding; // adjust width
    const height = this._height - 2 * padding; // adjust height

    const svgContainer = d3
      .select(this._histogramContainerRef.value)
      .append('svg')
      .attr('width', width + 2 * padding)
      .attr('height', height + 2 * padding)
      .append('g')
      .attr('transform', `translate(${padding}, ${padding})`);

    const x = d3
      .scaleBand()
      .domain(theHistogram.map((d) => d.name))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(theHistogram, (d) => d.count) as number])
      .range(this.orientation === 'vertical' ? [0, height] : [height, 0]);

    // Create the bars
    svgContainer
      .selectAll('rect')
      .data(theHistogram)
      .enter()
      .append('rect')
      .attr('x', (d) =>
        this.orientation === 'vertical' ? 0 : (x(d.name) as number),
      )
      .attr('y', (d) =>
        this.orientation === 'vertical' ? (x(d.name) as number) : y(d.count),
      )
      .attr('width', (d) =>
        this.orientation === 'vertical' ? y(d.count) : x.bandwidth(),
      )
      .attr('height', (d) =>
        this.orientation === 'vertical' ? x.bandwidth() : height - y(d.count),
      )
      .attr('fill', 'steelblue')
      .append('title') // append a title element to each rectangle
      .text((d) => `${this._xlabel}: ${d.name}, ${this._ylabel}: ${d.count}`); // set the text of the title

    // Add the x-axis label
    svgContainer
      .append('text')
      .attr(
        'transform',
        'translate(' + width / 2 + ' ,' + (height + padding - 5) + ')',
      )
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text(this.orientation === 'vertical' ? this._ylabel : this._xlabel);

    // Add the y-axis label
    svgContainer
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - padding - 5)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text(this.orientation === 'vertical' ? this._xlabel : this._ylabel);

    // Add the x-axis
    svgContainer
      .append('g')
      .attr(
        'transform',
        this.orientation === 'vertical'
          ? 'translate(0,0)'
          : `translate(0,${height})`,
      )
      .call(
        this.orientation === 'vertical' ? d3.axisLeft(x) : d3.axisBottom(x),
      );

    // Add the y-axis
    svgContainer
      .append('g')
      .attr(
        'transform',
        this.orientation === 'vertical'
          ? `translate(0,${height})`
          : 'translate(0,0)',
      )
      .call(
        this.orientation === 'vertical' ? d3.axisBottom(y) : d3.axisLeft(y),
      );
  }
}
