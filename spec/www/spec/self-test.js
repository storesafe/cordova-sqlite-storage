/* 'use strict'; */

var MYTIMEOUT = 12000;

var mytests = function() {

  describe('Built-in test(s)', function() {

    describe('Self test(s)', function() {
      it('Echo test',
        function(done) {
          window.sqlitePlugin.echoTest(function() {
            // ok:
            expect(true).toBe(true);
            done();
          }, function(err) {
            // went wrong:
            expect(false).toBe(true);
            expect('Echo test error: ' + JSON.stringify(err)).toBe('--');
            done();
          });
        }, MYTIMEOUT);

      it('Self-test: open/populate/read/update/delete database',
        function(done) {
          window.sqlitePlugin.selfTest(function() {
            // ok:
            expect(true).toBe(true);
            done();
          }, function(err) {
            // went wrong:
            expect(false).toBe(true);
            expect('Self-test error: ' + JSON.stringify(err)).toBe('--');
            done();
          });
        }, MYTIMEOUT);
    });

  });

};

if (window.hasBrowser) mytests();
else exports.defineAutoTests = mytests;

/* vim: set expandtab : */
