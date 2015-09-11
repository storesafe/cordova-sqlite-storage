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

#ifndef GEOS_ALGORITHM_SIRTREEPOINTINRING_H
#define GEOS_ALGORITHM_SIRTREEPOINTINRING_H

#include <geos/export.h>
#include <geos/algorithm/PointInRing.h> // for inheritance

#include <vector>

// Forward declarations
namespace geos {
	namespace geom {
		class Coordinate;
		class LineSegment;
		class LinearRing;
	}
	namespace index {
		namespace strtree {
			class SIRtree;
		}
	}
}


namespace geos {
namespace algorithm { // geos::algorithm

class GEOS_DLL SIRtreePointInRing: public PointInRing {
private:
	geom::LinearRing *ring;
	index::strtree::SIRtree *sirTree;
	int crossings;  // number of segment/ray crossings
	void buildIndex();
	void testLineSegment(const geom::Coordinate& p,
			geom::LineSegment *seg);
public:
	SIRtreePointInRing(geom::LinearRing *newRing);
	bool isInside(const geom::Coordinate& pt);
};

} // namespace geos::algorithm
} // namespace geos


#endif // GEOS_ALGORITHM_SIRTREEPOINTINRING_H

