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
 **********************************************************************
 *
 * Last port: geom/prep/PreparedPolygon.java rev 1.7 (JTS-1.10)
 *
 **********************************************************************/

#ifndef GEOS_GEOM_PREP_PREPAREDPOLYGON_H
#define GEOS_GEOM_PREP_PREPAREDPOLYGON_H

#include <geos/geom/prep/BasicPreparedGeometry.h> // for inheritance
#include <geos/noding/SegmentString.h> 

namespace geos {
	namespace noding {
		class FastSegmentSetIntersectionFinder;
	}
	namespace algorithm {
		namespace locate {
			class PointOnGeometryLocator;
		}
	}
}

namespace geos {
namespace geom { // geos::geom
namespace prep { // geos::geom::prep

/**
 * \brief
 * A prepared version of {@link Polygon} or {@link MultiPolygon} geometries.
 * 
 * @author mbdavis
 *
 */
class PreparedPolygon : public BasicPreparedGeometry 
{
private:
	bool isRectangle;
	mutable noding::FastSegmentSetIntersectionFinder * segIntFinder;
	mutable algorithm::locate::PointOnGeometryLocator * ptOnGeomLoc;
	mutable noding::SegmentString::ConstVect segStrings;

protected:
public:
	PreparedPolygon( const geom::Geometry * geom);
	~PreparedPolygon( );
  
	noding::FastSegmentSetIntersectionFinder * getIntersectionFinder() const;
	algorithm::locate::PointOnGeometryLocator * getPointLocator() const;
	
	bool contains( const geom::Geometry* g) const;
	bool containsProperly( const geom::Geometry* g) const;
	bool covers( const geom::Geometry* g) const;
	bool intersects( const geom::Geometry* g) const;

};

} // namespace geos::geom::prep
} // namespace geos::geom
} // namespace geos

#endif // GEOS_GEOM_PREP_PREPAREDPOLYGON_H
