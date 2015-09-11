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
 * Last port: linearref/LinearGeometryBuilder.java rev. 1.1
 *
 **********************************************************************/

#ifndef GEOS_LINEARREF_LINEARGEOMETRYBUILDER_H
#define GEOS_LINEARREF_LINEARGEOMETRYBUILDER_H

#include <geos/geom/Coordinate.h>
#include <geos/geom/CoordinateList.h>
#include <geos/geom/Geometry.h>
#include <geos/geom/GeometryFactory.h>
#include <geos/linearref/LinearLocation.h>

#include <vector>

namespace geos
{
namespace linearref   // geos::linearref
{

/**
 * Builds a linear geometry ({@link LineString} or {@link MultiLineString})
 * incrementally (point-by-point).
 *
 * @version 1.7
 */
class LinearGeometryBuilder
{
private:
	const geom::GeometryFactory* geomFact;

	typedef std::vector<geom::Geometry *> GeomPtrVect;

	// Geometry elements owned by this class
	GeomPtrVect lines;

	bool ignoreInvalidLines;
	bool fixInvalidLines;
	geom::CoordinateSequence* coordList;

	geom::Coordinate lastPt;

public:
	LinearGeometryBuilder(const geom::GeometryFactory* geomFact);

	~LinearGeometryBuilder();

	/**
	 * Allows invalid lines to be ignored rather than causing Exceptions.
	 * An invalid line is one which has only one unique point.
	 *
	 * @param ignoreShortLines <code>true</code> if short lines are
	 *                         to be ignored
	 */
	void setIgnoreInvalidLines(bool ignoreInvalidLines);

	/**
	 * Allows invalid lines to be ignored rather than causing Exceptions.
	 * An invalid line is one which has only one unique point.
	 *
	 * @param ignoreShortLines <code>true</code> if short lines are
	 *                         to be ignored
	 */
	void setFixInvalidLines(bool fixInvalidLines);

	/**
	 * Adds a point to the current line.
	 *
	 * @param pt the Coordinate to add
	 */
	void add(const geom::Coordinate& pt);

	/**
	 * Adds a point to the current line.
	 *
	 * @param pt the Coordinate to add
	 */
	void add(const geom::Coordinate& pt, bool allowRepeatedPoints);

	/// NOTE strk: why return by value ?
	geom::Coordinate getLastCoordinate() const;

	/// Terminate the current LineString.
	void endLine();

	geom::Geometry *getGeometry();
};

} // namespace geos.linearref
} // namespace geos

#endif
