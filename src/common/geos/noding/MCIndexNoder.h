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
 * Last port: noding/MCIndexNoder.java rev. 1.6 (JTS-1.9)
 *
 **********************************************************************/

#ifndef GEOS_NODING_MCINDEXNODER_H
#define GEOS_NODING_MCINDEXNODER_H

#include <geos/export.h>

#include <geos/inline.h>

#include <geos/index/chain/MonotoneChainOverlapAction.h> // for inheritance
#include <geos/noding/SinglePassNoder.h> // for inheritance
#include <geos/index/strtree/STRtree.h> // for composition
#include <geos/util.h>

#include <vector>
#include <iostream>

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
	namespace geom {
		class LineSegment;
	}
	namespace noding {
		class SegmentString;
		class SegmentIntersector;
	}
}

namespace geos {
namespace noding { // geos.noding

/** \brief
 * Nodes a set of SegmentString using a index based
 * on index::chain::MonotoneChain and a index::SpatialIndex.
 *
 * The {@link SpatialIndex} used should be something that supports
 * envelope (range) queries efficiently (such as a index::quadtree::Quadtree
 * or index::strtree::STRtree.
 *
 * Last port: noding/MCIndexNoder.java rev. 1.4 (JTS-1.7)
 */
class GEOS_DLL MCIndexNoder : public SinglePassNoder {

private:
	std::vector<index::chain::MonotoneChain*> monoChains;
	index::strtree::STRtree index;
	int idCounter;
	std::vector<SegmentString*>* nodedSegStrings;
	// statistics
	int nOverlaps;

	void intersectChains();

	void add(SegmentString* segStr);

public:

	MCIndexNoder(SegmentIntersector *nSegInt=NULL)
		:
		SinglePassNoder(nSegInt),
		idCounter(0),
		nodedSegStrings(NULL),
		nOverlaps(0)
	{}

	~MCIndexNoder();

	/// Return a reference to this instance's std::vector of MonotoneChains
	std::vector<index::chain::MonotoneChain*>& getMonotoneChains() { return monoChains; }

	index::SpatialIndex& getIndex();

	std::vector<SegmentString*>* getNodedSubstrings() const;

	void computeNodes(std::vector<SegmentString*>* inputSegmentStrings);

	class SegmentOverlapAction : public index::chain::MonotoneChainOverlapAction {
	public:
		SegmentOverlapAction(SegmentIntersector& newSi)
			:
			index::chain::MonotoneChainOverlapAction(),
			si(newSi)
		{}

		void overlap(index::chain::MonotoneChain& mc1, std::size_t start1,
            index::chain::MonotoneChain& mc2, std::size_t start2);
    private:
        SegmentIntersector& si;

        // Declare type as noncopyable
        SegmentOverlapAction(const SegmentOverlapAction& other);
        SegmentOverlapAction& operator=(const SegmentOverlapAction& rhs);
	};
	
};

} // namespace geos.noding
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#ifdef GEOS_INLINE
# include <geos/noding/MCIndexNoder.inl>
#endif

#endif // GEOS_NODING_MCINDEXNODER_H
