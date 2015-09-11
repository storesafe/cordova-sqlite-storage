/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2005-2006 Refractions Research Inc.
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************/

#ifndef GEOS_OPVALID_H
#define GEOS_OPVALID_H

namespace geos {
namespace operation { // geos.operation

/// Provides classes for testing the validity of geometries.
namespace valid { // geos.operation.valid

} // namespace geos.operation.valid
} // namespace geos.operation
} // namespace geos

//#include <geos/operation/valid/ConnectedInteriorTester.h>
//#include <geos/operation/valid/ConsistentAreaTester.h>
#include <geos/operation/valid/IsValidOp.h>
//#include <geos/operation/valid/QuadtreeNestedRingTester.h>
//#include <geos/operation/valid/RepeatedPointTester.h>
//#include <geos/operation/valid/SimpleNestedRingTester.h>
//#include <geos/operation/valid/SweeplineNestedRingTester.h>
#include <geos/operation/valid/TopologyValidationError.h>

#endif
