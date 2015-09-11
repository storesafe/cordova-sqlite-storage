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
 * Last port: linearref/LengthLocationMap.java r463
 *
 **********************************************************************/

#ifndef GEOS_LINEARREF_LENGTHLOCATIONMAP_H
#define GEOS_LINEARREF_LENGTHLOCATIONMAP_H

#include <geos/geom/Coordinate.h>
#include <geos/geom/Geometry.h>
#include <geos/linearref/LinearLocation.h>

namespace geos {
namespace linearref { // geos::linearref

/**
 * Computes the {@link LinearLocation} for a given length
 * along a linear {@link Geometry}.
 * Negative lengths are measured in reverse from end of the linear geometry.
 * Out-of-range values are clamped.
 */
class LengthLocationMap
{


private:
	const geom::Geometry *linearGeom;

	LinearLocation getLocationForward(double length) const;

	LinearLocation resolveHigher(const LinearLocation& loc) const;

public:

	// TODO: cache computed cumulative length for each vertex
	// TODO: support user-defined measures
	// TODO: support measure index for fast mapping to a location

	/**
	 * \brief
	 * Computes the {@link LinearLocation} for a
	 * given length along a linear {@link Geometry}.
	 *
	 * @param line the linear geometry to use
	 * @param length the length index of the location
	 * @return the {@link LinearLocation} for the length
	 */
	static LinearLocation getLocation(const geom::Geometry *linearGeom, double length)
	{
    LengthLocationMap locater(linearGeom);
    return locater.getLocation(length);
	}

	/**
	 * \brief
	 * Computes the {@link LinearLocation} for a
	 * given length along a linear {@link Geometry}.
	 *
	 * @param line the linear geometry to use
	 * @param length the length index of the location
	 * @param resolveLower if true lengths are resolved to the
	 *                     lowest possible index 
	 * @return the {@link LinearLocation} for the length
	 */
	static LinearLocation getLocation(const geom::Geometry *linearGeom, double length, bool resolveLower)
  {
    LengthLocationMap locater(linearGeom);
    return locater.getLocation(length, resolveLower);
  }

	/**
	 * Computes the length for a given {@link LinearLocation}
	 * on a linear {@link Geometry}.
	 *
	 * @param line the linear geometry to use
	 * @param loc the {@link LinearLocation} index of the location
	 * @return the length for the {@link LinearLocation}
	 */
	static double getLength(const geom::Geometry *linearGeom, const LinearLocation& loc);

	LengthLocationMap(const geom::Geometry *linearGeom);

	/**
	 * \brief
	 * Compute the {@link LinearLocation} corresponding to a length.
	 * 
	 * Negative lengths are measured in reverse from end of the linear geometry.
	 * Out-of-range values are clamped.
	 * Ambiguous indexes are resolved to the lowest possible location value,
	 * depending on the value of <tt>resolveLower</tt>.
	 *
	 * @param length the length index
	 * @return the corresponding LinearLocation
	 */
	LinearLocation getLocation(double length, bool resolveLower) const;

	/**
	 * \brief
	 * Compute the {@link LinearLocation} corresponding to a length.
	 * 
	 * Negative lengths are measured in reverse from end of the linear geometry.
	 * Out-of-range values are clamped.
	 * Ambiguous indexes are resolved to the lowest possible location value.
	 *
	 * @param length the length index
	 * @return the corresponding LinearLocation
	 */
	LinearLocation getLocation(double length) const;

	double getLength(const LinearLocation& loc) const;

};

} // geos.linearref
} // geos

#endif
