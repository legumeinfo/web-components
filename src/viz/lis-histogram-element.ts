import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import * as d3 from 'd3';

export type HistogramDataModel = {
  name: string;
  count: number;
};

/**
 * @htmlElement `<lis-histogram-element>`
 *
 * A custom web component for creating histograms using D3.js.
 *
 * The following attributes/properties can be set using HTML or JavaScript:
 * - {@link data | `data`}
 * - {@link xlabel | `xlabel`}
 * - {@link ylabel | `ylabel`}
 * - {@link width | `width`}
 * - {@link height | `height`}
 * - {@link orientation | `orientation`}
 *
 * @example
 * Example using only HTML:
 *
 * ```html
 * <lis-histogram-element
 *   data='[{"name": "A", "count": 10}, {"name": "B", "count": 20}]'
 *   nameLabel="Name"
 *   countLabel="Count"
 *   width='500'
 *   height='500'>
 * </lis-histogram-element>
 * ```
 *
 * @example
 * Example using JavaScript and HTML that sets data using values from a `<lis-simple-table-element>`:
 *
 * ```html
 * <lis-simple-table-element id="table"></lis-simple-table-element>
 * <lis-histogram-element id="histogram"></lis-histogram-element>
 *
 * <script type="text/javascript">
 *    window.onload = (event) => {
 *     // get the simple table element
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
 *     const histogramData = tableElement.data.map((d) => ({"name": d.cheese, "count": d.rating}));
 *     const histogramElement = document.getElementById('histogram');
 *     histogramElement.width = 500;
 *     histogramElement.height = 500;
 *     histogramElement.nameLabel = 'Cheese';
 *     histogramElement.countLabel = 'Rating';
 *     histogramElement.orientation = 'vertical';
 *     histogramElement.data = histogramData;
 *    }
 *   </script>
 * ```
 *
 */
@customElement('lis-histogram-element')
export class LisHistogramElement extends LitElement {
  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /** @ignore */
  // disable Shadow DOM to inherit global styles
  override createRenderRoot() {
    return this;
  }

  private _histogramContainerRef: Ref<HTMLDivElement> = createRef();

  /**
   * The data to display in the histogram.
   *
   * @attribute
   */
  @property()
  data: HistogramDataModel[] = [];

  /**
   * The label for the x-axis.
   *
   * @attribute
   */
  @property({type: String})
  nameLabel: string = 'Name';

  /**
   * The label for the y-axis.
   *
   * @attribute
   */
  @property({type: String})
  countLabel: string = 'Count';

  /**
   * The width of the histogram in pixels.
   *
   * @attribute
   */
  @property({type: Number})
  width: number = 500;

  /**
   * The height of the histogram in pixels.
   *
   * @attribute
   */
  @property({type: Number})
  height: number = 500;

  /**
   * The orientation of the histogram. Can be either 'horizontal' or 'vertical'.
   *
   * @attribute
   */
  @property({type: String})
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** @ignore */
  // used by Lit to draw the template
  override render() {
    this.renderHistogram(this.data);
    return html`<div ${ref(this._histogramContainerRef)}></div>`;
  }

  renderHistogram(theHistogram: HistogramDataModel[]) {
    if (!this._histogramContainerRef.value) return;
    this._histogramContainerRef.value.innerHTML = '';
    const maxLabelLength = d3.max(theHistogram, (d) => d.name.length) as number;
    if (!maxLabelLength) return;
    const padding = 9 * maxLabelLength; // padding around the SVG
    const width = this.width - 2 * padding; // adjust width
    const height = this.height - 2 * padding; // adjust height

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
      .text(
        (d) => `${this.nameLabel}: ${d.name}, ${this.countLabel}: ${d.count}`,
      ); // set the text of the title

    // Add the x-axis label
    svgContainer
      .append('text')
      .attr(
        'transform',
        'translate(' + width / 2 + ' ,' + (height + padding - 5) + ')',
      )
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text(this.orientation === 'vertical' ? this.countLabel : this.nameLabel);

    // Calculate dynamic padding based on the length of the y-axis label
    const dynamicPadding = Math.max(this.countLabel.length * 6, padding); // assuming 6px per character

    // Add the y-axis label
    svgContainer
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - dynamicPadding - 5)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text(this.orientation === 'vertical' ? this.nameLabel : this.countLabel);

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

declare global {
  interface HTMLElementTagNameMap {
    'lis-histogram-element': LisHistogramElement;
  }
}
