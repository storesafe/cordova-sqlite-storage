/*
 * Copyright (C) 2011 Davide Bertola
 *
 * Authors:
 * Davide Bertola <dade@dadeb.it>
 * Joe Noon <joenoon@gmail.com>
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
-(void) close: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

// Batch processing
-(void) backgroundExecuteSqlBatch:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) executeSqlBatch:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) _executeSqlBatch:(NSMutableDictionary*)options;

// Single requests
-(void) backgroundExecuteSql:(CDVInvokedUrlCommand*)command;
-(void) executeSql:(CDVInvokedUrlCommand*)command;
-(void) _executeSql:(CDVInvokedUrlCommand*)command;

-(id) getDBPath:(id)dbFile;

@end
