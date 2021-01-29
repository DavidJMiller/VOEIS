/**
 * Represents and controls the search bar element in our VOEIS webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 12/03/20
 */
class SearchBar {
  //#region STATIC MEMBERS /////////////////////////////////////////////////////

  /** The views in our website. */
  static VIEWS = ['local', 'global', 'fixed'];

  /** The numbers in the default history. */
  static DEFAULT_HISTORY_NUMBERS = [
    2,
    7,
    42,
    144,
    284,
    496,
    1729,
    5040,
    1048576,
    2147483647,
  ];

  /** The A-numbers of the sequences in the default history. */
  static DEFAULT_HISTORY_SEQUENCE_A_NUMS = [
    'A000040',
    'A050503',
    'A000045',
    'A000032',
    'A002182',
    'A000142',
    'A000079',
    'A000396',
    'A006370',
    'A007318',
  ];

  /** The A-numbers of the sequences in each sequence-preset. */
  static PRESET_SEQUENCE_A_NUMS = [
    ['A000040', 'A050503'],
    ['A000045', 'A000032'],
    ['A000142', 'A002182'],
  ];

  //#endregion

  //#region CONSTRUCTOR ////////////////////////////////////////////////////////

  /**
   * Creates a new `SearchBar` instance.
   * @param {View} view A reference to the view controller.
   */
  constructor(view) {
    /** @private @type {View} A reference to the view controller. */
    this.view = view;

    /** @private @type {string} The current view. */
    this.currView = 'global';

    /**
     * @private @type {Selection} A D3-selection containing the search-bar
     *   element.
     */
    this.elem = d3.select('#search-bar');

    /**
     * @private @type {Selection} A D3-selection containing the view-navigator
     *   button group.
     */
    this.viewNavigator = this.elem.select('#search-bar-view-navigator');

    /** @private @type {Selection} A D3-selection containing the search box. */
    this.searchBox = this.elem.select('#search-bar-search-box');

    /**
     * @private @type {Selection} A D3-selection containing the clear-input
     *   button.
     */
    this.clearButton = this.elem.select('#search-bar-clear-button');

    /**
     * @private @type {Selection} A D3-selection containing the search button.
     */
    this.searchButton = this.elem.select('#search-bar-search-button');

    /**
     * @private @type {Selection} A D3-selection containing the search box's
     *   invalid-tooltip.
     */
    this.invalidTooltip = this.elem.select('#search-bar-invalid-tooltip');

    /**
     * @private @type {Selection} A D3-selection containing the spinning
     *   "loading" circle.
     */
    this.loadingIndication = this.elem.select('#search-bar-loading-indication');

    /**
     * @private @type {Selection} A D3-selection containing the "no result"
     *   indication text.
     */
    this.noResIndication = this.elem.select('#search-bar-no-result-indication');

    /**
     * @private @type {Selection} A D3-selection containing the back-to-history
     *   button.
     */
    this.backButton = this.elem.select('#search-bar-back-button');

    /**
     * @private @type {Selection} A D3-selection containing the search result
     *   list.
     */
    this.resList = this.elem.select('#search-bar-result-list');

    /**
     * @private @type {Selection} A D3-selection containing the preset button
     *   group.
     */
    this.presetList = d3.select('#preset-list');

    /**
     * @private @type {SearchBarResultItem[]} The search result items currently
     *   shown, or `null` if it's showing the history items.
     */
    this.resShowing = null;

    /**
     * @private @type {Map<string, SearchBarResultItem>} The search result
     *   history for searching sequences.
     */
    this.sequenceHistory = new Map();

    /**
     * @private @type {Map<number, SearchBarResultItem>} The search result
     *   history for searching numbers.
     */
    this.numberHistory = new Map();

    /**
     * @private @type {Map<string, SearchBarResultItem>} The sequences to be
     *   left over when the history is cleared.
     */
    this.defaultSequenceHistory = null;

    /**
     * @private @type {Map<number, SearchBarResultItem>} The numbers to be left
     *   over when the history is cleared.
     */
    this.defaultNumberHistory = null;

    /**
     * @private @type {SearchBarResultItem[]} An array recording whether each
     *   "color index" has been used as a sequence-result selection. Since
     *   consecutive indices work the best when generating golden-angle
     *   colors, we'd like to choose the smallest unused index for our next
     *   selection.
     */
    this.sequenceSelectionByIndex = new Array(144).fill(null);

    /**
     * @private @type {SearchBarResultItem[]} Similar to
     *   `sequenceSelectionByIndex` but for numbers.
     */
    this.numberSelectionByIndex = new Array(144).fill(null);

    /**
     * @private @type {Map<SearchBarResultItem, number>} Maps each selection to
     *   its index.
     */
    this.selections = new Map();

    this.loadDefaultHistoryItems();
    this.initEvents();
    this.magicFunction();
  }

