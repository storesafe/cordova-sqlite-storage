/*
 * Copyright (C) 2011 Davide Bertola
 *
 * Authors:
 * Davide Bertola <dade@dadeb.it>
 * Joe Noon <joenoon@gmail.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
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

-(void) respond: (id)cb withString: (NSString *) str {
    if (cb != NULL) {
        NSString* jsString = [NSString stringWithFormat:@"PGSQLitePlugin.handleCallback('%@' , %@);", cb, str ];
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
    NSString *successCallback = [options objectForKey:@"successCallback"];
    NSString *errorCallback = [options objectForKey:@"errorCallback"];
    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];

    if (dbPath == NULL) {
        [self respond:errorCallback withString:@"{ message: 'You must specify database path' }"];
        return;
    }
    
    sqlite3 *db;
    const char *path = [dbPath UTF8String];
    
    if (sqlite3_open(path, &db) != SQLITE_OK) {
        [self respond:errorCallback withString:@"{ message: 'Unable to open DB' }"];
        return;
    }
    
    NSValue *dbPointer = [NSValue valueWithPointer:db];
    [openDBs setObject:dbPointer forKey: dbPath];
    [self respond:successCallback withString: @"{ message: 'Database opened' }"];
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
    NSString *successCallback = [options objectForKey:@"successCallback"];
    NSString *errorCallback = [options objectForKey:@"errorCallback"];
    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];
    NSMutableArray *query_parts = [options objectForKey:@"query"];
    NSString *query = [query_parts objectAtIndex:0];
    
    if (dbPath == NULL) {
        [self respond:errorCallback withString:@"{ message: 'You must specify database path' }"];
        return;
    }
    if (query == NULL) {
        [self respond:errorCallback withString:@"{ message: 'You must specify a query to execute' }"];
        return;
    }
    
    NSValue *dbPointer = [openDBs objectForKey:dbPath];
    if (dbPointer == NULL) {
        [self respond:errorCallback withString:@"{ message: 'No such database, you must open it first' }"];
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
                            columnValue = [NSNumber numberWithInt: sqlite3_column_int(statement, i)];
                            columnName = [NSString stringWithFormat:@"%s", sqlite3_column_name(statement, i)];
                            [entry setObject:columnValue forKey:columnName];
                            break;
                        case SQLITE_TEXT:
                            columnValue = [NSString stringWithFormat:@"%s", sqlite3_column_text(statement, i)];
                            columnName = [NSString stringWithFormat:@"%s", sqlite3_column_name(statement, i)];
                            [entry setObject:columnValue forKey:columnName];
                            break;
                        case SQLITE_BLOB:
                            
                            break;
                        case SQLITE_FLOAT:
                            columnValue = [NSNumber numberWithFloat: sqlite3_column_int(statement, i)];
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
        [self respond:errorCallback withString:[NSString stringWithFormat:@"{ message: 'SQL statement error : %s' }", errMsg]];
    } else {
        [resultSet setObject:resultRows forKey:@"rows"];
        [resultSet setObject:rowsAffected forKey:@"rowsAffected"];
        if (hasInsertId) {
            [resultSet setObject:insertId forKey:@"insertId"];
        }
        [self respond:successCallback withString:[resultSet JSONRepresentation]];
    }
}

-(void) close: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    NSString *successCallback = [options objectForKey:@"successCallback"];
    NSString *errorCallback = [options objectForKey:@"errorCallback"];
    NSString *dbPath = [self getDBPath:[options objectForKey:@"path"]];
    if (dbPath == NULL) {
        [self respond:errorCallback withString:@"{ message: 'You must specify database path' }"];
        return;
    }
    
    NSValue *val = [openDBs objectForKey:dbPath];
    sqlite3 *db = [val pointerValue];
    if (db == NULL) {
        [self respond:errorCallback withString: @"{ message: 'Specified db was not open' }"];
    }
    sqlite3_close (db);
    [self respond:successCallback withString: @"{ message: 'db closed' }"];
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
