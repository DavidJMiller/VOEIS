/**
 * Provides static functions that accesses and handles requests to our Python
 * database.
 *
 * VOEIS
 * David Miller, Kevin Song, and Qianlang Chen
 * W 11/11/20
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
   * @param {function(object):void} callback The function to call when the
   *     requested data has been retrieved from the database. The only argument
   *     in the callback function will contain an array of JSON objects: the top
   *     (up to) six search results.
   */
  static searchSequence(query, callback) {
    DBHandler.contactDB('/search-sequence', query, callback);
  }

  /**
   * Retrieves more terms of a sequence from the online OEIS.
   * @param {string} aNum The A-number of the sequence to request the terms of.
   * @param {function(object):void} callback The function to call when the
   *     requested data has been retrieved from the database. The only argument
   *     in the callback function will contain an array of numbers: the (up to
   *     first 1,728) terms in the specified sequence.
   */
  static getMoreOfSequence(aNum, callback) {
    DBHandler.contactDB('/get-more-of-sequence', aNum, callback);
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
}