  magicFunction() {
    const elem = this.elem.select('#search-bar-title-wrapper');

    let menu = new PlotMenu(elem);
    menu.appendLabel('Credits', 'search-bar-menu-label-0')
      .appendSelectable('OEIS Home Page', 'search-bar-menu-oeis',
        () => window.open('https://oeis.org'))
      .appendSelectable('OEIS Data Source', 'search-bar-menu-data',
        () => window.open('https://oeis.org/wiki/Welcome#Compressed_Versions'))
      .appendDivider('search-bar-menu-divider-1')
      .appendLabel('About Our Project', 'search-bar-menu-label-1')
      .appendSelectable('Project Introductory Video', 'search-bar-menu-video',
        () => window.open('https://www.youtube.com/watch?v=h8mhWaJFFLM'))
      .appendSelectable('Project GitHub', 'search-bar-menu-github',
        () => window.open('https://github.com/DavidJMiller/VOEIS'))
      .appendSelectable('Project Proposal', 'search-bar-menu-proposal',
        () => window.open(
          'https://github.com/DavidJMiller/VOEIS/raw/main/docs/proposal.pdf'))
      .appendSelectable('Project Process Book', 'search-bar-menu-process',
        () => window.open(
          'https://github.com/DavidJMiller/VOEIS/raw/main/docs/process_book.pdf'));

    elem
      .on('mouseover',
        () => {
          if (menu.isMenuShowing) return;
          InfoPanel.header('Click to learn more about our project :)')
            .show(elem, 0, 1);
        })
      .on('mouseout', () => InfoPanel.hide())
      .on('click', () => {
        menu.show();
        InfoPanel.hide();
      });
  }

  /** @private Loads the default history items from the database. */
  loadDefaultHistoryItems() {
    let sequences = SearchBar.DEFAULT_HISTORY_SEQUENCE_A_NUMS,
        numbers = SearchBar.DEFAULT_HISTORY_NUMBERS,
        remaining = sequences.length + numbers.length,
        onLoadingComplete = () => {
          this.defaultSequenceHistory =
            new Map([...this.defaultSequenceHistory.entries()].sort(
              (x, y) => sequences.indexOf(y[0]) - sequences.indexOf(x[0])));
          this.defaultNumberHistory =
            new Map([...this.defaultNumberHistory.entries()].sort(
              (x, y) => numbers.indexOf(y[0]) - numbers.indexOf(x[0])));
          this.clearHistory();
          this.resList.node().scrollTop = -this.resList.node().scrollHeight;
        };

    // no data races here because node uses an event loop

    this.defaultSequenceHistory = new Map();
    for (let i = 0; i < sequences.length; i++) {
      DBHandler.getSequence(sequences[i], res => {
        if (Object.keys(res).length) {
          this.defaultSequenceHistory.set(
            sequences[i], new SearchBarResultItem(res));

          // load and cache the extended data also, on the server side
          // TODO: disabled due to the free server not able to access OEIS
          // SEE
          // DBHandler.getMoreOfSequence(sequences[i], () => {});
        }
        if (!--remaining) onLoadingComplete();
      });
    }

    this.defaultNumberHistory = new Map();
    for (let i = 0; i < numbers.length; i++) {
      DBHandler.getNumber(numbers[i].toString(), res => {
        // sometimes res is empty due to truncated database for testing purposes
        if (Object.keys(res).length) {
          this.defaultNumberHistory.set(
            numbers[i], new SearchBarResultItem(res));
        }
        if (!--remaining) onLoadingComplete();
      });
    }
  }

