/**
 * Represents an option of statistics to display for a sequence or number the
 * user can choose to plot and view.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 11/25/20
 */
class PlotOption {
  /**
   * Creates a new `PlotOption` instance.
   * @param {string} menuTitle The text to display for this plot-option in the
   *   option-selection menu.
   * @param {string} plotTitle The text to display as the plot's title.
   * @param {string} plotXLabel The text to display as the plot's X-label.
   * @param {string} plotYLabel The text to display as the plot's Y-label.
   * @param {function(object):Plottable} calculate The calculating function for
   *   this plot-option to use, which convert a JSON object (the raw data of a
   *   sequence or number) to a `Plottable` object.
   * @param {function(Selection, Plottable, number[], number[], number,
   *   function):void} plotData The data-plotting function for this plot-option
   *   to use, which takes a `Plottable` object and plots it inside a given
   *   display element.
   * @param {function(Selection, PlotOption, number[], number[]):void} plotAxes
   *   The axis-plotting function for this plot-option to use, which draws the
   *   axes and/or background needed inside a given display element.
   * @param {function([number, Plottable, number][]):boolean} showInfo The
   *   function to call with a data point which generates the necessary text to
   *   display in the info-panel (if any). Must return whether the info-panel
   *   should show with the given data values. Defaults to a function that does
   *   nothing but returning `false`.
   * @param {boolean} plotDataOnResize Whether the `plotData` function should be
   *   called whenever the window resized. Defaults to false.
   */
  constructor(menuTitle, plotTitle, plotXLabel, plotYLabel, calculate, plotData,
    plotAxes, showInfo = null, plotDataOnResize = false) {
    /**
     * @type {string} menuText The text to display for this plot-option in the
     *   option-selection menu.
     */
    this.menuTitle = menuTitle;

    /** @type {string} The text to display as the plot's title. */
    this.plotTitle = plotTitle;

    /** @type {string} The text to display as the plot's X-label. */
    this.plotXLabel = plotXLabel;

    /** @type {string} The text to display as the plot's Y-label. */
    this.plotYLabel = plotYLabel;

    /**
     * @type {function(object):Plottable} The calculating function for
     *   this plot-option to use, which convert a JSON object (the raw data of
     *   a sequence or number) to a `Plottable` object.
     */
    this.calculate = calculate;

    this.plotData = plotData;

    /**
     * @type {function(Selection, PlotOption, number[], number[])} The
     *   axis-plotting function for this plot-option to use, which draws the
     *   axes and/or background needed inside a given display element.
     */
    this.plotAxes = plotAxes;

    this.showInfo = showInfo || (() => false);

    this.plotDataOnResize = plotDataOnResize;
  }
}
