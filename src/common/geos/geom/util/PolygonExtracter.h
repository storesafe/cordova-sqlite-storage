/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 * Copyright (C) 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************/

#ifndef GEOS_GEOM_UTIL_POLYGONEXTRACTER_H
#define GEOS_GEOM_UTIL_POLYGONEXTRACTER_H

#include <geos/export.h>
#include <geos/geom/GeometryFilter.h>
#include <geos/geom/Polygon.h>
#include <geos/platform.h>
#include <vector>

namespace geos {
namespace geom { // geos.geom
namespace util { // geos.geom.util

/**
 * Extracts all the 2-dimensional (Polygon) components from a Geometry.
 */
class GEOS_DLL PolygonExtracter: public GeometryFilter {

public:

	/**
	 * Pushes the Polygon components from a single geometry into
	 * the provided vector.
	 * If more than one geometry is to be processed, it is more
	 * efficient to create a single PolygonExtracterFilter instance
	 * and pass it to multiple geometries.
	 */
	static void getPolygons(const Geometry &geom, std::vector<const Polygon*>& ret)
	{
		PolygonExtracter pe(ret);
		geom.apply_ro(&pe);
	}

	/**
	 * Constructs a PolygonExtracterFilter with a list in which
	 * to store Polygons found.
	 */
	PolygonExtracter(std::vector<const Polygon*>& newComps)
		:
		comps(newComps)
		{}

	void filter_rw(Geometry *geom) {
		if ( const Polygon *p=dynamic_cast<const Polygon *>(geom) )
		{
			comps.push_back(p);
		}
	}

	void filter_ro(const Geometry *geom)
	{
		if ( const Polygon *p=dynamic_cast<const Polygon *>(geom) )
		{
			comps.push_back(p);
		}
	}

private:

    /// Reference to provided vector
    std::vector<const Polygon*>& comps;

    // Declare type as noncopyable
    PolygonExtracter(const PolygonExtracter& other);
    PolygonExtracter& operator=(const PolygonExtracter& rhs);
};

} // namespace geos.geom.util
} // namespace geos.geom
} // namespace geos

#endif
