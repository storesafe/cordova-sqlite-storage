//
//  Storage.h
//  Storage
//
//  Created by Davide Bertola on 5/28/11.
//  Copyright 2011 Polito. All rights reserved.
//
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
