/* 'use strict'; */

var MYTIMEOUT = 12000;

var isWindows = /MSAppHost/.test(navigator.userAgent);
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isFirefox = /Firefox/.test(navigator.userAgent);
var isWebKitBrowser = !isWindows && !isAndroid && /Safari/.test(navigator.userAgent);
var isBrowser = isWebKitBrowser || isFirefox;

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

      it('Self-test with CRUD operations & cleanup',
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
