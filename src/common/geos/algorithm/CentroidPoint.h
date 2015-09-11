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

#ifndef GEOS_ALGORITHM_CENTROIDPOINT_H
#define GEOS_ALGORITHM_CENTROIDPOINT_H

#include <geos/export.h>
#include <geos/geom/Coordinate.h>

// Forward declarations
namespace geos {
	namespace geom {
		class Geometry;
	}
}


namespace geos {
namespace algorithm { // geos::algorithm

/// @deprecated use Centroid instead
class GEOS_DLL CentroidPoint {

private:

	int ptCount;

	geom::Coordinate centSum;

public:

	CentroidPoint()
		:
		ptCount(0),
		centSum(0.0, 0.0)
	{}

	~CentroidPoint()
	{}

	/**
	 * Adds the point(s) defined by a Geometry to the centroid total.
	 * If the geometry is not of dimension 0 it does not contribute to the
	 * centroid.
	 * @param geom the geometry to add
	 */
	void add(const geom::Geometry *geom);

	void add(const geom::Coordinate *pt);

	geom::Coordinate* getCentroid() const;

	/// Return false if centroid could not be computed
	bool getCentroid(geom::Coordinate& ret) const;
};

} // namespace geos::algorithm
} // namespace geos

#endif // GEOS_ALGORITHM_CENTROIDPOINT_H
