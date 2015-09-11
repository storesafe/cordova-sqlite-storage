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
 * Last port: geom/prep/PreparedLineString.java rev 1.3 (JTS-1.10)
 *
 **********************************************************************/

#ifndef GEOS_GEOM_PREP_PREPAREDLINESTRING_H
#define GEOS_GEOM_PREP_PREPAREDLINESTRING_H

#include <geos/geom/prep/BasicPreparedGeometry.h> // for inheritance
#include <geos/noding/SegmentString.h> 

namespace geos {
	namespace noding {
		class FastSegmentSetIntersectionFinder;
	}
}

namespace geos {
namespace geom { // geos::geom
namespace prep { // geos::geom::prep

/**
 * \brief
 * A prepared version of {@link LinearRing}, {@link LineString} or {@link MultiLineString} geometries.
 * 
 * @author mbdavis
 *
 */
class PreparedLineString : public BasicPreparedGeometry 
{
private:
	noding::FastSegmentSetIntersectionFinder * segIntFinder;
	mutable noding::SegmentString::ConstVect segStrings;

protected:
public:
	PreparedLineString(const Geometry * geom) 
		: 
		BasicPreparedGeometry( geom),
		segIntFinder( NULL)
	{ }

	~PreparedLineString();

	noding::FastSegmentSetIntersectionFinder * getIntersectionFinder();

	bool intersects(const geom::Geometry * g) const;

};

} // namespace geos::geom::prep
} // namespace geos::geom
} // namespace geos

#endif // GEOS_GEOM_PREP_PREPAREDLINESTRING_H
