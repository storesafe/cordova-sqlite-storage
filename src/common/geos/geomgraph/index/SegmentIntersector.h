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
 **********************************************************************/

#ifndef GEOS_GEOMGRAPH_INDEX_SEGMENTINTERSECTOR_H
#define GEOS_GEOMGRAPH_INDEX_SEGMENTINTERSECTOR_H

#include <geos/export.h>
#include <vector>

#include <geos/geom/Coordinate.h> // for composition

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
	namespace algorithm {
		class LineIntersector;
	}
	namespace geomgraph {
		class Node;
		class Edge;
	}
}

namespace geos {
namespace geomgraph { // geos::geomgraph
namespace index { // geos::geomgraph::index


class GEOS_DLL SegmentIntersector{

private:

	/**
	 * These variables keep track of what types of intersections were
	 * found during ALL edges that have been intersected.
	 */
	bool hasIntersectionVar;

	bool hasProper;

	bool hasProperInterior;

	// the proper intersection point found
	geom::Coordinate properIntersectionPoint;

	algorithm::LineIntersector *li;

	bool includeProper;

	bool recordIsolated;

	//bool isSelfIntersection;

	//bool intersectionFound;

	int numIntersections;

	/// Elements are externally owned
	std::vector<std::vector<Node*>*> bdyNodes;

	bool isTrivialIntersection(Edge *e0,int segIndex0,Edge *e1, int segIndex1);

	bool isBoundaryPoint(algorithm::LineIntersector *li,
			std::vector<std::vector<Node*>*>& tstBdyNodes);

	bool isBoundaryPoint(algorithm::LineIntersector *li,
			std::vector<Node*> *tstBdyNodes);

public:

	static bool isAdjacentSegments(int i1,int i2);

	// testing only
	int numTests;

	//SegmentIntersector();

	virtual ~SegmentIntersector() {}

	SegmentIntersector(algorithm::LineIntersector *newLi,
			bool newIncludeProper, bool newRecordIsolated)
		:
		hasIntersectionVar(false),
		hasProper(false),
		hasProperInterior(false),
		li(newLi),
		includeProper(newIncludeProper),
		recordIsolated(newRecordIsolated),
		numIntersections(0),
		bdyNodes(2),
		numTests(0)
	{}

	/// \brief
	/// Parameters are externally owned.
	/// Make sure they live for the whole lifetime of this object
	void setBoundaryNodes(std::vector<Node*> *bdyNodes0,
			std::vector<Node*> *bdyNodes1);

	geom::Coordinate& getProperIntersectionPoint();

	bool hasIntersection();

	bool hasProperIntersection();

	bool hasProperInteriorIntersection();

	void addIntersections(Edge *e0, int segIndex0, Edge *e1, int segIndex1);

};

} // namespace geos.geomgraph.index
} // namespace geos.geomgraph
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif

