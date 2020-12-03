/**
 * Represents and controls the main view element in our VOEIS webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 12/03/20
 */
class View {
  //#region STATIC MEMBERS /////////////////////////////////////////////////////

  static STORY_HTMLS = [
    // story 0
    '<h4>The Sloane\'s Gap</h4><p>The Sloane\'s Gap appears when we plot each integer vs the number of sequences it has appeared in.</p><p>This helps us pick out interesting numbers, such as those seen in the discernable "upper band."</p>',
    // story 1
    '<h4>Prime Numbers are "Primary"</h4><p>Apparently, prime numbers got their name for a second good reason.</p><p><i>(A number is prime if it cannot be divided by anything other than 1 and itself.)</i></p>',
    // story 2
    '<h4>Highly Composites are "Highly Popular"</h4><p>These anti-prime numbers are rare and are also real gems for mathematicians.</p><p><i>(A number is highly composite if it has more divisors than all numbers below it.)</i></p>',
    // story 3
    '<h4>Powers of Two are "Two Powerful"</h4><p>Apparently, computers are powerful also because of these powerful numbers.</p><p><i>(A number is a power of two if you can get it by multiplying two by itself a number of times.)</i></p>',
  ];

  static STORY_SELECTIONS = [
    null,
    ['A000040'],
    ['A002182'],
    ['A000079'],
  ];

  //#endregion

  //#region CONSTRUCTOR ////////////////////////////////////////////////////////

  constructor() {
    /* default view */
    this.currView = 'global';

    /* plots for each view */
    this.mainPlot = new Plot('main-plot');
    this.bottomPlot = new Plot('bottom-plot');
    this.secondaryPlot = new Plot('secondary-plot');
    this.ternaryPlot = new Plot('ternary-plot');
    this.textPlot = new Plot('text-plot');

    /**
     * @type {Map<Plot, Object<string, {options: PlotOptions[], currIndex:
     *   number}>} Defines which plot-options are allowed within each plot
     */
    this.plotOptions = new Map();
    this.initPlotOptions();

    /** @type {Set<Plot>} The plots in the view. */
    this.plots = new Set(this.plotOptions.keys());

    /** @type {Map<number, object>} The current selections. */
    this.selections = new Map();

    this.currStoryPageIndex = 0;

    this.isStoryVisited = false;

    this.preStorySelections = null;

    /** @type {object} */
    this.loadSloanesGapData();

    this.changeView(this.currView);
  }

  /** @private Initializes the options for each plot. */
  initPlotOptions() {
    this.plotOptions.set(this.mainPlot, {
      'local': {
        'options': [
          PlotOptions.SEQUENCE,
          PlotOptions.GROWTH_RATE,
          PlotOptions.RUNNING_SUM,
          PlotOptions.DERIVATIVE,
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
          PlotOptions.BLANK,
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
          PlotOptions.DERIVATIVE,
        ],
        'currIndex': 1,
      },
      'global': {
        'options': [
          PlotOptions.BLANK,
        ],
        'currIndex': 0,
      },
      'fixed': {
        'options': [
          PlotOptions.BLANK,
        ],
        'currIndex': 0,
      },
    });
    this.plotOptions.set(this.ternaryPlot, {
      'local': {
        'options': [
          PlotOptions.SEQUENCE,
          PlotOptions.GROWTH_RATE,
          PlotOptions.RUNNING_SUM,
          PlotOptions.DERIVATIVE,
        ],
        'currIndex': 2,
      },
      'global': {
        'options': [
          PlotOptions.POPULARITY,
        ],
        'currIndex': 0,
      },
      'fixed': {
        'options': [
          PlotOptions.BLANK,
        ],
        'currIndex': 0,
      },
    });
    this.plotOptions.set(this.textPlot, {
      'local': {
        'options': [
          PlotOptions.SEQUENCE,
          PlotOptions.GROWTH_RATE,
          PlotOptions.RUNNING_SUM,
          PlotOptions.DERIVATIVE,
        ],
        'currIndex': 3,
      },
      'global': {
        'options': [
          PlotOptions.BLANK,
        ],
        'currIndex': 0,
      },
      'fixed': {
        'options': [
          PlotOptions.CONNECTIONS,
        ],
        'currIndex': 0,
      },
    });

    for (let plot of this.plotOptions.keys())
      plot.onOptionChange = d => this.changePlotOption(plot, d);
  }

  /** @private Loads the data for the Sloanes' Gap. */
  loadSloanesGapData() {
    DBHandler.getSloanes(res => {
      Functions.sloanesGapData = new Map(Object.entries(res)
                                           .map(x => [+x[0], +x[1]])
                                           .sort((x, y) => x[0] - y[0]));
      if (this.currView == 'global') this.viewSloanesGap();
    });
  }

