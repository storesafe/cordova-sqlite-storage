/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2006      Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: noding/IntersectionAdder.java rev. 1.6 (JTS-1.9)
 *
 **********************************************************************/

#ifndef GEOS_NODING_INTERSECTIONADDER_H
#define GEOS_NODING_INTERSECTIONADDER_H

#include <geos/export.h>

#include <vector>
#include <iostream>
#include <cstdlib> // for abs()

#include <geos/inline.h>

#include <geos/geom/Coordinate.h>
#include <geos/noding/SegmentIntersector.h> // for inheritance

// Forward declarations
namespace geos {
	namespace geom {
		class Coordinate;
	}
	namespace noding {
		class SegmentString;
	}
	namespace algorithm {
		class LineIntersector;
	}
}

namespace geos {
namespace noding { // geos.noding

/**
 * Computes the intersections between two line segments in SegmentString
 * and adds them to each string.
 * The {@link SegmentIntersector} is passed to a {@link Noder}.
 * The {@link addIntersections} method is called whenever the {@link Noder}
 * detects that two SegmentStrings <i>might</i> intersect.
 * This class is an example of the <i>Strategy</i> pattern.
 *
 */
class GEOS_DLL IntersectionAdder: public SegmentIntersector {

private:

	/**
	 * These variables keep track of what types of intersections were
	 * found during ALL edges that have been intersected.
	 */
	bool hasIntersectionVar;
	bool hasProper;
	bool hasProperInterior;
	bool hasInterior;

	// the proper intersection point found
	const geom::Coordinate* properIntersectionPoint;

	algorithm::LineIntersector& li;
	bool isSelfIntersection;
	//bool intersectionFound;

	/**
	 * A trivial intersection is an apparent self-intersection which
	 * in fact is simply the point shared by adjacent line segments.
	 * Note that closed edges require a special check for the point
	 * shared by the beginning and end segments.
	 */
	bool isTrivialIntersection(const SegmentString* e0, int segIndex0,
			const SegmentString* e1, int segIndex1);
 
    // Declare type as noncopyable
    IntersectionAdder(const IntersectionAdder& other);
    IntersectionAdder& operator=(const IntersectionAdder& rhs);

public:

	int numIntersections;
	int numInteriorIntersections;
	int numProperIntersections;

	// testing only
	int numTests;

	IntersectionAdder(algorithm::LineIntersector& newLi)
		:
		hasIntersectionVar(false),
		hasProper(false),
		hasProperInterior(false),
		hasInterior(false),
		properIntersectionPoint(NULL),
		li(newLi),
		numIntersections(0),
		numInteriorIntersections(0),
		numProperIntersections(0),
		numTests(0)
	{}

	algorithm::LineIntersector& getLineIntersector() { return li; }

	/**
	 * @return the proper intersection point, or <code>NULL</code>
	 *         if none was found
	 */
	const geom::Coordinate* getProperIntersectionPoint()  {
		return properIntersectionPoint;
	}

	bool hasIntersection() { return hasIntersectionVar; }

	/**
	 * A proper intersection is an intersection which is interior to
	 * at least two line segments.  Note that a proper intersection
	 * is not necessarily in the interior of the entire Geometry,
	 * since another edge may have an endpoint equal to the intersection,
	 * which according to SFS semantics can result in the point being
	 * on the Boundary of the Geometry.
	 */
	bool hasProperIntersection() { return hasProper; }

	/**
	 * A proper interior intersection is a proper intersection which is
	 * <b>not</b> contained in the set of boundary nodes set for this
	 * SegmentIntersector.
	 */
	bool hasProperInteriorIntersection() { return hasProperInterior; }

	/**
	 * An interior intersection is an intersection which is
	 * in the interior of some segment.
	 */
	bool hasInteriorIntersection() { return hasInterior; }


	/**
	 * This method is called by clients
	 * of the {@link SegmentIntersector} class to process
	 * intersections for two segments of the SegmentStrings being
	 * intersected.
	 * Note that some clients (such as MonotoneChains) may optimize away
	 * this call for segment pairs which they have determined do not
	 * intersect (e.g. by an disjoint envelope test).
	 */
	void processIntersections(
		SegmentString* e0,  int segIndex0,
		SegmentString* e1,  int segIndex1);

 
	static bool isAdjacentSegments(int i1, int i2) {
		return std::abs(i1 - i2) == 1;
	}

	/**
	 * Always process all intersections
	 *
	 * @return false always
	 */
	virtual bool isDone() const {
		return false;
	}
};
 

} // namespace geos.noding
} // namespace geos

#endif // GEOS_NODING_INTERSECTIONADDER_H
