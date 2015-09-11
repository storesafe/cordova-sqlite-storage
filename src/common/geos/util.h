/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 * Copyright (C) 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Utility header to retain a bit of backward compatibility.
 * Try to avoid including this header directly.
 *
 **********************************************************************/

#ifndef GEOS_UTIL_H
#define GEOS_UTIL_H

//#include <geos/util/AssertionFailedException.h>
#include <geos/util/GEOSException.h>
#include <geos/util/IllegalArgumentException.h>
#include <geos/util/TopologyException.h>
//#include <geos/util/UnsupportedOperationException.h>
//#include <geos/util/CoordinateArrayFilter.h>
//#include <geos/util/UniqueCoordinateArrayFilter.h>
#include <geos/util/GeometricShapeFactory.h>
//#include <geos/util/math.h>

//
// Private macros definition 
// 

namespace geos
{
    template<class T>
    void ignore_unused_variable_warning(T const& ) {}
}


#endif // GEOS_UTIL_H