  //#endregion

  //#region METHODS ////////////////////////////////////////////////////////////

  /**
   * Changes the view. This method is called when the user clicks on one of the
   * tabs in the view-navigator.
   * @param {string} newView The name of the view to change to, which might take
   *   the value of either `"local"`, `"global"`, or `"fixed"`.
   */
  changeView(newView) {
    this.currView = newView;
    this.selections.clear();

    this.updateHtmlForView();

    for (let [plot, options] of this.plotOptions) {
      plot.setOptions(
        options[this.currView]['options'], options[this.currView]['currIndex']);
    }

    const doc = d3.select(document), onWheel = e => {
      if (d3.select('#search-bar').node().contains(e.target)) return;

      if (e.deltaY < 0) {
        // scroll up
        if (!this.currStoryPageIndex) return;
        this.currStoryPageIndex--;
        this.drawStory();

      } else if (e.deltaY > 0) {
        // scroll down
        if (this.currStoryPageIndex == View.STORY_HTMLS.length - 1) return;
        this.currStoryPageIndex++;
        this.drawStory();
      }

      doc.interrupt('limit.wheel')
        .on('mousewheel.view', null)
        .transition('limit.wheel')
        .duration(1042)
        .on('end', () => doc.on('mousewheel.view', onWheel));
    };
    if (newView == 'global') {
      this.viewSloanesGap();
      doc.on('mousewheel.view', onWheel);
      this.drawStory();
    } else {
      doc.interrupt('limit.wheel').on('mousewheel.view', null);
      this.currStoryPageIndex = 0;
    }
  }

  drawStory() {
    const elem = d3.select('#right-view-cover'), transitionDuration = 347.2;

    elem.transition()
      .ease(d3.easeSinIn)
      .duration(transitionDuration)
      .style('opacity', 0)
      .on('end', () => {
        elem.html(View.STORY_HTMLS[this.currStoryPageIndex])
          .transition()
          .ease(d3.easeSinOut)
          .duration(transitionDuration)
          .style('opacity', 1);

        if (this.currStoryPageIndex) {
          elem.select('h4').style('color',
            `hsl(${Util.generateColor(this.currStoryPageIndex - 1, 0.5)})`);
        }

        elem.append('br');
        let dots = elem.append('p')
                     .style('text-align', 'center')
                     .selectAll('i')
                     .data(d3.range(View.STORY_HTMLS.length))
                     .join('i')
                     .attr('class',
                       d => d == this.currStoryPageIndex ? 'fas fa-circle'
                                                         : 'far fa-circle')
                     .style('padding', '6px')
                     .style('cursor', 'pointer');
        dots.on('click', (_e, d) => {
          if (d == this.currStoryPageIndex) return;

          dots.on('click', null);
          this.currStoryPageIndex = d;
          this.drawStory();
        });

        this.isStoryVisited |= this.currStoryPageIndex;
        if (this.isStoryVisited) return;

        let hint =
          elem.append('p')
            .style('text-align', 'center')
            .style('opacity', 0)
            .html(
              '<i class="fas fa-angle-down"></i> <i>Scroll to see more...</i>');

        const repeat = () => {
          hint.transition()
            .delay(3141.59)
            .ease(d3.easeSinIn)
            .duration(transitionDuration)
            .style('opacity', 0)
            .transition()
            .ease(d3.easeSinOut)
            .duration(transitionDuration)
            .style('opacity', 0.5)
            .on('end', repeat);
        };
        hint.transition()
          .delay(2083)
          .ease(d3.easeSinOut)
          .duration(transitionDuration)
          .style('opacity', 0.5)
          .on('end', repeat);
      });

    // TODO: fix this very bad coding!!
    if (!searchBar) return;

    if (this.currStoryPageIndex == 0) {
      if (this.preStorySelections) {
        searchBar.deselectAll();
        for (let [index, sequence] of this.preStorySelections) {
          searchBar.selectResItem(
            searchBar.sequenceHistory.get(sequence['a_num']), index);
        }
        this.preStorySelections = null;
      }
    } else {
      if (!this.preStorySelections)
        this.preStorySelections = Array.from(this.selections.entries());
      searchBar.deselectAll();
      for (let aNum of View.STORY_SELECTIONS[this.currStoryPageIndex]) {
        searchBar.selectResItem(
          searchBar.sequenceHistory.get(aNum), this.currStoryPageIndex - 1);
      }
    }
  }

