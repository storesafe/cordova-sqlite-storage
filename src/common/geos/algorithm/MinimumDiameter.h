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

#ifndef GEOS_ALGORITHM_MINIMUMDIAMETER_H
#define GEOS_ALGORITHM_MINIMUMDIAMETER_H

#include <geos/export.h>

// Forward declarations
namespace geos {
	namespace geom {
		class Geometry;
		class LineSegment;
		class LineString;
		class Coordinate;
		class CoordinateSequence;
	}
}


namespace geos {
namespace algorithm { // geos::algorithm

/** \brief
 * Computes the minimum diameter of a geom::Geometry
 *
 * The minimum diameter is defined to be the
 * width of the smallest band that
 * contains the geometry,
 * where a band is a strip of the plane defined
 * by two parallel lines.
 * This can be thought of as the smallest hole that the geometry can be
 * moved through, with a single rotation.
 * <p>
 * The first step in the algorithm is computing the convex hull of the Geometry.
 * If the input Geometry is known to be convex, a hint can be supplied to
 * avoid this computation.
 *
 * @see ConvexHull
 *
 */
class GEOS_DLL MinimumDiameter {
private:
	const geom::Geometry* inputGeom;
	bool isConvex;
	geom::LineSegment* minBaseSeg;
	geom::Coordinate* minWidthPt;
	int minPtIndex;
	double minWidth;
	void computeMinimumDiameter();
	void computeWidthConvex(const geom::Geometry* geom);

	/**
	 * Compute the width information for a ring of {@link geom::Coordinate}s.
	 * Leaves the width information in the instance variables.
	 *
	 * @param pts
	 * @return
	 */
	void computeConvexRingMinDiameter(const geom::CoordinateSequence *pts);

	unsigned int findMaxPerpDistance(const geom::CoordinateSequence* pts,
		geom::LineSegment* seg, unsigned int startIndex);

	static unsigned int getNextIndex(const geom::CoordinateSequence* pts,
		unsigned int index);

public:
	~MinimumDiameter();

	/** \brief
	 * Compute a minimum diameter for a giver {@link Geometry}.
	 *
	 * @param geom a Geometry
	 */
	MinimumDiameter(const geom::Geometry* newInputGeom);

	/** \brief
	 * Compute a minimum diameter for a given Geometry,
	 * with a hint if the Geometry is convex
	 * (e.g. a convex Polygon or LinearRing,
	 * or a two-point LineString, or a Point).
	 *
	 * @param geom a Geometry which is convex
	 * @param isConvex <code>true</code> if the input geometry is convex
	 */
	MinimumDiameter(const geom::Geometry* newInputGeom,
			const bool newIsConvex);

	/** \brief
	 * Gets the length of the minimum diameter of the input Geometry
	 *
	 * @return the length of the minimum diameter
	 */
	double getLength();

	/** \brief
	 * Gets the {@link geom::Coordinate} forming one end of the minimum diameter
	 *
	 * @return a coordinate forming one end of the minimum diameter
	 */
	geom::Coordinate* getWidthCoordinate();

	/** \brief
	 * Gets the segment forming the base of the minimum diameter
	 *
	 * @return the segment forming the base of the minimum diameter
	 */
	geom::LineString* getSupportingSegment();

	/** \brief
	 * Gets a LineString which is a minimum diameter
	 *
	 * @return a LineString which is a minimum diameter
	 */
	geom::LineString* getDiameter();
};

} // namespace geos::algorithm
} // namespace geos

#endif // GEOS_ALGORITHM_MINIMUMDIAMETER_H

