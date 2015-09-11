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
 **********************************************************************
 *
 * Last port: algorithm/CentroidArea.java r612
 *
 **********************************************************************/

#ifndef GEOS_ALGORITHM_CENTROIDAREA_H
#define GEOS_ALGORITHM_CENTROIDAREA_H


#include <geos/export.h>
#include <geos/geom/Coordinate.h>

// Forward declarations
namespace geos {
	namespace geom {
		class CoordinateSequence;
		class Geometry;
		class Polygon;
	}
}

namespace geos {
namespace algorithm { // geos::algorithm

/**
 * \class CentroidArea geosAlgorithm.h geos/geosAlgorithm.h
 *
 * \brief Computes the centroid of an area geometry.
 *
 * Algorithm:
 *
 * Based on the usual algorithm for calculating
 * the centroid as a weighted sum of the centroids
 * of a decomposition of the area into (possibly overlapping) triangles.
 * The algorithm has been extended to handle holes and multi-polygons.
 * See <code>http://www.faqs.org/faqs/graphics/algorithms-faq/</code>
 * for further details of the basic approach.
 * 
 * The code has also be extended to handle degenerate (zero-area) polygons.
 * In this case, the centroid of the line segments in the polygon
 * will be returned.
 *
 * @deprecated use Centroid instead
 *
 */
class GEOS_DLL CentroidArea {

public:

	CentroidArea()
		:
		basePt(0.0, 0.0),
		areasum2(0.0),
		totalLength(0.0)
	{}

	~CentroidArea() {}

	/**
	 * Adds the area defined by a Geometry to the centroid total.
	 * If the geometry has no area it does not contribute to the centroid.
	 *
	 * @param geom the geometry to add
	 */
	void add(const geom::Geometry *geom);

	/**
	 * Adds the area defined by an array of
	 * coordinates.  The array must be a ring;
	 * i.e. end with the same coordinate as it starts with.
	 * @param ring an array of {@link Coordinate}s
	 */
	void add(const geom::CoordinateSequence *ring);

	// TODO: deprecate
	geom::Coordinate* getCentroid() const;

	/// Return false if a centroid couldn't be computed ( empty polygon )
	bool getCentroid(geom::Coordinate& ret) const;

private:

	/// the point all triangles are based at
	geom::Coordinate basePt;

	// temporary variable to hold centroid of triangle
	geom::Coordinate triangleCent3;

	/// Partial area sum 
	double areasum2;       

	/// partial centroid sum
	geom::Coordinate cg3;

	// data for linear centroid computation, if needed
	geom::Coordinate centSum;
	double totalLength;

	void setBasePoint(const geom::Coordinate &newbasePt);

	void add(const geom::Polygon *poly);

	void addShell(const geom::CoordinateSequence *pts);

	void addHole(const geom::CoordinateSequence *pts);
	
	void addTriangle(const geom::Coordinate &p0, const geom::Coordinate &p1,
			const geom::Coordinate &p2,bool isPositiveArea);

	static void centroid3(const geom::Coordinate &p1, const geom::Coordinate &p2,
			const geom::Coordinate &p3, geom::Coordinate &c);

	static double area2(const geom::Coordinate &p1, const geom::Coordinate &p2,
			const geom::Coordinate &p3);

	/**
	 * Adds the linear segments defined by an array of coordinates
	 * to the linear centroid accumulators.
	 *
	 * This is done in case the polygon(s) have zero-area,
	 * in which case the linear centroid is computed instead.
	 *
	 * @param pts an array of {@link Coordinate}s
	 */
	void addLinearSegments(const geom::CoordinateSequence& pts);

};

} // namespace geos::algorithm
} // namespace geos


#endif // GEOS_ALGORITHM_CENTROIDAREA_H
