/**
 * Represents and controls the main view element in our VOEIS webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * A 11/21/20
 */
class View {
  //#region STATIC MEMBERS /////////////////////////////////////////////////////

  //#endregion

  //#region CONSTRUCTOR ////////////////////////////////////////////////////////

  constructor() {
    /* default view */
    this.currView = 'local';

    /* plots for each view */
    this.mainPlot = new Plot('main-plot-svg');
    this.bottomPlot = new Plot('bottom-plot-svg');
    this.secondaryPlot = new Plot('secondary-plot-svg');
    this.ternaryPlot = new Plot('ternary-plot-svg');
    this.textPlot = new Plot('text-plot-svg');

    /**
     * @type {Map<Plot, Object<string, {options: PlotOptions[], currIndex:
     *     number}>} Defines which plot-options are allowed within each plot
     */
    this.plotOptions = new Map();
    this.plotOptions.set(this.mainPlot, {
      'local': {
        'options': [
          PlotOptions.SEQUENCE,
          PlotOptions.GROWTH_RATE,
          PlotOptions.RUNNING_SUM,
        ],
        'currIndex': 0,
      },
      'global': {
        'options': [
          PlotOptions.SLOANES_GAP,
        ],
        'currIndex': 0,
      },
      'fixed': {
        'options': [
          PlotOptions.NEIGHBORS,
          PlotOptions.INDEX_COUNTS,
        ],
        'currIndex': 0,
      },
    });
    this.plotOptions.set(this.bottomPlot, {
      'local': {
        'options': [
          PlotOptions.GRID,
        ],
        'currIndex': 0,
      },
      'global': {
        'options': [
          PlotOptions.GRID,
        ],
        'currIndex': 0,
      },
      'fixed': {
        'options': [
          PlotOptions.INDEX_COUNTS,
        ],
        'currIndex': 0,
      }
    });
    this.plotOptions.set(this.secondaryPlot, {
      'local': {
        'options': [
          PlotOptions.SEQUENCE,
          PlotOptions.GROWTH_RATE,
          PlotOptions.RUNNING_SUM,
        ],
        'currIndex': 1,
      },
      'global': {
        'options': [
          PlotOptions.SLOANES_GAP,
        ],
        'currIndex': 0,
      },
      'fixed': {
        'options': [
          PlotOptions.NEIGHBORS,
          PlotOptions.INDEX_COUNTS,
        ],
        'currIndex': 1,
      },
    });
    this.plotOptions.set(this.bottomPlot, {
      'local': {
        'options': [
          PlotOptions.GRID,
        ],
        'currIndex': 0,
      },
      'global': {
        'options': [
          PlotOptions.GRID,
        ],
        'currIndex': 0,
      },
      'fixed': {
        'options': [
          PlotOptions.INDEX_COUNTS,
        ],
        'currIndex': 0,
      }
    });
    this.plotOptions.set(this.ternaryPlot, {
      'local': {
        'options': [
          PlotOptions.SEQUENCE,
          PlotOptions.GROWTH_RATE,
          PlotOptions.RUNNING_SUM,
        ],
        'currIndex': 2,
      },
      'global': {
        'options': [
          PlotOptions.SLOANES_GAP,
        ],
        'currIndex': 0,
      },
      'fixed': {
        'options': [
          PlotOptions.NEIGHBORS,
          PlotOptions.INDEX_COUNTS,
        ],
        'currIndex': 1,
      },
    });
    this.plotOptions.set(this.textPlot, this.plotOptions.get(this.mainPlot));

    /** @type {Set<Plot>} The plots in the view. */
    this.plots = new Set(this.plotOptions.keys());

    /** @type {Map<number, object>} The current selections. */
    this.selections = new Map();

    this.changeView(this.currView);
  }

  //#endregion

  //#region METHODS ////////////////////////////////////////////////////////////

  /**
   * Changes the view. This method is called when the user clicks on one of the
   * tabs in the view-navigator.
   * @param {string} newView The name of the view to change to, which might take
   *     the value of either `"local"`, `"global"`, or `"fixed"`.
   */
  changeView(newView) {
    this.currView = newView;
    this.selections.clear();

    for (let [plot, options] of this.plotOptions) {
      plot.setOptions(
          options[this.currView]['options'],
          options[this.currView]['currIndex']);
    }
  }

