/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2011 Sandro Santilli <strk@keybit.net>
 * Copyright (C) 2005-2006 Refractions Research Inc.
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation.
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: linearref/LinearGeometryBuilder.java r466
 *
 **********************************************************************/

#ifndef GEOS_LINEARREF_LOCATIONINDEXOFPOINT_H
#define GEOS_LINEARREF_LOCATIONINDEXOFPOINT_H

#include <geos/geom/Coordinate.h>
#include <geos/geom/Geometry.h>
#include <geos/linearref/LinearLocation.h>

namespace geos
{
namespace linearref   // geos::linearref
{

/**
 * Computes the {@link LinearLocation} of the point
 * on a linear {@link Geometry} nearest a given {@link Coordinate}.
 * The nearest point is not necessarily unique; this class
 * always computes the nearest point closest to
 * the start of the geometry.
 */
class LocationIndexOfPoint
{

private:
	const geom::Geometry *linearGeom;

	LinearLocation indexOfFromStart(const geom::Coordinate& inputPt, const LinearLocation* minIndex) const;

public:
	static LinearLocation indexOf(const geom::Geometry *linearGeom, const geom::Coordinate& inputPt);

	static LinearLocation indexOfAfter(const geom::Geometry *linearGeom, const geom::Coordinate& inputPt, const LinearLocation* minIndex);

	LocationIndexOfPoint(const geom::Geometry *linearGeom);

	/**
	 * Find the nearest location along a linear {@link Geometry} to a given point.
	 *
	 * @param inputPt the coordinate to locate
	 * @return the location of the nearest point
	 */
	LinearLocation indexOf(const geom::Coordinate& inputPt) const;
	/**
	 * Find the nearest {@link LinearLocation} along the linear {@link Geometry}
	 * to a given {@link Coordinate}
	 * after the specified minimum {@link LinearLocation}.
	 * If possible the location returned will be strictly greater than the
	 * <code>minLocation</code>.
	 * If this is not possible, the
	 * value returned will equal <code>minLocation</code>.
	 * (An example where this is not possible is when
	 * minLocation = [end of line] ).
	 *
	 * @param inputPt the coordinate to locate
	 * @param minLocation the minimum location for the point location
	 * @return the location of the nearest point
	 */
	LinearLocation indexOfAfter(const geom::Coordinate& inputPt, const LinearLocation* minIndex) const;
};
}
}
#endif
