/*
 * Copyright (C) 2011 Davide Bertola
 *
 * Authors:
 * Davide Bertola <dade@dadeb.it>
 * Joe Noon <joenoon@gmail.com>
 * Jean-Christophe Hoelt <hoelt@fovea.cc>
 *
 * Embedded public domain LIBB64 encoding routines from http://libb64.sourceforge.net 
 * - Chris Robertson <oztexan@gmail.com>
 *
 * This library is available under the terms of the MIT License (2008).
 * See http://opensource.org/licenses/alphabetical for full text.
 */

#import <Foundation/Foundation.h>
#import "sqlite3.h"

#import <Cordova/CDVPlugin.h>
#import <Cordova/CDVJSON.h>

#import "AppDelegate.h"

//LIBB64
typedef enum
{
	step_A, step_B, step_C
} LIBB64_base64_encodestep;

typedef struct
{
	LIBB64_base64_encodestep step;
	char result;
	int stepcount;
} LIBB64_base64_encodestate;
//LIBB64----END


@interface SQLitePlugin : CDVPlugin {
    NSMutableDictionary *openDBs;
}

@property (nonatomic, copy) NSMutableDictionary *openDBs;
@property (nonatomic, retain) NSString *appDocsPath;

// Open / Close
-(void) open: (CDVInvokedUrlCommand*)command;
-(void) close: (CDVInvokedUrlCommand*)command;

// Batch processing interface
-(void) backgroundExecuteSqlBatch: (CDVInvokedUrlCommand*)command;
-(void) executeSqlBatch: (CDVInvokedUrlCommand*)command;

// Single requests interface
-(void) backgroundExecuteSql:(CDVInvokedUrlCommand*)command;
-(void) executeSql:(CDVInvokedUrlCommand*)command;

// Perform the SQL request
-(CDVPluginResult*) executeSqlWithDict: (NSMutableDictionary*)dict;

-(id) getDBPath:(id)dbFile;

// LIBB64
+(id) getBlobAsBase64String:(const char*) blob_chars
                                    withlength: (int) blob_length;
+(void) base64_init_encodestate:(LIBB64_base64_encodestate*) state_in;
+(char) base64_encode_value: (char) value_in;
+(int) base64_encode_block: (const char*) plaintext_in
                            withlength: (int) length_in
                            withoutput: (char*) code_out
                            withencodestate: (LIBB64_base64_encodestate*) state_in
                            withlinelength: (int) line_length;
+(int) base64_encode_blockend: (char*) code_out
                                withencodestate: (LIBB64_base64_encodestate*) state_in;
// LIBB64---END

@end
