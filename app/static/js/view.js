class View {
  constructor() {
    this.mainPlot = new Plot('main-plot-svg', 'scatter');
    this.bottomPlot = new Plot('bottom-plot-svg', 'scatter');
    this.secondaryPlot = new Plot('secondary-plot-svg', 'scatter');
    this.ternaryPlot = new Plot('ternary-plot-svg', 'scatter');
    this.textPlot = new Plot('text-plot-svg', 'scatter');

    /** @type {Map<Plot, function>} */
    this.plotFuncs = new Map();
    this.plotFuncs.set(this.mainPlot, Functions.defaultMain);
    this.plotFuncs.set(this.bottomPlot, Functions.defaultMain);
    this.plotFuncs.set(this.secondaryPlot, Functions.defaultMain);
    this.plotFuncs.set(this.ternaryPlot, Functions.defaultMain);
    this.plotFuncs.set(this.textPlot, Functions.defaultMain);
  }

  /**
   * Changes the view. This method is called when the user clicks on one of the
   * tabs in the view-navigator.
   * @param {string} newView The name of the view to change to, which might take
   *     the value of either `"local"`, `"global"`, or `"fixed"`.
   */
  changeView(newView, sequences, numbers) {}

  /**
   * Views an OEIS sequence. This method is called when the user clicks on a
   * search result/history item under the local- or global-view, or when a
   * sequence-preset is loaded.
   * @param {object} sequence A JSON object with the sequence's data.
   * @param {boolean} isSelected `true` if the user just selected the sequence,
   *     or `false` if they just deselected it.
   */
  viewSequence(sequence, index) {
    let processedSequenceData = {
      values: [],
      xLabel: 'Indices',
      yLabel: 'Values',
      title: 'Terms',
    };
    for (let i = 0; i < sequence['terms'].length; i++) {
      processedSequenceData['values'].push({
        x: i + 1,
        y: sequence['terms'][i],
        magnitude: 1,
      });
    }
    for (let plot of this.plotFuncs.keys())
      plot.drawPlot(processedSequenceData);
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
    console.log(number);
    let processedNumberData = {
      values: [],
      xLabel: 'Offsets',
      yLabel: 'Neighbors',
      title: 'Popular Neighbors',
    };
    let maxMagnitude = 0;
    for (let offset in number['neighbors']) {
      for (let neighbor in number['neighbors'][offset]) {
        processedNumberData['values'].push({
          x: offset,
          y: neighbor,
          magnitude: number['neighbors'][offset][neighbor],
        });
        maxMagnitude =
            Math.max(maxMagnitude, number['neighbors'][offset][neighbor]);
      }
    }
    processedNumberData['values'].push({
      x: 0,
      y: number['num'],
      magnitude: maxMagnitude,
    });
    for (let plot of this.plotFuncs.keys()) plot.drawPlot(processedNumberData);
  }
}

class Functions {
  static defaultMain(json) {
    return {
      x: [1, 2, 3],
      y: [1, 4, 9],
      xLabel: 'xLabel',
      yLabel: 'yLabel',
      title: 'title',
      magnitude: [2, 3, 5]
    };
  }
}
