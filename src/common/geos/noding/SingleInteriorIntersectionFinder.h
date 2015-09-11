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
 **********************************************************************/

#ifndef GEOS_NODING_SINGLEINTERIORINTERSECTIONFINDER_H
#define GEOS_NODING_SINGLEINTERIORINTERSECTIONFINDER_H

#include <geos/noding/SegmentIntersector.h> // for inheritance
#include <geos/geom/Coordinate.h> // for composition

#include <vector>

// Forward declarations
namespace geos {
	namespace algorithm {
		class LineIntersector;
	}
	namespace noding {
		class SegmentString;
	}
}

namespace geos {
namespace noding { // geos.noding

/**
 * \brief
 * Finds an interior intersection in a set of SegmentString,
 * if one exists.  Only the first intersection found is reported.
 *
 * @version 1.7
 */
class SingleInteriorIntersectionFinder: public SegmentIntersector
{

public:

	/** \brief
	 * Creates an intersection finder which finds an interior intersection
	 * if one exists
	 *
	 * @param li the LineIntersector to use
	 */
	SingleInteriorIntersectionFinder(algorithm::LineIntersector& newLi)
		:
		li(newLi),
		interiorIntersection(geom::Coordinate::getNull())
	{
	}

	/** \brief
	 * Tests whether an intersection was found.
	 * 
	 * @return true if an intersection was found
	 */
	bool hasIntersection() const
	{ 
		return !interiorIntersection.isNull(); 
	}
  
	/** \brief
	 * Gets the computed location of the intersection.
	 * Due to round-off, the location may not be exact.
	 * 
	 * @return the coordinate for the intersection location
	 */
	const geom::Coordinate& getInteriorIntersection() const
	{    
		return interiorIntersection;  
	}

	/** \brief
	 * Gets the endpoints of the intersecting segments.
	 * 
	 * @return an array of the segment endpoints (p00, p01, p10, p11)
	 */
	const std::vector<geom::Coordinate>& getIntersectionSegments() const
	{
		return intSegments;
	}
  
	/** \brief
	 * This method is called by clients
	 * of the {@link SegmentIntersector} class to process
	 * intersections for two segments of the {@link SegmentStrings} being intersected.
	 *
	 * Note that some clients (such as {@link MonotoneChain}s) may optimize away
	 * this call for segment pairs which they have determined do not intersect
	 * (e.g. by an disjoint envelope test).
	 */
	void processIntersections(
		SegmentString* e0,  int segIndex0,
		SegmentString* e1,  int segIndex1);
  
	bool isDone() const
	{ 
		return !interiorIntersection.isNull();
	}

private:
	algorithm::LineIntersector& li;
	geom::Coordinate interiorIntersection;
	std::vector<geom::Coordinate> intSegments;

    // Declare type as noncopyable
    SingleInteriorIntersectionFinder(const SingleInteriorIntersectionFinder& other);
    SingleInteriorIntersectionFinder& operator=(const SingleInteriorIntersectionFinder& rhs);
};

} // namespace geos.noding
} // namespace geos

#endif // GEOS_NODING_SINGLEINTERIORINTERSECTIONFINDER_H
