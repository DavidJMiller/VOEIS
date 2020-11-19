/**
 * Represents and controls the element of the search bar element in our VOEIS
 * webpage.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * M 11/16/20
 */
class SearchBar {
  //#region STATIC MEMBERS /////////////////////////////////////////////////////

  /** The views in our website. */
  static VIEWS = ['local', 'global', 'fixed'];

  /** The numbers in the default history. */
  static DEFAULT_HISTORY_NUMBERS = [
    2,
    42,
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
    'A000045',
    'A000142',
    'A000396',
    'A002182',
    'A006370',
    'A001057', // used to test some negative values in the grid plot
  ];

  /** The A-numbers of the sequences in each sequence-preset. */
  static PRESET_SEQUENCE_A_NUMS = [
    ['A000040', 'A000045'],
    ['A000040', 'A000142'],
    ['A000142', 'A000396', 'A002182'],
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
    this.currView = 'local';

    /**
     * @private @type {Selection} A D3-selection containing the search-bar
     *     element.
     */
    this.elem = d3.select('#search-bar');

    /**
     * @private @type {Selection} A D3-selection containing the view-navigator
     *     button group.
     */
    this.viewNavigator = this.elem.select('#search-bar-view-navigator');

    /** @private @type {Selection} A D3-selection containing the search box. */
    this.searchBox = this.elem.select('#search-bar-search-box');

    /**
     * @private @type {Selection} A D3-selection containing the clear-input
     *     button.
     */
    this.clearButton = this.elem.select('#search-bar-clear-button');

    /**
     * @private @type {Selection} A D3-selection containing the search button.
     */
    this.searchButton = this.elem.select('#search-bar-search-button');

    /**
     * @private @type {Selection} A D3-selection containing the search box's
     *     invalid-tooltip.
     */
    this.invalidTooltip = this.elem.select('#search-bar-invalid-tooltip');

    /**
     * @private @type {Selection} A D3-selection containing the spinning
     *     "loading" circle.
     */
    this.loadingIndication = this.elem.select('#search-bar-loading-indication');

    /**
     * @private @type {Selection} A D3-selection containing the "no result"
     *     indication text.
     */
    this.noResIndication = this.elem.select('#search-bar-no-result-indication');

    /**
     * @private @type {Selection} A D3-selection containing the search result
     *     list.
     */
    this.resList = this.elem.select('#search-bar-result-list');

    /**
     * @private @type {Selection} A D3-selection containing the preset button
     *     group.
     */
    this.presetList = d3.select('#preset-list');

    /**
     * @private @type {SearchBarResultItem[]} The search result items currently
     *     shown, or `null` if it's showing the history items.
     */
    this.resShowing = null;

    /**
     * @private @type {Map<string, SearchBarResultItem>} The search result
     *     history for searching sequences.
     */
    this.sequenceHistory = new Map();

    /**
     * @private @type {Map<number, SearchBarResultItem>} The search result
     *     history for searching numbers.
     */
    this.numberHistory = new Map();

    /**
     * @private @type {Map<string, SearchBarResultItem>} The sequences to be
     *     left over when the history is cleared.
     */
    this.defaultSequenceHistory = null;

    /**
     * @private @type {Map<number, SearchBarResultItem>} The numbers to be left
     *     over when the history is cleared.
     */
    this.defaultNumberHistory = null;

    /**
     * @private @type {SearchBarResultItem[]} An array recording whether each
     *     "color index" has been used as a sequence-result selection. Since
     *     consecutive indices work the best when generating golden-angle
     *     colors, we'd like to choose the smallest unused index for our next
     *     selection.
     */
    this.sequenceSelectionByIndex = new Array(144).fill(null);

    /**
     * @private @type {SearchBarResultItem[]} Similar to
     *     `sequenceSelectionByIndex` but for numbers.
     */
    this.numberSelectionByIndex = new Array(144).fill(null);

    /**
     * @private @type {Map<SearchBarResultItem, number>} Maps each selection to
     *     its index.
     */
    this.selections = new Map();

    this.loadDefaultHistoryItems();
    this.initEvents();
  }

  //#endregion

  //#region METHODS ////////////////////////////////////////////////////////////

