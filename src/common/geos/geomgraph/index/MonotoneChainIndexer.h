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

#ifndef GEOS_GEOMGRAPH_INDEX_MONOTONECHAININDEXER_H
#define GEOS_GEOMGRAPH_INDEX_MONOTONECHAININDEXER_H

#include <geos/export.h>
#include <vector>

// Forward declarations
namespace geos {
	namespace geom {
		class CoordinateSequence;
	}
}

namespace geos {
namespace geomgraph { // geos::geomgraph
namespace index { // geos::geomgraph::index


class GEOS_DLL MonotoneChainIndexer{

public:

	MonotoneChainIndexer(){}

	void getChainStartIndices(const geom::CoordinateSequence*, std::vector<int>&);

private:

	int findChainEnd(const geom::CoordinateSequence* pts, int start);

};

} // namespace geos.geomgraph.index
} // namespace geos.geomgraph
} // namespace geos

#endif // GEOS_GEOMGRAPH_INDEX_MONOTONECHAININDEXER_H

