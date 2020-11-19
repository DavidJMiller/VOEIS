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
   * @type {object} Maps each plot type to the appropriate visualization
   *     functions.
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
  // plotData:
  // (1) new selection (once for the new selection)
  // (2) when extents change (n-1 times where n is number of selections)
  // (3) deselect (once for the deselection)
  // plotAxes: whenever window size changes

  /** The total duration of a transition in milliseconds. */
  static TOTAL_TRANSITION_DURATION = 2083;

  /** The duration of an individual transition in milliseconds. */
  static TRANSITION_DURATION = 347.2;

  //#endregion

  //#region GRID ///////////////////////////////////////////////////////////////

  /** The default base to use in the grid plot. */
  static GRID_DEFAULT_BASE = 10;

  /** The number of columns in the grid plot. */
  static GRID_NUM_COLS = 72;

  /**
   * The maximum number of empty columns kept in the grid before it collapses
   * and injects ellipses.
   */
  static GRID_MAX_EMPTY_COLS = 2;

  /** The number of columns the ellipses should take up. */
  static GRID_ELLIPSES_COLS = 2;

  /**
   * The fraction of the length of a cell in the grid plot to leave as the
   * padding between cells.
   */
  static GRID_CELL_PADDING_FACTOR = 0.0625;

  /**
   * The corner radius of a cell in pixels. (TODO: this doesn't work in SVGs)
   */
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
    const base = metadata['base'], sequences = metadata['sequences'],
          cells = metadata['cells'];

    // update the cells
    //
    // handle deselection: delete this index from plotted numbers
    if (!data) {
      for (let num of sequences.get(index)) {
        if (!cells.has(num)) continue;
        if (cells.get(num).delete(index) && !cells.get(num).size)
          cells.delete(num);
      }
      sequences.delete(index);
    } else {
      // handle movement: nothing to handle for this particular vis
      if (sequences.has(index)) return;

      // handle new selection: add this index to plotted numbers; numbers in the
      // sequences are given as the Y-values
      sequences.set(index, data['y']);
      for (let num of data['y']) {
        if (!cells.has(num)) cells.set(num, new Set());
        cells.get(num).add(index);
      }
    }

    // process cells: filter cells that fit into the display area and create
    // cell data object to feed into `d3.data()`
    //
    // let each element in the processed data be an array of incident indices,
    // and let `null` represent a cell in an empty column which should not be
    // displayed.

    const numCols = Visualizations.GRID_NUM_COLS, numCells = base * numCols;

    let nums = Array.from(cells.keys()).sort((x, y) => x - y), zeroIndex;
    if (!nums.length || nums[0] >= 0)
      zeroIndex = 0;
    else if (nums[nums.length - 1] < 0)
      zeroIndex = nums.length;
    else
      zeroIndex = nums.findIndex(x => x >= 0);

    // fake a linked list by setting zero at the middle
    let buffer = new Array(2 * numCells).fill([]),
        isColumnSkipped = new Array(2 * numCols).fill(false);

    let currCol = 0, prevCol = 0;
    for (let i = zeroIndex; i < nums.length; i++) {
      currCol = Math.floor(nums[i] / base);
      if (currCol > prevCol + Visualizations.GRID_MAX_EMPTY_COLS + 1) {
        currCol = prevCol + Visualizations.GRID_ELLIPSES_COLS + 1;
        if (currCol >= numCols) break;
        for (let j = 1; j <= Visualizations.GRID_ELLIPSES_COLS; j++)
          isColumnSkipped[numCols + prevCol + j] = true;
      }
      prevCol = currCol;

      const cellIndex = numCells + currCol * base + nums[i] % base;
      buffer[cellIndex] = Array.from(cells.get(nums[i])).sort((x, y) => x - y);
    }

    currCol = -1, prevCol = -1;
    for (let i = zeroIndex - 1; i >= 0; i--) {
      currCol = Math.floor(nums[i] / base);
      if (currCol < prevCol - Visualizations.GRID_MAX_EMPTY_COLS - 1) {
        if (currCol < -numCols) break;
        currCol = prevCol - Visualizations.GRID_ELLIPSES_COLS - 1;
        for (let j = 1; j <= Visualizations.GRID_ELLIPSES_COLS; j++)
          isColumnSkipped[numCols + prevCol - j] = true;
      }
      prevCol = currCol;

      const cellIndex = numCells + currCol * base + nums[i] % base + base;
      buffer[cellIndex] = Array.from(cells.get(nums[i])).sort((x, y) => x - y);
    }

    for (let i = 0; i < 2 * numCols; i++)
      if (isColumnSkipped[i])
        for (let j = 0; j < base; j++) buffer[i * base + j] = null;

    // construct cell data
    let start = numCols, end = Infinity;
    for (let i = 2 * numCols - 1; i >= numCols && end == Infinity; i--) {
      for (let j = 0; j < base; j++) {
        if (buffer[i * base + j].length) {
          end = i + 1;
          break;
        }
      }
    }
    for (let i = 0; i < numCols && start == numCols; i++) {
      for (let j = 0; j < base; j++) {
        if (buffer[i * base + j].length) {
          start = i;
          break;
        }
      }
    }
    let cellData;
    if (start < numCols / 2) {
      end = Math.min(end, Math.ceil(numCells * 1.5));
      cellData = buffer.slice(end * base - numCells, end * base);
    } else {
      cellData = buffer.slice(start * base, start * base + numCells);
    }

    const xScale =
        d3.scaleLinear().domain([0, Visualizations.GRID_NUM_COLS]).range([
          0, 100
        ]);
    const yScale = d3.scaleLinear().domain([0, base]).range([100, 0]);

    const cellWidth = (xScale(1) - xScale(0)) *
        (1 - 2 * Visualizations.GRID_CELL_PADDING_FACTOR),
          cellHeight = (yScale(0) - yScale(1)) *
        (1 - 2 * Visualizations.GRID_CELL_PADDING_FACTOR),
          cellXOffset =
              (xScale(1) - xScale(0)) * Visualizations.GRID_CELL_PADDING_FACTOR,
          cellYOffset =
              (yScale(0) - yScale(1)) * Visualizations.GRID_CELL_PADDING_FACTOR;

    let cellElems = elem.selectAll('svg').data(cellData);
    cellElems = cellElems.enter()
                    .append('svg')
                    .attr('class', 'plot-data-elem')
                    .merge(cellElems);
    cellElems
        .attr('x', (_d, i) => xScale(Math.floor(i / base)) + cellXOffset + '%')
        .attr('y', (_d, i) => yScale(i % base + 1) + cellYOffset + '%');
    let cellBackgrounds = cellElems.selectAll('.plot-grid-cell-background')
                              .data(d => d ? [0] : []);
    cellBackgrounds.exit().remove();
    cellBackgrounds.enter()
        .append('rect')
        .attr('class', 'plot-grid-cell-background')
        .attr('width', (_d, _i, a) => cellWidth / a.length + '%')
        .attr('height', cellHeight + '%');

    cellElems.filter(d => !d).selectAll('.plot-grid-cell').remove();

    let cellContents =
        cellElems.filter(d => d).selectAll('.plot-grid-cell').data(d => d);
    cellContents.exit().remove();
    cellContents = cellContents.enter()
                       .append('rect')
                       .attr('class', 'plot-grid-cell')
                       .merge(cellContents);
    cellContents
        .attr('x', (_d, i, a) => (cellXOffset + cellWidth / a.length * i) + '%')
        .attr('width', (_d, _i, a) => cellWidth / a.length + '%')
        .attr('height', cellHeight + '%')
        .style('fill', d => `hsla(${Util.generateColor(d)}, 0.3333)`);
  }

  static gridAxes(xLabel, yLabel, title, extents, elem) {}

  //#endregion

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
          .ease(d3.easeSinIn)
          .duration(Visualizations.TRANSITION_DURATION)
          .attr('r', 0)
          .on('end', () => wrapper.remove());

      return;
    }

    const maxMagnitude =
        data.hasOwnProperty('magnitudes') ? Math.max(...data['magnitudes']) : 1;

    const xScale = d3.scaleLinear().domain(extents['x']).range([0, 100]),
          yScale = d3.scaleLinear().domain(extents['y']).range([100, 0]),
          rScale = d3.scaleSqrt().domain([0, maxMagnitude]).range([
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

  static scatterAxes(xLabel, yLabel, title, extents, elem) {
    // this function is called any time whenever there is a need to redraw the
    // axes
    const plotWidth = elem.node().clientWidth,
          plotHeight = elem.node().clientHeight;

    // create scale for axis
    const xAxisScale =
        d3.scaleLinear().domain(extents['x']).range([0, plotWidth]),
          yAxisScale =
              d3.scaleLinear().domain(extents['y']).range([plotHeight, 0]),
          xAxis = d3.axisBottom().scale(xAxisScale).ticks(5),
          yAxis = d3.axisLeft().scale(yAxisScale).ticks(5);

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
    let tf = `translate(${plotWidth / 2}, ${plotHeight + 32})`;
    elem.select('#plot-x-label-text').attr('transform', tf).text(xLabel);

    tf = `translate(${- extents['y'].toString().length * 7}, ${
        plotHeight / 2}) `;
    elem.select('#plot-y-label-text')
        .text(yLabel)
        .transition()
        .ease(d3.easeSinOut)
        .duration(Visualizations.TRANSITION_DURATION)
        .attr('transform', tf + 'rotate(-90)');

    tf = `translate(${plotWidth / 2}, -8)`;
    elem.select('#plot-title-text').attr('transform', tf).text(title);
  }

  //#endregion
}
