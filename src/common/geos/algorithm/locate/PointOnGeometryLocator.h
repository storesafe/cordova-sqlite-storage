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
 *
 **********************************************************************/

#ifndef GEOS_ALGORITHM_LOCATE_POINTONGEOMETRYLOCATOR_H
#define GEOS_ALGORITHM_LOCATE_POINTONGEOMETRYLOCATOR_H

namespace geos {
	namespace geom {
		class Coordinate; 
	}
}

namespace geos {
namespace algorithm { // geos::algorithm
namespace locate { // geos::algorithm::locate

/** \brief
 * An interface for classes which determine the {@link Location} of
 * points in {@link Polygon} or {@link MultiPolygon} geometries.
 * 
 * @author Martin Davis
 */
class PointOnGeometryLocator
{
private:
protected:
public:
	virtual ~PointOnGeometryLocator() 
	{ }

	/**
	 * Determines the {@link Location} of a point in an areal {@link Geometry}.
	 * 
	 * @param p the point to test
	 * @return the location of the point in the geometry  
	 */
	virtual int locate( const geom::Coordinate * /*const*/ p) =0;
};

} // geos::algorithm::locate
} // geos::algorithm
} // geos

#endif // GEOS_ALGORITHM_LOCATE_POINTONGEOMETRYLOCATOR_H
