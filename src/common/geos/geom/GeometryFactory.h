/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2011 Sandro Santilli <strk@keybit.net>
 * Copyright (C) 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: geom/GeometryFactory.java r320 (JTS-1.12)
 *
 **********************************************************************/

#ifndef GEOS_GEOM_GEOMETRYFACTORY_H
#define GEOS_GEOM_GEOMETRYFACTORY_H

#include <geos/geom/Geometry.h>
#include <geos/geom/GeometryCollection.h>
#include <geos/geom/MultiPoint.h>
#include <geos/geom/MultiLineString.h>
#include <geos/geom/MultiPolygon.h>
#include <geos/export.h>
#include <geos/inline.h>

#include <vector>
#include <memory>
#include <cassert>

namespace geos {
	namespace geom { 
		class CoordinateSequenceFactory;
		class Coordinate;
		class CoordinateSequence;
		class Envelope;
		class Geometry;
		class GeometryCollection;
		class LineString;
		class LinearRing;
		class MultiLineString;
		class MultiPoint;
		class MultiPolygon;
		class Point;
		class Polygon;
		class PrecisionModel;
	}
}

namespace geos {
namespace geom { // geos::geom

/**
 * \brief
 * Supplies a set of utility methods for building Geometry objects
 * from CoordinateSequence or other Geometry objects.
 *
 * Note that the factory constructor methods do <b>not</b> change the input
 * coordinates in any way.
 * In particular, they are not rounded to the supplied <tt>PrecisionModel</tt>.
 * It is assumed that input Coordinates meet the given precision.
 */
class GEOS_DLL GeometryFactory {
public:
	/**
	 * \brief 
	 * Constructs a GeometryFactory that generates Geometries having a
	 * floating PrecisionModel and a spatial-reference ID of 0.
	 */
	GeometryFactory();

	/**
	 * \brief
	 * Constructs a GeometryFactory that generates Geometries having
	 * the given PrecisionModel, spatial-reference ID, and
	 * CoordinateSequence implementation.
	 *
	 * NOTES:
	 * (1) the given PrecisionModel is COPIED
	 * (2) the CoordinateSequenceFactory is NOT COPIED
	 *     and must be available for the whole lifetime
	 *     of the GeometryFactory
	 */
	GeometryFactory(const PrecisionModel *pm, int newSRID,
		CoordinateSequenceFactory *nCoordinateSequenceFactory);

	/**
	 * \brief
	 * Constructs a GeometryFactory that generates Geometries having the
	 * given CoordinateSequence implementation, a double-precision floating
	 * PrecisionModel and a spatial-reference ID of 0.
	 */
	GeometryFactory(CoordinateSequenceFactory *nCoordinateSequenceFactory);

	/**
	 * \brief
	 * Constructs a GeometryFactory that generates Geometries having
	 * the given PrecisionModel and the default CoordinateSequence
	 * implementation.
	 *
	 * @param pm the PrecisionModel to use
	 */
	GeometryFactory(const PrecisionModel *pm);

	/**
	 * \brief
	 * Constructs a GeometryFactory that generates Geometries having
	 * the given {@link PrecisionModel} and spatial-reference ID,
	 * and the default CoordinateSequence implementation.
	 *
	 * @param pm the PrecisionModel to use
	 * @param newSRID the SRID to use
	 */
	GeometryFactory(const PrecisionModel* pm, int newSRID);

	/**
	 * \brief Copy constructor
	 *
	 * @param gf the GeometryFactory to clone from
	 */
	GeometryFactory(const GeometryFactory &gf);

	/**
	 * \brief 
	 * Return a pointer to the default GeometryFactory.
	 * This is a global shared object instantiated
	 * using default constructor.
	 */
	static const GeometryFactory*
	getDefaultInstance();

	/// Destructor
	virtual ~GeometryFactory();

//Skipped a lot of list to array convertors

	Point* createPointFromInternalCoord(const Coordinate* coord,
			const Geometry *exemplar) const;

	/// Converts an Envelope to a Geometry.
	//
	/// Returned Geometry can be a Point, a Polygon or an EMPTY geom.
	///
	Geometry* toGeometry(const Envelope* envelope) const;

	/// \brief
	/// Returns the PrecisionModel that Geometries created by this
	/// factory will be associated with.
	const PrecisionModel* getPrecisionModel() const;

	/// Creates an EMPTY Point
	Point* createPoint() const;

