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


#import "SQLitePlugin.h"

@implementation SQLitePlugin

@synthesize openDBs;
@synthesize appDocsPath;

-(CDVPlugin*) initWithWebView:(UIWebView*)theWebView
{
    self = (SQLitePlugin*)[super initWithWebView:theWebView];
    if (self) {
        openDBs = [NSMutableDictionary dictionaryWithCapacity:0];
        [openDBs retain];

        NSString *docs = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex: 0];
        NSLog(@"Detected docs path: %@", docs);
        [self setAppDocsPath:docs];
    }
    return self;
}

-(id) getDBPath:(id)dbFile {
    if (dbFile == NULL) {
        return NULL;
    }
    NSString *dbPath = [NSString stringWithFormat:@"%@/%@", appDocsPath, dbFile];
    return dbPath;
}

-(void)open: (CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    NSMutableDictionary *options = [command.arguments objectAtIndex:0];

    NSString *dbname = [self getDBPath:[options objectForKey:@"name"]];
    NSValue *dbPointer;

    if (dbname == NULL) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"You must specify database name"];
    }
    else {
        dbPointer = [openDBs objectForKey:dbname];
        if (dbPointer != NULL) {
            // NSLog(@"Reusing existing database connection");
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Database opened"];
        }
        else {
            const char *name = [dbname UTF8String];
            // NSLog(@"using db name: %@", dbname);
            sqlite3 *db;

            if (sqlite3_open(name, &db) != SQLITE_OK) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Unable to open DB"];
                return;
            }
            else {
                const char *key = [[options objectForKey:@"key"] UTF8String];
                if(key != NULL) sqlite3_key(db, key, strlen(key));
                if(sqlite3_exec(db, (const char*)"SELECT count(*) FROM sqlite_master;", NULL, NULL, NULL) == SQLITE_OK) {
                    dbPointer = [NSValue valueWithPointer:db];
                    [openDBs setObject: dbPointer forKey: dbname];
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Database opened"];
                } else {
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Unable to encrypt DB"];
                }
            }
        }
    }

    if (sqlite3_threadsafe()) {
        NSLog(@"Good news: SQLite is thread safe!");
    }
    else {
        NSLog(@"Warning: SQLite is not thread safe.");
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId: command.callbackId];
}

-(void) close: (CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    NSMutableDictionary *options = [command.arguments objectAtIndex:0];

    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];
    if (dbPath == NULL) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"You must specify database path"];
    }
    else {
        NSValue *val = [openDBs objectForKey:dbPath];
        sqlite3 *db = [val pointerValue];
        if (db == NULL) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Specified db was not open"];
        }
        else {
            sqlite3_close (db);
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"DB closed"];
        }
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId: command.callbackId];
}

-(void) delete: (CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = nil;
    NSMutableDictionary *options = [command.arguments objectAtIndex:0];
    
    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];
    if(dbPath==NULL) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"You must specify database path"];
    } else {
        if([[NSFileManager defaultManager]fileExistsAtPath:dbPath]) {
            [[NSFileManager defaultManager]removeItemAtPath:dbPath error:nil];
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"DB deleted"];
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"The database does not exist on that path"];
        }
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


-(void) backgroundExecuteSqlBatch: (CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        [self executeSqlBatch: command];
    }];
}

-(void) executeSqlBatch: (CDVInvokedUrlCommand*)command
{
    NSMutableDictionary *options = [command.arguments objectAtIndex:0];
    NSMutableArray *results = [NSMutableArray arrayWithCapacity:0];
    NSMutableArray *executes = [options objectForKey:@"executes"];
    int status = CDVCommandStatus_OK;
    CDVPluginResult* pluginResult;

    @synchronized(self) {
        for (NSMutableDictionary *dict in executes) {
            CDVPluginResult *result = [self executeSqlWithDict:dict];
            if ([result.status intValue] == CDVCommandStatus_ERROR) {
                status = CDVCommandStatus_ERROR;
                break;
            }
            [results addObject: result.message];
        }
        pluginResult = [CDVPluginResult resultWithStatus:status messageAsArray:results];
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

-(void) backgroundExecuteSql: (CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        [self executeSql:command];
    }];
}