  /** @private Register events for buttons and other elements. */
  initEvents() {
    let navigatorInfo = {
      'local': 'Learn more about your favorite sequences',
      'global': 'Compare your favorite sequences to the entire OEIS',
      'fixed': 'Investigate your favorite numbers',
    };
    for (let view of SearchBar.VIEWS) {
      let button =
        this.viewNavigator.select(`#search-bar-view-navigator-${view}-button`);
      button
        .on('click',
          () => {
            this.changeView(view);
            InfoPanel.hide();
          })
        .on('mouseenter',
          () => {
            InfoPanel.header(Util.toTitleCase(view) + ' View')
              .text(navigatorInfo[view])
              .show(button, 0, 1, 347.2);
          })
        .on('mouseleave', () => InfoPanel.hide());
    }

    this.clearButton.on('click', () => this.clearSearchBox());
    this.searchButton.on('click', () => this.triggerSearch());
    this.searchBox
      .on('keydown',
        e => {
          switch (e.keyCode) {
            case 13:  // enter
              this.triggerSearch();
              break;

            case 27:  // escape
              this.clearSearchBox();
              break;
          }
        })
      .on('input',
        () => {
          this.searchBox.classed('is-invalid', false);
          this.clearButton.style('display',
            () => this.searchBox.node().value ? 'inline-block' : 'none');

          if (!this.searchBox.node().value && this.resShowing) {
            this.resShowing = null;
            this.showHistory();
          }
        })
      .on('blur', () => this.searchBox.classed('is-invalid', false));
    this.backButton.on('click', () => {
      this.showHistory();
      this.resList.node().scrollTop = -this.resList.node().scrollHeight;
    });

    for (let i = 0; i < SearchBar.PRESET_SEQUENCE_A_NUMS.length; i++) {
      this.presetList.select(`#preset-list-preset-${i + 1}-button`)
        .on('click', () => this.selectPreset(i));
    }
  }

  //#endregion

  //#region METHODS ////////////////////////////////////////////////////////////

  /**
   * @private Clears both the sequence- and number-history and fill them with
   *   default items. Note that this method does NOT clear selections before
   *   clearing the history.
   */
  clearHistory() {
    // concat() makes deep copies
    this.sequenceHistory = new Map(this.defaultSequenceHistory);
    this.numberHistory = new Map(this.defaultNumberHistory);

    this.showHistory();
  }

  /** @private Clears the result list and adds the history items. */
  showHistory() {
    this.searchBox.classed('is-invalid', false);
    this.backButton.style('display', 'none');
    document.documentElement.style.setProperty('--back-button-height', '0px');
    this.noResIndication.style('display', 'none');
    this.loadingIndication.style('display', 'none');
    this.resList.selectAll('div').remove();

    let toShow =
      this.currView == 'fixed' ? this.numberHistory : this.sequenceHistory
    for (let item of toShow.values()) this.addToResultList(item);
  }

  /** @private Fills the result list with search history items. */
  showResults(results) {
    this.searchBox.classed('is-invalid', false);
    this.backButton.style('display', 'list-item');
    document.documentElement.style.setProperty('--back-button-height', '42px');
    this.loadingIndication.style('display', 'none');
    this.noResIndication.style(
      'display', results.length ? 'none' : 'list-item');
    this.resList.selectAll('div').remove();
    this.resShowing = results;

    for (let item of results.values()) this.addToResultList(item);
    this.resList.node().scrollTop = -this.resList.node().scrollHeight;
  }

