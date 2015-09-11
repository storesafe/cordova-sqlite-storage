/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2011 Sandro Santilli <strk@keybit.net>
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
 * Last port: linearref/LinearLocation.java r463
 *
 **********************************************************************/

#ifndef GEOS_LINEARREF_LINEARLOCATION_H
#define GEOS_LINEARREF_LINEARLOCATION_H

#include <string>
#include <memory> // for std::auto_ptr

#include <geos/geom/Coordinate.h>
#include <geos/geom/Geometry.h>
#include <geos/geom/LineSegment.h>

namespace geos {
namespace linearref { // geos::linearref


/** \brief
 * Represents a location along a {@link LineString} or {@link MultiLineString}.
 *
 * The referenced geometry is not maintained within
 * this location, but must be provided for operations which require it.
 * Various methods are provided to manipulate the location value
 * and query the geometry it references.
 */
class LinearLocation
{
private:
	unsigned int componentIndex;
	unsigned int segmentIndex;
	double segmentFraction;

	/**
	 * Ensures the individual values are locally valid.
	 * Does <b>not</b> ensure that the indexes are valid for
	 * a particular linear geometry.
	 *
	 * @see clamp
	 */
	void normalize();

public:
	/**
	 * Gets a location which refers to the end of a linear {@link Geometry}.
	 * @param linear the linear geometry
	 * @return a new <tt>LinearLocation</tt>
	 */
	static LinearLocation getEndLocation(const geom::Geometry* linear);

	/**
	 * Computes the {@link Coordinate} of a point a given fraction
	 * along the line segment <tt>(p0, p1)</tt>.
	 * If the fraction is greater than 1.0 the last
	 * point of the segment is returned.
	 * If the fraction is less than or equal to 0.0 the first point
	 * of the segment is returned.
	 * The Z ordinate is interpolated from the Z-ordinates of
	 * the given points, if they are specified.
	 *
	 * @param p0 the first point of the line segment
	 * @param p1 the last point of the line segment
	 * @param frac the length to the desired point
	 * @return the <tt>Coordinate</tt> of the desired point
	 */
	static geom::Coordinate pointAlongSegmentByFraction(const geom::Coordinate& p0, const geom::Coordinate& p1, double frac);


	/**
	 * Creates a location referring to the start of a linear geometry
	 */
	LinearLocation(unsigned int segmentIndex = 0, double segmentFraction = 0.0);

	LinearLocation(unsigned int componentIndex, unsigned int segmentIndex, double segmentFraction);

	/**
	 * Ensures the indexes are valid for a given linear {@link Geometry}.
	 *
	 * @param linear a linear geometry
	 */
	void clamp(const geom::Geometry* linear);

	/**
	 * Snaps the value of this location to
	 * the nearest vertex on the given linear {@link Geometry},
	 * if the vertex is closer than <tt>minDistance</tt>.
	 *
	 * @param linearGeom a linear geometry
	 * @param minDistance the minimum allowable distance to a vertex
	 */
	void snapToVertex(const geom::Geometry* linearGeom, double minDistance);

	/**
	 * Gets the length of the segment in the given
	 * Geometry containing this location.
	 *
	 * @param linearGeom a linear geometry
	 * @return the length of the segment
	 */
	double getSegmentLength(const geom::Geometry* linearGeom) const;

	/**
	 * Sets the value of this location to
	 * refer the end of a linear geometry
	 *
	 * @param linear the linear geometry to set
	 */
	void setToEnd(const geom::Geometry* linear);

	/**
	 * Gets the component index for this location.
	 *
	 * @return the component index
	 */
	unsigned int getComponentIndex() const;

	/**
	 * Gets the segment index for this location
	 *
	 * @return the segment index
	 */
	unsigned int getSegmentIndex() const;

	/**
	 * Gets the segment fraction for this location
	 *
	 * @return the segment fraction
	 */
	double getSegmentFraction() const;

	/**
	 * Tests whether this location refers to a vertex
	 *
	 * @return true if the location is a vertex
	 */
	bool isVertex() const;

	/**
	 * Gets the {@link Coordinate} along the
	 * given linear {@link Geometry} which is
	 * referenced by this location.
	 *
	 * @param linearGeom the linear geometry referenced by this location
	 * @return the <tt>Coordinate</tt> at the location
	 */
	geom::Coordinate getCoordinate(const geom::Geometry* linearGeom) const;

	/**
	 * Gets a {@link LineSegment} representing the segment of the
	 * given linear {@link Geometry} which contains this location.
	 *
	 * @param linearGeom a linear geometry
	 * @return the <tt>LineSegment</tt> containing the location
	 */
	std::auto_ptr<geom::LineSegment> getSegment(const geom::Geometry* linearGeom) const;

	/**
	 * Tests whether this location refers to a valid
	 * location on the given linear {@link Geometry}.
	 *
	 * @param linearGeom a linear geometry
	 * @return true if this location is valid
	 */
	bool isValid(const geom::Geometry* linearGeom) const;

	/**
	 *  Compares this object with the specified object for order.
	 *
	 *@param  o  the <code>LineStringLocation</code> with which this <code>Coordinate</code>
	 *      is being compared
	 *@return    a negative integer, zero, or a positive integer as this <code>LineStringLocation</code>
	 *      is less than, equal to, or greater than the specified <code>LineStringLocation</code>
	 */
	int compareTo(const LinearLocation& other) const;

	/**
	 *  Compares this object with the specified index values for order.
	 *
	 * @param componentIndex1 a component index
	 * @param segmentIndex1 a segment index
	 * @param segmentFraction1 a segment fraction
	 * @return    a negative integer, zero, or a positive integer as this <code>LineStringLocation</code>
	 *      is less than, equal to, or greater than the specified locationValues
	 */
	int compareLocationValues(unsigned int componentIndex1, unsigned int segmentIndex1, double segmentFraction1) const;

	/**
	 *  Compares two sets of location values for order.
	 *
	 * @param componentIndex0 a component index
	 * @param segmentIndex0 a segment index
	 * @param segmentFraction0 a segment fraction
	 * @param componentIndex1 another component index
	 * @param segmentIndex1 another segment index
	 * @param segmentFraction1 another segment fraction
	 *@return    a negative integer, zero, or a positive integer
	 *      as the first set of location values
	 *      is less than, equal to, or greater than the second set of locationValues
	 */
	static int compareLocationValues(
		unsigned int componentIndex0, unsigned int segmentIndex0, double segmentFraction0,
		unsigned int componentIndex1, unsigned int segmentIndex1, double segmentFraction1);

	/**
	 * Tests whether two locations
	 * are on the same segment in the parent {@link Geometry}.
	 *
	 * @param loc a location on the same geometry
	 * @return true if the locations are on the same segment of the parent geometry
	 */
	bool isOnSameSegment(const LinearLocation& loc) const;

	/**
	 * \brief
	 * Tests whether this location is an endpoint of
	 * the linear component it refers to.
	 *
	 * @param linearGeom the linear geometry referenced by this location
	 * @return true if the location is a component endpoint
	 */
	bool isEndpoint(const geom::Geometry& linearGeom) const;

	friend std::ostream& operator<< (std::ostream& out, const LinearLocation& obj );

};


} // namespace geos.linearref
} // namespace geos

#endif