  updateHtmlForView() {
    d3.select('#right-view-top')
      .style('display', this.currView == 'global' ? 'none' : '')
      .classed('h-33', this.currView != 'fixed')
      .classed('h-100', this.currView == 'fixed');
    d3.select('#right-view-middle')
      .style('display', this.currView == 'global' ? 'none' : '');
    d3.select('#right-view-cover')
      .style('display', this.currView == 'global' ? '' : 'none')
      .style('opacity', 0);
    d3.select('#right-view-bottom')
      .classed('h-33', this.currView != 'global')
      .classed('h-50', this.currView == 'global');
    d3.select('#view-bottom')
      .style('display', this.currView == 'global' ? 'none' : '');
    d3.select('#view-top')
      .classed('h-75', this.currView != 'global')
      .classed('h-100', this.currView == 'global');
    document.documentElement.style.setProperty(
      '--ternary-plot-left', this.currView == 'global' ? '12px' : '96px');
  }

  /** @private */
  viewSloanesGap() {
    if (!Functions.sloanesGapData) return;

    for (let plot of this.plots) plot.drawPlot({}, -1);
  }

  /**
   * @private
   * @param {Plot} plot
   * @param {number} optionIndex
   */
  changePlotOption(plot, optionIndex) {
    this.plotOptions.get(plot)[this.currView]['currIndex'] = optionIndex;
  }

  /**
   * Views an OEIS sequence. This method is called when the user clicks on a
   * search result/history item under the local- or global-view, or when a
   * sequence-preset is loaded.
   * @param {object} sequence A JSON object with the sequence's data.
   * @param {number} index The selection's index.
   */
  viewSequence(sequence, index) {
    if (sequence)
      this.selections.set(index, sequence);
    else
      this.selections.delete(index);

    if (this.currView == 'global' && sequence) {
      DBHandler.getMoreOfSequence(sequence['a_num'], res => {
        if (!this.selections.has(index) ||
          this.selections.get(index)['a_num'] !=
            sequence['a_num'])  // the user has browsed away
          return;

        for (let plot of this.plots)
          plot.drawPlot({'a_num': sequence['a_num'], 'terms': res}, index);
      });

      return;
    }

    for (let plot of this.plots) plot.drawPlot(sequence, index);
  }

