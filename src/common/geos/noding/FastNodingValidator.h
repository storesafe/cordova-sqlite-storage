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
 * Last port: noding/FastNodingValidator.java rev. ??? (JTS-1.8)
 *
 **********************************************************************/

#ifndef GEOS_NODING_FASTNODINGVALIDATOR_H
#define GEOS_NODING_FASTNODINGVALIDATOR_H

#include <geos/noding/SingleInteriorIntersectionFinder.h> // for composition
#include <geos/algorithm/LineIntersector.h> // for composition

#include <memory>
#include <string>
#include <cassert>

// Forward declarations
namespace geos {
	namespace noding {
		class SegmentString;
	}
}

namespace geos {
namespace noding { // geos.noding

/** \brief
 * Validates that a collection of {@link SegmentString}s is correctly noded.
 *
 * Uses indexes to improve performance.
 * Does NOT check a-b-a collapse situations. 
 * Also does not check for endpt-interior vertex intersections.
 * This should not be a problem, since the noders should be
 * able to compute intersections between vertices correctly.
 * User may either test the valid condition, or request that a 
 * {@link TopologyException} 
 * be thrown.
 *
 * @version 1.7
 */
class FastNodingValidator 
{

public:

	FastNodingValidator(std::vector<noding::SegmentString*>& newSegStrings)
		:
		li(), // robust...
		segStrings(newSegStrings),
		segInt(),
		isValidVar(true)
	{
	}

	/**
	 * Checks for an intersection and 
	 * reports if one is found.
	 * 
	 * @return true if the arrangement contains an interior intersection
	 */
	bool isValid()
	{
		execute();
		return isValidVar;
	}
  
	/**
	 * Returns an error message indicating the segments containing
	 * the intersection.
	 * 
	 * @return an error message documenting the intersection location
	 */
	std::string getErrorMessage() const;
  
	/**
	 * Checks for an intersection and throws
	 * a TopologyException if one is found.
	 *
	 * @throws TopologyException if an intersection is found
	 */
	void checkValid();

private:

	geos::algorithm::LineIntersector li;

	std::vector<noding::SegmentString*>& segStrings;

	std::auto_ptr<SingleInteriorIntersectionFinder> segInt;

	bool isValidVar;
	
	void execute()
	{
		if (segInt.get() != NULL) return;
		checkInteriorIntersections();
	}

	void checkInteriorIntersections();
  
    // Declare type as noncopyable
    FastNodingValidator(const FastNodingValidator& other);
    FastNodingValidator& operator=(const FastNodingValidator& rhs);
};

} // namespace geos.noding
} // namespace geos

#endif // GEOS_NODING_FASTNODINGVALIDATOR_H
