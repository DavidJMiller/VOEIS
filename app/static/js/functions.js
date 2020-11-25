/**
 * Provides functions that calculate or plot statistics about numbers and
 * sequences.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * T 11/24/20
 */
class Functions {
  //#region STAT-CALCULATING FUNCTIONS /////////////////////////////////////////

  //#region SEQUENCES ----------------------------------------------------------

  static growthRate(sequence) {
    let x = [], y = [], yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < sequence['terms'].length - 1; i++) {
      x[i] = i;
      y[i] = sequence['terms'][i] == 0
          ? 0
          : sequence['terms'][i + 1] / sequence['terms'][i];
      if (y[i] < yMin) yMin = y[i];
      if (y[i] > yMax) yMax = y[i];
    }

    return new Plottable([0, x.length], [yMin, yMax], x, y);
  }

  static sequence(sequence) {
    let x = [], y = sequence['terms'], yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < y.length; i++) {
      x[i] = i + 1;
      yMin = Math.min(yMin, y[i]);
      yMax = Math.max(yMax, y[i]);
    }

    return new Plottable([0, x.length], [yMin, yMax], x, y);
  }

  static runningSum(sequence) {
    let x = [], y = sequence['terms'].concat(), yMin = Infinity,
        yMax = -Infinity;
    x.push(1);
    for (let i = 1; i < y.length; i++) {
      x[i] = i + 1;
      y[i] = y[i] + y[i - 1];
      if (y[i] < yMin) yMin = y[i];
      if (y[i] > yMax) yMax = y[i];
    }

    return new Plottable([1, x.length], [yMin, yMax], x, y);
  }

  //#endregion

  //#region NUMBERS ------------------------------------------------------------

  static indexCounts(number) {
    let x = [], y = [];
    for (let index in number['index_counts']) {
      x[+index] = +index + 1;
      y[+index] = number['index_counts'][index];
    }

    let yMax = 0;
    for (let i = 0; i < x.length; i++) {
      if (!y[i]) {
        x[i] = i + 1;
        y[i] = 0;
      } else if (y[i] > yMax) {
        yMax = y[i];
      }
    }

    return new Plottable([0, x.length], [0, yMax], x, y);
  }

  static neighbors(number) {
    let x = [0], y = [number['num']], magnitudes = [0], yMin = Infinity,
        yMax = -Infinity, xMin = Infinity, xMax = -Infinity, magnitudeMax = 0;
    const sortedDistances =
        Object.keys(number.neighbors).sort((x, y) => Math.abs(x) - Math.abs(y));
    for (let distance of sortedDistances) {
      let neighborCounts = number.neighbors[distance];
      for (let neighbor in neighborCounts) {
        if (+distance < xMin) xMin = +distance;
        if (+distance > xMax) xMax = +distance;
        if (+neighbor < yMin) yMin = +neighbor;
        if (+neighbor > yMax) yMax = +neighbor;
        magnitudeMax = Math.max(magnitudeMax, neighborCounts[neighbor]);
        x.push(+distance);
        y.push(+neighbor);
        magnitudes.push(neighborCounts[neighbor]);
      }
    }
    magnitudes[0] = magnitudeMax * 2;

    return new Plottable([xMin - 1, xMax + 1], [yMin, yMax], x, y, magnitudes);
  }

  //#endregion

  //#endregion

  //#region PLOTTING FUNCTIONS /////////////////////////////////////////////////

  //#region CONSTANTS ----------------------------------------------------------

  /** The total duration of a transition in milliseconds. */
  static TOTAL_TRANSITION_DURATION = 2083;

  /** The duration of an individual transition in milliseconds. */
  static TRANSITION_DURATION = 347.2;

  //#endregion

  //#region BAR ----------------------------------------------------------------

  static bar(elem, data, index, xExtent, _yExtent) {
    let wrapper = elem.select('#plot-data-wrapper-' + index);

    if (!data) {  // data is null: user deselected, remove elements
      wrapper.selectAll('rect')
          .transition('fade')
          .ease(d3.easeSinIn)
          .duration(Functions.TRANSITION_DURATION)
          .attr('y', '100%')
          .attr('height', '0%')
          .on('end', () => wrapper.remove());

      return;
    }

    const xScale = d3.scaleLinear().domain(xExtent).range([0, 100]),
          yScale = d3.scaleLinear().domain(data.yExtent).range([0, 100]);
    const width = 0.75 * (100 / (xExtent[1] - xExtent[0] + 1));

    if (!wrapper.empty()) {  // extent has been changed: move the elements
      wrapper.selectAll('rect')
          .transition('move')
          .ease(d3.easeSinOut)
          .duration(Functions.TRANSITION_DURATION)
          .attr('x', (_d, i) => (xScale(data.x[i]) - width / 2) + '%')
          .attr('y', (_d, i) => (100 - yScale(data.y[i])) + '%')
          .attr('height', (_d, i) => yScale(data.y[i]) + '%')
          .attr('width', width + '%');

      return;
    }

    // draw the new ones
    const fillColor = `hsla(${Util.generateColor(index)}, 0.3333)`,
          strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`;

    wrapper = elem.append('g')
                  .attr('class', 'plot-data-elem')
                  .attr('id', 'plot-data-wrapper-' + index);

    wrapper.selectAll('rect')
        .data(data['x'])
        .enter()
        .append('rect')
        .attr('x', d => xScale(d) - width / 2 + '%')
        .attr('y', '100%')
        .attr('height', '0%')
        .attr('width', width + '%')
        .style('fill', fillColor)
        .style('stroke', strokeColor)
        .style('stroke-width', '1px')
        .style('z-order', '1728')
        .transition('fade')
        .ease(d3.easeElasticOut)
        .delay(
            (_d, i) =>
                i * Functions.TOTAL_TRANSITION_DURATION / (data.length || 1))
        .duration(Functions.TRANSITION_DURATION * 2)
        .attr('y', (_d, i) => (100 - yScale(data.y[i])) + '%')
        .attr('height', (_d, i) => yScale(data.y[i]) + '%')
  }

  static indexCountAxes(elem, title, xLabel, yLabel, xExtent, yExtent) {
    Functions.scatterAxes(elem, title, xLabel, yLabel, xExtent, yExtent)
    elem.select('#plot-y-label-text').html('');
    elem.select('#plot-y-axis').html('');
  }

  //#endregion

  //#region GRID ---------------------------------------------------------------

  /** The default base to use in the grid plot. */
  static GRID_DEFAULT_BASE = 10;

  /** The number of columns in the grid plot. */
  static GRID_NUM_COLS = 80;

  /**
   * The maximum number of empty columns kept in the grid before it collapses
   * and injects an ellipsis.
   */
  static GRID_MAX_EMPTY_COLS = 2;

  /** The number of columns each instance of ellipses should take up. */
  static GRID_ELLIPSIS_COLS = 2;

  /** The number of dots each instance of ellipses should have. */
  static GRID_NUM_ELLIPSIS_DOTS = 3;

  /**
   * The fraction of the length of a cell in the grid plot to leave as the
   * space between cells.
   */
  static GRID_CELL_MARGIN_FACTOR = 0.0625;

  /**
   * @param {Selection} elem
   * @param {Plottable} data
   * @param {number} index
   * @param {[number, number]} _xExtent
   * @param {[number, number]} _yExtent
   */
  static grid(elem, data, index, _xExtent, _yExtent) {
    //#region DATA PROCESSING

    let wrapper = elem.select('#plot-data-wrapper-0');
    // use `wrapper.datum()` to store the plot's metadata
    /**
     * @type {[number, Map<number, number[]>, Map<number, Map<number,
     *     number[]>>]}
     */
    let [base, sequences, cells] = wrapper.datum();

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
      sequences.set(index, data.y);
      for (let i = 0; i < data.y.length; i++) {
        let num = data.y[i];
        if (!cells.has(num)) cells.set(num, new Map());
        if (cells.get(num).has(index))
          cells.get(num).get(index).push(i);
        else
          cells.get(num).set(index, [i]);
      }
    }

    // process cells: filter cells that fit into the display area and create
    // cell data array to feed into `d3.data()`
    //
    // let each element in the processed data be the selection info of the
    // incident number, and let `null` represent a cell in an empty column which
    // should not be displayed
    const numCols = Functions.GRID_NUM_COLS, numCells = base * numCols;

    let nums = Array.from(cells.keys()).sort((x, y) => x - y), zeroIndex;
    if (!nums.length || nums[0] >= 0)
      zeroIndex = 0;
    else if (nums[nums.length - 1] < 0)
      zeroIndex = nums.length;
    else
      zeroIndex = nums.findIndex(x => x >= 0);

    // fake a linked list by setting zero at the middle
    /** @type {[number, Map<number, number[]]>[]} */
    let buffer = new Array(2 * numCells);

    // process positive numbers first, then negative numbers: for each number,
    // determine (1) whether it'd into the grid and (2) how many empty columns
    // it'd leave and whether that'd trigger ellipses
    let currCol = 0, prevCol = 0;
    for (let i = zeroIndex; i < nums.length; i++) {
      currCol = Math.floor(nums[i] / base);
      if (currCol > prevCol + Functions.GRID_MAX_EMPTY_COLS + 1) {
        currCol = prevCol + Functions.GRID_ELLIPSIS_COLS + 1;
        if (currCol >= numCols) break;
        for (let j = 1; j <= Functions.GRID_ELLIPSIS_COLS; j++)
          for (let k = 0; k < base; k++)
            buffer[(numCols + prevCol + j) * base + k] = null;
      }
      prevCol = currCol;

      const cellIndex = numCells + currCol * base + nums[i] % base;
      buffer[cellIndex] = [nums[i], cells.get(nums[i])];
    }
    currCol = -1, prevCol = -1;
    for (let i = zeroIndex - 1; i >= 0; i--) {
      currCol = Math.floor(nums[i] / base);
      if (currCol < prevCol - Functions.GRID_MAX_EMPTY_COLS - 1) {
        currCol = prevCol - Functions.GRID_ELLIPSIS_COLS - 1;
        if (currCol < -numCols) break;
        for (let j = 1; j <= Functions.GRID_ELLIPSIS_COLS; j++)
          for (let k = 0; k < base; k++)
            buffer[(numCols + prevCol - j) * base + k] = null;
      }
      prevCol = currCol;

      const cellIndex =
          numCells + currCol * base + (nums[i] % base + base) % base;
      buffer[cellIndex] = [nums[i], cells.get(nums[i])];
    }

    // construct cell data: find the start and end position (the "range"
    // of relevant data in the buffer) and slice the buffer as final cell data
    // accordingly
    let start = numCols, end = numCols;
    for (let i = 2 * numCols - 1; i >= numCols && end == numCols; i--) {
      for (let j = 0; j < base; j++) {
        if (buffer[i * base + j]) {
          end = i + 1;
          break;
        }
      }
    }
    for (let i = 0; i < numCols && start == numCols; i++) {
      for (let j = 0; j < base; j++) {
        if (buffer[i * base + j]) {
          start = i;
          break;
        }
      }
    }
    let cellData;
    if (start < numCols / 2) {
      end = Math.min(end, Math.floor(numCells * 1.5));
      cellData = buffer.slice(end * base - numCells, end * base);
    } else {
      cellData = buffer.slice(start * base, start * base + numCells);
    }

    //#endregion

    //#region PLOTTING

    // "contents" refer to the wrapper of rectangles: one wrapper per sequence-
    // selection; multiple occurrences of the same number within the same
    // sequence would be handled by having stacked rects with the same color
    let contents =
        Functions.gridCells(wrapper, base, cellData)
            .selectAll('.plot-grid-cell-contents.active')
            .data(
                /**
                 * @param {[number, Map<number, number[]>]} d
                 * <sequenceIndex, occurrences[]>
                 */
                // data:
                // [seqIndex, selectionIndex, totalSelections, occurrences[]]
                d => d ? Array.from(d[1])
                             .sort((x, y) => x[0] - y[0])
                             .map((x, i) => [x[0], i, d[1].size, x[1]])
                       : [],
                // key: sequenceIndex
                d => d[0]);
    contents.exit()
        .classed('active', false)
        .transition()
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('x', d => 100 * (d[1] + 0.5) / d[2] + '%')
        .attr('y', '50%')
        .attr('width', '0%')
        .attr('height', '0%')
        .remove();
    contents.transition()
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('x', d => 100 * d[1] / d[2] + '%')
        .attr('width', d => 100 / d[2] + '%');
    contents = contents.enter()
                   .append('svg')
                   .attr('class', 'plot-grid-cell-contents active')
                   .attr('x', d => 100 * d[1] / d[2] + '%')
                   .attr('y', '0%')
                   .attr('width', d => 100 / d[2] + '%')
                   .attr('height', '100%')
                   .merge(contents);

    let rects = contents.selectAll('rect').data(
        /**
         * @param {[number, number, number, number[]]} d
         * [seqIndex, selectionIndex, totalSelections, occurrences[]]
         */
        // data: [sequenceIndex, occurrence]
        d => d[3].map(x => [d[0], x]),
        // key: occurrence
        d => d[1]);
    rects.exit().remove();
    let enteredRects =
        rects.enter()
            .append('rect')
            .style('fill', d => `hsla(${Util.generateColor(d[0])}, 0.3333)`)
            .attr('x', '50%')
            .attr('y', '50%')
            .attr('width', '0%')
            .attr('height', '0%');
    enteredRects
        .filter(d => d[0] == index)  // new selections
        .transition()
        .delay(
            d => (Functions.TOTAL_TRANSITION_DURATION -
                  Functions.TRANSITION_DURATION) *
                d[1] / (sequences.get(d[0]).length || 1))
        .ease(d3.easeElasticOut)
        .duration(Functions.TRANSITION_DURATION * 2)
        .attr('x', '0%')
        .attr('y', '0%')
        .attr('width', '100%')
        .attr('height', '100%');
    enteredRects.filter(d => d[0] != index)
        .transition()
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('x', '0%')
        .attr('y', '0%')
        .attr('width', '100%')
        .attr('height', '100%');

    //#endregion
  }

  static gridAxes(elem, title, _xLabel, yLabel, _xExtent, _yExtent) {
    // draw labels
    const plotWidth = elem.property('clientWidth'),
          plotHeight = elem.property('clientHeight');
    let tf = `translate(${plotWidth / 2}, -20)`;
    elem.select('#plot-title-text').attr('transform', tf).text(title);

    tf = `translate(-30, ${plotHeight / 2})`;
    elem.select('#plot-y-label-text')
        .text(yLabel)
        .attr('transform', tf + ' rotate(-90)');

    // clear unneeded labels
    elem.select('#plot-x-label-text').html('');
    elem.select('#plot-x-axis').html('');

    // draw background (all the empty cells, if needed)
    let wrapper = elem.select('#plot-data-wrapper-0')
    if (!wrapper.empty()) return;

    const base = Functions.GRID_DEFAULT_BASE;
    wrapper = elem.append('g')
                  .attr('class', 'plot-data-elem')
                  .attr('id', 'plot-data-wrapper-0')
                  // create metadata:
                  // [base, sequences, cells]
                  .datum([base, new Map(), new Map()]);

    Functions.gridCells(
        wrapper, base, new Array(base * Functions.GRID_NUM_COLS));
  }

  /**
   * @private Creates the cell elements and the backgrounds for the non-empty
   *     cells.
   * @param {Selection} wrapper
   * @param {number} base
   * @param {*[]} data
   */
  static gridCells(wrapper, base, data) {
    // create scales and calculate cell dimensions
    const xScale =
        d3.scaleLinear().domain([0, Functions.GRID_NUM_COLS]).range([0, 100]);
    const yScale = d3.scaleLinear().domain([0, base]).range([100, 0]);

    const margin = Functions.GRID_CELL_MARGIN_FACTOR,
          cellWidth = (xScale(1) - xScale(0)) * (1 - 2 * margin),
          cellHeight = (yScale(0) - yScale(1)) * (1 - 2 * margin),
          cellXOffset = (xScale(1) - xScale(0)) * margin,
          cellYOffset = (yScale(0) - yScale(1)) * margin;

    // create cell elements
    let cells = wrapper.selectAll('.plot-grid-cell').data(data);
    cells.exit().remove();
    cells = cells.enter()
                .append('svg')
                .attr('class', 'plot-grid-cell')
                .attr('id', (_d, i) => 'plot-grid-cell-' + i)
                .merge(cells);

    cells.attr('x', (_d, i) => xScale(Math.floor(i / base)) + cellXOffset + '%')
        .attr('y', (_d, i) => yScale(i % base + 1) + cellYOffset + '%')
        .attr('width', cellWidth + '%')
        .attr('height', cellHeight + '%');

    // draw cells' "clickable areas" (which ignore the margin)
    const invMargin = margin / (1 - 2 * margin);
    cells.selectAll('.plot-grid-cell-clickable-area')
        .data([true])
        .join('rect')
        .attr('class', 'plot-grid-cell-clickable-area')
        .style('opacity', 0)
        .attr('x', -invMargin * 100 + '%')
        .attr('y', -invMargin * 100 + '%')
        .attr('width', 100 + 200 * invMargin + '%')
        .attr('height', 100 + 200 * invMargin + '%');

    // draw cell backgrounds
    let backgrounds = cells.selectAll('.plot-grid-cell-background.active')
                          .data(d => d === null ? [] : [true]);
    // d: null=hidden, undefined=shown without contents
    backgrounds.exit()
        .classed('active', false)
        .transition()
        .ease(d3.easeSinIn)
        .duration(Functions.TRANSITION_DURATION)
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('width', '0%')
        .attr('height', '0%')
        .remove();
    backgrounds.enter()
        .append('rect')
        .attr('class', 'plot-grid-cell-background active')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('width', '0%')
        .attr('height', '0%')
        .transition()
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('x', '0%')
        .attr('y', '0%')
        .attr('width', '100%')
        .attr('height', '100%');

    // draw ellipses
    const numDots = Functions.GRID_NUM_ELLIPSIS_DOTS,
          dotSpan = Functions.GRID_ELLIPSIS_COLS;
    let ellipsisData = [];
    for (let i = 0; i < Functions.GRID_NUM_COLS; i++) {
      if (data[i * base] === null) {
        for (let j = 1; j <= numDots; j++)
          ellipsisData.push(i * (numDots + 1) / dotSpan + j);
        i += dotSpan - 1;
      }
    }
    let ellipses = wrapper.selectAll('.plot-grid-ellipsis-dot.active')
                       .data(ellipsisData, d => d);
    ellipses.exit()
        .classed('active', false)
        .transition()
        .ease(d3.easeSinIn)
        .duration(Functions.TRANSITION_DURATION)
        .attr('r', '0%')
        .remove();
    ellipses.enter()
        .append('circle')
        .attr('class', 'plot-grid-ellipsis-dot active')
        .attr('cx', d => xScale(d * dotSpan / (numDots + 1)) + '%')
        .attr('cy', '50%')
        .attr('r', '0%')
        .transition()
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .attr('r', Functions.GRID_CELL_MARGIN_FACTOR * cellWidth * 4 + '%');

    // create axis-ticks
    wrapper.selectAll('.plot-grid-tick.y')
        .data(d3.range(base))
        .join('text')
        .style('fill', 'black')
        .attr('class', 'plot-grid-tick y')
        .attr('id', d => 'plot-grid-tick-y-' + d)
        .attr('y', d => yScale(d + 0.5) + '%')
        .attr('transform', 'translate(-12, 4)')
        .text(d => d)
        .style('display', d => base > 12 && d % 2 ? 'none' : '');

    const numCols = Functions.GRID_NUM_COLS;
    let xTickData = [], prevColValue = -base;
    for (let i = 0; i < numCols; i++) {
      let currColValue;
      for (let j = 0; j < base; j++) {
        if (data[i * base + j]) {
          currColValue = Math.floor(data[i * base + j][0] / base) * base;
          break;
        }
      }
      if (currColValue === undefined) currColValue = prevColValue + base;
      xTickData.push(currColValue);
      prevColValue = currColValue;
    }
    wrapper.selectAll('.plot-grid-tick.x')
        .data(xTickData)
        .join('text')
        .style('fill', 'black')
        .attr('class', 'plot-grid-tick x')
        .attr('id', (_d, i) => 'plot-grid-tick-x-' + i)
        .attr('x', (_d, i) => xScale(i + 0.5) + '%')
        .attr('y', '100%')
        .attr('transform', 'translate(0, 12)')
        .text(d => d)
        .style('display', 'none');

    // create cells' mouse events
    cells.on('mouseover', (e, d) => {
      let target = d3.select(e.currentTarget);
      const i = target.attr('id').substr('plot-grid-cell-'.length);

      // show the corresponding x-tick and y-tick
      wrapper.selectAll('.plot-grid-tick.y').style('display', 'none');
      const row = i % base;
      wrapper.select('#plot-grid-tick-y-' + row).style('display', '');
      if (d === null) return;
      const col = Math.floor(i / base);
      wrapper.select('#plot-grid-tick-x-' + col).style('display', '');

      if (!d) return;
      // show the info about current number
      InfoPanel.header(d[0]);
      for (let [index, occurrences] of d[1]) {
        InfoPanel.text(`In selected sequence ${index + 1}: `)
            .text(
                occurrences.length, `hsl(${Util.generateColor(index, 0.5)})`,
                true)
            .text(' time' + (occurrences.length > 1 ? 's' : ''))
            .newline();
      }
      InfoPanel.show(target);
    });
    cells.on('mouseout', (e, d) => {
      let target = d3.select(e.currentTarget);
      const i = target.attr('id').substr('plot-grid-cell-'.length);

      // hide the corresponding x-tick and y-tick
      wrapper.selectAll('.plot-grid-tick.y')
          .style('display', d => base > 12 && d % 2 ? 'none' : '');
      if (d === null) return;
      const col = Math.floor(i / base);
      wrapper.select('#plot-grid-tick-x-' + col).style('display', 'none');

      if (d) InfoPanel.hide();
    });

    return cells;
  }

  //#endregion

  //#region LINE ---------------------------------------------------------------

  static line(elem, data, index, xExtent, yExtent) {
    let wrapper = elem.select('#plot-data-wrapper-' + index);

    const plotWidth = elem.node().clientWidth,
          plotHeight = elem.node().clientHeight;

    if (!data) {  // data is null: user deselected, remove elements
      wrapper.style('opacity', 1)
          .transition('fade')
          .ease(d3.easeSinIn)
          .duration(Functions.TRANSITION_DURATION)
          .style('opacity', 0)
          .remove();

      return;
    }

    const xScale = d3.scaleLinear().domain(xExtent).range([0, plotWidth]),
          yScale = d3.scaleLinear().domain(yExtent).range([plotHeight, 0]);

    const line = d3.line()
                     .x((_d, i) => xScale(data.x[i]))
                     .y((_d, i) => yScale(data.y[i]))
                     .curve(d3.curveLinear)

    if (!wrapper.empty()) {  // extent has been changed: move the elements
      wrapper.selectAll('path')
          .transition('move')
          .ease(d3.easeSinOut)
          .duration(Functions.TRANSITION_DURATION)
          .attr('d', line);

      return;
    }

    // draw the new ones
    const strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`;

    wrapper = elem.append('g')
                  .attr('class', 'plot-data-elem')
                  .attr('id', 'plot-data-wrapper-' + index);

    let path = wrapper.selectAll('path')
                   .data([data])
                   .enter()
                   .append('path')
                   .attr('d', line)
                   .style('fill', 'none')
                   .style('stroke', strokeColor)
                   .style('stroke-width', '2px')
                   .style('z-order', '1728')

    let totalLength = path.node().getTotalLength();

    path.attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .ease(d3.easeSinOut)
        .duration(Functions.TOTAL_TRANSITION_DURATION)
        .attr('stroke-dashoffset', 0)
  }

  //#endregion

  //#region SCATTER -----------------------------------------------------------

  /**
   * The radius of the dot representing the data item with the greatest
   * `magnitude` in a scatter plot.
   */
  static SCATTER_MAX_RADIUS = 12;

  /**
   * @param {Selection} elem
   * @param {Plottable} data
   * @param {number} index
   * @param {number[]} xExtent
   * @param {number[]} yExtent
   */
  static scatter(elem, data, index, xExtent, yExtent) {
    let wrapper = elem.select('#plot-data-wrapper-' + index);

    if (!data) {  // data is null: user deselected, remove elements
      wrapper.classed('active', false)
          .selectAll('circle')
          .transition('fade')
          .ease(d3.easeSinIn)
          .duration(Functions.TRANSITION_DURATION)
          .attr('r', 0)
          .on('end', () => wrapper.remove());

      return;
    }

    const maxMagnitude = data.magnitudes ? Math.max(...data.magnitudes) : 4;
    // if magnitudes not provided, default to every circle having radius 1/2
    // of max radius.

    const xScale = d3.scaleLinear().domain(xExtent).range([0, 100]),
          yScale = d3.scaleLinear().domain(yExtent).range([100, 0]),
          rScale = d3.scaleSqrt().domain([0, maxMagnitude]).range([
            0, Functions.SCATTER_MAX_RADIUS
          ]);

    if (!wrapper.empty() && wrapper.classed('active')) {
      // extent has been changed: move the elements
      wrapper.selectAll('circle')
          .transition('move')
          .ease(d3.easeSinOut)
          .duration(Functions.TRANSITION_DURATION)
          .attr('cx', (_d, i) => xScale(data.x[i]) + '%')
          .attr('cy', (_d, i) => yScale(data.y[i]) + '%');

      return;
    }

    // draw the new ones
    const fillColor = `hsla(${Util.generateColor(index)}, 0.3333)`,
          strokeColor = `hsla(${Util.generateColor(index)}, 0.6667)`;

    wrapper = elem.append('g')
                  .attr('class', 'plot-data-elem active')
                  .attr('id', 'plot-data-wrapper-' + index)
                  .lower();  // in case there's another wrapper "dying", we want
                             // to select the first wrapper in the future

    wrapper.selectAll('circle')
        .data(data['x'])
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d) + '%')
        .attr('cy', (_d, i) => yScale(data.y[i]) + '%')
        .attr('r', 0)
        .style('fill', fillColor)
        .style('stroke', strokeColor)
        .style('stroke-width', '1px')
        .style('z-order', '1728')
        .transition('fade')
        .ease(d3.easeElasticOut)
        .delay(
            (_d, i) => i *
                (Functions.TOTAL_TRANSITION_DURATION -
                 Functions.TRANSITION_DURATION) /
                (data.length || 1))
        .duration(Functions.TRANSITION_DURATION * 2)
        .attr('r', (_d, i) => rScale(data.magnitudes ? data.magnitudes[i] : 1));
  }

  static scatterAxes(elem, title, xLabel, yLabel, xExtent, yExtent) {
    // this function is called any time whenever there is a need to redraw the
    // axes
    const plotWidth = elem.property('clientWidth'),
          plotHeight = elem.property('clientHeight');

    // create scale for axis
    const xAxisScale = d3.scaleLinear().domain(xExtent).range([0, plotWidth]),
          yAxisScale = d3.scaleLinear().domain(yExtent).range([plotHeight, 0]),
          xAxis = d3.axisBottom().scale(xAxisScale).ticks(5),
          yAxis = d3.axisLeft().scale(yAxisScale).ticks(5);

    // plot axes
    elem.select('#plot-x-axis')
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .call(xAxis);
    elem.select('#plot-y-axis')
        .classed('text-only-axis', false)
        .transition('move')
        .ease(d3.easeSinOut)
        .duration(Functions.TRANSITION_DURATION)
        .call(yAxis);

    // show axis and title labels
    let tf = `translate(${plotWidth / 2}, ${plotHeight + 32})`;
    elem.select('#plot-x-label-text').attr('transform', tf).text(xLabel);

    const maxExtent =
        Math.abs(yExtent[0]) > Math.abs(yExtent[1]) ? yExtent[0] : yExtent[1];
    tf = `translate(${- 18 - maxExtent.toString().length * 6}, ${
        plotHeight / 2})`;
    let yLabelElem = elem.select('#plot-y-label-text');
    yLabelElem.text(yLabel);
    yLabelElem.transition('move')
        .ease(d3.easeSinOut)
        .duration(
            yLabelElem.attr('transform').includes('translate')
                ? Functions.TRANSITION_DURATION
                : 0)  // no transition for initial display to avoid being nifty
        .attr('transform', tf + ' rotate(-90)');

    tf = `translate(${plotWidth / 2}, -20)`;
    elem.select('#plot-title-text').attr('transform', tf).text(title);
  }

  //#endregion

  //#endregion
}
