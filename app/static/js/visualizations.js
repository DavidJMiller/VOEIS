/** W 11/18/20 */
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

  //#region CONSTANTS //////////////////////////////////////////////////////////

  /**
   * @type {Object<string, {plotData: function({x: number[], y: number[],
   *     xExtent: number[], yExtent: number[], title: string, xLabel: string,
   *     yLabel: string}, {x: number[], y: number[]}, number, Selection):void,
   *     'plotAxes': function({x: number[], y: number[]}, Selection):void}>}}
   * Maps each plot type to the appropriate visualization functions.
   */
  static PLOT_TYPES = {
    'grid': {
      'plotData': Visualizations.grid,
      'plotAxes': Visualizations.gridAxes,
    },
    'scatter': {
      'plotData': Visualizations.scatter,
      'plotAxes': Visualizations.scatterAxes,
    },
  };

  /** The total duration of a transition in milliseconds. */
  static TOTAL_TRANSITION_DURATION = 2083;

  /** The duration of an individual transition in milliseconds. */
  static TRANSITION_DURATION = 347.2;

  //#endregion

  //#region GRID ////////////////////////////////////////////////////////

  /** The default base to use in the grid plot. */
  static GRID_DEFAULT_BASE = 10;

  /** The number of columns in the grid plot. */
  static GRID_NUM_COLUMNS = 50;

  /**
   * The maximum number of empty columns kept in the grid before it collapses
   * and injects ellipses.
   */
  static GRID_MAX_EMPTY_COLUMNS = 2;

  /**
   * The fraction of the length of a cell in the grid plot to leave as the
   * padding between cells.
   */
  static GRID_CELL_PADDING_FACTOR = 0.0625;

  static GRID_CELL_CORNER_RADIUS = 2;

  static grid(data, extents, index, elem) {
    // use `elem.datum()` to store the plot's metadata
    /**
     * @type {{base: number, sequences: Map<number, number[]>, cells:
     *     Map<number, Set<number>>}}
     */
    let metadata = elem.datum();
    if (!metadata) {
      elem.datum(metadata = {
        'base': Visualizations.GRID_DEFAULT_BASE,
        'sequences': new Map(),
        'cells': new Map(),
      });
    }

    // update the cells
    //
    // handle deselection: delete this index from plotted numbers
    if (!data) {
      for (let num of metadata['sequences'].get(index)) {
        if (!metadata['cells'].has(num)) continue;
        if (metadata['cells'].get(num).delete(index) &&
            !metadata['cells'].get(num).size)
          metadata['cells'].delete(num);
      }
      metadata['sequences'].delete(index);
    } else {
      // handle movement: nothing to handle for this particular vis
      if (metadata['sequences'].has(index)) return;

      // handle new selection: add this index to plotted numbers; numbers in the
      // sequences are given as the Y-values
      metadata['sequences'].set(index, data['y']);
      for (let num of data['y']) {
        if (!metadata['cells'].has(num)) metadata['cells'].set(num, new Set());
        metadata['cells'].get(num).add(index);
      }
    }

    // process cells: filter cells that fit into the display area and create
    // cell data object to feed into `d3.data()`
    //
    // let each element in the processed data be an array of incident indices,
    // and let `null` represent a cell in an empty column which should not be
    // displayed.

    const numCells = metadata['base'] * Visualizations.GRID_NUM_COLUMNS;

    let nums = Array.from(metadata['cells'].keys()).sort((x, y) => x - y),
        zeroIndex;
    if (!nums.length || nums[0] >= 0)
      zeroIndex = 0;
    else if (nums[nums.length - 1] < 0)
      zeroIndex = nums.length;
    else
      zeroIndex = nums.findIndex(x => x >= 0);

    // fake a linked list by setting zero at the middle
    let buffer = new Array(2 * numCells).fill([]),
        isColumnSkipped =
            new Array(2 * Visualizations.GRID_NUM_COLUMNS).fill(false);

    let currColumn = 0, prevColumn = 0;
    for (let i = zeroIndex; i < nums.length; i++) {
      currColumn = Math.floor(nums[i] / metadata['base']);
      if (currColumn > prevColumn + Visualizations.GRID_MAX_EMPTY_COLUMNS + 1) {
        currColumn = prevColumn + Visualizations.GRID_MAX_EMPTY_COLUMNS + 1;
        for (let j = 1; j <= Visualizations.GRID_MAX_EMPTY_COLUMNS; j++)
          isColumnSkipped[Visualizations.GRID_NUM_COLUMNS + prevColumn + j] =
              true;
      }
      if (currColumn >= isColumnSkipped.length / 2) break;
      prevColumn = currColumn;

      let cellIndex =
          numCells + currColumn * metadata['base'] + nums[i] % metadata['base'];
      buffer[cellIndex] =
          Array.from(metadata['cells'].get(nums[i])).sort((x, y) => x - y);
    }

    currColumn = -1, prevColumn = -1;
    for (let i = zeroIndex; i < nums.length; i++) {
      currColumn = Math.floor(nums[i] / metadata['base']);
      if (currColumn < prevColumn + Visualizations.GRID_MAX_EMPTY_COLUMNS - 1) {
        currColumn = prevColumn + Visualizations.GRID_MAX_EMPTY_COLUMNS - 1;
        for (let j = 1; j <= Visualizations.GRID_MAX_EMPTY_COLUMNS; j++)
          isColumnSkipped[Visualizations.GRID_NUM_COLUMNS + prevColumn - j] =
              true;
      }
      if (currColumn < isColumnSkipped.length / 2) break;
      prevColumn = currColumn;

      let cellIndex = numCells + currColumn * metadata['base'] +
          (nums[i] % metadata['base'] + metadata['base']) % metadata['base'];
      buffer[cellIndex] =
          Array.from(metadata['cells'].get(nums[i])).sort((x, y) => x - y);
    }

    for (let i = 0; i < isColumnSkipped.length; i++)
      if (isColumnSkipped[i])
        for (let j = 0; j < metadata['base']; j++)
          buffer[i * metadata['base'] + j] = null;

    let firstIndex = Math.floor(
                         Math.max(buffer.findIndex(x => x.length), 0) /
                         metadata['base']) *
        metadata['base'],
        cellData = buffer.slice(firstIndex, firstIndex + numCells);

    const xScale = d3.scaleLinear()
                       .domain([
                         0,
                         Visualizations.GRID_NUM_COLUMNS,
                       ])
                       .range([
                         Plot.PADDING_FACTOR,
                         100 - Plot.PADDING_FACTOR,
                       ]);
    const yScale = d3.scaleLinear()
                       .domain([
                         0,
                         metadata['base'],
                       ])
                       .range([
                         100 - Plot.PADDING_FACTOR,
                         Plot.PADDING_FACTOR,
                       ]);

    const cellWidth = (xScale(1) - xScale(0)) *
        (1 - 2 * Visualizations.GRID_CELL_PADDING_FACTOR),
          cellHeight = (yScale(0) - yScale(1)) *
        (1 - 2 * Visualizations.GRID_CELL_PADDING_FACTOR),
          cellXOffset =
              (xScale(1) - xScale(0)) * Visualizations.GRID_CELL_PADDING_FACTOR,
          cellYOffset =
              (yScale(0) - yScale(1)) * Visualizations.GRID_CELL_PADDING_FACTOR;

    let cells = elem.selectAll('rect').data(cellData);
    cells = cells.enter().append('rect').merge(cells);

    //     enteredCells = cells.enter();
    // enteredCells.append('rect')
    cells.attr('rx', Visualizations.GRID_CELL_CORNER_RADIUS)
        .attr('ry', Visualizations.GRID_CELL_CORNER_RADIUS)
        .attr(
            'x',
            (_d, i) =>
                xScale(Math.floor(i / metadata['base'])) + cellXOffset + '%')
        .attr(
            'y',
            (_d, i) => yScale(i % metadata['base'] + 1) + cellYOffset + '%')
        .attr('width', cellWidth + '%')
        .attr('height', cellHeight + '%');
    // // .style('opacity', 0)
    // // .transition('fade')
    // // .ease(d3.easeSinOut)
    // // .duration(Visualizations.TRANSITION_DURATION)
    // // .style('opacity', 1);
    // cells = enteredCells.merge(cells);
    cells.style('fill', d => {
      if (!d) return 'transparent';
      if (!d.length) return 'var(--gray-a-8)';

      return `hsla(${Util.generateColor(d[0])}, 0.3333)`;
    });
  }

  static gridAxes(extents, elem) {}

  //#region SCATTER ////////////////////////////////////////////////////////////

  /**
   * The radius of the dot representing the data item with the greatest
   * `magnitude` in a scatter plot.
   */
  static SCATTER_MAX_RADIUS = 6;

  static scatter(data, extents, index, elem) {
    let wrapper = elem.select('#plot-data-wrapper-' + index);

    if (!data) {  // data is null: user deselected, remove elements
      wrapper.selectAll('circle')
          .transition('fade')
          .ease(d3.easeSinOut)
          .duration(Visualizations.TRANSITION_DURATION)
          .attr('r', 0)
          .on('end', () => wrapper.remove());

      return;
    }

    const maxMagnitude =
        data.hasOwnProperty('magnitudes') ? Math.max(...data['magnitudes']) : 1;

    const xScale = d3.scaleLinear().domain(extents['x']).range([
      Plot.PADDING_FACTOR,
      100 - Plot.PADDING_FACTOR,
    ]);
    const yScale = d3.scaleLinear().domain(extents['y']).range([
      100 - Plot.PADDING_FACTOR,
      Plot.PADDING_FACTOR,
    ]);
    const rScale = d3.scaleSqrt().domain([0, maxMagnitude]).range([
      0,
      Visualizations.SCATTER_MAX_RADIUS,
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

    wrapper = elem.append('g')
                  .attr('class', 'plot-data-elem')
                  .attr('id', 'plot-data-wrapper-' + index);

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
        .delay(
            (_d, i) => i * Visualizations.TOTAL_TRANSITION_DURATION /
                (data['x'].length || 1))
        .duration(Visualizations.TRANSITION_DURATION * 2)
        .attr(
            'r',
            (_d, i) => rScale(data['magnitude'] ? data['magnitude'][i] : 1));
  }

  static scatterAxes(extents, elem) {
    // this function is called any time whenever there is a need to redraw the
    // axes
    const plotWidth = elem.node().clientWidth,
          plotHeight = elem.node().clientHeight;

    // create scale for axis
    const xAxisPadding = Plot.PADDING_FACTOR / 100 * plotWidth;
    const yAxisPadding = Plot.PADDING_FACTOR / 100 * plotHeight;

    const xAxisScale = d3.scaleLinear().domain(extents['x']).range([
      0,
      plotWidth - xAxisPadding * 2,
    ]);
    const yAxisScale = d3.scaleLinear().domain(extents['y']).range([
      plotHeight - yAxisPadding * 2,
      0,
    ]);

    const xAxis = d3.axisBottom().scale(xAxisScale).ticks(5);
    const yAxis = d3.axisRight().scale(yAxisScale).ticks(5);

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

  //#endregion
}
