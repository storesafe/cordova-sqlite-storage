/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 *
 **********************************************************************/

#ifndef GEOS_GEOM_PREP_SEGMENTINTERSECTIONDETECTOR_H
#define GEOS_GEOM_PREP_SEGMENTINTERSECTIONDETECTOR_H

#include <geos/noding/SegmentIntersector.h>
#include <geos/algorithm/LineIntersector.h>
#include <geos/geom/Coordinate.h>
#include <geos/geom/CoordinateSequence.h>
#include <geos/noding/SegmentString.h>

using namespace geos::algorithm;

namespace geos {
namespace noding { // geos::noding

/** \brief
 * Detects and records an intersection between two {@link SegmentString}s,
 * if one exists.  
 *
 * This strategy can be configured to search for proper intersections.
 * In this case, the presence of any intersection will still be recorded,
 * but searching will continue until either a proper intersection has been found
 * or no intersections are detected.
 *
 * Only a single intersection is recorded.
 *
 * @version 1.7
 */
class SegmentIntersectionDetector : public SegmentIntersector 
{
private:
	LineIntersector * li;

	bool findProper;
	bool findAllTypes;

	bool _hasIntersection;
	bool _hasProperIntersection;
	bool _hasNonProperIntersection;

	const geom::Coordinate * intPt;
	geom::CoordinateSequence * intSegments;

protected:
public:
	SegmentIntersectionDetector( LineIntersector * li) 
		:
		li( li),
		findProper(false),
		findAllTypes(false),
		_hasIntersection(false),
		_hasProperIntersection(false),
		_hasNonProperIntersection(false),
		intPt( NULL),
		intSegments( NULL)
	{ }

	~SegmentIntersectionDetector()
	{
		//delete intPt;
		delete intSegments;
	}


	void setFindProper( bool findProper)
	{
		this->findProper = findProper;
	}
  
	void setFindAllIntersectionTypes( bool findAllTypes)
	{
		this->findAllTypes = findAllTypes;
	}
  
	/**
	 * Tests whether an intersection was found.
	 * 
	 * @return true if an intersection was found
	 */
	bool hasIntersection() const
	{ 
		return _hasIntersection; 
	}
  
	/**
	 * Tests whether a proper intersection was found.
	 * 
	 * @return true if a proper intersection was found
	 */
	bool hasProperIntersection() const 
	{ 
		return _hasProperIntersection; 
	}
  
	/**
	 * Tests whether a non-proper intersection was found.
	 * 
	 * @return true if a non-proper intersection was found
	 */
	bool hasNonProperIntersection() const
	{ 
		return _hasNonProperIntersection; 
	}
  
	/**
	* Gets the computed location of the intersection.
	* Due to round-off, the location may not be exact.
	* 
	* @return the coordinate for the intersection location
	*/
	const geom::Coordinate * const getIntersection()  const
	{    
		return intPt;  
	}


	/**
	 * Gets the endpoints of the intersecting segments.
	 * 
	 * @return an array of the segment endpoints (p00, p01, p10, p11)
	 */
	const geom::CoordinateSequence * getIntersectionSegments() const
	{
		return intSegments;
	}
  
	bool isDone() const
	{ 
		// If finding all types, we can stop
		// when both possible types have been found.
		if (findAllTypes)
			return _hasProperIntersection && _hasNonProperIntersection;

		// If searching for a proper intersection, only stop if one is found
		if (findProper)
			return _hasProperIntersection;

		return _hasIntersection;
	}

	/**
	 * This method is called by clients
	 * of the {@link SegmentIntersector} class to process
	 * intersections for two segments of the {@link SegmentStrings} being intersected.
	 * Note that some clients (such as {@link MonotoneChain}s) may optimize away
	 * this call for segment pairs which they have determined do not intersect
	 * (e.g. by an disjoint envelope test).
	 */
	void processIntersections(	noding::SegmentString * e0, int segIndex0,
								noding::SegmentString * e1, int segIndex1 );
  
};

} // namespace geos::noding
} // namespace geos

#endif // GEOS_GEOM_PREP_SEGMENTINTERSECTIONDETECTOR_H
