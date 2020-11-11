class DBHandler {
    static getNumber(number, callback) {
        DBHandler.contactDB('/get-number', number, callback);
    }

    static getSequence(aNum, callback) {
        DBHandler.contactDB('/get-sequence', aNum, callback);
    }

    static searchSequence(query, callback) {
        DBHandler.contactDB('/search-sequence', query, callback);
    }

    static getMoreOfSequence(aNum, callback) {
        DBHandler.contactDB('/get-more-of-sequence', aNum, callback);
    }

    static getSloanes(callback) {
        DBHandler.contactDB('/get-sloanes', '', callback);
    }

    /** @private */
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