  /** @private Loads the default history items from the database. */
  loadDefaultHistoryItems() {
    let sequences = SearchBar.DEFAULT_HISTORY_SEQUENCE_A_NUMS,
        numbers = SearchBar.DEFAULT_HISTORY_NUMBERS,
        remaining = sequences.length + numbers.length,
        onLoadingComplete = () => {
          this.defaultSequenceHistory =
              new Map([...this.defaultSequenceHistory.entries()].sort(
                  (x, y) => y[0].localeCompare(x[0])));
          this.defaultNumberHistory =
              new Map([...this.defaultNumberHistory.entries()].sort(
                  (x, y) => y[0] - x[0]));
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
    for (let view of SearchBar.VIEWS) {
      this.viewNavigator.select(`#search-bar-view-navigator-${view}-button`)
          .on('click', () => this.changeView(view));
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
              this.clearButton.style(
                  'display',
                  () => this.searchBox.node().value ? 'inline-block' : 'none');

              if (!this.searchBox.node().value && this.resShowing) {
                this.resShowing = null;
                this.showHistory();
              }
            })
        .on('blur', () => this.searchBox.classed('is-invalid', false));

    for (let i = 0; i < SearchBar.PRESET_SEQUENCE_A_NUMS.length; i++) {
      this.presetList.select(`#preset-list-preset-${i + 1}-button`)
          .on('click', () => this.selectPreset(i));
    }
  }

  /**
   * @private Clears both the sequence- and number-history and fill them with
   *     default items. Note that this method does NOT clear selections before
   *     clearing the history.
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
    this.resList.selectAll('div').remove();
    this.noResIndication.style('display', 'none');
    this.loadingIndication.style('display', 'none');

    let toShow =
        this.currView == 'fixed' ? this.numberHistory : this.sequenceHistory
    for (let item of toShow.values()) this.addToResultList(item);
  }

  /** @private Fills the result list with search history items. */
  showResults(results) {
    this.searchBox.classed('is-invalid', false);
    this.loadingIndication.style('display', 'none');
    this.resList.selectAll('div').remove();
    this.resShowing = results;

    this.noResIndication.style(
        'display', results.length ? 'none' : 'list-item');

    for (let item of results.values()) this.addToResultList(item);
    this.resList.node().scrollTop = -this.resList.node().scrollHeight;
  }

  /** @private Adds an item to the result list. */
  addToResultList(resItem) {
    let elem = this.resList.append('div').attr(
        'class', 'row btn w-100 btn-outline-dark search-bar-result-item');

    elem.append('b').text(resItem.title);
    if (resItem.subtitle) elem.append('span').text(resItem.subtitle);
    if (resItem.contents) elem.append('p').text(resItem.contents);
    elem.on('click', () => this.selectResItem(resItem));

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
    this.searchBox.attr(
        'placeholder',
        newView == 'fixed' ? 'Lookup Integers' : 'Search Sequences');
    this.presetList.style('display', newView == 'fixed' ? 'none' : '');
    this.elem.style(
        'height',
        `calc(100% - ${
            newView == 'fixed' ? '54px' : 'var(--preset-list-height)'})`);

    // update the result list
    if (newView == 'fixed' || !this.resShowing)
      this.showHistory();
    else
      this.showResults(this.resShowing);
    if ((newView == 'fixed') != (oldView == 'fixed'))
      this.resList.node().scrollTop = -this.resList.node().scrollHeight;

    // notify the view
    this.view.changeView(newView);
    let selections = newView == 'fixed' ? this.numberSelectionByIndex :
                                          this.sequenceSelectionByIndex;
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
      this.invalidTooltip.html(
          this.currView == 'fixed' ? 'Enter your favorite integer :)' :
                                     'Enter some of your favorite integers :)');
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
  selectResItem(resItem) {
    let elem = resItem.elem, isSelected = this.selections.has(resItem),
        toView = null, tarIndex = -1;
    if (isSelected) {  // deselect
      let indexArray = this.currView == 'fixed' ? this.numberSelectionByIndex :
                                                  this.sequenceSelectionByIndex;
      tarIndex = this.selections.get(resItem);

      indexArray[tarIndex] = null;
      this.selections.delete(resItem);

      elem.classed('selected', false).style('background-color', '');
    } else {  // select
      let indexArray = this.currView == 'fixed' ? this.numberSelectionByIndex :
                                                  this.sequenceSelectionByIndex;
      toView = resItem.rawData;
      tarIndex = indexArray.indexOf(null);  // assume always exists

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
    if (presetANums.length == this.selections.size &&
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

//#region HELPER CLASSES ///////////////////////////////////////////////////////

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