  /* plot is changing the plotted statistics */
  changeStat(plot, option) {
    /* TODO */
  }

  /**
   * Views an OEIS sequence. This method is called when the user clicks on a
   * search result/history item under the local- or global-view, or when a
   * sequence-preset is loaded.
   * @param {object} sequence A JSON object with the sequence's data.
   * @param {boolean} isSelected `true` if the user just selected the sequence,
   *     or `false` if they just deselected it.
   */
  viewSequence(sequence, index) {
    if (sequence)
      this.selections.set(index, sequence);
    else
      this.selections.delete(index);

    // for (let plot of this.plots) plot.drawPlot(sequence, index);
    this.mainPlot.drawPlot(sequence, index);
    this.bottomPlot.drawPlot(sequence, index);
    this.secondaryPlot.drawPlot(sequence, index);
    this.ternaryPlot.drawPlot(sequence, index);
    // this.textPlot.drawPlot(sequence, index);
  }

  /**
   * Views a number that has appeared in any OEIS sequence. This method is
   * called when the user clicks on a search result/history item under the
   * fixed-view.
   * @param {object} number A JSON object with the number's data.
   * @param {boolean} isSelected `true` if the user just selected the number,
   *     or `false` if they just deselected it.
   */
  viewNumber(number, index) {
    if (number)
      this.selections.set(index, number);
    else
      this.selections.delete(index);

    // for (let plot of this.plots) plot.drawPlot(number, index);
    this.mainPlot.drawPlot(number, index);
    this.bottomPlot.drawPlot(number, index);
    // this.secondaryPlot.drawPlot(number, index);
    // this.ternaryPlot.drawPlot(number, index);
    // this.textPlot.drawPlot(number, index);

    if (number['num'] == 42) {
      DBHandler.getSloanes(d => {
        console.log(d);
      });
      DBHandler.getNumber('12', d => console.log(d));
    }
  }

  //#endregion
}

//#region HELPER CLASSES ///////////////////////////////////////////////////////

/**
 * Provides calculator and plotting functions for each plot-option to use.
 *
 * Each static constant in this class represents a supported plot-option and
 * should have the following attributes: `menuText`, `title`, `xLabel`,
 * `yLabel`, `calculate`, `plotData`, and `plotAxes`.
 */
class PlotOptions {
  //#region LOCAL //////////////////////////////////////////////////////////////

  static SEQUENCE = new PlotOption(
      'Sequence Terms',
      'Sequence Terms',
      'Index',
      'Term',
      Functions.sequence,
      Functions.scatter,
      Functions.scatterAxes,
  );

  static GRID = new PlotOption(
      '',
      'Last-Digit Distribution',
      '',
      'Last Digit',
      Functions.sequence,
      Functions.grid,
      Functions.gridAxes,
  );

  static GROWTH_RATE = new PlotOption(
      'Growth Rate',
      'Growth Rate',
      'Index',
      'Growth Rate',
      Functions.growthRate,
      Functions.line,
      Functions.scatterAxes,
      true,
  );

  static RUNNING_SUM = new PlotOption(
      'Running Sum',
      'Running Sum',
      'Index',
      'Sum of First n Terms',
      Functions.runningSum,
      Functions.line,
      Functions.scatterAxes,
      true,
  );

  //#endregion

  //#region GLOBAL /////////////////////////////////////////////////////////////

  static SLOANES_GAP = new PlotOption(
      '',
      'Number of sequences each integer has appeared in',
      'Number',
      'Number of sequences',
      null,
      null,
      null,
  );

  //#endregion

  //#region FIXED //////////////////////////////////////////////////////////////

  static NEIGHBORS = new PlotOption(
      'Neighbors',
      'Most Frequent Neighbors',
      'Neighbor Distance',
      'Neighbor',
      Functions.neighbors,
      Functions.scatter,
      Functions.scatterAxes,
  );

  static INDEX_COUNTS = new PlotOption(
      'Index Counts',
      'Index Counts in all Sequences',
      'Index',
      'Occurrence Frequency',
      Functions.indexCounts,
      Functions.bar,
      Functions.indexCountAxes,
  );
  //#endregion
}

//#endregion
