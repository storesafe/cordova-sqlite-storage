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
 **********************************************************************
 *
 * Last port: noding/FastSegmentSetIntersectionFinder.java r388 (JTS-1.12)
 *
 **********************************************************************/

#ifndef GEOS_NODING_FASTSEGMENTSETINTERSECTIONFINDER_H
#define GEOS_NODING_FASTSEGMENTSETINTERSECTIONFINDER_H

#include <geos/noding/SegmentString.h>
#include <geos/noding/MCIndexSegmentSetMutualIntersector.h>


//forward declarations
namespace geos {
	namespace noding { 
		class SegmentIntersectionDetector;
		class SegmentSetMutualIntersector;
		//class MCIndexSegmentSetMutualIntersector : public SegmentSetMutualIntersector;
	}
}


namespace geos {
namespace noding { // geos::noding

/** \brief
 * Finds if two sets of {@link SegmentStrings}s intersect.
 *
 * Uses indexing for fast performance and to optimize repeated tests
 * against a target set of lines.
 * Short-circuited to return as soon an intersection is found.
 *
 * @version 1.7
 */
class FastSegmentSetIntersectionFinder
{
private:
	MCIndexSegmentSetMutualIntersector * segSetMutInt; 
	geos::algorithm::LineIntersector * lineIntersector;

protected:
public:
	FastSegmentSetIntersectionFinder( SegmentString::ConstVect * baseSegStrings);

	~FastSegmentSetIntersectionFinder();
	
	/**
	 * Gets the segment set intersector used by this class.
	 * This allows other uses of the same underlying indexed structure.
	 * 
	 * @return the segment set intersector used
	 */
	SegmentSetMutualIntersector * getSegmentSetIntersector()
	{
		return segSetMutInt;
	}

	bool intersects( SegmentString::ConstVect * segStrings);
	bool intersects( SegmentString::ConstVect * segStrings, SegmentIntersectionDetector * intDetector);

};

} // geos::noding
} // geos

#endif // GEOS_NODING_FASTSEGMENTSETINTERSECTIONFINDER_H

