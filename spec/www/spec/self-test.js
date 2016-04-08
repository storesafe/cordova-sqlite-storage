/* 'use strict'; */

var MYTIMEOUT = 12000;

// simple tests:
var mytests = function() {

  describe('SELF test(s)', function() {

    describe('ECHO test(s)', function() {
      it('Simple echo test',
        function(done) {
          window.sqlitePlugin.echoTest(function() {
            // ok:
            expect(true).toBe(true);
            done();
          }, function(err) {
            // went wrong:
            expect(false).toBe(true);
            done();
          });
        }, MYTIMEOUT);
    });

  });

};

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
