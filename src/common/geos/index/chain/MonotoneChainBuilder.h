/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: index/chain/MonotoneChainBuilder.java r388 (JTS-1.12)
 *
 **********************************************************************/

#ifndef GEOS_IDX_CHAIN_MONOTONECHAINBUILDER_H
#define GEOS_IDX_CHAIN_MONOTONECHAINBUILDER_H

#include <geos/export.h>
#include <vector>
#include <cstddef>

// Forward declarations
namespace geos {
	namespace geom {
		class CoordinateSequence;
	}
	namespace index { 
		namespace chain { 
			class MonotoneChain;
		}
	}
}

namespace geos {
namespace index { // geos::index
namespace chain { // geos::index::chain

/** \brief
 * Constructs {@link MonotoneChain}s
 * for sequences of {@link Coordinate}s.
 *
 * TODO: use vector<const Coordinate*> instead ?
 */
class GEOS_DLL MonotoneChainBuilder {

public:

	MonotoneChainBuilder(){}

	/** \brief
	 * Return a newly-allocated vector of newly-allocated
	 * MonotoneChain objects for the given CoordinateSequence.
	 * Remember to deep-delete the result.
	 */
	static std::vector<MonotoneChain*>* getChains(
			const geom::CoordinateSequence *pts,
			void* context);

	/** \brief
	 * Fill the provided vector with newly-allocated MonotoneChain objects
	 * for the given CoordinateSequence.
	 * Remember to delete vector elements!
	 */
	static void getChains(const geom::CoordinateSequence *pts,
			void* context,
			std::vector<MonotoneChain*>& mcList);

	static std::vector<MonotoneChain*>* getChains(const geom::CoordinateSequence *pts)
	{
		return getChains(pts, NULL);
	}

	/** \brief
	 * Fill the given vector with start/end indexes of the monotone chains
	 * for the given CoordinateSequence.
	 * The last entry in the array points to the end point of the point
	 * array,
	 * for use as a sentinel.
	 */
	static void getChainStartIndices(const geom::CoordinateSequence& pts,
			std::vector<std::size_t>& startIndexList);

private:

	/**
	 * Finds the index of the last point in a monotone chain
	 * starting at a given point.
	 * Any repeated points (0-length segments) will be included
	 * in the monotone chain returned.
	 *
	 * @return the index of the last point in the monotone chain
	 *         starting at <code>start</code>.
	 *
	 * NOTE: aborts if 'start' is >= pts.getSize()
	 */
	static std::size_t findChainEnd(const geom::CoordinateSequence& pts,
	                                                   std::size_t start);
};

} // namespace geos::index::chain
} // namespace geos::index
} // namespace geos

#endif // GEOS_IDX_CHAIN_MONOTONECHAINBUILDER_H

