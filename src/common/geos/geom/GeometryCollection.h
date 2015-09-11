/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
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
 * Last port: geom/GeometryCollection.java rev. 1.41
 *
 **********************************************************************/

#ifndef GEOS_GEOS_GEOMETRYCOLLECTION_H
#define GEOS_GEOS_GEOMETRYCOLLECTION_H

#include <geos/export.h>
#include <geos/geom/Geometry.h> // for inheritance
//#include <geos/platform.h>
#include <geos/geom/Envelope.h> // for proper use of auto_ptr<>
#include <geos/geom/Dimension.h> // for Dimension::DimensionType

#include <geos/inline.h>

#include <string>
#include <vector>
#include <memory> // for auto_ptr

// Forward declarations
namespace geos {
	namespace geom { // geos::geom
		class Coordinate;
		class CoordinateArraySequence;
		class CoordinateSequenceFilter;
	}
}

namespace geos {
namespace geom { // geos::geom

/**
 * \class GeometryCollection geom.h geos.h
 *
 * \brief Represents a collection of heterogeneous Geometry objects.
 *
 * Collections of Geometry of the same type are 
 * represented by GeometryCollection subclasses MultiPoint,
 * MultiLineString, MultiPolygon.
 */
class GEOS_DLL GeometryCollection : public virtual Geometry {

public:
	friend class GeometryFactory;

	typedef std::vector<Geometry *>::const_iterator const_iterator;

	typedef std::vector<Geometry *>::iterator iterator;

	const_iterator begin() const;

	const_iterator end() const;

	/**
	 * Creates and returns a full copy of this GeometryCollection object.
	 * (including all coordinates contained by it).
	 *
	 * @return a clone of this instance
	 */
	virtual Geometry *clone() const {
		return new GeometryCollection(*this);
	}

	virtual ~GeometryCollection();

	/**
	 * \brief
	 * Collects all coordinates of all subgeometries into a
	 * CoordinateSequence.
	 * 
	 * Note that the returned coordinates are copies, so
	 * you want be able to use them to modify the geometries
	 * in place. Also you'll need to delete the CoordinateSequence
	 * when finished using it.
	 * 
	 * @return the collected coordinates
	 *
	 */
	virtual CoordinateSequence* getCoordinates() const;

	virtual bool isEmpty() const;

	/**
	 * \brief
	 * Returns the maximum dimension of geometries in this collection
	 * (0=point, 1=line, 2=surface)
	 *
	 * @see Dimension::DimensionType
	 */
	virtual Dimension::DimensionType getDimension() const;

	/// Returns coordinate dimension.
	virtual int getCoordinateDimension() const;

	virtual Geometry* getBoundary() const;

	/**
	 * \brief
	 * Returns the maximum boundary dimension of geometries in
	 * this collection.
	 */
	virtual int getBoundaryDimension() const;

	virtual std::size_t getNumPoints() const;

	virtual std::string getGeometryType() const;

	virtual GeometryTypeId getGeometryTypeId() const;

	virtual bool equalsExact(const Geometry *other,
			double tolerance=0) const;

	virtual void apply_ro(CoordinateFilter *filter) const;

	virtual void apply_rw(const CoordinateFilter *filter);

	virtual void apply_ro(GeometryFilter *filter) const;

	virtual void apply_rw(GeometryFilter *filter);

	virtual void apply_ro(GeometryComponentFilter *filter) const;

	virtual void apply_rw(GeometryComponentFilter *filter);

	virtual void apply_rw(CoordinateSequenceFilter& filter);

	virtual void apply_ro(CoordinateSequenceFilter& filter) const;

	virtual void normalize();

	virtual const Coordinate* getCoordinate() const;

	/// Returns the total area of this collection
	virtual double getArea() const;

	/// Returns the total length of this collection
	virtual double getLength() const;

	/// Returns the number of geometries in this collection
	virtual std::size_t getNumGeometries() const;

	/// Returns a pointer to the nth Geometry int this collection
	virtual const Geometry* getGeometryN(std::size_t n) const;

protected:

	GeometryCollection(const GeometryCollection &gc);

	/** \brief
	 * Construct a GeometryCollection with the given GeometryFactory.
	 * Will keep a reference to the factory, so don't
	 * delete it until al Geometry objects referring to
	 * it are deleted.
	 * Will take ownership of the Geometry vector.
	 *
	 * @param newGeoms
	 *	The <code>Geometry</code>s for this
	 *	<code>GeometryCollection</code>,
	 *	or <code>null</code> or an empty array to
	 *	create the empty geometry.
	 *	Elements may be empty <code>Geometry</code>s,
	 *	but not <code>null</code>s.
	 *
	 *	If construction succeed the created object will take
	 *	ownership of newGeoms vector and elements.
	 *
	 *	If construction	fails "IllegalArgumentException *"
	 *	is thrown and it is your responsibility to delete newGeoms
	 *	vector and content.
	 *
	 * @param newFactory the GeometryFactory used to create this geometry
	 */
	GeometryCollection(std::vector<Geometry *> *newGeoms, const GeometryFactory *newFactory);


	std::vector<Geometry *>* geometries;

	Envelope::AutoPtr computeEnvelopeInternal() const;

	int compareToSameClass(const Geometry *gc) const;

};

} // namespace geos::geom
} // namespace geos

#ifdef GEOS_INLINE
# include "geos/geom/GeometryCollection.inl"
#endif

#endif // ndef GEOS_GEOS_GEOMETRYCOLLECTION_H
