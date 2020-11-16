class View {

  constructor() {
    this.currView = 'global';

    this.mainPlot = new Plot('main-plot-svg', 'scatter');
    this.bottomPlot = new Plot('bottom-plot-svg', 'scatter');
    this.secondaryPlot = new Plot('secondary-plot-svg', 'scatter');
    this.ternaryPlot = new Plot('ternary-plot-svg', 'scatter');
    this.textPlot = new Plot('text-plot-svg', 'scatter');

    /* plot iterable */
    this.plots = [
      this.mainPlot, 
      this.secondaryPlot,
      this.ternaryPlot,
      this.bottomPlot,
      this.textPlot
    ];

    /* set which stats are allowed within each view and plot */ 
    this.plotStats = new Map();
    this.plotStats.set(this.mainPlot,
      {'local': ['Sequence Terms', 'Growth Rate'],
        'global': ['Sloane\'s'],
        'fixed': ['Neighbors', 'Something']
      });
    this.plotStats.set(this.secondaryPlot, this.plotStats.get(this.mainPlot));
    this.plotStats.set(this.ternaryPlot, this.plotStats.get(this.mainPlot));
    this.plotStats.set(this.bottomPlot,
      {'local': ['GH Squares'],
        'global': ['Top vs Bottom Band'],
        'fixed': ['Index Count']
      });
    this.plotStats.set(this.textPlot, this.plotStats.get(this.mainPlot));
 
    /* plot -> {local stat index, global stat index, fixed stat index}*/ 
    this.plotIndices = new Map();
    this.plotIndices.set(this.mainPlot, {'local': 0, 'global': 0, 'fixed': 0});     
    this.plotIndices.set(this.secondaryPlot, {'local': 0, 'global': 0, 'fixed': 0});     
    this.plotIndices.set(this.ternaryPlot, {'local': 0, 'global': 0, 'fixed': 0});     
    this.plotIndices.set(this.bottomPlot, {'local': 0, 'global': 0, 'fixed': 0});     
    this.plotIndices.set(this.textPlot, {'local': 0, 'global': 0, 'fixed': 0});     

    this.plotFuncs = new Map();
    this.plotFuncs.set(this.mainPlot,
      {'local': [Functions.defaultMain, Functions.defaultMain],
        'global': [Functions.defaultMain],
        'fixed': [Functions.defaultMain, Functions.defaultMain]
      });
    this.plotStats.set(this.secondaryPlot, this.plotStats.get(this.mainPlot));
    this.plotStats.set(this.ternaryPlot, this.plotStats.get(this.mainPlot));
    this.plotStats.set(this.bottomPlot,
      {'local': [Functions.defaultMain],
        'global': [Functions.defaultMain],
        'fixed': [Functions.defaultMain]
      });
    this.plotStats.set(this.textPlot, this.plotStats.get(this.mainPlot));
  } 

  /**
   * Changes the view. This method is called when the user clicks on one of the
   * tabs in the view-navigator.
   * @param {string} newView The name of the view to change to, which might take
   *     the value of either `"local"`, `"global"`, or `"fixed"`.
   */
  changeView(newView) {
    this.currView = newView;

    for(let p of this.plots) {
      p.clearPlot();
      let index = this.plotIndices.get(p)[newView];
      let menuItems = this.plotStats.get(p)[newView];
      p.setMenuItems(index, menuItems);
    }
  }

  /* plot is changing the plotted statistic to index */
  changeStat(plot, index) {
    this.plotIndices.get(plot)[this.currView] = index;
    updatePlot(plot)
  }

  /* private func: update single plot */
  updatePlot(plot) {
     
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
    /* deplotting */  
    if(sequence == null) {
      /* code goes here */
      return;
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

/* functions used to pack data */
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