	/// Creates a Point using the given Coordinate
	Point* createPoint(const Coordinate& coordinate) const;

	/// Creates a Point taking ownership of the given CoordinateSequence
	Point* createPoint(CoordinateSequence *coordinates) const;

	/// Creates a Point with a deep-copy of the given CoordinateSequence.
	Point* createPoint(const CoordinateSequence &coordinates) const;

	/// Construct an EMPTY GeometryCollection
	GeometryCollection* createGeometryCollection() const;

	/// Construct the EMPTY Geometry
	Geometry* createEmptyGeometry() const;

	/// Construct a GeometryCollection taking ownership of given arguments
	GeometryCollection* createGeometryCollection(
			std::vector<Geometry *> *newGeoms) const;

	/// Constructs a GeometryCollection with a deep-copy of args
	GeometryCollection* createGeometryCollection(
			const std::vector<Geometry *> &newGeoms) const;

	/// Construct an EMPTY MultiLineString 
	MultiLineString* createMultiLineString() const;

	/// Construct a MultiLineString taking ownership of given arguments
	MultiLineString* createMultiLineString(
			std::vector<Geometry *> *newLines) const;

	/// Construct a MultiLineString with a deep-copy of given arguments
	MultiLineString* createMultiLineString(
			const std::vector<Geometry *> &fromLines) const;

	/// Construct an EMPTY MultiPolygon 
	MultiPolygon* createMultiPolygon() const;

	/// Construct a MultiPolygon taking ownership of given arguments
	MultiPolygon* createMultiPolygon(std::vector<Geometry *> *newPolys) const;

	/// Construct a MultiPolygon with a deep-copy of given arguments
	MultiPolygon* createMultiPolygon(
			const std::vector<Geometry *> &fromPolys) const;

	/// Construct an EMPTY LinearRing 
	LinearRing* createLinearRing() const;

	/// Construct a LinearRing taking ownership of given arguments
	LinearRing* createLinearRing(CoordinateSequence* newCoords) const;

	std::auto_ptr<Geometry> createLinearRing(
			std::auto_ptr<CoordinateSequence> newCoords) const;

	/// Construct a LinearRing with a deep-copy of given arguments
	LinearRing* createLinearRing(
			const CoordinateSequence& coordinates) const;

	/// Constructs an EMPTY <code>MultiPoint</code>.
	MultiPoint* createMultiPoint() const;

	/// Construct a MultiPoint taking ownership of given arguments
	MultiPoint* createMultiPoint(std::vector<Geometry *> *newPoints) const;

	/// Construct a MultiPoint with a deep-copy of given arguments
	MultiPoint* createMultiPoint(
			const std::vector<Geometry *> &fromPoints) const;

	/// \brief
	/// Construct a MultiPoint containing a Point geometry
	/// for each Coordinate in the given list.
	MultiPoint* createMultiPoint(
			const CoordinateSequence &fromCoords) const;

	/// \brief
	/// Construct a MultiPoint containing a Point geometry
	/// for each Coordinate in the given vector.
	MultiPoint* createMultiPoint(
			const std::vector<Coordinate> &fromCoords) const;

	/// Construct an EMPTY Polygon 
	Polygon* createPolygon() const;

	/// Construct a Polygon taking ownership of given arguments
	Polygon* createPolygon(LinearRing *shell,
			std::vector<Geometry *> *holes) const;

	/// Construct a Polygon with a deep-copy of given arguments
	Polygon* createPolygon(const LinearRing &shell,
			const std::vector<Geometry *> &holes) const;

	/// Construct an EMPTY LineString 
	LineString* createLineString() const;

	/// Copy a LineString
	std::auto_ptr<LineString> createLineString(const LineString& ls) const;

	/// Construct a LineString taking ownership of given argument
	LineString* createLineString(CoordinateSequence* coordinates) const;

	std::auto_ptr<Geometry> createLineString(
			std::auto_ptr<CoordinateSequence> coordinates) const;

	/// Construct a LineString with a deep-copy of given argument
	LineString* createLineString(
			const CoordinateSequence& coordinates) const;

