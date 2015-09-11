/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************/

#ifndef GEOS_GEOM_TRIANGLE_H
#define GEOS_GEOM_TRIANGLE_H

#include <geos/export.h>
#include <geos/geom/Coordinate.h> 

#include <geos/inline.h>

namespace geos {
namespace geom { // geos::geom

/**
 * \brief
 * Represents a planar triangle, and provides methods for calculating various
 * properties of triangles.
 */
class GEOS_DLL Triangle {
public:
	Coordinate p0, p1, p2;

	Triangle(const Coordinate& nP0, const Coordinate& nP1, const Coordinate& nP2)
		:
		p0(nP0),
		p1(nP1),
		p2(nP2)
	{}

	/**
	 * The inCentre of a triangle is the point which is equidistant
	 * from the sides of the triangle.  This is also the point at which the bisectors
	 * of the angles meet.
	 *
	 * @param resultPoint the point into which to write the inCentre of the triangle
	 */
	void inCentre(Coordinate& resultPoint);
};


} // namespace geos::geom
} // namespace geos

//#ifdef GEOS_INLINE
//# include "geos/geom/Triangle.inl"
//#endif

#endif // ndef GEOS_GEOM_TRIANGLE_H
