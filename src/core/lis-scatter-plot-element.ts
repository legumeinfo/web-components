import {LitElement, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {LisResizeObserverController} from '../controllers';
import * as d3 from 'd3';

export type ScatterPlotPointModel = [number, number];

/**
 * @htmlElement `<lis-scatter-plot-element>` is a custom web component for creating scatter plots using D3.js.
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
@customElement('lis-scatter-plot-element')
export class LisScatterPlotElement extends LitElement {
  // bind to the container div element in the template
  private _scatterPlotContainerRef: Ref<HTMLDivElement> = createRef();

  // a controller that allows element resize events to be observed
  protected resizeObserverController = new LisResizeObserverController(
    this,
    this.resize,
  );

  @state()
  private _data: ScatterPlotPointModel[] = [];

  @state()
  private _xlabel: string = 'X-axis';

  @state()
  private _ylabel: string = 'Y-axis';

  @state()
  private _width: number = 500;

  @state()
  private _height: number = 500;

  /**
   * The data to display in the scatter plot.
   *
   * @attribute
   */
  @property()
  set data(data: ScatterPlotPointModel[]) {
    this._data = data; // parse data if needed here before setting it
  }

  /**
   * The label for the x-axis.
   *
   * @attribute
   */
  @property()
  set xlabel(xlabel: string) {
    this._xlabel = xlabel; // format axis label if needed here before setting it
  }

  /**
   * The label for the y-axis.
   *
   * @attribute
   */
  @property()
  set ylabel(ylabel: string) {
    this._ylabel = ylabel; // format axis label if needed here before setting it
  }

  /**
   * The width of the scatter plot in pixels.
   *
   * @attribute
   */
  @property()
  set width(width: number) {
    this._width = +width; // format number width
  }

  /**
   * The height of the scatter plot in pixels.
   *
   * @attribute
   */
  @property()
  set height(height: number) {
    this._height = +height; // format number height
  }

  private resize(entries: ResizeObserverEntry[]) {
    entries.forEach((entry: ResizeObserverEntry) => {
      if (
        entry.target == this._scatterPlotContainerRef.value &&
        entry.contentBoxSize
      ) {
        this.requestUpdate();
      }
    });
  }

  private scatterPlotContainerReady() {
    if (this._scatterPlotContainerRef.value) {
      this.resizeObserverController.observe(
        this._scatterPlotContainerRef.value,
      );
    }
  }

  override render() {
    this.renderScatterPlot(this._data);
    return html`<div
      ${ref(this._scatterPlotContainerRef)}
      ${ref(this.scatterPlotContainerReady)}
    ></div>`;
  }
  override createRenderRoot() {
    return this;
  }

  renderScatterPlot(data: ScatterPlotPointModel[]) {
    if (!this._scatterPlotContainerRef.value) return;
    this._scatterPlotContainerRef.value.innerHTML = '';
    const padding = 60; // padding around the SVG
    const width = this._width - 2 * padding; // adjust width
    const height = this._height - 2 * padding; // adjust height

    const svgContainer = d3
      .select(this._scatterPlotContainerRef.value)
      .append('svg')
      .attr('width', width + 2 * padding)
      .attr('height', height + 2 * padding)
      .append('g')
      .attr('transform', `translate(${padding}, ${padding})`);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[0]) as number])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[1]) as number])
      .range([height, 0]);

    // add the scatter plot points
    svgContainer
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d[0]))
      .attr('cy', (d) => y(d[1]))
      .attr('r', 5)
      .style('fill', 'steelblue');

    // Add the x-axis
    svgContainer
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add the y-axis
    svgContainer.append('g').call(d3.axisLeft(y));

    // Add the x-axis label
    svgContainer
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + padding / 2)
      .style('text-anchor', 'middle')
      .text(this._xlabel);

    // Add the y-axis label
    svgContainer
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -padding / 2)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .text(this._ylabel);
  }
}
