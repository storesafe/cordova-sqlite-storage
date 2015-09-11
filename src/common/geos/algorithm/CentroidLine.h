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

#ifndef GEOS_ALGORITHM_CENTROIDLINE_H
#define GEOS_ALGORITHM_CENTROIDLINE_H


#include <geos/export.h>
#include <geos/geom/Coordinate.h>

// Forward declarations
namespace geos {
	namespace geom {
		class Geometry;
		class CoordinateSequence;
	}
}

namespace geos {
namespace algorithm { // geos::algorithm

/// @deprecated use Centroid instead
class GEOS_DLL CentroidLine {
private:

	geom::Coordinate centSum;

	double totalLength;

public:

	CentroidLine()
		:
		centSum(0.0, 0.0),
		totalLength(0.0)
	{}

	~CentroidLine() {}

	/** \brief
	 * Adds the linestring(s) defined by a Geometry to the centroid total.
	 *
	 * If the geometry is not linear it does not contribute to the centroid
	 * @param geom the geometry to add
	 */
	void add(const geom::Geometry *geom);

	/** \brief
	 * Adds the length defined by an array of coordinates.
	 *
	 * @param pts an array of {@link geom::Coordinate}s
	 */
	void add(const geom::CoordinateSequence *pts);

	geom::Coordinate* getCentroid() const;

	/// return false if centroid could not be computed
	bool getCentroid(geom::Coordinate& ret) const;
};

} // namespace geos::algorithm
} // namespace geos


#endif // GEOS_ALGORITHM_CENTROIDLINE_H
