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
 **********************************************************************
 *
 * Last port: geomgraph/Position.java rev. 1.4 (JTS-1.10)
 *
 **********************************************************************/


#ifndef GEOS_GEOMGRAPH_POSITION_H
#define GEOS_GEOMGRAPH_POSITION_H

#include <geos/export.h>
#include <map>
#include <vector>
#include <string>

#include <geos/inline.h>


namespace geos {
namespace geomgraph { // geos.geomgraph

class GEOS_DLL Position {
public:
	enum {
		/*
		 * An indicator that a Location is <i>on</i>
		 * a GraphComponent
		 */
		ON=0,

		/*
		 * An indicator that a Location is to the
		 * <i>left</i> of a GraphComponent
		 */  
		LEFT,

		/*
		 * An indicator that a Location is to the
		 * <i>right</i> of a GraphComponent
		 */  
		RIGHT
	};

	/**
	 * Returns LEFT if the position is RIGHT, RIGHT if
	 * the position is LEFT, or the position otherwise.
	 */
	static int opposite(int position);
};

} // namespace geos.geomgraph
} // namespace geos

#endif // ifndef GEOS_GEOMGRAPH_POSITION_H

