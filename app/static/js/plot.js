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
   * @param {string} plotId The ID of the SVG element in our webpage this plot
   *     should control (without the leading `#` sign).
   */
  constructor(plotId) {
    /**
     * @private @type {Selection} A D3-selection containing an SVG for the plot.
     */
    this.plotElem = d3.select('#' + plotId);

    /** @type {PlotOption} */
    this.currOption = null;

    /**
     * @private @type {Map<number, Plottable>} The `Plottable` data currently
     *     displayed in this plot, for each "color-index."
     */
    this.plottedData = new Map();

    this.xExtent = Plot.DEFAULT_EXTENTS.concat();  // concat makes hard copies
    this.yExtent = Plot.DEFAULT_EXTENTS.concat();

    this.xAxisElem = null;
    this.yAxisElem = null;
    this.xLabelElem = null;
    this.yLabelElem = null;
    this.titleElem = null;

    this.initPlot();

    // redraw axes and other background elements when the size of browser window
    // changes
    window.addEventListener('resize', () => this.drawAxes());
  }

  //#endregion

  //#region METHODS ////////////////////////////////////////////////////////////

  /** @private Creates other background elements needed for this plot. */
  initPlot() {
    this.xAxisElem = this.plotElem.append('svg')
                         .attr('y', '100%')
                         .append('g')
                         .attr('id', 'plot-x-axis');
    this.yAxisElem =
        this.plotElem.append('svg').append('g').attr('id', 'plot-y-axis');
    this.xLabelElem = this.plotElem.append('text')
                          .attr('id', 'plot-x-label-text')
                          .attr('class', 'x-axis-label');
    this.yLabelElem = this.plotElem.append('text')
                          .attr('id', 'plot-y-label-text')
                          .attr('class', 'y-axis-label')
                          .attr('transform', 'rotate(-90)');
    this.titleElem = this.plotElem.append('text')
                         .attr('id', 'plot-title-text')
                         .attr('class', 'title-label');
  }

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
        this.currOption.plotData(
            this.plotElem, plottedData, i, this.xExtent, this.yExtent,
            this.currOption.showInfo);
      }
    }
    this.currOption.plotData(
        this.plotElem, currPlottable, index, this.xExtent, this.yExtent,
        this.currOption.showInfo);
  }

  /* remove drawn elements, but not axis */
  clearPlot() {
    this.plotElem.selectAll('.plot-data-elem').remove();
    this.plotElem.datum(undefined);
    this.plottedData.clear();
    this.xExtent[0] = this.yExtent[0] = Plot.DEFAULT_EXTENTS[0];
    this.xExtent[1] = this.yExtent[1] = Plot.DEFAULT_EXTENTS[1];
  }

  /* set plot-able stats for this plot */
  setOptions(options, defaultIndex) {
    this.clearPlot();
    this.currOption = options[defaultIndex];

    /* TODO */

    this.drawAxes();
  }

  /** @private */
  drawAxes() {
    if (!this.currOption) return;
    this.currOption.plotAxes(
        this.plotElem, this.currOption.plotTitle, this.currOption.plotXLabel,
        this.currOption.plotYLabel, this.xExtent, this.yExtent);
    if (this.currOption.plotDataOnResize) {
      for (let [index, plottedData] of this.plottedData) {
        this.currOption.plotData(
            this.plotElem, plottedData, index, this.xExtent, this.yExtent,
            this.currOption.showInfo);
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

//#region HELPER CLASSES ///////////////////////////////////////////////////////

/**
 * Represents an option of statistics to display for a sequence or number the
 * user can choose to plot and view.
 */
class PlotOption {
  /**
   * Creates a new `PlotOption` instance.
   * @param {string} menuTitle The text to display for this plot-option in the
   *     option-selection menu.
   * @param {string} plotTitle The text to display as the plot's title.
   * @param {string} plotXLabel The text to display as the plot's X-label.
   * @param {string} plotYLabel The text to display as the plot's Y-label.
   * @param {function(object):Plottable} calculate The calculating function for
   *     this plot-option to use, which convert a JSON object (the raw data of a
   *     sequence or number) to a `Plottable` object.
   * @param {function(Selection, Plottable, number[], number[], number,
   *     function):void} plotData The data-plotting function for this
   *     plot-option to use, which takes a `Plottable` object and plots it
   *     inside a given display element.
   * @param {function(Selection, PlotOption, number[], number[]):void} plotAxes
   *     The axis-plotting function for this plot-option to use, which draws the
   *     axes and/or background needed inside a given display element.
   * @param {function([number, Plottable, number][]):boolean} showInfo The
   *     function to call with a data point which generates the necessary text
   *     to display in the info-panel (if any). Must return whether the
   *     info-panel should show with the given data values. Defaults to a
   *     function that does nothing but returning `false`.
   * @param {boolean} plotDataOnResize Whether the `plotData` function should be
   *     called whenever the window resized. Defaults to false.
   */
  constructor(
      menuTitle, plotTitle, plotXLabel, plotYLabel, calculate, plotData,
      plotAxes, showInfo = null, plotDataOnResize = false) {
    /**
     * @type {string} menuText The text to display for this plot-option in the
     *     option-selection menu.
     */
    this.menuTitle = menuTitle;

    /**
     * @type {string} The text to display as the plot's title.
     */
    this.plotTitle = plotTitle;

    /**
     * @type {string} The text to display as the plot's X-label.
     */
    this.plotXLabel = plotXLabel;

    /**
     * @type {string} The text to display as the plot's Y-label.
     */
    this.plotYLabel = plotYLabel;

    /**
     * @type {function(object):Plottable} The calculating function for
     *     this plot-option to use, which convert a JSON object (the raw data of
     *     a sequence or number) to a `Plottable` object.
     */
    this.calculate = calculate;

    this.plotData = plotData;

    /**
     * @type {function(Selection, PlotOption, number[], number[])} The
     *     axis-plotting function for this plot-option to use, which draws the
     *     axes and/or background needed inside a given display element.
     */
    this.plotAxes = plotAxes;

    this.showInfo = showInfo || (() => false);

    this.plotDataOnResize = plotDataOnResize;
  }
}

/** Represents and provides data ready to be plotted. */
class Plottable {
  /**
   * Creates a new `Plottable` instance.
   * @param {object} rawData The raw JSON data that's used to generate this
   *     plottable data.
   * @param {number[]} xExtent The extent of the X-values, in the form of `[min,
   *     max]`.
   * @param {number[]} yExtent The extent of the Y-values, in the form of `[min,
   *     max]`.
   * @param {number[]} x The actual X-values ready to be scaled and plotted.
   * @param {number[]} y The actual Y-values ready to be scaled and plotted.
   *     Must have the same length as `x`.
   * @param {number[]} magnitudes The attached "magnitude" value for each data
   *     point. Must have the same length as `x` or be `null`. Defaults to
   *     `null`.
   */
  constructor(rawData, xExtent, yExtent, x, y, magnitudes = null) {
    this.rawData = rawData;
    this.xExtent = xExtent;
    this.yExtent = yExtent;
    this.x = x;
    this.y = y;
    this.magnitudes = magnitudes;

    if (y.length != x.length || magnitudes && magnitudes.length != x.length)
      throw 'Lengths of data points do not match.';

    this.length = x.length;
  }
}

//#endregion
