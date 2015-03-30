/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);

          //var db = window.openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
          var db = window.sqlitePlugin.openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
          db.transaction(function(tx) {
            tx.executeSql("select upper('Some US-ASCII text') as uppertext", [], function(tx, res) {
              console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);
            });
          });

	    /**
        SQLite3JS.openAsync(':memory:').then(function (db) {
          db.oneAsync("SELECT upper('CamelToUpper')").then(function(res) {
          console.log("result: " + JSON.stringify(res));
          })
	    });

        SQLite3JS.openAsync(':memory:').then(function (db) {
          db.runAsync('CREATE TABLE Item (name TEXT, price REAL, dateBought UNSIGNED BIG INT, id INT PRIMARY KEY)').then(function () {
          db.runAsync('INSERT INTO Item (name, price, id) VALUES (?, ?, ?)', ['Apple', 1.2, 1]).then(function () {
          db.allAsync('SELECT * FROM Item').then(function (rows) {
          console.log("result: " + JSON.stringify(rows));
          })
	    });
	    **/

	    /**
          var db = window.openDatabase("Database", "1.0", "HTML5 Database API example", 200000);
          db.transaction(function(tx) {
            tx.executeSql("select upper('Some US-ASCII text') as uppertext", [], function(tx, res) {
              console.log("res.rows.item(0).uppertext: " + res.rows.item(0).uppertext);
            });
          });

          var db = openDatabase("Value-binding-test", "1.0", "Demo", 200000);
          db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data_text1, data_text2, data_int, data_real)');
          }, function(err) { console.log("error: " + err.message) }, function() {
            db.transaction(function(tx) {
              // create columns with no type affinity
              tx.executeSql("insert into test_table (data_text1, data_text2, data_int, data_real) VALUES (?,?,?,?)", ["314159", "3.14159", 314159, 3.14159], function(tx, res) {
                console.log("res.rowsAffected " + res.rowsAffected);
                tx.executeSql("select * from test_table", [], function(tx, res) {
                  var row = res.rows.item(0);
                  console.log("data_text1 " + row.data_text1);
                  console.log("ata_text2 " + row.data_text2);
                  console.log("data_int " + row.data_int);
                  console.log(" real " + row.data_real);
                });
              });
            });
          });
	    **/

    }
};

app.initialize();