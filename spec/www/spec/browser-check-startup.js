/* 'use strict'; */

var MYTIMEOUT = 12000;

var isWindows = /MSAppHost/.test(navigator.userAgent);
var isAndroid = !isWindows && /Android/.test(navigator.userAgent);
var isFirefox = /Firefox/.test(navigator.userAgent);
var isWebKitBrowser = !isWindows && !isAndroid && /Safari/.test(navigator.userAgent);
var isBrowser = isWebKitBrowser || isFirefox;
var isEdgeBrowser = isBrowser && (/Edge/.test(navigator.userAgent));
var isChromeBrowser = isBrowser && !isEdgeBrowser && (/Chrome/.test(navigator.userAgent));
var isMac = !isBrowser && /Macintosh/.test(navigator.userAgent);
var isAppleMobileOS = /iPhone/.test(navigator.userAgent) ||
      /iPad/.test(navigator.userAgent) || /iPod/.test(navigator.userAgent);
var hasMobileWKWebView = isAppleMobileOS && !!window.webkit && !!window.webkit.messageHandlers;

window.hasBrowser = true;
window.hasWebKitWebSQL = isAndroid || (isAppleMobileOS && !hasMobileWKWebView) || isChromeBrowser;

describe('Check startup for navigator.userAgent: ' + navigator.userAgent, function() {
  it('receives deviceready event', function(done) {
    expect(true).toBe(true);
    document.addEventListener("deviceready", function() {
      done();
    });
  }, MYTIMEOUT);

  it('has openDatabase', function() {
    if (window.hasWebKitWebSQL) expect(window.openDatabase).toBeDefined();
    expect(window.sqlitePlugin).toBeDefined();
    expect(window.sqlitePlugin.openDatabase).toBeDefined();
  });
});

/* vim: set expandtab : */
