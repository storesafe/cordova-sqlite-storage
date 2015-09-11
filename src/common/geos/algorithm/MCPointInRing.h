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

#ifndef GEOS_ALGORITHM_MCPOINTINRING_H
#define GEOS_ALGORITHM_MCPOINTINRING_H

#include <geos/export.h>
#include <geos/index/chain/MonotoneChainSelectAction.h> // for inheritance
#include <geos/algorithm/PointInRing.h> // for inheritance
#include <geos/geom/Coordinate.h> // for composition
#include <geos/index/bintree/Interval.h> // for composition

#include <vector>

// Forward declarations
namespace geos {
	namespace geom {
		class Coordinate;
		class LineSegment;
		class LinearRing;
		class CoordinateSequence;
		class CoordinateSequence;
	}
	namespace index {
		namespace bintree {
			class Bintree;
			class Interval;
		}
		namespace chain {
			class MonotoneChain;
		}
	}
}

namespace geos {
namespace algorithm { // geos::algorithm

class GEOS_DLL MCPointInRing: public PointInRing {
public:
	MCPointInRing(const geom::LinearRing *newRing);
	~MCPointInRing();
	bool isInside(const geom::Coordinate& pt);

	void testLineSegment(const geom::Coordinate& p,
	                        const geom::LineSegment& seg);

	class MCSelecter: public index::chain::MonotoneChainSelectAction {
	using MonotoneChainSelectAction::select;
	private:
		geom::Coordinate p;
		MCPointInRing *parent;
	public:
		MCSelecter(const geom::Coordinate& newP, MCPointInRing *prt);
		void select(const geom::LineSegment& ls);
	};

private:
	const geom::LinearRing *ring;
	index::bintree::Interval interval;
	geom::CoordinateSequence *pts;
	index::bintree::Bintree *tree;
	int crossings;  // number of segment/ray crossings
	void buildIndex();
	void testMonotoneChain(geom::Envelope *rayEnv,
			MCSelecter *mcSelecter,
			index::chain::MonotoneChain *mc);
};

} // namespace geos::algorithm
} // namespace geos

#endif // GEOS_ALGORITHM_MCPOINTINRING_H

