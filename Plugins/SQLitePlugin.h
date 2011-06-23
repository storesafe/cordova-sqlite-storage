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

#import "PhoneGapDelegate.h"
#import <Foundation/Foundation.h>
#import "/usr/include/sqlite3.h"


@interface SQLitePlugin : PhoneGapCommand {
    NSString *successCallback;
    NSString *errorCallback;
    NSMutableDictionary *openDBs;
}

@property (nonatomic, copy) NSString *successCallback;
@property (nonatomic, copy) NSString *errorCallback;
@property (nonatomic, copy) NSMutableDictionary *openDBs;

-(void) open:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) executeSQL:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;
-(void) close: (NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

@end
