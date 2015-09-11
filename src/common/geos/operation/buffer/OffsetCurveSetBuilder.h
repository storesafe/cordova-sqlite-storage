/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2011 Sandro Santilli <strk@keybit.net>
 * Copyright (C) 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: operation/buffer/OffsetCurveSetBuilder.java r378 (JTS-1.12)
 *
 **********************************************************************/

#ifndef GEOS_OP_BUFFER_OFFSETCURVESETBUILDER_H
#define GEOS_OP_BUFFER_OFFSETCURVESETBUILDER_H

#include <geos/export.h>

#include <vector>

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
	namespace geom {
		class Geometry;
		class CoordinateSequence;
		class GeometryCollection;
		class Point;
		class LineString;
		class LinearRing;
		class Polygon;
	}
	namespace geomgraph {
		class Label;
	}
	namespace noding {
		class SegmentString;
	}
	namespace operation {
		namespace buffer {
			class OffsetCurveBuilder;
		}
	}
}

namespace geos {
namespace operation { // geos.operation
namespace buffer { // geos.operation.buffer

/**
 * \class OffsetCurveSetBuilder opBuffer.h geos/opBuffer.h
 *
 * \brief
 * Creates all the raw offset curves for a buffer of a Geometry.
 *
 * Raw curves need to be noded together and polygonized to form the
 * final buffer area.
 *
 */
class GEOS_DLL OffsetCurveSetBuilder {

private:

	// To keep track of newly-created Labels.
	// Labels will be relesed by object dtor
	std::vector<geomgraph::Label*> newLabels;

	const geom::Geometry& inputGeom;

	double distance;

	OffsetCurveBuilder& curveBuilder;

	/// The raw offset curves computed.
	/// This class holds ownership of std::vector elements.
	///
	std::vector<noding::SegmentString*> curveList;

	/**
	 * Creates a noding::SegmentString for a coordinate list which is a raw
	 * offset curve, and adds it to the list of buffer curves.
	 * The noding::SegmentString is tagged with a geomgraph::Label
	 * giving the topology of the curve.
	 * The curve may be oriented in either direction.
	 * If the curve is oriented CW, the locations will be:
	 * - Left: Location.EXTERIOR
	 * - Right: Location.INTERIOR
	 *
	 * @param coord is raw offset curve, ownership transferred here
	 */
	void addCurve(geom::CoordinateSequence *coord, int leftLoc,
			int rightLoc);

	void add(const geom::Geometry& g);

	void addCollection(const geom::GeometryCollection *gc);

	/**
	 * Add a Point to the graph.
	 */
	void addPoint(const geom::Point *p);

	void addLineString(const geom::LineString *line);

	void addPolygon(const geom::Polygon *p);

	/**
	 * Add an offset curve for a polygon ring.
	 * The side and left and right topological location arguments
	 * assume that the ring is oriented CW.
	 * If the ring is in the opposite orientation,
	 * the left and right locations must be interchanged and the side
	 * flipped.
	 *
	 * @param coord the coordinates of the ring (must not contain
	 * repeated points)
	 * @param offsetDistance the distance at which to create the buffer
	 * @param side the side of the ring on which to construct the buffer
	 *             line
	 * @param cwLeftLoc the location on the L side of the ring
	 *                  (if it is CW)
	 * @param cwRightLoc the location on the R side of the ring
	 *                   (if it is CW)
	 */
	void addPolygonRing(const geom::CoordinateSequence *coord,
			double offsetDistance, int side, int cwLeftLoc,
			int cwRightLoc);

	/**
	 * The ringCoord is assumed to contain no repeated points.
	 * It may be degenerate (i.e. contain only 1, 2, or 3 points).
	 * In this case it has no area, and hence has a minimum diameter of 0.
	 *
	 * @param ring
	 * @param offsetDistance
	 * @return
	 */
	bool isErodedCompletely(const geom::LinearRing* ringCoord,
      double bufferDistance);

	/**
	 * Tests whether a triangular ring would be eroded completely by
	 * the given buffer distance.
	 * This is a precise test.  It uses the fact that the inner buffer
	 * of a triangle converges on the inCentre of the triangle (the
	 * point equidistant from all sides).  If the buffer distance is
	 * greater than the distance of the inCentre from a side, the
	 * triangle will be eroded completely.
	 *
	 * This test is important, since it removes a problematic case where
	 * the buffer distance is slightly larger than the inCentre distance.
	 * In this case the triangle buffer curve "inverts" with incorrect
	 * topology, producing an incorrect hole in the buffer.
	 *
	 * @param triCoord
	 * @param bufferDistance
	 * @return
	 */
	bool isTriangleErodedCompletely(const geom::CoordinateSequence *triCoords,
			double bufferDistance);

    // Declare type as noncopyable
    OffsetCurveSetBuilder(const OffsetCurveSetBuilder& other);
    OffsetCurveSetBuilder& operator=(const OffsetCurveSetBuilder& rhs);

public:

	/// Constructor
	OffsetCurveSetBuilder(const geom::Geometry& newInputGeom,
		double newDistance, OffsetCurveBuilder& newCurveBuilder);

	/// Destructor
	~OffsetCurveSetBuilder();

	/** \brief
	 * Computes the set of raw offset curves for the buffer.
	 *
	 * Each offset curve has an attached {@link geomgraph::Label} indicating
	 * its left and right location.
	 *
	 * @return a Collection of SegmentStrings representing the raw
	 * buffer curves
	 */
	std::vector<noding::SegmentString*>& getCurves();

	/// Add raw curves for a set of CoordinateSequences
	//
	/// @param lineList is a list of CoordinateSequence, ownership
	///        of which is transferred here.
	///
	void addCurves(const std::vector<geom::CoordinateSequence*>& lineList,
		int leftLoc, int rightLoc);

};

} // namespace geos::operation::buffer
} // namespace geos::operation
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // ndef GEOS_OP_BUFFER_OFFSETCURVESETBUILDER_H

