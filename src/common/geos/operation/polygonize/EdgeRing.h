/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2006 Refractions Research Inc.
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: operation/polygonize/EdgeRing.java rev. 109/138 (JTS-1.10)
 *
 **********************************************************************/


#ifndef GEOS_OP_POLYGONIZE_EDGERING_H
#define GEOS_OP_POLYGONIZE_EDGERING_H

#include <geos/export.h>

#include <vector>

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
	namespace geom { 
		class LineString;
		class LinearRing;
		class Polygon;
		class CoordinateSequence;
		class Geometry;
		class GeometryFactory;
		class Coordinate;
	}
	namespace planargraph { 
		class DirectedEdge;
	}
}

namespace geos {
namespace operation { // geos::operation
namespace polygonize { // geos::operation::polygonize

/**\brief
 * Represents a ring of PolygonizeDirectedEdge which form
 * a ring of a polygon.  The ring may be either an outer shell or a hole.
 */
class GEOS_DLL EdgeRing {
private:
	const geom::GeometryFactory *factory; 

	typedef std::vector<const planargraph::DirectedEdge*> DeList;
	DeList deList;

	// cache the following data for efficiency
	geom::LinearRing *ring;
	geom::CoordinateSequence *ringPts;

	typedef std::vector<geom::Geometry*> GeomVect;
	GeomVect *holes;

	/** \brief
	 * Computes the list of coordinates which are contained in this ring.
	 * The coordinatea are computed once only and cached.
	 *
	 * @return an array of the Coordinate in this ring
	 */
	geom::CoordinateSequence* getCoordinates();

	static void addEdge(const geom::CoordinateSequence *coords,
			bool isForward,
			geom::CoordinateSequence *coordList);

public:
	/**
	 * \brief
	 * Find the innermost enclosing shell EdgeRing
	 * containing the argument EdgeRing, if any.
	 *
	 * The innermost enclosing ring is the <i>smallest</i> enclosing ring.
	 * The algorithm used depends on the fact that:
	 * 
	 * ring A contains ring B iff envelope(ring A) contains envelope(ring B)
	 *
	 * This routine is only safe to use if the chosen point of the hole
	 * is known to be properly contained in a shell
	 * (which is guaranteed to be the case if the hole does not touch
	 * its shell)
	 *
	 * @return containing EdgeRing, if there is one
	 * @return null if no containing EdgeRing is found
	 */
	static EdgeRing* findEdgeRingContaining(
			EdgeRing *testEr,
			std::vector<EdgeRing*> *shellList);

	/**
	 * \brief
	 * Finds a point in a list of points which is not contained in
	 * another list of points.
	 *
	 * @param testPts the CoordinateSequence to test
	 * @param pts the CoordinateSequence to test the input points against
	 * @return a Coordinate reference from <code>testPts</code> which is
	 * not in <code>pts</code>, or <code>Coordinate::nullCoord</code>
	 */
	static const geom::Coordinate& ptNotInList(
			const geom::CoordinateSequence *testPts,
			const geom::CoordinateSequence *pts);

	/** \brief
	 * Tests whether a given point is in an array of points.
	 * Uses a value-based test.
	 *
	 * @param pt a Coordinate for the test point
	 * @param pts an array of Coordinate to test
	 * @return <code>true</code> if the point is in the array
	 */
	static bool isInList(const geom::Coordinate &pt,
			const geom::CoordinateSequence *pts);

	EdgeRing(const geom::GeometryFactory *newFactory);

	~EdgeRing();

	/** \brief
	 * Adds a DirectedEdge which is known to form part of this ring.
	 *
	 * @param de the DirectedEdge to add. Ownership to the caller.
	 */
	void add(const planargraph::DirectedEdge *de);

	/** \brief
	 * Tests whether this ring is a hole.
	 *
	 * Due to the way the edges in the polyongization graph are linked,
	 * a ring is a hole if it is oriented counter-clockwise.
	 * @return <code>true</code> if this ring is a hole
	 */
	bool isHole();

	/** \brief
	 * Adds a hole to the polygon formed by this ring.
	 *
	 * @param hole the LinearRing forming the hole.
	 */
	void addHole(geom::LinearRing *hole);

	/** \brief
	 * Computes the Polygon formed by this ring and any contained holes.
	 *
	 * LinearRings ownership is transferred to returned polygon.
	 * Subsequent calls to the function will return NULL.
	 *
	 * @return the Polygon formed by this ring and its holes.
	 */
	geom::Polygon* getPolygon();

	/** \brief
	 * Tests if the LinearRing ring formed by this edge ring
	 * is topologically valid.
	 */
	bool isValid();

	/** \brief
	 * Gets the coordinates for this ring as a LineString.
	 *
	 * Used to return the coordinates in this ring
	 * as a valid geometry, when it has been detected that the ring
	 * is topologically invalid.
	 * @return a LineString containing the coordinates in this ring
	 */
	geom::LineString* getLineString();

	/** \brief
	 * Returns this ring as a LinearRing, or null if an Exception
	 * occurs while creating it (such as a topology problem).
	 *
	 * Ownership of ring is retained by the object.
	 * Details of problems are written to standard output.
	 */
	geom::LinearRing* getRingInternal();

	/** \brief
	 * Returns this ring as a LinearRing, or null if an Exception
	 * occurs while creating it (such as a topology problem).
	 *
	 * Details of problems are written to standard output.
	 * Caller gets ownership of ring.
	 */
	geom::LinearRing* getRingOwnership();
};

} // namespace geos::operation::polygonize
} // namespace geos::operation
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // GEOS_OP_POLYGONIZE_EDGERING_H
