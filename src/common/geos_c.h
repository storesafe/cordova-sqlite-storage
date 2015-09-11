/************************************************************************
 *
 *
 * C-Wrapper for GEOS library
 *
 * Copyright (C) 2010 2011 Sandro Santilli <strk@keybit.net>
 * Copyright (C) 2005 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation.
 * See the COPYING file for more information.
 *
 * Author: Sandro Santilli <strk@keybit.net>
 *
 ***********************************************************************
 *
 * GENERAL NOTES:
 *
 *	- Remember to call initGEOS() before any use of this library's
 *	  functions, and call finishGEOS() when done.
 *
 *	- Currently you have to explicitly GEOSGeom_destroy() all
 *	  GEOSGeom objects to avoid memory leaks, and to GEOSFree()
 *	  all returned char * (unless const).
 *
 *	- Functions ending with _r are thread safe; see details in RFC 3
 *	  http://trac.osgeo.org/geos/wiki/RFC3
 *
 ***********************************************************************/

#ifndef GEOS_C_H_INCLUDED
#define GEOS_C_H_INCLUDED

#ifndef __cplusplus
# include <stddef.h> /* for size_t definition */
#else
# include <cstddef>
using std::size_t;
#endif

#ifdef __cplusplus
extern "C" {
#endif

/************************************************************************
 *
 * Version
 *
 ***********************************************************************/

/*
 * Following 'ifdef' hack fixes problem with generating geos_c.h on Windows,
 * when building with Visual C++ compiler.
 *
 */
#if defined(_MSC_VER)
#include <geos/version.h>
#define GEOS_CAPI_VERSION_MAJOR 1
#define GEOS_CAPI_VERSION_MINOR 8
#define GEOS_CAPI_VERSION_PATCH 2
#define GEOS_CAPI_VERSION "3.4.2-CAPI-1.8.2"
#else
#ifndef GEOS_VERSION_MAJOR
#define GEOS_VERSION_MAJOR 3
#endif
#ifndef GEOS_VERSION_MINOR
#define GEOS_VERSION_MINOR 4
#endif
#ifndef GEOS_VERSION_PATCH
#define GEOS_VERSION_PATCH 2
#endif
#ifndef GEOS_VERSION
#define GEOS_VERSION "3.4.2"
#endif
#ifndef GEOS_JTS_PORT
#define GEOS_JTS_PORT "1.12.0"
#endif

#define GEOS_CAPI_VERSION_MAJOR 1
#define GEOS_CAPI_VERSION_MINOR 8
#define GEOS_CAPI_VERSION_PATCH 2
#define GEOS_CAPI_VERSION "3.4.2-CAPI-1.8.2"
#endif

#define GEOS_CAPI_FIRST_INTERFACE GEOS_CAPI_VERSION_MAJOR
#define GEOS_CAPI_LAST_INTERFACE (GEOS_CAPI_VERSION_MAJOR+GEOS_CAPI_VERSION_MINOR)

/************************************************************************
 *
 * (Abstract) type definitions
 *
 ************************************************************************/

typedef void (*GEOSMessageHandler)(const char *fmt, ...);

/* When we're included by geos_c.cpp, those are #defined to the original
 * JTS definitions via preprocessor. We don't touch them to allow the
 * compiler to cross-check the declarations. However, for all "normal"
 * C-API users, we need to define them as "opaque" struct pointers, as
 * those clients don't have access to the original C++ headers, by design.
 */
#ifndef GEOSGeometry
typedef struct GEOSGeom_t GEOSGeometry;
typedef struct GEOSPrepGeom_t GEOSPreparedGeometry;
typedef struct GEOSCoordSeq_t GEOSCoordSequence;
typedef struct GEOSSTRtree_t GEOSSTRtree;
typedef struct GEOSBufParams_t GEOSBufferParams;
#endif

/* Those are compatibility definitions for source compatibility
 * with GEOS 2.X clients relying on that type.
 */
typedef GEOSGeometry* GEOSGeom;
typedef GEOSCoordSequence* GEOSCoordSeq;

/* Supported geometry types
 * This was renamed from GEOSGeomTypeId in GEOS 2.2.X, which might
 * break compatibility, this issue is still under investigation.
 */

enum GEOSGeomTypes {
    GEOS_POINT,
    GEOS_LINESTRING,
    GEOS_LINEARRING,
    GEOS_POLYGON,
    GEOS_MULTIPOINT,
    GEOS_MULTILINESTRING,
    GEOS_MULTIPOLYGON,
    GEOS_GEOMETRYCOLLECTION
};

/* Byte oders exposed via the c api */
enum GEOSByteOrders {
    GEOS_WKB_XDR = 0, /* Big Endian */
    GEOS_WKB_NDR = 1 /* Little Endian */
};

typedef struct GEOSContextHandle_HS *GEOSContextHandle_t;

typedef void (*GEOSQueryCallback)(void *item, void *userdata);

/************************************************************************
 *
 * Initialization, cleanup, version
 *
 ***********************************************************************/

#include <geos/export.h>

extern void GEOS_DLL initGEOS(GEOSMessageHandler notice_function,
	GEOSMessageHandler error_function);
extern void GEOS_DLL finishGEOS(void);

/*
 * Register an interruption checking callback
 *
 * The callback will be invoked _before_ checking for
 * interruption, so can be used to request it.
 */
typedef void (GEOSInterruptCallback)();
extern GEOSInterruptCallback GEOS_DLL *GEOS_interruptRegisterCallback(GEOSInterruptCallback* cb);
/* Request safe interruption of operations */
extern void GEOS_DLL GEOS_interruptRequest();
/* Cancel a pending interruption request */
extern void GEOS_DLL GEOS_interruptCancel();


extern GEOSContextHandle_t GEOS_DLL initGEOS_r(
                                    GEOSMessageHandler notice_function,
                                    GEOSMessageHandler error_function);
extern void GEOS_DLL finishGEOS_r(GEOSContextHandle_t handle);

extern GEOSMessageHandler GEOS_DLL GEOSContext_setNoticeHandler_r(GEOSContextHandle_t extHandle,
                                                                  GEOSMessageHandler nf);
extern GEOSMessageHandler GEOS_DLL GEOSContext_setErrorHandler_r(GEOSContextHandle_t extHandle,
                                                                 GEOSMessageHandler ef);

extern const char GEOS_DLL *GEOSversion();


/************************************************************************
 *
 * NOTE - These functions are DEPRECATED.  Please use the new Reader and
 * writer APIS!
 *
 ***********************************************************************/

extern GEOSGeometry GEOS_DLL *GEOSGeomFromWKT(const char *wkt);
extern char GEOS_DLL *GEOSGeomToWKT(const GEOSGeometry* g);

extern GEOSGeometry GEOS_DLL *GEOSGeomFromWKT_r(GEOSContextHandle_t handle,
                                                const char *wkt);
extern char GEOS_DLL *GEOSGeomToWKT_r(GEOSContextHandle_t handle,
                                      const GEOSGeometry* g);

/*
 * Specify whether output WKB should be 2d or 3d.
 * Return previously set number of dimensions.
 */
extern int GEOS_DLL GEOS_getWKBOutputDims();
extern int GEOS_DLL GEOS_setWKBOutputDims(int newDims);

extern int GEOS_DLL GEOS_getWKBOutputDims_r(GEOSContextHandle_t handle);
extern int GEOS_DLL GEOS_setWKBOutputDims_r(GEOSContextHandle_t handle,
                                            int newDims);

/*
 * Specify whether the WKB byte order is big or little endian.
 * The return value is the previous byte order.
 */
extern int GEOS_DLL GEOS_getWKBByteOrder();
extern int GEOS_DLL GEOS_setWKBByteOrder(int byteOrder);

extern GEOSGeometry GEOS_DLL *GEOSGeomFromWKB_buf(const unsigned char *wkb, size_t size);
extern unsigned char GEOS_DLL *GEOSGeomToWKB_buf(const GEOSGeometry* g, size_t *size);

extern GEOSGeometry GEOS_DLL *GEOSGeomFromHEX_buf(const unsigned char *hex, size_t size);
extern unsigned char GEOS_DLL *GEOSGeomToHEX_buf(const GEOSGeometry* g, size_t *size);

extern int GEOS_DLL GEOS_getWKBByteOrder_r(GEOSContextHandle_t handle);
extern int GEOS_DLL GEOS_setWKBByteOrder_r(GEOSContextHandle_t handle,
                                           int byteOrder);

extern GEOSGeometry GEOS_DLL *GEOSGeomFromWKB_buf_r(GEOSContextHandle_t handle,
                                                    const unsigned char *wkb,
                                                    size_t size);
extern unsigned char GEOS_DLL *GEOSGeomToWKB_buf_r(GEOSContextHandle_t handle,
                                                   const GEOSGeometry* g,
                                                   size_t *size);

extern GEOSGeometry GEOS_DLL *GEOSGeomFromHEX_buf_r(GEOSContextHandle_t handle,
                                                    const unsigned char *hex,
                                                    size_t size);
extern unsigned char GEOS_DLL *GEOSGeomToHEX_buf_r(GEOSContextHandle_t handle,
                                                   const GEOSGeometry* g,
                                                   size_t *size);

/************************************************************************
 *
 * Coordinate Sequence functions
 *
 ***********************************************************************/

/*
 * Create a Coordinate sequence with ``size'' coordinates
 * of ``dims'' dimensions.
 * Return NULL on exception.
 */
extern GEOSCoordSequence GEOS_DLL *GEOSCoordSeq_create(unsigned int size, unsigned int dims);

extern GEOSCoordSequence GEOS_DLL *GEOSCoordSeq_create_r(
                                                GEOSContextHandle_t handle,
                                                unsigned int size,
                                                unsigned int dims);

/*
 * Clone a Coordinate Sequence.
 * Return NULL on exception.
 */
extern GEOSCoordSequence GEOS_DLL *GEOSCoordSeq_clone(const GEOSCoordSequence* s);

extern GEOSCoordSequence GEOS_DLL *GEOSCoordSeq_clone_r(
                                                GEOSContextHandle_t handle,
                                                const GEOSCoordSequence* s);

/*
 * Destroy a Coordinate Sequence.
 */
extern void GEOS_DLL GEOSCoordSeq_destroy(GEOSCoordSequence* s);

extern void GEOS_DLL GEOSCoordSeq_destroy_r(GEOSContextHandle_t handle,
                                            GEOSCoordSequence* s);

/*
 * Set ordinate values in a Coordinate Sequence.
 * Return 0 on exception.
 */
extern int GEOS_DLL GEOSCoordSeq_setX(GEOSCoordSequence* s,
	unsigned int idx, double val);
extern int GEOS_DLL GEOSCoordSeq_setY(GEOSCoordSequence* s,
	unsigned int idx, double val);
extern int GEOS_DLL GEOSCoordSeq_setZ(GEOSCoordSequence* s,
	unsigned int idx, double val);
extern int GEOS_DLL GEOSCoordSeq_setOrdinate(GEOSCoordSequence* s,
	unsigned int idx, unsigned int dim, double val);

extern int GEOS_DLL GEOSCoordSeq_setX_r(GEOSContextHandle_t handle,
                                        GEOSCoordSequence* s, unsigned int idx,
                                        double val);
extern int GEOS_DLL GEOSCoordSeq_setY_r(GEOSContextHandle_t handle,
                                        GEOSCoordSequence* s, unsigned int idx,
                                        double val);
extern int GEOS_DLL GEOSCoordSeq_setZ_r(GEOSContextHandle_t handle,
                                        GEOSCoordSequence* s, unsigned int idx,
                                        double val);
extern int GEOS_DLL GEOSCoordSeq_setOrdinate_r(GEOSContextHandle_t handle,
                                               GEOSCoordSequence* s,
                                               unsigned int idx,
                                               unsigned int dim, double val);

/*
 * Get ordinate values from a Coordinate Sequence.
 * Return 0 on exception.
 */
extern int GEOS_DLL GEOSCoordSeq_getX(const GEOSCoordSequence* s,
	unsigned int idx, double *val);
extern int GEOS_DLL GEOSCoordSeq_getY(const GEOSCoordSequence* s,
	unsigned int idx, double *val);
extern int GEOS_DLL GEOSCoordSeq_getZ(const GEOSCoordSequence* s,
	unsigned int idx, double *val);
extern int GEOS_DLL GEOSCoordSeq_getOrdinate(const GEOSCoordSequence* s,
	unsigned int idx, unsigned int dim, double *val);

extern int GEOS_DLL GEOSCoordSeq_getX_r(GEOSContextHandle_t handle,
                                        const GEOSCoordSequence* s,
                                        unsigned int idx, double *val);
extern int GEOS_DLL GEOSCoordSeq_getY_r(GEOSContextHandle_t handle,
                                        const GEOSCoordSequence* s,
                                        unsigned int idx, double *val);
extern int GEOS_DLL GEOSCoordSeq_getZ_r(GEOSContextHandle_t handle,
                                        const GEOSCoordSequence* s,
                                        unsigned int idx, double *val);
extern int GEOS_DLL GEOSCoordSeq_getOrdinate_r(GEOSContextHandle_t handle,
                                               const GEOSCoordSequence* s,
                                               unsigned int idx,
                                               unsigned int dim, double *val);
/*
 * Get size and dimensions info from a Coordinate Sequence.
 * Return 0 on exception.
 */
extern int GEOS_DLL GEOSCoordSeq_getSize(const GEOSCoordSequence* s,
	unsigned int *size);
extern int GEOS_DLL GEOSCoordSeq_getDimensions(const GEOSCoordSequence* s,
	unsigned int *dims);

extern int GEOS_DLL GEOSCoordSeq_getSize_r(GEOSContextHandle_t handle,
                                           const GEOSCoordSequence* s,
                                           unsigned int *size);
extern int GEOS_DLL GEOSCoordSeq_getDimensions_r(GEOSContextHandle_t handle,
                                                 const GEOSCoordSequence* s,
                                                 unsigned int *dims);

/************************************************************************
 *
 *  Linear referencing functions -- there are more, but these are
 *  probably sufficient for most purposes
 *
 ***********************************************************************/

/*
 * GEOSGeometry ownership is retained by caller
 */


/* Return distance of point 'p' projected on 'g' from origin
 * of 'g'. Geometry 'g' must be a lineal geometry */
extern double GEOS_DLL GEOSProject(const GEOSGeometry *g,
                                   const GEOSGeometry* p);
extern double GEOS_DLL GEOSProject_r(GEOSContextHandle_t handle,
                                     const GEOSGeometry *g,
                                     const GEOSGeometry *p);

/* Return closest point to given distance within geometry
 * Geometry must be a LineString */
extern GEOSGeometry GEOS_DLL *GEOSInterpolate(const GEOSGeometry *g,
                                              double d);
extern GEOSGeometry GEOS_DLL *GEOSInterpolate_r(GEOSContextHandle_t handle,
                                                const GEOSGeometry *g,
                                                double d);

extern double GEOS_DLL GEOSProjectNormalized(const GEOSGeometry *g,
                                             const GEOSGeometry* p);
extern double GEOS_DLL GEOSProjectNormalized_r(GEOSContextHandle_t handle,
                                               const GEOSGeometry *g,
                                               const GEOSGeometry *p);

extern GEOSGeometry GEOS_DLL *GEOSInterpolateNormalized(const GEOSGeometry *g,
                                                        double d);
extern GEOSGeometry GEOS_DLL *GEOSInterpolateNormalized_r(
                                                GEOSContextHandle_t handle,
                                                const GEOSGeometry *g,
                                                double d);

/************************************************************************
 *
 * Buffer related functions
 *
 ***********************************************************************/


/* @return NULL on exception */
extern GEOSGeometry GEOS_DLL *GEOSBuffer(const GEOSGeometry* g,
	double width, int quadsegs);
extern GEOSGeometry GEOS_DLL *GEOSBuffer_r(GEOSContextHandle_t handle,
                                           const GEOSGeometry* g,
                                           double width, int quadsegs);

enum GEOSBufCapStyles {
	GEOSBUF_CAP_ROUND=1,
	GEOSBUF_CAP_FLAT=2,
	GEOSBUF_CAP_SQUARE=3
};

enum GEOSBufJoinStyles {
	GEOSBUF_JOIN_ROUND=1,
	GEOSBUF_JOIN_MITRE=2,
	GEOSBUF_JOIN_BEVEL=3
};

/* @return 0 on exception */
extern GEOSBufferParams GEOS_DLL *GEOSBufferParams_create();
extern GEOSBufferParams GEOS_DLL *GEOSBufferParams_create_r(
                                              GEOSContextHandle_t handle);
extern void GEOS_DLL GEOSBufferParams_destroy(GEOSBufferParams* parms);
extern void GEOS_DLL GEOSBufferParams_destroy_r(
                                              GEOSContextHandle_t handle,
                                              GEOSBufferParams* parms);

/* @return 0 on exception */
extern int GEOS_DLL GEOSBufferParams_setEndCapStyle(
                                              GEOSBufferParams* p,
                                              int style);
extern int GEOS_DLL GEOSBufferParams_setEndCapStyle_r(
                                              GEOSContextHandle_t handle,
                                              GEOSBufferParams* p,
                                              int style);

/* @return 0 on exception */
extern int GEOS_DLL GEOSBufferParams_setJoinStyle(
                                              GEOSBufferParams* p,
                                              int joinStyle);
extern int GEOS_DLL GEOSBufferParams_setJoinStyle_r(
                                              GEOSContextHandle_t handle,
                                              GEOSBufferParams* p,
                                              int joinStyle);

/* @return 0 on exception */
extern int GEOS_DLL GEOSBufferParams_setMitreLimit(
                                              GEOSBufferParams* p,
                                              double mitreLimit);
extern int GEOS_DLL GEOSBufferParams_setMitreLimit_r(
                                              GEOSContextHandle_t handle,
                                              GEOSBufferParams* p,
                                              double mitreLimit);

/* @return 0 on exception */
extern int GEOS_DLL GEOSBufferParams_setQuadrantSegments(
                                              GEOSBufferParams* p,
                                              int quadSegs);
extern int GEOS_DLL GEOSBufferParams_setQuadrantSegments_r(
                                              GEOSContextHandle_t handle,
                                              GEOSBufferParams* p,
                                              int quadSegs);

/* @param singleSided: 1 for single sided, 0 otherwise */
/* @return 0 on exception */
extern int GEOS_DLL GEOSBufferParams_setSingleSided(
                                              GEOSBufferParams* p,
                                              int singleSided);
extern int GEOS_DLL GEOSBufferParams_setSingleSided_r(
                                              GEOSContextHandle_t handle,
                                              GEOSBufferParams* p,
                                              int singleSided);

/* @return NULL on exception */
extern GEOSGeometry GEOS_DLL *GEOSBufferWithParams(
                                              const GEOSGeometry* g,
                                              const GEOSBufferParams* p,
                                              double width);
extern GEOSGeometry GEOS_DLL *GEOSBufferWithParams_r(
                                              GEOSContextHandle_t handle,
                                              const GEOSGeometry* g,
                                              const GEOSBufferParams* p,
                                              double width);

/* These functions return NULL on exception. */
extern GEOSGeometry GEOS_DLL *GEOSBufferWithStyle(const GEOSGeometry* g,
	double width, int quadsegs, int endCapStyle, int joinStyle,
	double mitreLimit);
extern GEOSGeometry GEOS_DLL *GEOSBufferWithStyle_r(GEOSContextHandle_t handle,
	const GEOSGeometry* g, double width, int quadsegs, int endCapStyle,
	int joinStyle, double mitreLimit);

/* These functions return NULL on exception. Only LINESTRINGs are accepted. */
/* @deprecated in 3.3.0: use GEOSOffsetCurve instead */
extern GEOSGeometry GEOS_DLL *GEOSSingleSidedBuffer(const GEOSGeometry* g,
	double width, int quadsegs, int joinStyle, double mitreLimit,
	int leftSide);
extern GEOSGeometry GEOS_DLL *GEOSSingleSidedBuffer_r(
	GEOSContextHandle_t handle,
	const GEOSGeometry* g, double width, int quadsegs,
	int joinStyle, double mitreLimit, int leftSide);

/*
 * Only LINESTRINGs are accepted.
 * @param width : offset distance.
 *                negative for right side offset.
 *                positive for left side offset.
 * @return NULL on exception
 */
extern GEOSGeometry GEOS_DLL *GEOSOffsetCurve(const GEOSGeometry* g,
	double width, int quadsegs, int joinStyle, double mitreLimit);
extern GEOSGeometry GEOS_DLL *GEOSOffsetCurve_r(GEOSContextHandle_t handle,
	const GEOSGeometry* g, double width, int quadsegs,
	int joinStyle, double mitreLimit);


/************************************************************************
 *
 * Geometry Constructors.
 * GEOSCoordSequence* arguments will become ownership of the returned object.
 * All functions return NULL on exception.
 *
 ***********************************************************************/

extern GEOSGeometry GEOS_DLL *GEOSGeom_createPoint(GEOSCoordSequence* s);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createEmptyPoint();
extern GEOSGeometry GEOS_DLL *GEOSGeom_createLinearRing(GEOSCoordSequence* s);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createLineString(GEOSCoordSequence* s);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createEmptyLineString();

extern GEOSGeometry GEOS_DLL *GEOSGeom_createPoint_r(
                                       GEOSContextHandle_t handle,
                                       GEOSCoordSequence* s);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createEmptyPoint_r(
                                       GEOSContextHandle_t handle);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createLinearRing_r(
                                       GEOSContextHandle_t handle,
                                       GEOSCoordSequence* s);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createLineString_r(
                                       GEOSContextHandle_t handle,
                                       GEOSCoordSequence* s);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createEmptyLineString_r(
                                       GEOSContextHandle_t handle);

/*
 * Second argument is an array of GEOSGeometry* objects.
 * The caller remains owner of the array, but pointed-to
 * objects become ownership of the returned GEOSGeometry.
 */
extern GEOSGeometry GEOS_DLL *GEOSGeom_createEmptyPolygon();
extern GEOSGeometry GEOS_DLL *GEOSGeom_createPolygon(GEOSGeometry* shell,
	GEOSGeometry** holes, unsigned int nholes);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createCollection(int type,
	GEOSGeometry* *geoms, unsigned int ngeoms);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createEmptyCollection(int type);

extern GEOSGeometry GEOS_DLL *GEOSGeom_createEmptyPolygon_r(
                                       GEOSContextHandle_t handle);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createPolygon_r(
                                       GEOSContextHandle_t handle,
                                       GEOSGeometry* shell,
                                       GEOSGeometry** holes,
                                       unsigned int nholes);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createCollection_r(
                                       GEOSContextHandle_t handle, int type,
                                       GEOSGeometry* *geoms,
                                       unsigned int ngeoms);
extern GEOSGeometry GEOS_DLL *GEOSGeom_createEmptyCollection_r(
                                       GEOSContextHandle_t handle, int type);

extern GEOSGeometry GEOS_DLL *GEOSGeom_clone(const GEOSGeometry* g);

extern GEOSGeometry GEOS_DLL *GEOSGeom_clone_r(GEOSContextHandle_t handle,
                                               const GEOSGeometry* g);

/************************************************************************
 *
 * Memory management
 *
 ***********************************************************************/

extern void GEOS_DLL GEOSGeom_destroy(GEOSGeometry* g);

extern void GEOS_DLL GEOSGeom_destroy_r(GEOSContextHandle_t handle,
                                        GEOSGeometry* g);

/************************************************************************
 *
 * Topology operations - return NULL on exception.
 *
 ***********************************************************************/

extern GEOSGeometry GEOS_DLL *GEOSEnvelope(const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSIntersection(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSConvexHull(const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSDifference(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSSymDifference(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSBoundary(const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSUnion(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSUnaryUnion(const GEOSGeometry* g);

/* @deprecated in 3.3.0: use GEOSUnaryUnion instead */
extern GEOSGeometry GEOS_DLL *GEOSUnionCascaded(const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSPointOnSurface(const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSGetCentroid(const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSNode(const GEOSGeometry* g);

extern GEOSGeometry GEOS_DLL *GEOSEnvelope_r(GEOSContextHandle_t handle,
                                             const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSIntersection_r(GEOSContextHandle_t handle,
                                                 const GEOSGeometry* g1,
                                                 const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSConvexHull_r(GEOSContextHandle_t handle,
                                               const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSDifference_r(GEOSContextHandle_t handle,
                                               const GEOSGeometry* g1,
                                               const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSSymDifference_r(GEOSContextHandle_t handle,
                                                  const GEOSGeometry* g1,
                                                  const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSBoundary_r(GEOSContextHandle_t handle,
                                             const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSUnion_r(GEOSContextHandle_t handle,
                                          const GEOSGeometry* g1,
                                          const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSUnaryUnion_r(GEOSContextHandle_t handle,
                                          const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSUnionCascaded_r(GEOSContextHandle_t handle,
                                                  const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSPointOnSurface_r(GEOSContextHandle_t handle,
                                                   const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSGetCentroid_r(GEOSContextHandle_t handle,
                                                const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSNode_r(GEOSContextHandle_t handle,
                                         const GEOSGeometry* g);

/*
 * all arguments remain ownership of the caller
 * (both Geometries and pointers)
 */
extern GEOSGeometry GEOS_DLL *GEOSPolygonize(const GEOSGeometry * const geoms[], unsigned int ngeoms);
extern GEOSGeometry GEOS_DLL *GEOSPolygonizer_getCutEdges(const GEOSGeometry * const geoms[], unsigned int ngeoms);
/*
 * Polygonizes a set of Geometries which contain linework that
 * represents the edges of a planar graph.
 *
 * Any dimension of Geometry is handled - the constituent linework
 * is extracted to form the edges.
 *
 * The edges must be correctly noded; that is, they must only meet
 * at their endpoints.
 * The Polygonizer will still run on incorrectly noded input
 * but will not form polygons from incorrectly noded edges.
 *
 * The Polygonizer reports the follow kinds of errors:
 *
 * - Dangles - edges which have one or both ends which are
 *   not incident on another edge endpoint
 * - Cut Edges - edges which are connected at both ends but
 *   which do not form part of polygon
 * - Invalid Ring Lines - edges which form rings which are invalid
 *   (e.g. the component lines contain a self-intersection)
 *
 * Errors are reported to output parameters "cuts", "dangles" and
 * "invalid" (if not-null). Formed polygons are returned as a
 * collection. NULL is returned on exception. All returned
 * geometries must be destroyed by caller.
 *
 */
extern GEOSGeometry GEOS_DLL *GEOSPolygonize_full(const GEOSGeometry* input,
	GEOSGeometry** cuts, GEOSGeometry** dangles, GEOSGeometry** invalid);

extern GEOSGeometry GEOS_DLL *GEOSLineMerge(const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSSimplify(const GEOSGeometry* g, double tolerance);
extern GEOSGeometry GEOS_DLL *GEOSTopologyPreserveSimplify(const GEOSGeometry* g,
	double tolerance);

extern GEOSGeometry GEOS_DLL *GEOSPolygonize_r(GEOSContextHandle_t handle,
                              const GEOSGeometry *const geoms[],
                              unsigned int ngeoms);
extern GEOSGeometry GEOS_DLL *GEOSPolygonizer_getCutEdges_r(
                              GEOSContextHandle_t handle,
                              const GEOSGeometry * const geoms[],
                              unsigned int ngeoms);
extern GEOSGeometry GEOS_DLL *GEOSPolygonize_full_r(GEOSContextHandle_t handle,
                              const GEOSGeometry* input, GEOSGeometry** cuts,
                              GEOSGeometry** dangles, GEOSGeometry** invalidRings);

extern GEOSGeometry GEOS_DLL *GEOSLineMerge_r(GEOSContextHandle_t handle,
                                              const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSSimplify_r(GEOSContextHandle_t handle,
                                             const GEOSGeometry* g,
                                             double tolerance);
extern GEOSGeometry GEOS_DLL *GEOSTopologyPreserveSimplify_r(
                              GEOSContextHandle_t handle,
                              const GEOSGeometry* g, double tolerance);

/*
 * Return all distinct vertices of input geometry as a MULTIPOINT.
 * Note that only 2 dimensions of the vertices are considered when
 * testing for equality.
 */
extern GEOSGeometry GEOS_DLL *GEOSGeom_extractUniquePoints(
                              const GEOSGeometry* g);
extern GEOSGeometry GEOS_DLL *GEOSGeom_extractUniquePoints_r(
                              GEOSContextHandle_t handle,
                              const GEOSGeometry* g);

/*
 * Find paths shared between the two given lineal geometries.
 *
 * Returns a GEOMETRYCOLLECTION having two elements:
 * - first element is a MULTILINESTRING containing shared paths
 *   having the _same_ direction on both inputs
 * - second element is a MULTILINESTRING containing shared paths
 *   having the _opposite_ direction on the two inputs
 *
 * Returns NULL on exception
 */
extern GEOSGeometry GEOS_DLL *GEOSSharedPaths(const GEOSGeometry* g1,
  const GEOSGeometry* g2);
extern GEOSGeometry GEOS_DLL *GEOSSharedPaths_r(GEOSContextHandle_t handle,
  const GEOSGeometry* g1, const GEOSGeometry* g2);

/*
 * Snap first geometry on to second with given tolerance
 * Returns a newly allocated geometry, or NULL on exception
 */
extern GEOSGeometry GEOS_DLL *GEOSSnap(const GEOSGeometry* g1,
  const GEOSGeometry* g2, double tolerance);
extern GEOSGeometry GEOS_DLL *GEOSSnap_r(GEOSContextHandle_t handle,
  const GEOSGeometry* g1, const GEOSGeometry* g2, double tolerance);

/*
 * Return a Delaunay triangulation of the vertex of the given geometry
 *
 * @param g the input geometry whose vertex will be used as "sites"
 * @param tolerance optional snapping tolerance to use for improved robustness
 * @param onlyEdges if non-zero will return a MULTILINESTRING, otherwise it will
 *                  return a GEOMETRYCOLLECTION containing triangular POLYGONs.
 *
 * @return  a newly allocated geometry, or NULL on exception
 */
extern GEOSGeometry GEOS_DLL * GEOSDelaunayTriangulation(
                                  const GEOSGeometry *g,
                                  double tolerance,
                                  int onlyEdges);

extern GEOSGeometry GEOS_DLL * GEOSDelaunayTriangulation_r(
                                  GEOSContextHandle_t handle,
                                  const GEOSGeometry *g,
                                  double tolerance,
                                  int onlyEdges);

/************************************************************************
 *
 *  Binary predicates - return 2 on exception, 1 on true, 0 on false
 *
 ***********************************************************************/

extern char GEOS_DLL GEOSDisjoint(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSTouches(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSIntersects(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSCrosses(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSWithin(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSContains(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSOverlaps(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSEquals(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSEqualsExact(const GEOSGeometry* g1, const GEOSGeometry* g2, double tolerance);
extern char GEOS_DLL GEOSCovers(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSCoveredBy(const GEOSGeometry* g1, const GEOSGeometry* g2);

extern char GEOS_DLL GEOSDisjoint_r(GEOSContextHandle_t handle,
                                    const GEOSGeometry* g1,
                                    const GEOSGeometry* g2);
extern char GEOS_DLL GEOSTouches_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry* g1,
                                   const GEOSGeometry* g2);
extern char GEOS_DLL GEOSIntersects_r(GEOSContextHandle_t handle,
                                      const GEOSGeometry* g1,
                                      const GEOSGeometry* g2);
extern char GEOS_DLL GEOSCrosses_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry* g1,
                                   const GEOSGeometry* g2);
extern char GEOS_DLL GEOSWithin_r(GEOSContextHandle_t handle,
                                  const GEOSGeometry* g1,
                                  const GEOSGeometry* g2);
extern char GEOS_DLL GEOSContains_r(GEOSContextHandle_t handle,
                                    const GEOSGeometry* g1,
                                    const GEOSGeometry* g2);
extern char GEOS_DLL GEOSOverlaps_r(GEOSContextHandle_t handle,
                                    const GEOSGeometry* g1,
                                    const GEOSGeometry* g2);
extern char GEOS_DLL GEOSEquals_r(GEOSContextHandle_t handle,
                                  const GEOSGeometry* g1,
                                  const GEOSGeometry* g2);
extern char GEOS_DLL GEOSEqualsExact_r(GEOSContextHandle_t handle,
                                       const GEOSGeometry* g1,
                                       const GEOSGeometry* g2,
                                       double tolerance);
extern char GEOS_DLL GEOSCovers_r(GEOSContextHandle_t handle,
                                  const GEOSGeometry* g1,
                                  const GEOSGeometry* g2);
extern char GEOS_DLL GEOSCoveredBy_r(GEOSContextHandle_t handle,
                                  const GEOSGeometry* g1,
                                  const GEOSGeometry* g2);

/************************************************************************
 *
 *  Prepared Geometry Binary predicates - return 2 on exception, 1 on true, 0 on false
 *
 ***********************************************************************/

/*
 * GEOSGeometry ownership is retained by caller
 */
extern const GEOSPreparedGeometry GEOS_DLL *GEOSPrepare(const GEOSGeometry* g);

extern void GEOS_DLL GEOSPreparedGeom_destroy(const GEOSPreparedGeometry* g);

extern char GEOS_DLL GEOSPreparedContains(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedContainsProperly(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedCoveredBy(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedCovers(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedCrosses(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedDisjoint(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedIntersects(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedOverlaps(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedTouches(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedWithin(const GEOSPreparedGeometry* pg1, const GEOSGeometry* g2);

/*
 * GEOSGeometry ownership is retained by caller
 */
extern const GEOSPreparedGeometry GEOS_DLL *GEOSPrepare_r(
                                            GEOSContextHandle_t handle,
                                            const GEOSGeometry* g);

extern void GEOS_DLL GEOSPreparedGeom_destroy_r(GEOSContextHandle_t handle,
                                                const GEOSPreparedGeometry* g);

extern char GEOS_DLL GEOSPreparedContains_r(GEOSContextHandle_t handle,
                                            const GEOSPreparedGeometry* pg1,
                                            const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedContainsProperly_r(GEOSContextHandle_t handle,
                                         const GEOSPreparedGeometry* pg1,
                                         const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedCoveredBy_r(GEOSContextHandle_t handle,
                                          const GEOSPreparedGeometry* pg1,
                                          const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedCovers_r(GEOSContextHandle_t handle,
                                          const GEOSPreparedGeometry* pg1,
                                          const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedCrosses_r(GEOSContextHandle_t handle,
                                          const GEOSPreparedGeometry* pg1,
                                          const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedDisjoint_r(GEOSContextHandle_t handle,
                                          const GEOSPreparedGeometry* pg1,
                                          const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedIntersects_r(GEOSContextHandle_t handle,
                                              const GEOSPreparedGeometry* pg1,
                                              const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedOverlaps_r(GEOSContextHandle_t handle,
                                          const GEOSPreparedGeometry* pg1,
                                          const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedTouches_r(GEOSContextHandle_t handle,
                                          const GEOSPreparedGeometry* pg1,
                                          const GEOSGeometry* g2);
extern char GEOS_DLL GEOSPreparedWithin_r(GEOSContextHandle_t handle,
                                          const GEOSPreparedGeometry* pg1,
                                          const GEOSGeometry* g2);

/************************************************************************
 *
 *  STRtree functions
 *
 ***********************************************************************/

/*
 * GEOSGeometry ownership is retained by caller
 */

extern GEOSSTRtree GEOS_DLL *GEOSSTRtree_create(size_t nodeCapacity);
extern void GEOS_DLL GEOSSTRtree_insert(GEOSSTRtree *tree,
                                        const GEOSGeometry *g,
                                        void *item);
extern void GEOS_DLL GEOSSTRtree_query(GEOSSTRtree *tree,
                                       const GEOSGeometry *g,
                                       GEOSQueryCallback callback,
                                       void *userdata);
extern void GEOS_DLL GEOSSTRtree_iterate(GEOSSTRtree *tree,
                                       GEOSQueryCallback callback,
                                       void *userdata);
extern char GEOS_DLL GEOSSTRtree_remove(GEOSSTRtree *tree,
                                        const GEOSGeometry *g,
                                        void *item);
extern void GEOS_DLL GEOSSTRtree_destroy(GEOSSTRtree *tree);


extern GEOSSTRtree GEOS_DLL *GEOSSTRtree_create_r(
                                    GEOSContextHandle_t handle,
                                    size_t nodeCapacity);
extern void GEOS_DLL GEOSSTRtree_insert_r(GEOSContextHandle_t handle,
                                          GEOSSTRtree *tree,
                                          const GEOSGeometry *g,
                                          void *item);
extern void GEOS_DLL GEOSSTRtree_query_r(GEOSContextHandle_t handle,
                                         GEOSSTRtree *tree,
                                         const GEOSGeometry *g,
                                         GEOSQueryCallback callback,
                                         void *userdata);
extern void GEOS_DLL GEOSSTRtree_iterate_r(GEOSContextHandle_t handle,
                                       GEOSSTRtree *tree,
                                       GEOSQueryCallback callback,
                                       void *userdata);
extern char GEOS_DLL GEOSSTRtree_remove_r(GEOSContextHandle_t handle,
                                          GEOSSTRtree *tree,
                                          const GEOSGeometry *g,
                                          void *item);
extern void GEOS_DLL GEOSSTRtree_destroy_r(GEOSContextHandle_t handle,
                                           GEOSSTRtree *tree);


/************************************************************************
 *
 *  Unary predicate - return 2 on exception, 1 on true, 0 on false
 *
 ***********************************************************************/

extern char GEOS_DLL GEOSisEmpty(const GEOSGeometry* g);
extern char GEOS_DLL GEOSisSimple(const GEOSGeometry* g);
extern char GEOS_DLL GEOSisRing(const GEOSGeometry* g);
extern char GEOS_DLL GEOSHasZ(const GEOSGeometry* g);
extern char GEOS_DLL GEOSisClosed(const GEOSGeometry *g);

extern char GEOS_DLL GEOSisEmpty_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry* g);
extern char GEOS_DLL GEOSisSimple_r(GEOSContextHandle_t handle,
                                    const GEOSGeometry* g);
extern char GEOS_DLL GEOSisRing_r(GEOSContextHandle_t handle,
                                  const GEOSGeometry* g);
extern char GEOS_DLL GEOSHasZ_r(GEOSContextHandle_t handle,
                                const GEOSGeometry* g);
extern char GEOS_DLL GEOSisClosed_r(GEOSContextHandle_t handle,
                                const GEOSGeometry *g);

/************************************************************************
 *
 *  Dimensionally Extended 9 Intersection Model related
 *
 ***********************************************************************/

/* These are for use with GEOSRelateBoundaryNodeRule (flags param) */
enum GEOSRelateBoundaryNodeRules {
	/* MOD2 and OGC are the same rule, and is the default
	 * used by GEOSRelatePattern
	 */
	GEOSRELATE_BNR_MOD2=1,
	GEOSRELATE_BNR_OGC=1,
	GEOSRELATE_BNR_ENDPOINT=2,
	GEOSRELATE_BNR_MULTIVALENT_ENDPOINT=3,
	GEOSRELATE_BNR_MONOVALENT_ENDPOINT=4
};

/* return 2 on exception, 1 on true, 0 on false */
extern char GEOS_DLL GEOSRelatePattern(const GEOSGeometry* g1, const GEOSGeometry* g2, const char *pat);
extern char GEOS_DLL GEOSRelatePattern_r(GEOSContextHandle_t handle,
                                         const GEOSGeometry* g1,
                                         const GEOSGeometry* g2,
                                         const char *pat);

/* return NULL on exception, a string to GEOSFree otherwise */
extern char GEOS_DLL *GEOSRelate(const GEOSGeometry* g1, const GEOSGeometry* g2);
extern char GEOS_DLL *GEOSRelate_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry* g1,
                                   const GEOSGeometry* g2);

/* return 2 on exception, 1 on true, 0 on false */
extern char GEOS_DLL GEOSRelatePatternMatch(const char *mat, const char *pat);
extern char GEOS_DLL GEOSRelatePatternMatch_r(GEOSContextHandle_t handle,
                                         const char *mat,
                                         const char *pat);

/* return NULL on exception, a string to GEOSFree otherwise */
extern char GEOS_DLL *GEOSRelateBoundaryNodeRule(const GEOSGeometry* g1,
                                                 const GEOSGeometry* g2,
                                                 int bnr);
extern char GEOS_DLL *GEOSRelateBoundaryNodeRule_r(GEOSContextHandle_t handle,
                                                   const GEOSGeometry* g1,
                                                   const GEOSGeometry* g2,
                                                   int bnr);

/************************************************************************
 *
 *  Validity checking
 *
 ***********************************************************************/

/* These are for use with GEOSisValidDetail (flags param) */
enum GEOSValidFlags {
	GEOSVALID_ALLOW_SELFTOUCHING_RING_FORMING_HOLE=1
};

/* return 2 on exception, 1 on true, 0 on false */
extern char GEOS_DLL GEOSisValid(const GEOSGeometry* g);
extern char GEOS_DLL GEOSisValid_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry* g);

/* return NULL on exception, a string to GEOSFree otherwise */
extern char GEOS_DLL *GEOSisValidReason(const GEOSGeometry *g);
extern char GEOS_DLL *GEOSisValidReason_r(GEOSContextHandle_t handle,
                                         const GEOSGeometry* g);

/*
 * Caller has the responsibility to destroy 'reason' (GEOSFree)
 * and 'location' (GEOSGeom_destroy) params
 * return 2 on exception, 1 when valid, 0 when invalid
 */
extern char GEOS_DLL GEOSisValidDetail(const GEOSGeometry* g,
                                       int flags,
                                       char** reason, GEOSGeometry** location);
extern char GEOS_DLL GEOSisValidDetail_r(GEOSContextHandle_t handle,
                                         const GEOSGeometry* g,
                                         int flags,
                                         char** reason,
                                         GEOSGeometry** location);

/************************************************************************
 *
 *  Geometry info
 *
 ***********************************************************************/

/* Return NULL on exception, result must be freed by caller. */
extern char GEOS_DLL *GEOSGeomType(const GEOSGeometry* g);

extern char GEOS_DLL *GEOSGeomType_r(GEOSContextHandle_t handle,
                                     const GEOSGeometry* g);

/* Return -1 on exception */
extern int GEOS_DLL GEOSGeomTypeId(const GEOSGeometry* g);

extern int GEOS_DLL GEOSGeomTypeId_r(GEOSContextHandle_t handle,
                                     const GEOSGeometry* g);

/* Return 0 on exception */
extern int GEOS_DLL GEOSGetSRID(const GEOSGeometry* g);
extern int GEOS_DLL GEOSGetSRID_r(GEOSContextHandle_t handle,
                                  const GEOSGeometry* g);

extern void GEOS_DLL GEOSSetSRID(GEOSGeometry* g, int SRID);
extern void GEOS_DLL GEOSSetSRID_r(GEOSContextHandle_t handle,
                                   GEOSGeometry* g, int SRID);

/* May be called on all geometries in GEOS 3.x, returns -1 on error and 1
 * for non-multi geometries. Older GEOS versions only accept
 * GeometryCollections or Multi* geometries here, and are likely to crash
 * when fed simple geometries, so beware if you need compatibility with
 * old GEOS versions.
 */
extern int GEOS_DLL GEOSGetNumGeometries(const GEOSGeometry* g);

extern int GEOS_DLL GEOSGetNumGeometries_r(GEOSContextHandle_t handle,
                                           const GEOSGeometry* g);

/*
 * Return NULL on exception.
 * Returned object is a pointer to internal storage:
 * it must NOT be destroyed directly.
 * Up to GEOS 3.2.0 the input geometry must be a Collection, in
 * later version it doesn't matter (getGeometryN(0) for a single will
 * return the input).
 */
extern const GEOSGeometry GEOS_DLL *GEOSGetGeometryN(const GEOSGeometry* g, int n);

extern const GEOSGeometry GEOS_DLL *GEOSGetGeometryN_r(
                                    GEOSContextHandle_t handle,
                                    const GEOSGeometry* g, int n);

/* Return -1 on exception */
extern int GEOS_DLL GEOSNormalize(GEOSGeometry* g);

extern int GEOS_DLL GEOSNormalize_r(GEOSContextHandle_t handle,
                                    GEOSGeometry* g);

/* Return -1 on exception */
extern int GEOS_DLL GEOSGetNumInteriorRings(const GEOSGeometry* g);

extern int GEOS_DLL GEOSGetNumInteriorRings_r(GEOSContextHandle_t handle,
                                              const GEOSGeometry* g);

/* Return -1 on exception, Geometry must be a LineString. */
extern int GEOS_DLL GEOSGeomGetNumPoints(const GEOSGeometry* g);

extern int GEOS_DLL GEOSGeomGetNumPoints_r(GEOSContextHandle_t handle,
                                       const GEOSGeometry* g);

/* Return -1 on exception, Geometry must be a Point. */
extern int GEOS_DLL GEOSGeomGetX(const GEOSGeometry *g, double *x);
extern int GEOS_DLL GEOSGeomGetY(const GEOSGeometry *g, double *y);

extern int GEOS_DLL GEOSGeomGetX_r(GEOSContextHandle_t handle, const GEOSGeometry *g, double *x);
extern int GEOS_DLL GEOSGeomGetY_r(GEOSContextHandle_t handle, const GEOSGeometry *g, double *y);

/*
 * Return NULL on exception, Geometry must be a Polygon.
 * Returned object is a pointer to internal storage:
 * it must NOT be destroyed directly.
 */
extern const GEOSGeometry GEOS_DLL *GEOSGetInteriorRingN(const GEOSGeometry* g, int n);

extern const GEOSGeometry GEOS_DLL *GEOSGetInteriorRingN_r(
                                    GEOSContextHandle_t handle,
                                    const GEOSGeometry* g, int n);

/*
 * Return NULL on exception, Geometry must be a Polygon.
 * Returned object is a pointer to internal storage:
 * it must NOT be destroyed directly.
 */
extern const GEOSGeometry GEOS_DLL *GEOSGetExteriorRing(const GEOSGeometry* g);

extern const GEOSGeometry GEOS_DLL *GEOSGetExteriorRing_r(
                                    GEOSContextHandle_t handle,
                                    const GEOSGeometry* g);

/* Return -1 on exception */
extern int GEOS_DLL GEOSGetNumCoordinates(const GEOSGeometry* g);

extern int GEOS_DLL GEOSGetNumCoordinates_r(GEOSContextHandle_t handle,
                                            const GEOSGeometry* g);

/*
 * Return NULL on exception.
 * Geometry must be a LineString, LinearRing or Point.
 */
extern const GEOSCoordSequence GEOS_DLL *GEOSGeom_getCoordSeq(const GEOSGeometry* g);

extern const GEOSCoordSequence GEOS_DLL *GEOSGeom_getCoordSeq_r(
                                         GEOSContextHandle_t handle,
                                         const GEOSGeometry* g);

/*
 * Return 0 on exception (or empty geometry)
 */
extern int GEOS_DLL GEOSGeom_getDimensions(const GEOSGeometry* g);

extern int GEOS_DLL GEOSGeom_getDimensions_r(GEOSContextHandle_t handle,
                                             const GEOSGeometry* g);

/*
 * Return 2 or 3.
 */
extern int GEOS_DLL GEOSGeom_getCoordinateDimension(const GEOSGeometry* g);

extern int GEOS_DLL GEOSGeom_getCoordinateDimension_r(GEOSContextHandle_t handle,
                                                      const GEOSGeometry* g);

/*
 * Return NULL on exception.
 * Must be LineString and must be freed by called.
 */
extern GEOSGeometry GEOS_DLL *GEOSGeomGetPointN(const GEOSGeometry *g, int n);
extern GEOSGeometry GEOS_DLL *GEOSGeomGetStartPoint(const GEOSGeometry *g);
extern GEOSGeometry GEOS_DLL *GEOSGeomGetEndPoint(const GEOSGeometry *g);

extern GEOSGeometry GEOS_DLL *GEOSGeomGetPointN_r(GEOSContextHandle_t handle, const GEOSGeometry *g, int n);
extern GEOSGeometry GEOS_DLL *GEOSGeomGetStartPoint_r(GEOSContextHandle_t handle, const GEOSGeometry *g);
extern GEOSGeometry GEOS_DLL *GEOSGeomGetEndPoint_r(GEOSContextHandle_t handle, const GEOSGeometry *g);

/************************************************************************
 *
 *  Misc functions
 *
 ***********************************************************************/

/* Return 0 on exception, 1 otherwise */
extern int GEOS_DLL GEOSArea(const GEOSGeometry* g, double *area);
extern int GEOS_DLL GEOSLength(const GEOSGeometry* g, double *length);
extern int GEOS_DLL GEOSDistance(const GEOSGeometry* g1, const GEOSGeometry* g2,
	double *dist);
extern int GEOS_DLL GEOSHausdorffDistance(const GEOSGeometry *g1,
        const GEOSGeometry *g2, double *dist);
extern int GEOS_DLL GEOSHausdorffDistanceDensify(const GEOSGeometry *g1,
        const GEOSGeometry *g2, double densifyFrac, double *dist);
extern int GEOS_DLL GEOSGeomGetLength(const GEOSGeometry *g, double *length);

extern int GEOS_DLL GEOSArea_r(GEOSContextHandle_t handle,
                               const GEOSGeometry* g, double *area);
extern int GEOS_DLL GEOSLength_r(GEOSContextHandle_t handle,
                                 const GEOSGeometry* g, double *length);
extern int GEOS_DLL GEOSDistance_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry* g1,
                                   const GEOSGeometry* g2, double *dist);
extern int GEOS_DLL GEOSHausdorffDistance_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry *g1,
                                   const GEOSGeometry *g2,
                                   double *dist);
extern int GEOS_DLL GEOSHausdorffDistanceDensify_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry *g1,
                                   const GEOSGeometry *g2,
                                   double densifyFrac, double *dist);
extern int GEOS_DLL GEOSGeomGetLength_r(GEOSContextHandle_t handle,
                                   const GEOSGeometry *g, double *length);

/* Return 0 on exception, the closest points of the two geometries otherwise.
 * The first point comes from g1 geometry and the second point comes from g2.
 */
extern GEOSCoordSequence GEOS_DLL *GEOSNearestPoints(
  const GEOSGeometry* g1, const GEOSGeometry* g2);
extern GEOSCoordSequence GEOS_DLL *GEOSNearestPoints_r(
  GEOSContextHandle_t handle, const GEOSGeometry* g1, const GEOSGeometry* g2);


/************************************************************************
 *
 * Algorithms
 *
 ***********************************************************************/

/* Walking from A to B:
 *  return -1 if reaching P takes a counter-clockwise (left) turn
 *  return  1 if reaching P takes a clockwise (right) turn
 *  return  0 if P is collinear with A-B
 *
 * On exceptions, return 2.
 *
 */
extern int GEOS_DLL GEOSOrientationIndex(double Ax, double Ay, double Bx, double By,
	double Px, double Py);
extern int GEOS_DLL GEOSOrientationIndex_r(GEOSContextHandle_t handle,
	double Ax, double Ay, double Bx, double By, double Px, double Py);


/************************************************************************
 *
 * Reader and Writer APIs
 *
 ***********************************************************************/

typedef struct GEOSWKTReader_t GEOSWKTReader;
typedef struct GEOSWKTWriter_t GEOSWKTWriter;
typedef struct GEOSWKBReader_t GEOSWKBReader;
typedef struct GEOSWKBWriter_t GEOSWKBWriter;


/* WKT Reader */
extern GEOSWKTReader GEOS_DLL *GEOSWKTReader_create();
extern void GEOS_DLL GEOSWKTReader_destroy(GEOSWKTReader* reader);
extern GEOSGeometry GEOS_DLL *GEOSWKTReader_read(GEOSWKTReader* reader, const char *wkt);

extern GEOSWKTReader GEOS_DLL *GEOSWKTReader_create_r(
                                             GEOSContextHandle_t handle);
extern void GEOS_DLL GEOSWKTReader_destroy_r(GEOSContextHandle_t handle,
                                             GEOSWKTReader* reader);
extern GEOSGeometry GEOS_DLL *GEOSWKTReader_read_r(GEOSContextHandle_t handle,
                                                   GEOSWKTReader* reader,
                                                   const char *wkt);

/* WKT Writer */
extern GEOSWKTWriter GEOS_DLL *GEOSWKTWriter_create();
extern void GEOS_DLL GEOSWKTWriter_destroy(GEOSWKTWriter* writer);
extern char GEOS_DLL *GEOSWKTWriter_write(GEOSWKTWriter* writer, const GEOSGeometry* g);
extern void GEOS_DLL GEOSWKTWriter_setTrim(GEOSWKTWriter *writer, char trim);
extern void GEOS_DLL GEOSWKTWriter_setRoundingPrecision(GEOSWKTWriter *writer, int precision);
extern void GEOS_DLL GEOSWKTWriter_setOutputDimension(GEOSWKTWriter *writer, int dim);
extern int  GEOS_DLL GEOSWKTWriter_getOutputDimension(GEOSWKTWriter *writer);
extern void GEOS_DLL GEOSWKTWriter_setOld3D(GEOSWKTWriter *writer, int useOld3D);

extern GEOSWKTWriter GEOS_DLL *GEOSWKTWriter_create_r(
                                             GEOSContextHandle_t handle);
extern void GEOS_DLL GEOSWKTWriter_destroy_r(GEOSContextHandle_t handle,
                                             GEOSWKTWriter* writer);
extern char GEOS_DLL *GEOSWKTWriter_write_r(GEOSContextHandle_t handle,
                                            GEOSWKTWriter* writer,
                                            const GEOSGeometry* g);
extern void GEOS_DLL GEOSWKTWriter_setTrim_r(GEOSContextHandle_t handle,
                                            GEOSWKTWriter *writer,
                                            char trim);
extern void GEOS_DLL GEOSWKTWriter_setRoundingPrecision_r(GEOSContextHandle_t handle,
                                            GEOSWKTWriter *writer,
                                            int precision);
extern void GEOS_DLL GEOSWKTWriter_setOutputDimension_r(GEOSContextHandle_t handle,
                                                        GEOSWKTWriter *writer,
                                                        int dim);
extern int  GEOS_DLL GEOSWKTWriter_getOutputDimension_r(GEOSContextHandle_t handle,
                                                        GEOSWKTWriter *writer);
extern void GEOS_DLL GEOSWKTWriter_setOld3D_r(GEOSContextHandle_t handle,
                                              GEOSWKTWriter *writer,
                                              int useOld3D);

/* WKB Reader */
extern GEOSWKBReader GEOS_DLL *GEOSWKBReader_create();
extern void GEOS_DLL GEOSWKBReader_destroy(GEOSWKBReader* reader);
extern GEOSGeometry GEOS_DLL *GEOSWKBReader_read(GEOSWKBReader* reader, const unsigned char *wkb, size_t size);
extern GEOSGeometry GEOS_DLL *GEOSWKBReader_readHEX(GEOSWKBReader* reader, const unsigned char *hex, size_t size);

extern GEOSWKBReader GEOS_DLL *GEOSWKBReader_create_r(
                                             GEOSContextHandle_t handle);
extern void GEOS_DLL GEOSWKBReader_destroy_r(GEOSContextHandle_t handle,
                                             GEOSWKBReader* reader);
extern GEOSGeometry GEOS_DLL *GEOSWKBReader_read_r(GEOSContextHandle_t handle,
                                                   GEOSWKBReader* reader,
                                                   const unsigned char *wkb,
                                                   size_t size);
extern GEOSGeometry GEOS_DLL *GEOSWKBReader_readHEX_r(
                                            GEOSContextHandle_t handle,
                                            GEOSWKBReader* reader,
                                            const unsigned char *hex,
                                            size_t size);

/* WKB Writer */
extern GEOSWKBWriter GEOS_DLL *GEOSWKBWriter_create();
extern void GEOS_DLL GEOSWKBWriter_destroy(GEOSWKBWriter* writer);

extern GEOSWKBWriter GEOS_DLL *GEOSWKBWriter_create_r(
                                             GEOSContextHandle_t handle);
extern void GEOS_DLL GEOSWKBWriter_destroy_r(GEOSContextHandle_t handle,
                                             GEOSWKBWriter* writer);

/* The caller owns the results for these two methods! */
extern unsigned char GEOS_DLL *GEOSWKBWriter_write(GEOSWKBWriter* writer, const GEOSGeometry* g, size_t *size);
extern unsigned char GEOS_DLL *GEOSWKBWriter_writeHEX(GEOSWKBWriter* writer, const GEOSGeometry* g, size_t *size);

extern unsigned char GEOS_DLL *GEOSWKBWriter_write_r(
                                             GEOSContextHandle_t handle,
                                             GEOSWKBWriter* writer,
                                             const GEOSGeometry* g,
                                             size_t *size);
extern unsigned char GEOS_DLL *GEOSWKBWriter_writeHEX_r(
                                             GEOSContextHandle_t handle,
                                             GEOSWKBWriter* writer,
                                             const GEOSGeometry* g,
                                             size_t *size);

/*
 * Specify whether output WKB should be 2d or 3d.
 * Return previously set number of dimensions.
 */
extern int GEOS_DLL GEOSWKBWriter_getOutputDimension(const GEOSWKBWriter* writer);
extern void GEOS_DLL GEOSWKBWriter_setOutputDimension(GEOSWKBWriter* writer, int newDimension);

extern int GEOS_DLL GEOSWKBWriter_getOutputDimension_r(
                                  GEOSContextHandle_t handle,
                                  const GEOSWKBWriter* writer);
extern void GEOS_DLL GEOSWKBWriter_setOutputDimension_r(
                                   GEOSContextHandle_t handle,
                                   GEOSWKBWriter* writer, int newDimension);

/*
 * Specify whether the WKB byte order is big or little endian.
 * The return value is the previous byte order.
 */
extern int GEOS_DLL GEOSWKBWriter_getByteOrder(const GEOSWKBWriter* writer);
extern void GEOS_DLL GEOSWKBWriter_setByteOrder(GEOSWKBWriter* writer, int byteOrder);

extern int GEOS_DLL GEOSWKBWriter_getByteOrder_r(GEOSContextHandle_t handle,
                                                 const GEOSWKBWriter* writer);
extern void GEOS_DLL GEOSWKBWriter_setByteOrder_r(GEOSContextHandle_t handle,
                                                  GEOSWKBWriter* writer,
                                                  int byteOrder);

/*
 * Specify whether SRID values should be output.
 */
extern char GEOS_DLL GEOSWKBWriter_getIncludeSRID(const GEOSWKBWriter* writer);
extern void GEOS_DLL GEOSWKBWriter_setIncludeSRID(GEOSWKBWriter* writer, const char writeSRID);

extern char GEOS_DLL GEOSWKBWriter_getIncludeSRID_r(GEOSContextHandle_t handle,
                                   const GEOSWKBWriter* writer);
extern void GEOS_DLL GEOSWKBWriter_setIncludeSRID_r(GEOSContextHandle_t handle,
                                   GEOSWKBWriter* writer, const char writeSRID);


/*
 * Free buffers returned by stuff like GEOSWKBWriter_write(),
 * GEOSWKBWriter_writeHEX() and GEOSWKTWriter_write().
 */
extern void GEOS_DLL GEOSFree(void *buffer);
extern void GEOS_DLL GEOSFree_r(GEOSContextHandle_t handle, void *buffer);

#ifdef __cplusplus
} // extern "C"
#endif

#endif /* #ifndef GEOS_C_H_INCLUDED */
