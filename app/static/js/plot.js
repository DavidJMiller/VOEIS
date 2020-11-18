/** M 11/16/20 */
class Plot {
  /** The extents to use (for both X and Y) when there is no data to plot. */
  static DEFAULT_EXTENTS = [0, 12];

  static PADDING_FACTOR = 12.5;

  /* main, bottom, secondary, ternary, text */
  constructor(plotId, plotType) {
    /**
     * @private @type {Selection} A D3-selection containing a SVG for the plot.
     */
    this.plot = d3.select('#' + plotId);

    this.currPlotType = plotType;

    /**
     * @private @type {Map<number, object>} The data currently displayed in this
     *     plot, for each "color-index."
     */
    this.plottedData = new Map();

    /** @private @type {object} The extents of the axes. */
    this.extents = {
      x: Plot.DEFAULT_EXTENTS.concat(),  // concat makes hard copies
      y: Plot.DEFAULT_EXTENTS.concat(),
    };

    this.xAxisElem = this.plot.append('svg')
                         .attr('x', Plot.PADDING_FACTOR + '%')
                         .attr('y', 100 - Plot.PADDING_FACTOR + '%')
                         .append('g')
                         .attr('id', 'plot-x-axis');
    this.yAxisElem = this.plot.append('svg')
                         .attr('x', Plot.PADDING_FACTOR + '%')
                         .attr('y', Plot.PADDING_FACTOR + '%')
                         .append('g')
                         .attr('id', 'plot-y-axis');
    this.xAxisLabel = this.plot.append('text')
                          .attr('id', 'plot-x-label-text')
                          .attr('class', 'axis-label');
    this.xAxisLabel = this.plot.append('text')
                          .attr('id', 'plot-y-label-text')
                          .attr('class', 'axis-label');
    this.titleLabel = this.plot.append('text')
                          .attr('id', 'plot-title-text')
                          .attr('class', 'title-label');

    let onWindowResize = () => {
      Visualizations.PLOT_TYPES[this.currPlotType]['plotAxes'](
          this.extents, this.plot);
    };

    window.addEventListener('resize', onWindowResize);
    onWindowResize();  // force a resize now
  }

  /* get appropriate function and send it data to plot */
  drawPlot(data, index) {
    let visFuncs = Visualizations.PLOT_TYPES[this.currPlotType];

    if (data)
      this.plottedData.set(index, data);
    else
      this.plottedData.delete(index);

    if (this.calculateExtents(data)) {
      visFuncs['plotAxes'](this.extents, this.plot);
      for (let [i, plottedData] of this.plottedData) {
        if (i == index) continue;  // don't move the new data before drawing
        visFuncs['plotData'](plottedData, this.extents, i, this.plot);
      }
    }
    visFuncs['plotData'](data, this.extents, index, this.plot);
  }

  /* remove drawn elements, but not axis */
  clearPlot() {
    this.plot.selectAll('.plot-data-elem').remove();
    this.plottedData.clear();
  }

  /* set plot-able stats for this plot */
  setMenuItems(index, menuItems) {
    /* TODO:
      We are plotting the statistic menuItems[index]. Also let
      dropdown have items in menuItems.
    */
    // GG: do this later after multiple selection and deletion are working
    // correctly.
  }

  /**
   * @private Finds the extreme X- and Y-values as the new extents.
   * @returns Whether the extents has changed, which would trigger a re-draw.
   */
  calculateExtents(newData) {
    let xMin, xMax, yMin, yMax;
    if (newData && this.plottedData.size) {  // `newData` is the new selection
      xMin = Math.min(this.extents['x'][0], newData['xExtent'][0]);
      xMax = Math.max(this.extents['x'][1], newData['xExtent'][1]);
      yMin = Math.min(this.extents['y'][0], newData['yExtent'][0]);
      yMax = Math.max(this.extents['y'][1], newData['yExtent'][1]);
    } else {  // a deselection by the user
      xMin = Infinity, yMin = Infinity;
      xMax = -Infinity, yMax = -Infinity;
      for (let data of this.plottedData.values()) {
        xMin = Math.min(xMin, data['xExtent'][0]);
        xMax = Math.max(xMax, data['xExtent'][1]);
        yMin = Math.min(xMin, data['yExtent'][0]);
        yMax = Math.max(xMax, data['yExtent'][1]);
      }
      if (xMin == Infinity) {  // no data left
        xMin = yMin = Plot.DEFAULT_EXTENTS[0];
        xMax = yMax = Plot.DEFAULT_EXTENTS[1];
      }
    }

    if (xMin == this.extents['x'][0] && xMax == this.extents['x'][1] &&
        yMin == this.extents['y'][0] && yMax == this.extents['y'][1])
      return false;

    this.extents['x'][0] = xMin;
    this.extents['x'][1] = xMax;
    this.extents['y'][0] = yMin;
    this.extents['y'][1] = yMax;

    return true;
  }
}
