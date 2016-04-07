/* 'use strict'; */

var MYTIMEOUT = 12000;

// initial test(s):
exports.defineAutoTests = function() {

  describe('INITIAL test(s)', function() {

    describe('ECHO test(s)', function() {
      it('Initial echo test',
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

/* vim: set expandtab : */
