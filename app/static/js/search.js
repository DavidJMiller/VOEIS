class SearchBar {
    constructor() {
        // this.cache = {};
        this.sequenceHistory = [];
        this.numberHistory = [];
        this.searchBox = d3.select('#search-bar-search-box');
        this.searchButton = d3.select('#search-bar-search-button');

        this.searchButton.on('click', () => {
            console.log('click!!!');
        });

        this.defaultSequenceHistory();
    }

    defaultSequenceHistory() {
        // populate history
    }

    addToHistory(elem) {
        // if in history, select the one currently in history
        // else add to history
        this.history.append(elem);
    }

    clearHistory() {
        this.history = [];
    }
}
