/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2005-2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************/

#ifndef GEOS_GEOM_COORDINATEFILTER_H
#define GEOS_GEOM_COORDINATEFILTER_H

#include <geos/export.h>
#include <geos/inline.h>

#include <cassert>

namespace geos {
namespace geom { // geos::geom

class Coordinate;

/**
 * <code>Geometry</code> classes support the concept of applying a
 * coordinate filter to every coordinate in the <code>Geometry</code>.
 *
 * A  coordinate filter can either record information about each coordinate or
 * change the coordinate in some way. Coordinate filters implement the
 * interface <code>CoordinateFilter</code>. (<code>CoordinateFilter</code> is
 * an example of the Gang-of-Four Visitor pattern). Coordinate filters can be
 * used to implement such things as coordinate transformations, centroid and
 * envelope computation, and many other functions.
 *
 * TODO: provide geom::CoordinateInspector and geom::CoordinateMutator instead
 * of having the two versions of filter_rw and filter_ro
 *
 */
class GEOS_DLL CoordinateFilter {
public:
   virtual ~CoordinateFilter() {}

   /**
    * Performs an operation on <code>coord</code>.
    *
    * @param  coord  a <code>Coordinate</code> to which the filter is applied.
    */
   virtual void filter_rw(Coordinate* /*coord*/) const { assert(0); }

   /**
    * Performs an operation with <code>coord</code>.
    *
    * @param  coord  a <code>Coordinate</code> to which the filter is applied.
    */
   virtual void filter_ro(const Coordinate* /*coord*/) { assert(0); }
};

} // namespace geos::geom
} // namespace geos

#endif // ndef GEOS_GEOM_COORDINATEFILTER_H
