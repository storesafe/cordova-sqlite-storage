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


#import "PGSQLitePlugin.h"

@implementation PGSQLitePlugin

@synthesize openDBs;
@synthesize appDocsPath;

-(PGPlugin*) initWithWebView:(UIWebView*)theWebView
{
    self = (PGSQLitePlugin*)[super initWithWebView:theWebView];
    if (self) {
        openDBs = [NSMutableDictionary dictionaryWithCapacity:0];
        [openDBs retain];
        
        PGFile* pgFile = [[self appDelegate] getCommandInstance: @"com.phonegap.file"];
        NSString *docs = [pgFile appDocsPath];
        [self setAppDocsPath:docs];

    }
    return self;
}

-(void) respond: (id)cb withString:(NSString *)str withType:(NSString *)type {
    if (cb != NULL) {
        NSString* jsString = [NSString stringWithFormat:@"PGSQLitePlugin.handleCallback('%@', '%@', %@);", cb, type, str ];
        [self writeJavascript:jsString];
    }
}

-(id) getDBPath:(id)dbFile {
    if (dbFile == NULL) {
        return NULL;
    }
    NSString *dbPath = [NSString stringWithFormat:@"%@/%@", appDocsPath, dbFile];
    return dbPath;
}

-(void) open: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString *callback = [options objectForKey:@"callback"];
    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];

    if (dbPath == NULL) {
        [self respond:callback withString:@"{ message: 'You must specify database path' }" withType:@"error"];
        return;
    }
    
    sqlite3 *db;
    const char *path = [dbPath UTF8String];
    
    if (sqlite3_open(path, &db) != SQLITE_OK) {
        [self respond:callback withString:@"{ message: 'Unable to open DB' }" withType:@"error"];
        return;
    }
    
    NSValue *dbPointer = [NSValue valueWithPointer:db];
    [openDBs setObject:dbPointer forKey: dbPath];
    [self respond:callback withString: @"{ message: 'Database opened' }" withType:@"success"];
}

-(void) backgroundExecuteSqlBatch: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    [self performSelector:@selector(_executeSqlBatch:) withObject:options afterDelay:0.001];
}

-(void) backgroundExecuteSql: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    [self performSelector:@selector(_executeSql:) withObject:options afterDelay:0.001];
}

-(void) _executeSqlBatch:(NSMutableDictionary*)options
{
    [self executeSqlBatch:NULL withDict:options];
}

-(void) _executeSql:(NSMutableDictionary*)options
{
    [self executeSql:NULL withDict:options];
}

-(void) executeSqlBatch: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSMutableArray *executes = [options objectForKey:@"executes"];
    for (NSMutableDictionary *dict in executes) {
        [self executeSql:NULL withDict:dict];
    }
}

-(void) executeSql: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString *callback = [options objectForKey:@"callback"];
    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];
    NSMutableArray *query_parts = [options objectForKey:@"query"];
    NSString *query = [query_parts objectAtIndex:0];
    
    if (dbPath == NULL) {
        [self respond:callback withString:@"{ message: 'You must specify database path' }" withType:@"error"];
        return;
    }
    if (query == NULL) {
        [self respond:callback withString:@"{ message: 'You must specify a query to execute' }" withType:@"error"];
        return;
    }
    
    NSValue *dbPointer = [openDBs objectForKey:dbPath];
    if (dbPointer == NULL) {
        [self respond:callback withString:@"{ message: 'No such database, you must open it first' }" withType:@"error"];
        return;
    }
    sqlite3 *db = [dbPointer pointerValue];
    
    const char *sql_stmt = [query UTF8String];
    char *errMsg = NULL;
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
    NSString *bindval;
    NSObject *insertId;
    NSObject *rowsAffected;
    
    hasInsertId = NO;
    previousRowsAffected = sqlite3_total_changes(db);
    previousInsertId = sqlite3_last_insert_rowid(db);
    
    if (sqlite3_prepare_v2(db, sql_stmt, -1, &statement, NULL) != SQLITE_OK) {
        errMsg = (char *) sqlite3_errmsg (db);
        keepGoing = NO;
    } else {
        for (int b = 1; b < query_parts.count; b++) {
            bindval = [NSString stringWithFormat:@"%@", [query_parts objectAtIndex:b]];
            sqlite3_bind_text(statement, b, [bindval UTF8String], -1, SQLITE_TRANSIENT);
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
                errMsg = "SQL statement error";
                keepGoing = NO;
        }
    }
    
    if (errMsg != NULL) {
        [self respond:callback withString:[NSString stringWithFormat:@"{ message: 'SQL statement error : %s' }", errMsg] withType:@"error"];
    } else {
        [resultSet setObject:resultRows forKey:@"rows"];
        [resultSet setObject:rowsAffected forKey:@"rowsAffected"];
        if (hasInsertId) {
            [resultSet setObject:insertId forKey:@"insertId"];
        }
        [self respond:callback withString:[resultSet JSONRepresentation] withType:@"success"];
    }
}

-(void) close: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString *callback = [options objectForKey:@"callback"];
    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];
    if (dbPath == NULL) {
        [self respond:callback withString:@"{ message: 'You must specify database path' }" withType:@"error"];
        return;
    }
    
    NSValue *val = [openDBs objectForKey:dbPath];
    sqlite3 *db = [val pointerValue];
    if (db == NULL) {
        [self respond:callback withString: @"{ message: 'Specified db was not open' }" withType:@"error"];
    }
    sqlite3_close (db);
    [self respond:callback withString: @"{ message: 'db closed' }" withType:@"success"];
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
