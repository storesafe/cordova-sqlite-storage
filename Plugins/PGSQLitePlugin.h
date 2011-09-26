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

#import <Foundation/Foundation.h>
#import "sqlite3.h"

#ifdef PHONEGAP_FRAMEWORK
    #import <PhoneGap/PGPlugin.h>
    #import <PhoneGap/JSON.h>
    #import <PhoneGap/PhoneGapDelegate.h>
    #import <PhoneGap/File.h>
#else
    #import "PGPlugin.h"
    #import "JSON.h"
    #import "PhoneGapDelegate.h"
    #import "File.h"
#endif

@interface PGSQLitePlugin : PGPlugin {
    NSMutableDictionary *openDBs;
}

@property (nonatomic, copy) NSMutableDictionary *openDBs;
@property (nonatomic, retain) NSString *appDocsPath;

-(void) open:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) backgroundExecuteSqlBatch:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) backgroundExecuteSql:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) executeSqlBatch:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) executeSql:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) _executeSqlBatch:(NSMutableDictionary*)options;
-(void) _executeSql:(NSMutableDictionary*)options;
-(void) close: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) respond: (id)cb withString: (NSString *) str;
-(id) getDBPath:(id)dbFile;

@end
