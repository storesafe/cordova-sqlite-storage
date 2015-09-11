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
 **********************************************************************
 *
 * Last port: operation/distance/ConnectedElementLocationFilter.java rev. 1.4 (JTS-1.10)
 *
 **********************************************************************/

#ifndef GEOS_OP_DISTANCE_CONNECTEDELEMENTLOCATIONFILTER_H
#define GEOS_OP_DISTANCE_CONNECTEDELEMENTLOCATIONFILTER_H

#include <geos/export.h>

#include <geos/geom/GeometryFilter.h> // for inheritance

#include <vector>

// Forward declarations
namespace geos {
	namespace geom { 
		class Geometry;
	}
	namespace operation { 
		namespace distance {
			class GeometryLocation;
		}
	}
}


namespace geos {
namespace operation { // geos::operation
namespace distance { // geos::operation::distance

/** \brief
 * A ConnectedElementPointFilter extracts a single point
 * from each connected element in a Geometry
 * (e.g. a polygon, linestring or point)
 * and returns them in a list. The elements of the list are 
 * DistanceOp::GeometryLocation.
 */
class GEOS_DLL ConnectedElementLocationFilter: public geom::GeometryFilter {
private:

	std::vector<GeometryLocation*> *locations;

public:
	/**
	 * Returns a list containing a point from each Polygon, LineString, and Point
	 * found inside the specified geometry. Thus, if the specified geometry is
	 * not a GeometryCollection, an empty list will be returned. The elements of the list 
	 * are {@link com.vividsolutions.jts.operation.distance.GeometryLocation}s.
	 */  
	static std::vector<GeometryLocation*>* getLocations(const geom::Geometry *geom);

	ConnectedElementLocationFilter(std::vector<GeometryLocation*> *newLocations)
		:
		locations(newLocations)
	{}

	void filter_ro(const geom::Geometry *geom);
	void filter_rw(geom::Geometry *geom);
};


} // namespace geos::operation::distance
} // namespace geos::operation
} // namespace geos

#endif // GEOS_OP_DISTANCE_CONNECTEDELEMENTLOCATIONFILTER_H

