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
 **********************************************************************/

#ifndef GEOS_INDEXCHAIN_H
#define GEOS_INDEXCHAIN_H

namespace geos {
namespace index { // geos.index

/// Contains classes that implement Monotone Chains
namespace chain { // geos.index.chain

} // namespace geos.index.chain
} // namespace geos.index
} // namespace geos

#include <geos/index/chain/MonotoneChain.h>
//#include <geos/index/chain/MonotoneChainBuilder.h>
#include <geos/index/chain/MonotoneChainOverlapAction.h>
#include <geos/index/chain/MonotoneChainSelectAction.h>

#endif