	/**
	 *  Build an appropriate <code>Geometry</code>, <code>MultiGeometry</code>, or
	 *  <code>GeometryCollection</code> to contain the <code>Geometry</code>s in
	 *  it.
	 *
	 *  For example:
	 *
	 *    - If <code>geomList</code> contains a single <code>Polygon</code>,
	 *      the <code>Polygon</code> is returned.
	 *    - If <code>geomList</code> contains several <code>Polygon</code>s, a
	 *      <code>MultiPolygon</code> is returned.
	 *    - If <code>geomList</code> contains some <code>Polygon</code>s and
	 *      some <code>LineString</code>s, a <code>GeometryCollection</code> is
	 *      returned.
	 *    - If <code>geomList</code> is empty, an empty
	 *      <code>GeometryCollection</code> is returned
	 *    .
	 *
	 * Note that this method does not "flatten" Geometries in the input,
	 * and hence if any MultiGeometries are contained in the input a
	 * GeometryCollection containing them will be returned.
	 *
	 * @param  newGeoms  the <code>Geometry</code>s to combine
	 *
	 * @return
	 *	A <code>Geometry</code> of the "smallest", "most type-specific"
	 *	class that can contain the elements of <code>geomList</code>.
	 *
	 * NOTE: the returned Geometry will take ownership of the
	 * 	given vector AND its elements 
	 */
	Geometry* buildGeometry(std::vector<Geometry *> *geoms) const;

  /// See buildGeometry(std::vector<Geometry *>&) for semantics
  //
  /// Will clone the geometries accessible trough the iterator.
  ///
  /// @tparam T an iterator yelding something which casts to const Geometry*
  /// @param from start iterator
  /// @param toofar end iterator
  ///
  template <class T>
	std::auto_ptr<Geometry> buildGeometry(T from, T toofar) const
  {
    bool isHeterogeneous = false;
    size_t count = 0;
    int geomClass = -1;
    for (T i=from; i != toofar; ++i)
    {
      ++count;
      const Geometry* g = *i;
      if ( geomClass < 0 ) {
        geomClass = g->getClassSortIndex();
      }
      else if ( geomClass != g->getClassSortIndex() ) {
        isHeterogeneous = true;
      }
    }

    // for the empty geometry, return an empty GeometryCollection
    if ( count == 0 ) {
      return std::auto_ptr<Geometry>( createGeometryCollection() );
    }

    // for the single geometry, return a clone
    if ( count == 1 ) {
      return std::auto_ptr<Geometry>( (*from)->clone() );
    }

    // Now we know it is a collection

    // FIXME:
    // Until we tweak all the createMulti* interfaces
    // to support taking iterators we'll have to build
    // a custom vector here.
    std::vector<Geometry*> fromGeoms;
    for (T i=from; i != toofar; ++i) {
      const Geometry* g = *i;
      fromGeoms.push_back(const_cast<Geometry*>(g));
    }
    

    // for an heterogeneous ...
    if ( isHeterogeneous ) {
      return std::auto_ptr<Geometry>( createGeometryCollection(fromGeoms) );
    }

    // At this point we know the collection is not hetereogenous.
    if ( dynamic_cast<const Polygon*>(*from) ) {
      return std::auto_ptr<Geometry>( createMultiPolygon(fromGeoms) );
    } else if ( dynamic_cast<const LineString*>(*from) ) {
      return std::auto_ptr<Geometry>( createMultiLineString(fromGeoms) );
    } else if ( dynamic_cast<const Point*>(*from) ) {
      return std::auto_ptr<Geometry>( createMultiPoint(fromGeoms) );
    }
    // FIXME: Why not to throw an exception? --mloskot
    assert(0); // buildGeomtry encountered an unkwnon geometry type
    return std::auto_ptr<Geometry>(); // nullptr
  }

	/** \brief
	 * This function does the same thing of the omonimouse function
	 * taking vector pointer instead of reference. 
	 *
	 * The difference is that this version will copy needed data
	 * leaving ownership to the caller.
	 */
	Geometry* buildGeometry(const std::vector<Geometry *> &geoms) const;
	
	int getSRID() const;

	/// \brief
	/// Returns the CoordinateSequenceFactory associated
	/// with this GeometryFactory
	const CoordinateSequenceFactory* getCoordinateSequenceFactory() const;

	/// Returns a clone of given Geometry.
	Geometry* createGeometry(const Geometry *g) const;

	/// Destroy a Geometry, or release it
	void destroyGeometry(Geometry *g) const;

private:
	const PrecisionModel* precisionModel;
	int SRID;
	const CoordinateSequenceFactory *coordinateListFactory;
};

} // namespace geos::geom
} // namespace geos

#ifdef GEOS_INLINE
# include "geos/geom/GeometryFactory.inl"
#endif

#endif // ndef GEOS_GEOM_GEOMETRYFACTORY_H
