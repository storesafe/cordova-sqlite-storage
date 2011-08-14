/*
 * Copyright (C) 2011 Davide Bertola
 *
 * Authors:
 * Davide Bertola <dade@dadeb.it>
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
#import "JSON.h"

@implementation PGSQLitePlugin
@synthesize successCallback, errorCallback, openDBs;

-(id)initWithWebView:(UIWebView *)theWebView
{
    self = (PGSQLitePlugin*)[super initWithWebView:theWebView];
    if (self) {
        openDBs = [NSMutableDictionary dictionaryWithCapacity:0];
        [openDBs retain];
    }
    return self;
}

-(void) respond: (NSString *)cb withString: (NSString *) str {
    NSString* jsCallBack = [NSString stringWithFormat:@"%@('%@');", cb, str ];
    [self writeJavascript: jsCallBack];
}

-(void) updateCallbacks: (NSMutableArray*) arguments
{
    NSUInteger argc = [arguments count];
    self.successCallback = NULL;
    self.errorCallback = NULL;
    if (argc > 0) {
        self.successCallback = [arguments objectAtIndex:0];
    }
    if (argc > 1) {
        self.errorCallback = [arguments objectAtIndex:1];
    }
}

-(void) open: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    [self updateCallbacks:arguments];
    
    NSString *dbPath = [options objectForKey:@"path"];
    if (dbPath == NULL) {
        [self respond:self.errorCallback withString:@"You must specify database path"];
        return;
    }
    
    sqlite3 *db;
    const char *path = [dbPath UTF8String];
    
    if (sqlite3_open(path, &db) != SQLITE_OK) {
        [self respond:self.errorCallback withString:@"Unable to open DB"];
        return;
    }
    
    NSValue *dbPointer = [NSValue valueWithPointer:db];
    [openDBs setObject:dbPointer forKey: dbPath];
    [self respond:self.successCallback withString: @"Database opened"];
}

-(void) executeSQL: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    [self updateCallbacks:arguments];
    
    NSString *dbPath = [options objectForKey: @"path"];
    NSString *query = [options objectForKey:@"query"];

    if (dbPath == NULL) {
        [self respond:self.errorCallback withString:@"You must specify database path"];
        return;
    }
    if (query == NULL) {
        [self respond:self.errorCallback withString:@"You must specify a query to execute"];
        return;
    }
    
    NSValue *dbPointer = [openDBs objectForKey:dbPath];
    if (dbPointer == NULL) {
        [self respond:self.errorCallback withString:@"No such database, you must open it first"];
        return;
    }
    sqlite3 *db = [dbPointer pointerValue];
    
    const char *sql_stmt = [query UTF8String];
    char *errMsg = NULL;
    sqlite3_stmt *statement;
    int result, i, column_type;
    BOOL keepGoing = YES;
    
    NSMutableArray *resultSet = [NSMutableArray arrayWithCapacity:0];
    NSMutableDictionary *entry;
    NSObject *columnValue;
    NSString *columnName;

    
    if (sqlite3_prepare(db, sql_stmt, -1, &statement, NULL) != SQLITE_OK) {
        errMsg = (char *) sqlite3_errmsg (db);        
        [self respond:self.errorCallback 
           withString:[NSString stringWithFormat:@"SQL statement error : %s", errMsg]];
        keepGoing = NO;
    } 
    
    while (keepGoing) {
        result = sqlite3_step (statement);
            
        switch (result) {

            case SQLITE_ROW:
                i = 0;
                entry = [NSMutableDictionary dictionaryWithCapacity:0];
                
                while (i < sqlite3_column_count(statement)) {
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
                [resultSet addObject:entry];
                break;
                
            case SQLITE_DONE:
                keepGoing = NO;
                break;
                
            default:
                errMsg = "SQL statement error";
                keepGoing = NO;
        }
    }
    
    if (errMsg != NULL) {
        [self respond:self.errorCallback withString:[NSString stringWithFormat:@"SQL statement error : %s", errMsg]];
    } else {
        [self respond:self.successCallback withString:[resultSet JSONRepresentation]];
    }
    
}

-(void) close: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
    [self updateCallbacks:arguments];
    
    NSString *dbPath = [options objectForKey:@"path"];
    if (dbPath == NULL) {
        [self respond:self.errorCallback withString:@"You must specify database path"];
        return;
    }
    
    NSValue *val = [openDBs objectForKey:dbPath];
    sqlite3 *db = [val pointerValue];
    if (db == NULL) {
        [self respond:self.errorCallback withString: @"Specified db was not open"];
    }
    sqlite3_close (db);
    [self respond:self.successCallback withString: @""];
}

-(void)exitApp: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
   exit (0);
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
    [super dealloc];
}

@end