  /**
   * Views a number that has appeared in any OEIS sequence. This method is
   * called when the user clicks on a search result/history item under the
   * fixed-view.
   * @param {object} number A JSON object with the number's data.
   * @param {number} index The selection's index.
   */
  viewNumber(number, index) {
    if (number)
      this.selections.set(index, number);
    else
      this.selections.delete(index);

    for (let plot of this.plots) plot.drawPlot(number, index);
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
  static BLANK = new PlotOption(
    'Blank (for testing)',
    '',
    '',
    '',
    d => new Plottable(d, [0, 1], [0, 1], [], []),
    () => {},
    () => {},
  );

  //#region LOCAL //////////////////////////////////////////////////////////////

  static SEQUENCE = new PlotOption(
    'Sequence Terms',
    'Sequence Terms',
    'Index',
    'Term',
    Functions.sequence,
    Functions.scatter,
    Functions.scatterAxes,
    info => {
      InfoPanel.header(info[0][1].y[info[0][2]]);
      for (let [s, d, i] of info) {
        const color = `hsl(${Util.generateColor(s, 0.5)})`;
        InfoPanel.text('Index ')
          .text(d.x[i], color, true)
          .text(' of ')
          .text(d.rawData['a_num'], color, true)
          .newline();
      }

      return true;
    },
  );

  static GRID = new PlotOption(
    'Grid',
    'Modulo {base} Remainder Distribution',
    '',
    'Remainder',
    Functions.sequence,
    Functions.grid,
    Functions.gridAxes,
    // the grid handles the info-panel internally
  );

  static GROWTH_RATE = new PlotOption(
    'Growth Rate',
    'Growth Rate',
    'Index',
    'Growth Rate',
    Functions.growthRate,
    Functions.line,
    Functions.lineAxes,
    info => {
      for (let [s, d, i] of info) {
        const color = `hsl(${Util.generateColor(s, 0.5)})`;
        InfoPanel.text(d3.format(',.4')(d.y[i]) + 'x', color, true)
          .text(` between indices ${d.x[i]} 🡒 ${d.x[i] + 1} of `)
          .text(d.rawData['a_num'], color, true)
          .newline();
      }

      return true;
    },
    true,
  );

  static RUNNING_SUM = new PlotOption(
    'Running Sum',
    'Running Sum',
    'Index',
    'Sum of First n Terms',
    Functions.runningSum,
    Functions.area,
    Functions.areaAxes,
    info => {
      for (let [s, d, i] of info) {
        const color = `hsl(${Util.generateColor(s, 0.5)})`;
        InfoPanel
          .text(`The first ${d.x[i]} term${d.x[i] == 1 ? '' : 's'}` +
            ` sum${d.x[i] == 1 ? 's' : ''} to `)
          .text(d.y[i], color, true)
          .text(' in ')
          .text(d.rawData['a_num'], color, true)
          .newline();
      }

      return true;
    },
    true,
  );

  static DERIVATIVE = new PlotOption(
    'Discrete Derivative',
    'Discrete Derivative',
    'Index',
    'Change in Term Values',
    Functions.derivative,
    Functions.derivativeBar,
    Functions.barAxes,
    info => {
      for (let [s, d, i] of info) {
        const color = `hsl(${Util.generateColor(s, 0.5)})`;
        InfoPanel.text(d3.format('+,.4')(d.y[i]), color, true)
          .text(` between indices ${d.x[i]} 🡒 ${d.x[i] + 1} of `)
          .text(d.rawData['a_num'], color, true)
          .newline();
      }

      return true;
    },
  );

  //#endregion

  //#region GLOBAL /////////////////////////////////////////////////////////////

  static SLOANES_GAP = new PlotOption(
    'Sloane\'s Gap',
    'Number of sequences each integer has appeared in',
    'Integer',
    'Number of sequences',
    Functions.sloanesGap,
    Functions.scatterSloanesGap,
    Functions.scatterAxes,
    info => {
      let [s, d, i] = info[0];
      InfoPanel.header(d.x[i])
        .text('Has appeared in ')
        .text(d.y[i], 'black', true)
        .text(' OEIS sequences')
        .newline();

      for (let i = 0; i < info.length; i++) {
        [s, d, i] = info[i];
        if (s == -1) continue;

        const color = `hsl(${Util.generateColor(s, 0.5)})`;
        InfoPanel.text('In sequence ')
          .text(d.rawData['a_num'], color, true)
          .newline();
      }

      return true;
    },
  );

  static POPULARITY = new PlotOption(
    'Popularity',
    '"Popularity" of Numbers',
    '',
    'Proportion of Numbers in "Top Band"',
    Functions.popularity,
    Functions.barPopularity,
    Functions.barAxesPopularity,
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
    info => {
      const [s, d, i] = info[0], color = `hsl(${Util.generateColor(s, 0.5)})`;
      if (d.x[i] == 0) {
        InfoPanel.header(d.y[i], color);
        return true;
      }

      InfoPanel.text(d.y[i], color, true)
        .text(' has appeared ')
        .newline()
        .text(Math.abs(d.x[i]), color, true)
        .text(` position${Math.abs(d.x[i]) == 1 ? '' : 's'} `)
        .text(`${d.x[i] < 0 ? 'before' : 'after'} `)
        .text(d.rawData['num'], color, true)
        .text(' in any sequence ')
        .newline()
        .text(d.magnitudes[i], color, true)
        .text(' time' + (d.magnitudes[i] == 1 ? '' : 's'));

      return true;
    },
  );

  static INDEX_COUNTS = new PlotOption(
    'Index Counts',
    'Index Counts in all Sequences',
    'Index',
    'Occurrence Frequency',
    Functions.indexCounts,
    Functions.bar,
    Functions.barAxesIndexCounts,
    info => {
      for (let [s, d, i] of info) {
        if (!d.y[i]) continue;

        const color = `hsl(${Util.generateColor(s, 0.5)})`
        InfoPanel.text(d.rawData['num'], color, true)
          .text(' has appeared at index ')
          .text(d.x[i], color, true)
          .text(' in any sequence ')
          .text(d.y[i], color, true)
          .text(' time' + (d.y[i] == 1 ? '' : 's'))
          .newline();
      }

      return true;
    },
  );

  static CONNECTIONS = new PlotOption(
    'Persistent Neighbors',
    'Persistent Neighbors',
    '',
    'Neighbor Distance',
    Functions.connections,
    Functions.parallel,
    Functions.parallelAxes,
    info => {
      InfoPanel.header(info[0][1].y[info[0][2]]);
      for (let [s, d, i] of info) {
        const color = `hsl(${Util.generateColor(s, 0.5)})`;
        InfoPanel.text('Difference of ')
          .text(d3.format(',.4')(d.y[i]), color, true)
          .text(` between indices ${d.x[i]} 🡒 ${d.x[i] + 1} of `)
          .text(d.rawData['a_num'], color, true)
          .newline();
      }

      return true;
    },
  );

  //#endregion
}

//#endregion
