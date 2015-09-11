/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2009 Sandro Santilli <strk@keybit.net>
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: noding/BasicSegmentString.java rev. 1.1 (JTS-1.9)
 *
 **********************************************************************/

#ifndef GEOS_NODING_BASICSEGMENTSTRING_H
#define GEOS_NODING_BASICSEGMENTSTRING_H

#include <geos/export.h>
#include <geos/noding/SegmentString.h> // for inheritance
#include <geos/geom/CoordinateSequence.h> // for inlines (size())

#include <geos/inline.h>

#include <vector>

// Forward declarations
namespace geos {
	namespace algorithm {
		//class LineIntersector;
	}
}

namespace geos {
namespace noding { // geos.noding

/**
 * Represents a list of contiguous line segments,
 * and supports noding the segments.
 * The line segments are represented by an array of {@link Coordinate}s.
 * Intended to optimize the noding of contiguous segments by
 * reducing the number of allocated objects.
 * SegmentStrings can carry a context object, which is useful
 * for preserving topological or parentage information.
 * All noded substrings are initialized with the same context object.
 */
class GEOS_DLL BasicSegmentString : public SegmentString {

public:

	/// Construct a BasicSegmentString.
	//
	/// @param newPts CoordinateSequence representing the string,
	///                externally owned
	/// @param newContext the context associated to this SegmentString
	///
	BasicSegmentString(geom::CoordinateSequence *newPts,
			const void* newContext)
		:
		SegmentString(newContext),
		pts(newPts)
	{}

	virtual ~BasicSegmentString()
	{}

	/// see dox in SegmentString.h
	virtual unsigned int size() const
	{
		return pts->size();
	}

	/// see dox in SegmentString.h
	virtual const geom::Coordinate& getCoordinate(unsigned int i) const;

	/// see dox in SegmentString.h
	virtual geom::CoordinateSequence* getCoordinates() const;

	/// see dox in SegmentString.h
	virtual bool isClosed() const;

	/// see dox in SegmentString.h
	virtual std::ostream& print(std::ostream& os) const;

	/** \brief
	 * Gets the octant of the segment starting at vertex index.
	 *
	 * @param index the index of the vertex starting the segment. 
	 *        Must not be the last index in the vertex list
	 * @return the octant of the segment at the vertex
	 */
	int getSegmentOctant(unsigned int index) const;

private:

	geom::CoordinateSequence *pts;

};

} // namespace geos.noding
} // namespace geos

#endif // ndef GEOS_NODING_BASICSEGMENTSTRING_H

