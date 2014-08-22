Lawnchair.adapter('webkit-sqlite', (function() {

    /**
     * Called when every transaction fails.
     * 
     * @param {type} transaction
     * @param {type} error
     */
    var logFail = function(transaction, error) {
        console.log('SQLite Adapter Error: ', transaction, error);
    };
    // TODO: Need to use better date function
    var now = function() {
        return new Date();
    };
    var queries = {
        create: 'CREATE TABLE IF NOT EXISTS {0} (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)',
        keys: 'SELECT id FROM {0} ORDER BY timestamp DESC',
        insert: 'INSERT INTO {0} (value, timestamp, id) VALUES (?, ?, ?)',
        update: 'UPDATE {0} SET value = ?, timestamp = ? WHERE (id = ?)',
        selectMultiple: 'SELECT id, value FROM {0} WHERE id IN ("{1}")',
        selectSingle: 'SELECT id, value FROM {0} WHERE id = "{1}"',
        exists: 'SELECT id FROM {0} WHERE (id = ?)',
        selectAll: 'SELECT id, value, timestamp FROM {0}',
        delete: 'DELETE FROM {0} WHERE (id = ?)',
        nuke: 'DELETE FROM {0}'
    };

    // not entirely sure if this is needed...
    if (!Function.prototype.bind) {
        Function.prototype.bind = function(object) {
            var that, slice, args, nop, bound;

            that = this;
            slice = [].slice;
            args = slice.call(arguments, 1);
            nop = function() {
            };
            bound = function() {
                return that.apply(that instanceof nop ? that : (object || {}),
                        args.concat(slice.call(arguments)));
            };

            nop.prototype = that.prototype;
            bound.prototype = new nop();

            return bound;
        };
    }

    // verify if format exists
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;

            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] !== 'undefined' ? args[number] :
                        match;
            });
        };
    }

    /**
     * Detect if function exists.
     * 
     * @param {Function} _function Function name
     * @returns {Boolean}
     */
    var function_exists = function(_function) {
        return (_function !== null) && (typeof _function !== 'undefined');
    };

    // public methods
    return {
        /**
         * Verify if sqlitePlugin is enabled.
         * Ex.: {Lawnchair}.valid();
         * 
         * @returns {Boolean}
         */
        valid: function() {
            return !!(sqlitePlugin.openDatabase);
        },
        /**
         * Initializes connection to a database and table.
         * Ex.: {Lawnchair}.init({db: 'databasefile', name: 'tablename'});
         * 
         * @param {Object} options Must be {db: 'databasefile', name: 'tablename'} on minimal.
         * @param {Function} callback Function called on success. Receives: {Lawnchair}.
         * @param {Function} failback Function called on fail. Receives: transaction, error.
         * @returns {Lawnchair}
         */
        init: function(options, callback, failback) {
            var that, dbname, bgType, onSuccess, onFail;

            that = this;
            callback = that.fn(that.name, callback);
            dbname = options.db || that.name;
            bgType = options.bgType || 1;
            onSuccess = function() {
                if (function_exists(callback)) {
                    return callback.call(that, that);
                }
            };
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };

            // open a connection and create the database if it doesn't exist 
            that.database = sqlitePlugin.openDatabase({
                name: dbname,
                bgType: bgType
            });
            that.database.transaction(function(transaction) {
                transaction.executeSql(queries.create.format(that.name), [],
                        onSuccess, onFail);
            });

            return that;
        },
        /**
         * List the keys of table.
         * 
         * @param {Function} callback Function called on success
         * @param {Function} failback Function called on fail
         * @returns {Lawnchair}
         */
        keys: function(callback, failback) {
            var that, onSuccess, onFail;

            that = this;
            callback = that.lambda(callback);
            onSuccess = function(unusedParameter, results) {
                var length, result, i;

                if (function_exists(callback)) {
                    if (results.rows.length === 0) {
                        callback.call(that, []);
                    } else {
                        length = results.rows.length;
                        result = [];

                        for (i = 0; i < length; i++) {
                            result.push(results.rows.item(i).id);
                        }

                        callback.call(that, result);
                    }
                }
            };
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };

            that.database.transaction(function(transaction) {
                transaction.executeSql(queries.keys.format(that.name), [],
                        onSuccess, onFail);
            });

            return that;
        },
        /**
         * Persist a record.
         * 
         * @param {Object} record
         * @param {Function} callback Function called on success
         * @param {Function} failback Function called on fail
         * @returns {Lawnchair}
         */
        save: function(record, callback, failback) {
            var that, key, onSuccess, onFail, value;

            that = this;
            key = record.key || that.uuid();
            onSuccess = function() {
                if (function_exists(callback)) {
                    record.key = key;
                    that.lambda(callback).call(that, record);
                }
            };
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };
            // TODO: Move timestamp to a plugin
            value = [now(), key];

            // verify existence of key
            that.exists(record.key, function(exists) {

                that.database.transaction(function(transaction) {
                    if (!exists) {
                        // if not exists, insert it
                        value.unshift(JSON.stringify(record));
                        transaction.executeSql(queries.insert.format(that.name), value, onSuccess, onFail);
                    } else {
                        // if exists, just update
                        delete(record.key);
                        value.unshift(JSON.stringify(record));
                        transaction.executeSql(queries.update.format(that.name), value, onSuccess, onFail);
                    }
                });

            });

            return that;
        },
        /**
         * Batch save a array of records.
         * Ex.: {Lanchair}.batch([{ ... }, { ... }, ... ],
         * function(lawnchair, results) { ... },
         * function(transaction, error) { ... });;
         * 
         * @param {Array} records
         * @param {Function} callback
         * @param {Function} failback
         * @returns {Lawnchair}
         */
        // TODO: this should be a batch insert / just getting the test to pass...
        batch: function(records, callback, failback) {
            var that, results, done, updateProgress, checkProgress, length, i;

            that = this;
            results = [];
            done = false;
            updateProgress = function(record) {
                results.push(record);
                done = (results.length === records.length);
            };
            checkProgress = setInterval(function() {
                if (done) {
                    if (callback) {
                        that.lambda(callback).call(that, results);
                    }

                    clearInterval(checkProgress);
                }
            }, 200);
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };

            length = records.length;
            for (i = 0; i < length; i++) {
                that.save(records[i], updateProgress, onFail);
            }

            return that;
        },
        /**
         * Get a record giving the key or records using a array of keys.
         * 
         * @param {String || Array} keyOrArray
         * @param {Function} callback
         * @param {Function} failback
         * @returns {Lawnchair}
         */
        get: function(keyOrArray, callback, failback) {
            var that, onSuccess, onFail;

            that = this;
            onSuccess = function(unusedParameter, results) {
                var object, result, length, i;

                if (function_exists(callback)) {
                    object = null;
                    result = null;

                    if (results.rows.length === 1) {
                        object = JSON.parse(results.rows.item(0).value);
                        object.key = results.rows.item(0).id;
                        result = object;
                    } else if (results.rows.length > 1) {
                        result = [];
                        length = results.rows.length;
                        for (i = 0; i < length; i++) {
                            object = JSON.parse(results.rows.item(i).value);
                            object.key = results.rows.item(i).id;
                            result.push(object);
                        }

                        if (!that.isArray(keyOrArray)) {
                            result = result.length ? result[0] : null;
                        }
                    }

                    that.lambda(callback).call(that, result);
                }
            };
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };

            that.database.transaction(function(transaction) {
                transaction.executeSql(
                        that.isArray(keyOrArray) ?
                        queries.selectMultiple.format(that.name, keyOrArray.join('", "')) :
                        queries.selectSingle.format(that.name, keyOrArray), [],
                        onSuccess, onFail);
            });

            return that;
        },
        /**
         * Verify if a record exists giving the key.
         * 
         * @param {String} key
         * @param {Function} callback Function called on success
         * @param {Function} failback Function called on fail
         * @returns {Lawnchair}
         */
        exists: function(key, callback, failback) {
            var that, onSuccess, onFail;

            that = this;
            onSuccess = function(unusedParameter, results) {
                if (function_exists(callback)) {
                    that.fn('exists', callback).call(that,
                            (results.rows.length > 0));
                }
            };
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };

            that.database.transaction(function(transaction) {
                transaction.executeSql(queries.exists.format(that.name), [key],
                        onSuccess, onFail);
            });

            return that;
        },
        /**
         * 
         * @param {type} callback
         * @param {type} failback
         * @returns {Lawnchair}
         */
        all: function(callback, failback) {
            var that, result, onSuccess, onFail;

            that = this;
            result = [];
            callback = that.fn(that.name, callback) || undefined;
            onSuccess = function(unusedParameter, results) {
                var length, i, object;

                if (function_exists(callback)) {
                    if (results.rows.length !== 0) {
                        length = results.rows.length;
                        for (i = 0; i < length; i++) {
                            object = JSON.parse(results.rows.item(i).value);
                            object.key = results.rows.item(i).id;
                            result.push(object);
                        }
                    }

                    callback.call(that, result);
                }
            };
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };

            that.database.transaction(function(transaction) {
                transaction.executeSql(queries.selectAll.format(that.name), [],
                        onSuccess, onFail);
            });

            return that;
        },
        /**
         * Remove a record with object key or key value.
         * Ex.: {Lawnchair}.remove('bb55b820-297f-11e4-941a-0002a5d5c51b',
         * function(lawnchair) { ... });
         * 
         * @param {String || Object} keyOrObj Key or Object with Key attribute
         * @param {Function} callback Function called on success
         * @param {Function} failback Function called on fail
         * @returns {Lawnchair}
         */
        remove: function(keyOrObj, callback, failback) {
            var that, key, onSuccess, onFail;

            that = this;
            key = (typeof keyOrObj === 'string') ? keyOrObj : keyOrObj.key;
            onSuccess = function() {
                if (function_exists(callback)) {
                    that.lambda(callback).call(that);
                }
            };
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };

            that.database.transaction(function(transaction) {
                transaction.executeSql(queries.delete.format(that.name),
                        [key], onSuccess, onFail);
            });

            return that;
        },
        /**
         * Empty table removing all records.
         * Ex.: {Lawnchair}.nuke();
         * 
         * @param {Function} callback Function called on success
         * @param {Function} failback Function called on fail
         * @returns {Lawnchair}
         */
        nuke: function(callback, failback) {
            var that, onSuccess, onFail;

            that = this;
            onSuccess = function() {
                if (function_exists(callback)) {
                    that.lambda(callback).call(that);
                }
            };
            onFail = function(transaction, error) {
                logFail(transaction, error);

                if (function_exists(failback)) {
                    failback(transaction, error);
                }
            };

            that.database.transaction(function(transaction) {
                transaction.executeSql(queries.nuke.format(that.name), [],
                        onSuccess, onFail);
            });

            return that;
        }
    };
})());
