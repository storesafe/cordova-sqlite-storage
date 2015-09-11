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

#ifndef GEOS_GEOM_UTIL_COMPONENTCOORDINATEEXTRACTER_H
#define GEOS_GEOM_UTIL_COMPONENTCOORDINATEEXTRACTER_H

#include <vector>

#include <geos/geom/GeometryComponentFilter.h>
#include <geos/geom/Geometry.h> // to be removed when we have the .inl
#include <geos/geom/Coordinate.h> // to be removed when we have the .inl
#include <geos/geom/LineString.h> // to be removed when we have the .inl
#include <geos/geom/Point.h> // to be removed when we have the .inl
//#include <geos/platform.h>

namespace geos {
namespace geom { // geos::geom
namespace util { // geos::geom::util

/** \brief
 * Extracts a single representative {@link Coordinate} 
 * from each connected component of a {@link Geometry}.
 *
 * @version 1.9
 */
class ComponentCoordinateExtracter : public GeometryComponentFilter 
{
public:
	/**
	 * Push the linear components from a single geometry into
	 * the provided vector.
	 * If more than one geometry is to be processed, it is more
	 * efficient to create a single ComponentCoordinateFilter instance
	 * and pass it to multiple geometries.
	 */
	static void getCoordinates(const Geometry &geom, std::vector<const Coordinate*> &ret)
	{
		ComponentCoordinateExtracter cce(ret);
		geom.apply_ro(&cce);
	}

	/**
	 * Constructs a ComponentCoordinateFilter with a list in which
	 * to store Coordinates found.
	 */
	ComponentCoordinateExtracter( std::vector<const Coordinate*> &newComps)
		:
		comps(newComps)
		{}

	void filter_rw( Geometry * geom)
	{
		if (	geom->getGeometryTypeId() == geos::geom::GEOS_LINEARRING 
			||	geom->getGeometryTypeId() == geos::geom::GEOS_LINESTRING
			||	geom->getGeometryTypeId() == geos::geom::GEOS_POINT ) 
			comps.push_back( geom->getCoordinate() );
		//if (	typeid( *geom ) == typeid( LineString )
		//	||	typeid( *geom ) == typeid( Point ) )
		//if ( const Coordinate *ls=dynamic_cast<const Coordinate *>(geom) )
		//	comps.push_back(ls);
	}

	void filter_ro( const Geometry * geom)
	{
		//if (	typeid( *geom ) == typeid( LineString )
		//	||	typeid( *geom ) == typeid( Point ) )
		if (	geom->getGeometryTypeId() == geos::geom::GEOS_LINEARRING 
			||	geom->getGeometryTypeId() == geos::geom::GEOS_LINESTRING
			||	geom->getGeometryTypeId() == geos::geom::GEOS_POINT ) 
			comps.push_back( geom->getCoordinate() );
		//if ( const Coordinate *ls=dynamic_cast<const Coordinate *>(geom) )
		//	comps.push_back(ls);
	}

private:

	Coordinate::ConstVect &comps;

    // Declare type as noncopyable
    ComponentCoordinateExtracter(const ComponentCoordinateExtracter& other);
    ComponentCoordinateExtracter& operator=(const ComponentCoordinateExtracter& rhs);
};

} // namespace geos.geom.util
} // namespace geos.geom
} // namespace geos

#endif //GEOS_GEOM_UTIL_COMPONENTCOORDINATEEXTRACTER_H
