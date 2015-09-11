/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2011 Sandro Santilli <strk@keybit.net>
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 * Copyright (C) 2005 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: geom/MultiPoint.java r320 (JTS-1.12)
 *
 **********************************************************************/

#ifndef GEOS_GEOS_MULTIPOINT_H
#define GEOS_GEOS_MULTIPOINT_H

#include <geos/export.h>
#include <geos/platform.h>
#include <geos/geom/GeometryCollection.h> // for inheritance
#include <geos/geom/Puntal.h> // for inheritance
#include <geos/geom/Dimension.h> // for Dimension::DimensionType

#include <geos/inline.h>

#include <string>
#include <vector>

namespace geos {
	namespace geom { // geos::geom
		class Coordinate;
		class CoordinateArraySequence;
	}
}

namespace geos {
namespace geom { // geos::geom

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable:4250) // T1 inherits T2 via dominance
#endif

/**
 * Models a collection of Point objects.
 *
 * Any collection of Points is a valid MultiPoint.
 */
class GEOS_DLL MultiPoint: public GeometryCollection, public Puntal
{

public:

	friend class GeometryFactory;

	virtual ~MultiPoint();

	/// Returns point dimension (0)
	Dimension::DimensionType getDimension() const;

	/// Returns Dimension::False (Point has no boundary)
	int getBoundaryDimension() const;

	/** \brief
	 * Gets the boundary of this geometry.
	 *
	 * Zero-dimensional geometries have no boundary by definition,
	 * so an empty GeometryCollection is returned.
	 *
	 * @return an empty GeometryCollection
	 * @see Geometry#getBoundary
	 */
	Geometry* getBoundary() const;

	std::string getGeometryType() const;

	virtual GeometryTypeId getGeometryTypeId() const;

	bool equalsExact(const Geometry *other, double tolerance=0) const;

	Geometry *clone() const { return new MultiPoint(*this); }

protected:

	/**
	 * \brief Constructs a <code>MultiPoint</code>.
	 *
	 * @param  newPoints
	 *	the <code>Point</code>s for this <code>MultiPoint</code>,
	 *	or <code>null</code> or an empty array to create the empty
	 * 	geometry.
	 *	Elements may be empty <code>Point</code>s,
	 *	but not <code>null</code>s.
	 *
	 *	Constructed object will take ownership of
	 *	the vector and its elements.
	 *
	 * @param newFactory
	 * 	The GeometryFactory used to create this geometry
	 *	Caller must keep the factory alive for the life-time
	 *	of the constructed MultiPoint.
	 */
	MultiPoint(std::vector<Geometry *> *newPoints, const GeometryFactory *newFactory);

	MultiPoint(const MultiPoint &mp): Geometry(mp), GeometryCollection(mp) {}

	const Coordinate* getCoordinateN(int n) const;
};

#ifdef _MSC_VER
#pragma warning(pop)
#endif

} // namespace geos::geom
} // namespace geos

#endif // ndef GEOS_GEOS_MULTIPOINT_H
