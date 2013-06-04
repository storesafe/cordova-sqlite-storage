/*
 * Copyright (C) 2011 Davide Bertola
 *
 * Authors:
 * Davide Bertola <dade@dadeb.it>
 * Joe Noon <joenoon@gmail.com>
 * Jean-Christophe Hoelt <hoelt@fovea.cc>
 *
 * This library is available under the terms of the MIT License (2008).
 * See http://opensource.org/licenses/alphabetical for full text.
 */

#import <Foundation/Foundation.h>
#import "sqlite3.h"

#import <Cordova/CDVPlugin.h>
#import <Cordova/CDVJSON.h>

#import "AppDelegate.h"

@interface SQLitePlugin : CDVPlugin {
    NSMutableDictionary *openDBs;
}

@property (nonatomic, copy) NSMutableDictionary *openDBs;
@property (nonatomic, retain) NSString *appDocsPath;

// Open / Close
-(void) open: (CDVInvokedUrlCommand*)command;
-(void) close: (CDVInvokedUrlCommand*)command;
-(void) delete: (CDVInvokedUrlCommand*)command;

// Batch processing interface
-(void) backgroundExecuteSqlBatch: (CDVInvokedUrlCommand*)command;
-(void) executeSqlBatch: (CDVInvokedUrlCommand*)command;

// Single requests interface
-(void) backgroundExecuteSql:(CDVInvokedUrlCommand*)command;
-(void) executeSql:(CDVInvokedUrlCommand*)command;

// Perform the SQL request
-(CDVPluginResult*) executeSqlWithDict: (NSMutableDictionary*)dict;

-(id) getDBPath:(id)dbFile;

@end
