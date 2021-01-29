/**
 * Provides static functions that accesses and handles requests to our Python
 * database.
 *
 * Update: the client is now responsible for downloading data from oeis.org.
 * Functions like `searchSequence` and `getMoreOfSequence` are now done by the
 * JavaScript side. This is more friendly for free cloud hosting services since
 * it's difficult to find a free hosting site that allows cross-site accessing.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 01/27/21
 */
class DBHandler {
  /**
   * Retrieves the data of a number from the database.
   * @param {string} number The number to request the data of.
   * @param {function(object):void} callback The function to call when the
   *     requested data has been retrieved from the database. The only argument
   *     in the callback function will contain one JSON object: the data of the
   *     number.
   */
  static getNumber(number, callback) {
    DBHandler.contactDB('/get-number', number, callback);
  }

  /**
   * Retrieves the data of a sequence from the database.
   * @param {string} aNum The A-number of the sequence to request the data of.
   * @param {function(object):void} callback The function to call when the
   *     requested data has been retrieved from the database. The only argument
   *     in the callback function will contain one JSON object: the data of the
   *     sequence.
   */
  static getSequence(aNum, callback) {
    DBHandler.contactDB('/get-sequence', aNum, callback);
  }

  /**
   * Searches the online OEIS for a sequence.
   * @param {string} query The search query to send to the online OEIS.
   * @param {function(object[]):void} callback The function to call when the
   *     requested data has been retrieved from the database. The only argument
   *     in the callback function will contain an array of JSON objects: the top
   *     (up to) twelve search results.
   */
  static searchSequence(query, callback) {
    // DBHandler.contactDB('/search-sequence', query, callback);

    const numResults = 12;
    /** @type {function(string)} */
    const process = d => {
      let tokens = d.split('%I A'), sequences = [], numLoaded = 0;
      if (tokens.length == 1) {
        // no result
        callback(sequences);
        return;
      }
      for (let i = 1; i < tokens.length; i++) {
        let aNum = 'A' + tokens[i].slice(0, 6);
        DBHandler.getSequence(aNum, d => {
          if (d.hasOwnProperty('a_num')) sequences.push(d);
          if (++numLoaded == numResults) callback(sequences);
        });
      }
    };

    const url = `search?q=${query}&n=${numResults}&fmt=text`;
    DBHandler.getFromOEIS(url, process);
  }

  /**
   * Retrieves more terms of a sequence from the online OEIS.
   * @param {string} aNum The A-number of the sequence to request the terms of.
   * @param {function(object):void} callback The function to call when the
   *     requested data has been retrieved from the database. The only argument
   *     in the callback function will contain an array of numbers: the terms in
   *     the specified sequence.
   */
  static getMoreOfSequence(aNum, callback) {
    // DBHandler.contactDB('/get-more-of-sequence', aNum, callback);

    const maxNumTerms = 2e9;
    /** @type {function(string)} */
    const process = d => {
      let lines = d.split('\n'), terms = [], commentLen = 0;
      for (let i = 0; i < lines.length; i++) {
        let tokens = lines[i].split(' ');
        if (tokens.length != 2 || !Number.isInteger(+tokens[0]) ||
          !Number.isInteger(+tokens[1])) {
          continue;
        }
        let term = +tokens[1];
        if (term >= -(2 ** 31) && term < 2 ** 31) terms.push(term);
        commentLen = i + 1;
        break;
      }

      for (let i = commentLen; i < lines.length; i++) {
        if (i - commentLen == maxNumTerms - 1) break;
        let tokens = lines[i].split(' ');
        if (tokens.length < 2) break;
        let term = +tokens[1];
        if (term >= -(2 ** 31) && term < 2 ** 31 &&
          term >= Functions.SLOANES_GAP_MIN_NUM &&
          term <= Functions.SLOANES_GAP_MAX_NUM) {
          terms.push(term);
        }
      }

      callback(terms);
    };

    const url = `${aNum}/b${aNum.substr(1)}.txt`;
    DBHandler.getFromOEIS(url, process);
  }

  /**
   * Retrieves the data that describes the Sloane's Gap.
   * @param {function(object):void} callback The function to call when the
   *     requested data has been retrieved from the database. The only argument
   *     in the callback function will contain a dictionary that maps each
   *     number to the number of OEIS sequences that number has appeared in.
   */
  static getSloanes(callback) {
    DBHandler.contactDB('/get-sloanes', '', callback);
  }

  /** @private Makes the AJAX call to the database. */
  static contactDB(url, input, callback) {
    $.ajax({
      type: 'POST',
      url: url,
      contentType: 'text',
      data: input,
      dataType: 'json',
      success: callback,
    });
  }

  /**
   * @private Download data from the online OEIS using the CORS-Anywhere API.
   */
  static getFromOEIS(url, callback) {
    url = `https://cors-anywhere.herokuapp.com/https://oeis.org/${url}`;
    fetch(url).then(d => d.text()).then(callback);
  }
}
