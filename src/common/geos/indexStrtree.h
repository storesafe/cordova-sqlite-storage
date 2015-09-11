/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2006 Refractions Research Inc.
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************/

#ifndef GEOS_INDEXSTRTREE_H
#define GEOS_INDEXSTRTREE_H

namespace geos {
namespace index { // geos.index

/// Contains 2-D and 1-D versions of the Sort-Tile-Recursive (STR) tree, a query-only R-tree.
namespace strtree { // geos.index.strtree

} // namespace geos.index.strtree
} // namespace geos.index
} // namespace geos

#include <geos/index/strtree/AbstractNode.h>
#include <geos/index/strtree/AbstractSTRtree.h>
#include <geos/index/strtree/Boundable.h>
#include <geos/index/strtree/Interval.h>
//#include <geos/index/strtree/ItemBoundable.h>
#include <geos/index/strtree/SIRtree.h>
#include <geos/index/strtree/STRtree.h>

#endif // GEOS_INDEXSTRTREE_H