  /** @private Adds an item to the result list. */
  addToResultList(resItem) {
    let elem =
      this.resList.append('div')
        .attr('class', 'row btn w-100 btn-outline-dark search-bar-result-item')
        .datum(resItem);

    elem.append('b').text(resItem.title);
    if (resItem.subtitle) elem.append('span').text(resItem.subtitle);
    if (resItem.contents) elem.append('p').text(resItem.contents);

    elem
      .on('click',
        () => {
          this.selectResItem(resItem);
          if (elem.classed('selected')) InfoPanel.hide();
        })
      .on('mouseenter',
        () => {
          if (!resItem.contents) return;
          InfoPanel.text(resItem.rawData['name'], 'black', true)
            .newline()
            .newline()
            .text(resItem.contents)
            .show(elem, 1, 0, 1042);
        })
      .on('mouseleave', () => InfoPanel.hide());

    if (this.selections.has(resItem)) {
      let color =
        `hsla(${Util.generateColor(this.selections.get(resItem))}, 0.3333)`;
      elem.classed('selected', true).style('background-color', color);
    }

    resItem.elem = elem;
  }

  /** @private Change the view (local, global, etc.). */
  changeView(newView) {
    if (newView == this.currView) return;
    let oldView = this.currView;
    this.currView = newView;

    // update search bar element styles
    for (let view of SearchBar.VIEWS) {
      this.viewNavigator.select(`#search-bar-view-navigator-${view}-button`)
        .classed('btn-secondary', view == newView)
        .classed('btn-outline-secondary', view != newView);
    }
    this.searchBox.attr('placeholder',
      newView == 'fixed' ? 'Lookup Integers' : 'Search Sequences');
    this.presetList.style('display', newView == 'fixed' ? 'none' : '');
    document.documentElement.style.setProperty(
      '--preset-list-height', newView == 'fixed' ? '54px' : '144px');

    // update the result list
    if (newView == 'fixed' || !this.resShowing)
      this.showHistory();
    else
      this.showResults(this.resShowing);
    if ((newView == 'fixed') != (oldView == 'fixed'))
      this.resList.node().scrollTop = -this.resList.node().scrollHeight;

    // notify the view
    this.view.changeView(newView);
    let selections = newView == 'fixed' ? this.numberSelectionByIndex
                                        : this.sequenceSelectionByIndex;
    for (let i = 0; i < selections.length; i++) {
      let selection = selections[i];
      if (selection) {
        if (newView == 'fixed')
          this.view.viewNumber(selection.rawData, i);
        else
          this.view.viewSequence(selection.rawData, i);
      }
    }
  }

  /** @private Searches a number or a sequence entered in the search box. */
  triggerSearch() {
    let query = this.searchBox.node().value.trim();
    if (!query) {
      this.invalidTooltip.html(this.currView == 'fixed'
          ? 'Enter your favorite integer :)'
          : 'Enter some of your favorite integers :)');
      this.searchBox.classed('is-invalid', true);
      this.searchBox.node().focus();

      return;
    }

    if (this.currView == 'fixed') {
      if (!Number.isInteger(+query)) {
        this.invalidTooltip.html('Enter your favorite <b>integer</b>!');
        this.searchBox.classed('is-invalid', true);

        return;
      }
      query = (+query).toFixed(0);

      DBHandler.getNumber(query, res => {
        if (this.currView != 'fixed') return;  // res comes in too late
        let number = +query;
        if (!Object.keys(res).length) {
          this.invalidTooltip.html(
            `${number} has not appeared in any OEIS sequence :(`);
          this.searchBox.classed('is-invalid', true);

          return;
        }
        let resItem;
        if (this.numberHistory.has(number)) {
          resItem = this.numberHistory.get(number);
          this.numberHistory.delete(number);
          this.numberHistory.set(number, resItem);
          this.showHistory();
        } else {
          resItem = new SearchBarResultItem(res);
          this.numberHistory.set(number, resItem);
          this.addToResultList(resItem);
        }
        if (!this.selections.has(resItem)) this.selectResItem(resItem);
        this.resList.node().scrollTop = -this.resList.node().scrollHeight;
      });
    } else {
      DBHandler.searchSequence(query, res => {
        if (this.currView == 'fixed') return;
        this.showResults(res.reverse().map(x => {
          if (this.sequenceHistory.has(x['a_num']))
            return this.sequenceHistory.get(x['a_num']);

          return new SearchBarResultItem(x);
        }));
      });

      this.resList.selectAll('div').remove();
      this.noResIndication.style('display', 'none');
      this.loadingIndication.style('display', 'list-item');
    }
  }

