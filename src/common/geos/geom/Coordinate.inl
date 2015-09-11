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

#ifndef GEOS_GEOM_COORDINATE_INL
#define GEOS_GEOM_COORDINATE_INL

#include <geos/geom/Coordinate.h>
#include <geos/platform.h> // for DoubleNotANumber

#include <cassert>
#include <cmath>

namespace geos {
namespace geom { // geos::geom

INLINE void
Coordinate::setNull()
{
	x=DoubleNotANumber;
	y=DoubleNotANumber;
	z=DoubleNotANumber;
}

INLINE bool
Coordinate::isNull() const
{
	return (ISNAN(x) && ISNAN(y) && ISNAN(z));
}

INLINE
Coordinate::Coordinate(double xNew, double yNew, double zNew)
	:
	x(xNew),
	y(yNew),
	z(zNew)
{}

INLINE bool
Coordinate::equals2D(const Coordinate& other) const
{
	if (x != other.x) return false;
	if (y != other.y) return false;
	return true;
}

INLINE bool
Coordinate::equals(const Coordinate& other) const
{
	return equals2D(other);
}

INLINE int
Coordinate::compareTo(const Coordinate& other) const
{
	if (x < other.x) return -1;
	if (x > other.x) return 1;
	if (y < other.y) return -1;
	if (y > other.y) return 1;
	return 0;
}

INLINE bool
Coordinate::equals3D(const Coordinate& other) const
{
	return (x == other.x) && ( y == other.y) && 
		((z == other.z)||(ISNAN(z) && ISNAN(other.z)));
}

INLINE double
Coordinate::distance(const Coordinate& p) const
{
	double dx = x - p.x;
	double dy = y - p.y;
	return std::sqrt(dx * dx + dy * dy);
}

INLINE int
Coordinate::hashCode() const
{
	//Algorithm from Effective Java by Joshua Bloch [Jon Aquino]
	int result = 17;
	result = 37 * result + hashCode(x);
	result = 37 * result + hashCode(y);
	return result;
}

/*static*/
INLINE int
Coordinate::hashCode(double d)
{
	int64 f = (int64)(d);
	return (int)(f^(f>>32));
}

INLINE bool
CoordinateLessThen::operator()(const Coordinate* a, const Coordinate* b) const
{
	if (a->compareTo(*b)<0) return true;
	else return false;
}

INLINE bool
CoordinateLessThen::operator()(const Coordinate& a, const Coordinate& b) const
{
	if (a.compareTo(b)<0) return true;
	else return false;
}

INLINE bool
operator==(const Coordinate& a, const Coordinate& b)
{
	return a.equals2D(b);
}

INLINE bool
operator!=(const Coordinate& a, const Coordinate& b)
{
	return ! a.equals2D(b);
}

} // namespace geos::geom
} // namespace geos

#endif // GEOS_GEOM_COORDINATE_INL

