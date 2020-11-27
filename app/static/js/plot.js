/**
 * Represents and controls a plot element in our VOEIS webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 11/25/20
 */
class Plot {
  //#region STATIC MEMBERS /////////////////////////////////////////////////////

  /** The extents to use (for both X and Y) when there is no data to plot. */
  static DEFAULT_EXTENTS = [0, 12];

  //#endregion

  //#region CONSTRUCTOR ////////////////////////////////////////////////////////

  /**
   * Creates a new `Plot` instance.
   * @param {string} plotId The ID of the element in our webpage this plot
   *   should control (without the leading `#` sign).
   */
  constructor(plotId) {
    this.plotElem = d3.select('#' + plotId);

    /**
     * @private @type {Selection} A D3-selection containing an SVG for the plot.
     */
    this.plotSvgElem = this.plotElem.append('svg').attr('class', 'plot-svg');

    /** @type {PlotOption} */
    this.currOption = null;

    /**
     * @private @type {Map<number, Plottable>} The `Plottable` data currently
     *   displayed in this plot, for each "color-index."
     */
    this.plottedData = new Map();

    this.xExtent = Plot.DEFAULT_EXTENTS.concat();  // concat makes hard copies
    this.yExtent = Plot.DEFAULT_EXTENTS.concat();

    this.xAxisElem = null;
    this.yAxisElem = null;
    this.xLabelElem = null;
    this.yLabelElem = null;
    this.titleElem = null;

    this.plotMenu = new PlotMenu(this.plotElem);
    this.onOptionChange = () => {};

    this.initPlot();

    // redraw axes and other background elements when the size of browser window
    // changes
    window.addEventListener('resize', () => this.drawAxes(true));
  }

  /** @private Creates other background elements needed for this plot. */
  initPlot() {
    this.xAxisElem = this.plotSvgElem.append('svg')
                       .attr('y', '100%')
                       .append('g')
                       .attr('id', 'plot-x-axis');
    this.yAxisElem =
      this.plotSvgElem.append('svg').append('g').attr('id', 'plot-y-axis');
    this.xLabelElem = this.plotSvgElem.append('text')
                        .attr('id', 'plot-x-label-text')
                        .attr('class', 'x-axis-label');
    this.yLabelElem = this.plotSvgElem.append('text')
                        .attr('id', 'plot-y-label-text')
                        .attr('class', 'y-axis-label')
                        .attr('transform', 'rotate(-90)');
    this.titleElem = this.plotSvgElem.append('text')
                       .attr('id', 'plot-title-text')
                       .attr('class', 'title-label');
  }

  //#endregion

  //#region METHODS ////////////////////////////////////////////////////////////

  /* get appropriate function and send it data to plot */
  drawPlot(data, index) {
    let currPlottable = data && this.currOption.calculate(data);

    if (currPlottable)
      this.plottedData.set(index, currPlottable);
    else
      this.plottedData.delete(index);

    if (this.calculateExtents(currPlottable)) {
      // extents have changed; redraw axes
      this.drawAxes();

      // move previously-plotted data points
      for (let [i, plottedData] of this.plottedData) {
        if (i == index) continue;
        this.currOption.plotData(this.plotSvgElem, plottedData, i, this.xExtent,
          this.yExtent, this.currOption.showInfo, this.plotMenu);
      }
    }
    this.currOption.plotData(this.plotSvgElem, currPlottable, index,
      this.xExtent, this.yExtent, this.currOption.showInfo, this.plotMenu);
  }

  /* remove drawn elements, but not axis */
  clearPlot() {
    this.plotSvgElem.selectAll('.plot-data-elem').remove();
    this.plotSvgElem.datum(undefined);
    this.xAxisElem.html('');
    this.yAxisElem.html('');
    this.titleElem.html('');
    this.xLabelElem.html('');
    this.yLabelElem.html('');

    this.plottedData.clear();
    this.xExtent[0] = this.yExtent[0] = Plot.DEFAULT_EXTENTS[0];
    this.xExtent[1] = this.yExtent[1] = Plot.DEFAULT_EXTENTS[1];
  }

  /**
   * @param {PlotOption[]} options
   * @param {number} defaultIndex
   */
  setOptions(options, defaultIndex) {
    this.clearPlot();
    this.currOption = options[defaultIndex];

    this.plotMenu.clear();
    if (options.length == 1) {
      this.drawAxes();
      return;  // don't show just one option
    }
    for (let i = 0; i < options.length; i++) {
      this.plotMenu.appendSelectable(
        options[i].menuTitle,
        options[i],
        () => {
          this.plotMenu.deselectSelectable(this.currOption)
            .removeClasses('plot-setting');
          this.onOptionChange(i);
          this.currOption = options[i];
          this.plotMenu.selectSelectable(this.currOption).hide();

          // make a clone since we're about to clear
          let oldPlottedData = new Map(this.plottedData.entries());
          this.clearPlot();
          this.drawAxes();
          for (let [index, plottedData] of oldPlottedData)
            this.drawPlot(plottedData.rawData, index);
        },
      );
    }
    this.plotMenu.selectSelectable(this.currOption);

    this.drawAxes();
  }

  /** @private */
  drawAxes(drawResizablePlots = false) {
    if (!this.currOption) return;

    this.plotMenu.forceClasses('plot-setting');
    this.currOption.plotAxes(this.plotSvgElem, this.currOption.plotTitle,
      this.currOption.plotXLabel, this.currOption.plotYLabel, this.xExtent,
      this.yExtent, this.plotMenu);
    this.plotMenu.releaseClasses('plot-setting');

    if (drawResizablePlots && this.currOption.plotDataOnResize) {
      for (let [index, plottedData] of this.plottedData) {
        this.currOption.plotData(this.plotSvgElem, plottedData, index,
          this.xExtent, this.yExtent, this.currOption.showInfo, this.plotMenu);
      }
    }
  }

  /**
   * @private Finds the extreme X- and Y-values as the new extents.
   * @param {Plottable} newData
   * @returns Whether the extents has changed, which would trigger a re-draw.
   */
  calculateExtents(newData) {
    let xMin, xMax, yMin, yMax;
    if (newData && this.plottedData.size > 1) {
      // `newData` is the new selection
      xMin = Math.min(this.xExtent[0], newData.xExtent[0]);
      xMax = Math.max(this.xExtent[1], newData.xExtent[1]);
      yMin = Math.min(this.yExtent[0], newData.yExtent[0]);
      yMax = Math.max(this.yExtent[1], newData.yExtent[1]);
    } else {  // a deselection by the user
      xMin = Infinity, yMin = Infinity;
      xMax = -Infinity, yMax = -Infinity;
      for (let data of this.plottedData.values()) {
        xMin = Math.min(xMin, data.xExtent[0]);
        xMax = Math.max(xMax, data.xExtent[1]);
        yMin = Math.min(yMin, data.yExtent[0]);
        yMax = Math.max(yMax, data.yExtent[1]);
      }
      if (xMin == Infinity) {  // no data left
        xMin = yMin = Plot.DEFAULT_EXTENTS[0];
        xMax = yMax = Plot.DEFAULT_EXTENTS[1];
      }
    }

    if (xMin == this.xExtent[0] && xMax == this.xExtent[1] &&
      yMin == this.yExtent[0] && yMax == this.yExtent[1])
      return false;

    this.xExtent[0] = xMin;
    this.xExtent[1] = xMax;
    this.yExtent[0] = yMin;
    this.yExtent[1] = yMax;

    return true;
  }

  //#endregion
}
