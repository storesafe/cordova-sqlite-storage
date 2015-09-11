/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2011 Sandro Santilli <strk@keybit.net>
 * Copyright (C) 2006 Refractions Research Inc.
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 *
 **********************************************************************
 *
 * Last port: noding/NodedSegmentString.java r320 (JTS-1.12)
 *
 **********************************************************************/

#ifndef GEOS_NODING_NODEDSEGMENTSTRING_H
#define GEOS_NODING_NODEDSEGMENTSTRING_H

#include <geos/export.h>
#include <geos/noding/NodableSegmentString.h> // for inheritance
#include <geos/geom/CoordinateSequence.h> // for inlines
#include <geos/algorithm/LineIntersector.h>
#include <geos/noding/SegmentNode.h>
#include <geos/noding/SegmentNodeList.h>
#include <geos/noding/SegmentString.h>
//#include <geos/noding/Octant.h>
#include <geos/geom/Coordinate.h>

#include <cstddef>

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251 4355) // warning C4355: 'this' : used in base member initializer list
#endif

namespace geos {
namespace noding { // geos::noding

/** \brief
 * Represents a list of contiguous line segments,
 * and supports noding the segments.
 *
 * The line segments are represented by an array of {@link Coordinate}s.
 * Intended to optimize the noding of contiguous segments by
 * reducing the number of allocated objects.
 * SegmentStrings can carry a context object, which is useful
 * for preserving topological or parentage information.
 * All noded substrings are initialized with the same context object.
 *
 */
class GEOS_DLL NodedSegmentString : public NodableSegmentString 
{
public:

    // TODO: provide a templated method using an output iterator
    template <class II>
    static void getNodedSubstrings(II from, II too_far, 
        SegmentString::NonConstVect* resultEdgelist)
    {
        for (II i=from; i != too_far; ++i)
        {
            NodedSegmentString * nss = dynamic_cast<NodedSegmentString*>(*i);
            assert(nss);
            nss->getNodeList().addSplitEdges(resultEdgelist);
        }
    }

    template <class C>
    static void getNodedSubstrings(C *segStrings,
        SegmentString::NonConstVect* resultEdgelist)
    {
        getNodedSubstrings(segStrings->begin(), segStrings->end(), resultEdgelist);
    }

	static void getNodedSubstrings(const SegmentString::NonConstVect& segStrings,
			SegmentString::NonConstVect* resultEdgeList);

	/// Returns allocated object
	static SegmentString::NonConstVect* getNodedSubstrings(
			const SegmentString::NonConstVect& segStrings);


	/**
	 * Creates a new segment string from a list of vertices.
	 *
	 * @param newPts CoordinateSequence representing the string,
	 *               ownership transferred.
	 *
	 * @param data the user-defined data of this segment string
	 *             (may be null)
	 */
    NodedSegmentString(geom::CoordinateSequence *newPts, const void* newContext)
        : NodableSegmentString(newContext)
        , nodeList(this)
        , pts(newPts)
    {}

	~NodedSegmentString()
	{
		delete pts;
	}

	/**
	 * Adds an intersection node for a given point and segment to this segment string.
	 * If an intersection already exists for this exact location, the existing
	 * node will be returned.
	 * 
	 * @param intPt the location of the intersection
	 * @param segmentIndex the index of the segment containing the intersection
	 * @return the intersection node for the point
	 */
	SegmentNode* addIntersectionNode( geom::Coordinate * intPt, std::size_t segmentIndex) 
	{
		std::size_t normalizedSegmentIndex = segmentIndex;

		// normalize the intersection point location
		std::size_t nextSegIndex = normalizedSegmentIndex + 1;
		if (nextSegIndex < size()) 
		{
			geom::Coordinate const& nextPt = 
                getCoordinate(static_cast<unsigned int>(nextSegIndex));

			// Normalize segment index if intPt falls on vertex
			// The check for point equality is 2D only - Z values are ignored
			if ( intPt->equals2D( nextPt )) 
			{
				normalizedSegmentIndex = nextSegIndex;
			}
		}

		// Add the intersection point to edge intersection list.
		SegmentNode * ei = getNodeList().add( *intPt, normalizedSegmentIndex);
		return ei;
	}

	SegmentNodeList& getNodeList();

	const SegmentNodeList& getNodeList() const;

	virtual unsigned int size() const
	{
		return static_cast<unsigned int>(pts->size());
	}

	virtual const geom::Coordinate& getCoordinate(unsigned int i) const;

	virtual geom::CoordinateSequence* getCoordinates() const;

	virtual bool isClosed() const;

	virtual std::ostream& print(std::ostream& os) const;


	/** \brief
	 * Gets the octant of the segment starting at vertex index.
	 *
	 * @param index the index of the vertex starting the segment. 
	 *        Must not be the last index in the vertex list
	 * @return the octant of the segment at the vertex
	 */
	int getSegmentOctant(unsigned int index) const;

	/** \brief
	 * Add {SegmentNode}s for one or both
	 * intersections found for a segment of an edge to the edge
	 * intersection list.
	 */
	void addIntersections(algorithm::LineIntersector *li,
			unsigned int segmentIndex, int geomIndex);

	/** \brief
	 * Add an SegmentNode for intersection intIndex.
	 *
	 * An intersection that falls exactly on a vertex
	 * of the SegmentString is normalized
	 * to use the higher of the two possible segmentIndexes
	 */
	void addIntersection(algorithm::LineIntersector *li,
			unsigned int segmentIndex,
			int geomIndex, int intIndex);

	/** \brief
	 * Add an SegmentNode for intersection intIndex.
	 *
	 * An intersection that falls exactly on a vertex of the
	 * edge is normalized
	 * to use the higher of the two possible segmentIndexes
	 */
	void addIntersection(const geom::Coordinate& intPt,
			unsigned int segmentIndex);


private:

	SegmentNodeList nodeList;

	geom::CoordinateSequence *pts;

	static int safeOctant(const geom::Coordinate& p0, const geom::Coordinate& p1);

};

} // namespace geos::noding
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // GEOS_NODING_NODEDSEGMENTSTRING_H
