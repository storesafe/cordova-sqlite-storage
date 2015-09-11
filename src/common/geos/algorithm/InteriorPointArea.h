/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2013 Sandro Santilli <strk@keybit.net>
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
 * Last port: algorithm/InteriorPointArea.java r728 (JTS-1.13+)
 *
 **********************************************************************/

#ifndef GEOS_ALGORITHM_INTERIORPOINTAREA_H
#define GEOS_ALGORITHM_INTERIORPOINTAREA_H

#include <geos/export.h>
#include <geos/geom/Coordinate.h>

// Forward declarations
namespace geos {
	namespace geom {
		class Geometry;
		class LineString;
		class GeometryFactory;
		class GeometryCollection;
	}
}


namespace geos {
namespace algorithm { // geos::algorithm

/** \brief
 * Computes a point in the interior of an areal geometry.
 *
 * <h2>Algorithm</h2>
 * <ul>
 *   <li>Find a Y value which is close to the centre of
 *       the geometry's vertical extent but is different
 *       to any of it's Y ordinates.
 *   <li>Create a horizontal bisector line using the Y value
 *       and the geometry's horizontal extent
 *   <li>Find the intersection between the geometry
 *       and the horizontal bisector line.
 *       The intersection is a collection of lines and points.
 *   <li>Pick the midpoint of the largest intersection geometry
 * </ul>
 *
 * <b>
 * Note: If a fixed precision model is used,
 * in some cases this method may return a point
 * which does not lie in the interior.
 * </b>
 */
class GEOS_DLL InteriorPointArea {

private:

	bool foundInterior;

	const geom::GeometryFactory *factory;

	geom::Coordinate interiorPoint;

	double maxWidth;

	void add(const geom::Geometry *geom);

	const geom::Geometry *widestGeometry(const geom::Geometry *geometry);

	const geom::Geometry *widestGeometry(const geom::GeometryCollection *gc);

	geom::LineString *horizontalBisector(const geom::Geometry *geometry);

public:

	/**
	 * Creates a new interior point finder
	 * for an areal geometry.
	 *
	 * @param g an areal geometry
	 */
	InteriorPointArea(const geom::Geometry *g);

	~InteriorPointArea();

	/**
	 * Gets the computed interior point.
	 *
	 * @return the coordinate of an interior point
	 */
	bool getInteriorPoint(geom::Coordinate& ret) const;

private:

	/** \brief
	 * Finds an interior point of a Polygon
	 *
	 * @param geometry the geometry to analyze
	 * @return the midpoint of the largest intersection between the geometry and
	 * a line halfway down its envelope
	 */
	void addPolygon(const geom::Geometry *geometry);

};

} // namespace geos::algorithm
} // namespace geos

#endif // GEOS_ALGORITHM_INTERIORPOINTAREA_H