-(void) executeSql: (CDVInvokedUrlCommand*)command
{
    NSMutableDictionary *options = [command.arguments objectAtIndex:0];
    CDVPluginResult* pluginResult;
    @synchronized (self) {
        pluginResult = [self executeSqlWithDict: options];
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

-(CDVPluginResult*) executeSqlWithDict: (NSMutableDictionary*)options
{
    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];
    NSMutableArray *query_parts = [options objectForKey:@"query"];
    NSString *query = [query_parts objectAtIndex:0];

    if (dbPath == NULL) {
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"You must specify database path"];
    }
    if (query == NULL) {
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"You must specify a query to execute"];
    }

    NSValue *dbPointer = [openDBs objectForKey:dbPath];
    if (dbPointer == NULL) {
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"No such database, you must open it first"];
    }
    sqlite3 *db = [dbPointer pointerValue];

    const char *sql_stmt = [query UTF8String];
    const char *errMsg = NULL;
    sqlite3_stmt *statement;
    int result, i, column_type, count;
    int previousRowsAffected, nowRowsAffected, diffRowsAffected;
    long long previousInsertId, nowInsertId;
    BOOL keepGoing = YES;
    BOOL hasInsertId;
    NSMutableDictionary *resultSet = [NSMutableDictionary dictionaryWithCapacity:0];
    NSMutableArray *resultRows = [NSMutableArray arrayWithCapacity:0];
    NSMutableDictionary *entry;
    NSObject *columnValue;
    NSString *columnName;
    NSObject *bindval;
    NSObject *insertId;
    NSObject *rowsAffected;

    hasInsertId = NO;
    previousRowsAffected = sqlite3_total_changes(db);
    previousInsertId = sqlite3_last_insert_rowid(db);

    if (sqlite3_prepare_v2(db, sql_stmt, -1, &statement, NULL) != SQLITE_OK) {
        errMsg = /* (char *) */ sqlite3_errmsg (db);
        keepGoing = NO;
    } else {
      for (int b = 1; b < query_parts.count; b++) {
        bindval = [query_parts objectAtIndex:b];
        if ([bindval isEqual:[NSNull null]]){
          sqlite3_bind_null(statement, b);
        } else {
          sqlite3_bind_text(statement, b, [[NSString stringWithFormat:@"%@", bindval] UTF8String], -1, SQLITE_TRANSIENT);
        }
      }
    }

    while (keepGoing) {
        result = sqlite3_step (statement);
        switch (result) {

            case SQLITE_ROW:
                i = 0;
                entry = [NSMutableDictionary dictionaryWithCapacity:0];
                count = sqlite3_column_count(statement);
				
                while (i < count) {
                    column_type = sqlite3_column_type(statement, i);
                    switch (column_type) {
                        case SQLITE_INTEGER:
                            columnValue = [NSNumber numberWithDouble: sqlite3_column_double(statement, i)];
                            columnName = [NSString stringWithFormat:@"%s", sqlite3_column_name(statement, i)];
                            [entry setObject:columnValue forKey:columnName];
                            break;
                        case SQLITE_TEXT:
                            columnValue = [NSString stringWithUTF8String:(char *)sqlite3_column_text(statement, i)];
                            columnName = [NSString stringWithFormat:@"%s", sqlite3_column_name(statement, i)];
                            [entry setObject:columnValue forKey:columnName];
                            break;
                        case SQLITE_BLOB:

                            break;
                        case SQLITE_FLOAT:
                            columnValue = [NSNumber numberWithFloat: sqlite3_column_double(statement, i)];
                            columnName = [NSString stringWithFormat:@"%s", sqlite3_column_name(statement, i)];
                            [entry setObject:columnValue forKey:columnName];
                            break;
                        case SQLITE_NULL:
                            break;
                    }
                    i++;

                }
                [resultRows addObject:entry];
                break;

            case SQLITE_DONE:
                nowRowsAffected = sqlite3_total_changes(db);
                diffRowsAffected = nowRowsAffected - previousRowsAffected;
                rowsAffected = [NSNumber numberWithInt:diffRowsAffected];
                nowInsertId = sqlite3_last_insert_rowid(db);
                if (previousInsertId != nowInsertId) {
                    hasInsertId = YES;
                    insertId = [NSNumber numberWithLongLong:sqlite3_last_insert_rowid(db)];
                }
                keepGoing = NO;
                break;

            default:
                errMsg = [[NSString stringWithFormat:@"sqlite3 error code %i", result] UTF8String];
                keepGoing = NO;
        }
    }

    sqlite3_finalize (statement);

    if (errMsg != NULL) {
        return [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[NSString stringWithFormat:@"SQL statement error : %s", errMsg]];
    }

    [resultSet setObject:resultRows forKey:@"rows"];
    [resultSet setObject:rowsAffected forKey:@"rowsAffected"];
    if (hasInsertId) {
        [resultSet setObject:insertId forKey:@"insertId"];
    }
    return [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:resultSet];
}

-(void)dealloc
{
    int i;
    NSArray *keys = [openDBs allKeys];
    NSValue *pointer;
    NSString *key;
    sqlite3 *db;

    /* close db the user forgot */
    for (i=0; i<[keys count]; i++) {
        key = [keys objectAtIndex:i];
        pointer = [openDBs objectForKey:key];
        db = [pointer pointerValue];
        sqlite3_close (db);
    }

    [openDBs release];
    [appDocsPath release];
    [super dealloc];
}

@end
