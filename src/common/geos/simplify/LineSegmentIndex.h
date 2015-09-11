/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: simplify/LineSegmentIndex.java rev. 1.1 (JTS-1.7.1)
 *
 **********************************************************************
 *
 * NOTES
 *
 **********************************************************************/

#ifndef GEOS_SIMPLIFY_LINESEGMENTINDEX_H
#define GEOS_SIMPLIFY_LINESEGMENTINDEX_H

#include <geos/export.h>
#include <vector>
#include <memory> // for auto_ptr

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
	namespace geom {
		class Envelope;
		class LineSegment;
	}
	namespace simplify {
		class TaggedLineString;
	}
	namespace index {
		namespace quadtree {
			class Quadtree;
		}
	}
}

namespace geos {
namespace simplify { // geos::simplify

class GEOS_DLL LineSegmentIndex {

public:

	LineSegmentIndex();

	~LineSegmentIndex();

	void add(const TaggedLineString& line);

	void add(const geom::LineSegment* seg);

	void remove(const geom::LineSegment* seg);

	std::auto_ptr< std::vector<geom::LineSegment*> >
			query(const geom::LineSegment* seg) const;

private:

	std::auto_ptr<index::quadtree::Quadtree> index;

	std::vector<geom::Envelope*> newEnvelopes;
	
	// Copying is turned off
	LineSegmentIndex(const LineSegmentIndex&);
	LineSegmentIndex& operator=(const LineSegmentIndex&);
};

} // namespace geos::simplify
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // GEOS_SIMPLIFY_LINESEGMENTINDEX_H
