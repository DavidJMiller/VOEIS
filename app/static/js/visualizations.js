/** M 11/16/20 */
class Visualizations {
  /* we are getting dictionary of form
      x:[size n]
      y:[size n]
      xExtent: [xMin, xMax]
      yExtent: [yMin, yMax]
      title:string
      yLabel:string
      xLabel:string
  */

  /**
   * @type {Object<string, {plotData: function({x: number[], y: number[],
   *     xExtent: number[], yExtent: number[], title: string, xLabel: string,
   *     yLabel: string}, {x: number[], y: number[]}, number, Selection):void,
   *     'plotAxes': function({x: number[], y: number[]}, Selection):void}>}}
   * Maps each plot type to the appropriate visualization functions.
   */
  static PLOT_TYPES = {
    'scatter': {
      'plotData': Visualizations.scatter,
      'plotAxes': Visualizations.scatterAxes,
    },
  };

  /**
   * The radius of the dot representing the data item with the greatest
   * `magnitude`.
   */
  static SCATTER_MAX_RADIUS = 6;

  /** The duration of a standard transition in milliseconds. */
  static TRANSITION_DURATION = 347.2;

  /**
   * The additional delay for each data element of a standard transition in
   * milliseconds.
   */
  static TRANSITION_DELAY = 57.87;

  static scatter(data, extent, index, elem) {
    let wrapper = elem.select('#plot-data-wrapper-' + index);

    if (!data) {  // data is null: user deselected, remove elements
      wrapper.transition('fade')
          .ease(d3.easeSinOut)
          .duration(Visualizations.TRANSITION_DURATION)
          .style('opacity', 0)
          .remove();

      return;
    }

    const maxMagnitude = Math.max(...(data['magnitudes'] || [1]));

    let xScale = d3.scaleLinear().domain(extent['x']).range([
      Plot.PADDING_FACTOR,
      100 - Plot.PADDING_FACTOR,
    ]);
    let yScale = d3.scaleLinear().domain(extent['y']).range([
      100 - Plot.PADDING_FACTOR,
      Plot.PADDING_FACTOR,
    ]);
    let rScale = d3.scaleSqrt().domain([0, maxMagnitude]).range([
      0, Visualizations.SCATTER_MAX_RADIUS
    ]);

    if (!wrapper.empty()) {  // extent has been changed: move the elements
      wrapper.selectAll('circle')
          .transition('move')
          .ease(d3.easeSinOut)
          .duration(Visualizations.TRANSITION_DURATION)
          .attr('cx', (_d, i) => xScale(data['x'][i]) + '%')
          .attr('cy', (_d, i) => yScale(data['y'][i]) + '%');

      return;
    }

    // draw the new ones
    const fillColor = `hsla(${Util.generateColor(index)}, 0.3333)`,
          strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`;

    wrapper = elem.append('g').attr('id', 'plot-data-wrapper-' + index);

    wrapper.selectAll('circle')
        .data(data['x'])
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d) + '%')
        .attr('cy', (_d, i) => yScale(data['y'][i]) + '%')
        .attr('r', 0)
        .style('fill', fillColor)
        .style('stroke', strokeColor)
        .style('stroke-width', '1px')
        .transition('fade')
        .ease(d3.easeElasticOut)
        .delay((_d, i) => i * Visualizations.TRANSITION_DELAY)
        .duration(Visualizations.TRANSITION_DURATION * 2)
        .attr(
            'r',
            (_d, i) => rScale(data['magnitude'] ? data['magnitude'][i] : 1));
  }

  static scatterAxes(extents, elem) {
    // GG: this function is called any time whenever there is a need to redraw
    // the axes.
    const plotWidth = elem.node().clientWidth,
          plotHeight = elem.node().clientHeight;

    // create scale for axis
    let xAxisPadding = Plot.PADDING_FACTOR / 100 * plotWidth;
    let yAxisPadding = Plot.PADDING_FACTOR / 100 * plotHeight;

    let xAxisScale = d3.scaleLinear().domain(extents['x']).range([
      0,
      plotWidth - xAxisPadding * 2,
    ]);
    let yAxisScale = d3.scaleLinear().domain(extents['y']).range([
      plotHeight - yAxisPadding * 2,
      0,
    ]);

    let xAxis = d3.axisBottom().scale(xAxisScale).ticks(5);
    let yAxis = d3.axisRight().scale(yAxisScale).ticks(5);

    // plot axes
    elem.select('#plot-x-axis')
        .transition()
        .ease(d3.easeSinOut)
        .duration(Visualizations.TRANSITION_DURATION)
        .call(xAxis);
    elem.select('#plot-y-axis')
        .transition()
        .ease(d3.easeSinOut)
        .duration(Visualizations.TRANSITION_DURATION)
        .call(yAxis);

    // show axis and title labels
    let tf = `translate(${plotWidth / 2}, ${plotHeight - yAxisPadding + 36})`;
    elem.select('#plot-x-label-text').attr('transform', tf).text('X-Label');

    tf = `translate(${xAxisPadding - 12}, ${plotHeight / 2}) `;
    elem.select('#plot-y-label-text')
        .attr('transform', tf + 'rotate(-90)')
        .text('Y-Label');

    tf = `translate(${plotWidth / 2}, 24)`;
    elem.select('#plot-title-text').attr('transform', tf).text('Plot');
  }
}

// GG: feel free to change any part of this code since I haven't tested it, so
// some things may just not make sense.
