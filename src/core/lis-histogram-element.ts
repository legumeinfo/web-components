import {LitElement, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';
import {LisResizeObserverController} from '../controllers';
import * as d3 from 'd3';

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

  @property()
  set data(data: HistogramData[]) {
    this._data = data; // parse data if needed here before setting it
  }

  /*static override styles = css`
        :host {
            display: block;
            padding: 16px;
        }
        .tooltip {
            position: absolute;
            text-align: center;
            width: 60px;
            height: 28px;
            padding: 2px;
            font: 12px sans-serif;
            background: lightsteelblue;
            border: 0px;
            border-radius: 8px;
            pointer-events: none;
            opacity: 0;
        }
    `;*/

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
    //const histogramContainer = d3.select(this._histogramContainerRef.value);

    const svgContainer = d3
      .select(this._histogramContainerRef.value)
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    const x = d3
      .scaleBand()
      .domain(theHistogram.map((d) => d.name))
      .range([0, 500])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(theHistogram, (d) => d.count) as number])
      .range([500, 0]);

    // Create the bars
    svgContainer
      .selectAll('rect')
      .data(theHistogram)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.name) as number)
      .attr('y', (d) => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', (d) => 500 - y(d.count))
      .attr('fill', 'steelblue');

    // Add the x-axis label
    svgContainer
      .append('text')
      .attr('transform', 'translate(' + 500 / 2 + ' ,' + (500 + 40) + ')')
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text('Name');

    // Add the y-axis label
    svgContainer
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - 50)
      .attr('x', 0 - 500 / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text('Count');

    // Add the x-axis
    svgContainer
      .append('g')
      .attr('transform', 'translate(0,' + 500 + ')')
      .call(d3.axisBottom(x));

    // Add the y-axis
    svgContainer.append('g').call(d3.axisLeft(y));
  }
}
