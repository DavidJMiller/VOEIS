/** M 11/16/20 */
class View {
  constructor() {
    this.currView = 'global';

    this.mainPlot = new Plot('main-plot-svg', 'scatter');
    this.bottomPlot = new Plot('bottom-plot-svg', 'grid');
    this.secondaryPlot = new Plot('secondary-plot-svg', 'scatter');
    this.ternaryPlot = new Plot('ternary-plot-svg', 'scatter');
    this.textPlot = new Plot('text-plot-svg', 'scatter');

    /* plot iterable */
    this.plots = [
      this.mainPlot, this.secondaryPlot, this.ternaryPlot, this.bottomPlot,
      this.textPlot
    ];

    /* set which stats are allowed within each view and plot */
    this.plotStats = new Map();
    this.plotStats.set(this.mainPlot, {
      'local': ['Sequence Terms', 'Growth Rate'],
      'global': ['Sloane\'s'],
      'fixed': ['Neighbors', 'Index Count']
    });
    this.plotStats.set(this.secondaryPlot, this.plotStats.get(this.mainPlot));
    this.plotStats.set(this.ternaryPlot, this.plotStats.get(this.mainPlot));
    this.plotStats.set(this.bottomPlot, {
      'local': ['GH Squares'],
      'global': ['Top vs Bottom Band'],
      'fixed': ['Index Count']
    });
    this.plotStats.set(this.textPlot, this.plotStats.get(this.mainPlot));

    /* plot -> {local stat index, global stat index, fixed stat index}*/
    this.plotIndices = new Map();
    this.plotIndices.set(this.mainPlot, {'local': 0, 'global': 0, 'fixed': 0});
    this.plotIndices.set(
        this.secondaryPlot, {'local': 0, 'global': 0, 'fixed': 0});
    this.plotIndices.set(
        this.ternaryPlot, {'local': 0, 'global': 0, 'fixed': 0});
    this.plotIndices.set(
        this.bottomPlot, {'local': 0, 'global': 0, 'fixed': 0});
    this.plotIndices.set(this.textPlot, {'local': 0, 'global': 0, 'fixed': 0});

    this.plotFuncs = new Map();
    this.plotFuncs.set(this.mainPlot, {
      'local': [Functions.sequence, Functions.sequence],
      'global': [Functions.sequence],
      'fixed': [Functions.sequence, Functions.sequence]
    });
    this.plotFuncs.set(this.secondaryPlot, this.plotFuncs.get(this.mainPlot));
    this.plotFuncs.set(this.ternaryPlot, this.plotFuncs.get(this.mainPlot));
    this.plotFuncs.set(this.bottomPlot, {
      'local': [Functions.sequence],
      'global': [Functions.sequence],
      'fixed': [Functions.sequence]
    });
    this.plotFuncs.set(this.textPlot, this.plotFuncs.get(this.mainPlot));

    /** @type {Map<number, object>} The current selections. */
    this.selections = new Map();
  }

  /**
   * Changes the view. This method is called when the user clicks on one of the
   * tabs in the view-navigator.
   * @param {string} newView The name of the view to change to, which might take
   *     the value of either `"local"`, `"global"`, or `"fixed"`.
   */
  changeView(newView) {
    this.currView = newView;
    this.selections.clear();

    for (let plot of this.plots) {
      plot.clearPlot();
      let index = this.plotIndices.get(plot)[newView];
      let menuItems = this.plotStats.get(plot)[newView];
      plot.setMenuItems(index, menuItems);
    }
  }

  /* plot is changing the plotted statistic to index */
  changeStat(plot, index) {
    this.plotIndices.get(plot)[this.currView] = index;
    let plotFunc = this.plotFunc.get(plot)[this.currView][index];
    for (let [i, selection] of this.selections)
      plot.drawPlot(plotFunc(selection), i);
  }

  /* private func: update single plot */
  // updatePlot(plot, plotData, index) {
  //  plot.drawPlot(plotData, index);
  //}

  /**
   * Views an OEIS sequence. This method is called when the user clicks on a
   * search result/history item under the local- or global-view, or when a
   * sequence-preset is loaded.
   * @param {object} sequence A JSON object with the sequence's data.
   * @param {boolean} isSelected `true` if the user just selected the sequence,
   *     or `false` if they just deselected it.
   */
  viewSequence(sequence, index) {
    this.selections.set(index, sequence);

    if (sequence == null) { /* deplotting */
      for (let plot of this.plots) {
        plot.drawPlot(null, index);
      }
    } else {
      let plotData;
      let plotIndex;
      for (let plot of this.plots) {
        plotIndex = this.plotIndices.get(plot)[this.currView];
        plotData = this.plotFuncs.get(plot)[this.currView][plotIndex](sequence);
        plot.drawPlot(plotData, index);
      }
    }
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
    this.selections.set(index, number);

    if (number == null) { /* deplotting */
      for (let plot of this.plots) {
        plot.drawPlot(null, index);
      }
    } else {
      let plotData;
      for (let plot of this.plots) {
        plotData = this.plotFuncs.get(plot)[this.currView][index](sequence);
        plot.drawPlot(plotData, index);
      }
    }
  }
}

/* functions used to pack data
we get sequence jsons in the form
    a_num: "AXXXXXX"
    name: "..."
    terms: [size n]
and number jsons in the form
    index_counts: {0:int, 1:int, ...}
    neighbors: {-max_offset: {int: count}, ...}
    num: int
    total_count: int
    total_num_sequences: int
Then we send data to plots in the form
    x: [size n]
    y: [size n]
    xExtent: [xMin, xMax]
    yExtent: [yMin, ymax]
    title: "..."
    xLabel: "..."
    yLabel: "..."
*/
class Functions {
  static indexCount(json) {
    let x = [], y = [];
    for (let index in json['index_counts']) {
      x.push(+index);
      y.push(json['index_counts'][index]);
    }
    return {
      'x': x,
      'y': y,
      'xExtent': [x[0], x[x.length - 1]],
      'yExtent': d3.extent(y),
      'title': 'Index Count',
      'xLabel': 'Index',
      'yLabel': 'Count',
    };
  }

  static sequence(json) {
    return {
      'x': Array(json.terms.length).fill().map((x, i) => i + 1),
      'y': json.terms.map(x => x),
      'xExtent': [0, json.terms.length],
      'yExtent': d3.extent(json.terms),
      'title': 'Sequence Terms',
      'xLabel': 'Index',
      'yLabel': 'Value'
    };
  }
}
