// got from: https://github.com/mattgemmell/MGTwitterEngine#readme

//
//  NSData+Base64.m
//
// Derived from http://colloquy.info/project/browser/trunk/NSDataAdditions.h?rev=1576
// Created by khammond on Mon Oct 29 2001.
// Formatted by Timothy Hatcher on Sun Jul 4 2004.
// Copyright (c) 2001 Kyle Hammond. All rights reserved.
// Original development by Dave Winer.
//

//#import "MGTwitterEngineGlobalHeader.h"

@interface NSData (Base64)

/*!	@function	+dataWithBase64EncodedString:
 @discussion	This method returns an autoreleased NSData object. The NSData object is initialized with the
 contents of the Base 64 encoded string. This is a convenience method.
 @param	inBase64String	An NSString object that contains only Base 64 encoded data.
 @result	The NSData object. */
+ (NSData *) dataWithBase64EncodedString:(NSString *) string;

/*!	@function	-initWithBase64EncodedString:
 @discussion	The NSData object is initialized with the contents of the Base 64 encoded string.
 This method returns self as a convenience.
 @param	inBase64String	An NSString object that contains only Base 64 encoded data.
 @result	This method returns self. */
- (id) initWithBase64EncodedString:(NSString *) string;

/*!	@function	-base64EncodingWithLineLength:
 @discussion	This method returns a Base 64 encoded string representation of the data object.
 @param	inLineLength A value of zero means no line breaks.  This is crunched to a multiple of 4 (the next
 one greater than inLineLength).
 @result	The base 64 encoded data. */
- (NSString *) base64EncodingWithLineLength:(unsigned int) lineLength;

@end