  /** @private Clears the text in the search box and hides the clear button.*/
  clearSearchBox() {
    this.searchBox.classed('is-invalid', false);
    this.clearButton.style('display', 'none');
    this.searchBox.node().value = '';
    this.searchBox.node().focus();

    if (this.resShowing) {
      this.resShowing = null;
      this.showHistory();
    }
  }

  /** @private Selects or deselects a search result item. */
  selectResItem(resItem, defaultIndex = 0) {
    let elem = resItem.elem, isSelected = this.selections.has(resItem),
        toView = null, tarIndex = -1;
    if (isSelected) {  // deselect
      let indexArray = this.currView == 'fixed' ? this.numberSelectionByIndex
                                                : this.sequenceSelectionByIndex;
      tarIndex = this.selections.get(resItem);

      indexArray[tarIndex] = null;
      this.selections.delete(resItem);

      elem.classed('selected', false).style('background-color', '');
    } else {  // select
      let indexArray = this.currView == 'fixed' ? this.numberSelectionByIndex
                                                : this.sequenceSelectionByIndex;
      toView = resItem.rawData;
      tarIndex =
        indexArray.indexOf(null, defaultIndex);  // assume always exists

      indexArray[tarIndex] = resItem;
      this.selections.set(resItem, tarIndex);

      let color = `hsla(${Util.generateColor(tarIndex)}, 0.3333)`;
      elem.classed('selected', true).style('background-color', color);

      // add to history if it's a sequence item
      if (this.currView != 'fixed' && this.resShowing) {
        this.sequenceHistory.delete(resItem.subtitle);
        this.sequenceHistory.set(resItem.subtitle, resItem);
      }
    }

    // notify the view
    if (this.currView == 'fixed') {
      this.view.viewNumber(toView, tarIndex);
    } else {
      this.view.viewSequence(toView, tarIndex);
    }
  }

  /** @private Deselects all selections. */
  deselectAll(inAllViews = false) {
    let selectionsByView =
      [this.sequenceSelectionByIndex, this.numberSelectionByIndex];
    if (this.currView == 'fixed') selectionsByView.reverse();

    for (let i = 0; i <= +inAllViews; i++) {
      for (let j = 0; j < selectionsByView[i].length; j++) {
        let toDeselect = selectionsByView[i][j];
        if (!toDeselect) continue;
        this.selectResItem(toDeselect);
        this.selections.delete(toDeselect);
        selectionsByView[i][j] = null;
      }
    }
  }

  /** @private Selects a particular preset. */
  selectPreset(index) {
    if (this.currView == 'fixed') return;  // fixed-view presets not supported

    let presetANums = SearchBar.PRESET_SEQUENCE_A_NUMS[index];
    if (presetANums.length ==
        this.sequenceSelectionByIndex.filter(x => x).length &&
      presetANums.every(
        x => this.selections.has(this.defaultSequenceHistory.get(x)))) {
      return;  // check if the selections already matches the preset precisely
               // since redrawing is expensive.
    }

    this.deselectAll();
    if (this.resShowing) {
      this.resShowing = null;
      this.showHistory();
    }
    for (let aNum of presetANums)
      this.selectResItem(this.defaultSequenceHistory.get(aNum));
  }

  //#endregion
}

//#region HELPER CLASSES
/////////////////////////////////////////////////////////

/** Represents and controls the element of a result item. */
class SearchBarResultItem {
  constructor(res) {
    this.rawData = res;
    this.title = null;
    this.subtitle = null;
    this.contents = null;
    this.elem = null;

    if (res.hasOwnProperty('a_num')) {  // sequence
      this.title =
        res['name'].replace(/((( [^e0-9])?(\:|\.|\,))|( \()).*/, '').trim();
      this.subtitle = res['a_num'];
      this.contents = res['terms'].join(', ');
    } else {  // number
      this.title = res['num'];
    }
  }
}

//#endregion
