/*
 * Copyright (C) 2011-2013 Chris Brody
 * Copyright (C) 2011 Davide Bertola
 *
 * This library is available under the terms of the MIT License (2008).
 * See http://opensource.org/licenses/alphabetical for full text.
 */

#import <Foundation/Foundation.h>

#import "sqlite3.h"

#import <Cordova/CDVPlugin.h>
#import <Cordova/CDVJSON.h>

#import "AppDelegate.h"

enum WebSQLError {
    UNKNOWN_ERR = 0,
    DATABASE_ERR = 1,
    VERSION_ERR = 2,
    TOO_LARGE_ERR = 3,
    QUOTA_ERR = 4,
    SYNTAX_ERR = 5,
    CONSTRAINT_ERR = 6,
    TIMEOUT_ERR = 7
};
typedef int WebSQLError;

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
-(CDVPluginResult*) executeSqlWithDict: (NSMutableDictionary*)dict andArgs: (NSMutableDictionary*)dbargs;

-(id) getDBPath:(id)dbFile;

+(NSDictionary *)captureSQLiteErrorFromDb:(sqlite3 *)db;

+(int)mapSQLiteErrorCode:(int)code;

// LIBB64
+(id) getBlobAsBase64String:(const char*) blob_chars
                            withlength: (int) blob_length;
// LIBB64---END

@end
