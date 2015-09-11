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
 * Last port: geomgraph/EdgeIntersectionList.java r428 (JTS-1.12+)
 *
 **********************************************************************/


#ifndef GEOS_GEOMGRAPH_EDGEINTERSECTIONLIST_H
#define GEOS_GEOMGRAPH_EDGEINTERSECTIONLIST_H

#include <geos/export.h>
#include <vector>
#include <set>
#include <string>

#include <geos/geomgraph/EdgeIntersection.h> // for EdgeIntersectionLessThen
#include <geos/geom/Coordinate.h> // for CoordinateLessThen

#include <geos/inline.h>

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
	namespace geom {
		class Coordinate;
	}
	namespace geomgraph {
		class Edge;
	}
}

namespace geos {
namespace geomgraph { // geos.geomgraph


/**
 * A list of edge intersections along an Edge.
 * Implements splitting an edge with intersections
 * into multiple resultant edges.
 */
class GEOS_DLL EdgeIntersectionList{
public:
	typedef std::set<EdgeIntersection *, EdgeIntersectionLessThen> container;
	typedef container::iterator iterator;
	typedef container::const_iterator const_iterator;

private:
	container nodeMap;

public:

	Edge *edge;
	EdgeIntersectionList(Edge *edge);
	~EdgeIntersectionList();

	/*
	 * Adds an intersection into the list, if it isn't already there.
	 * The input segmentIndex and dist are expected to be normalized.
	 * @return the EdgeIntersection found or added
	 */
	EdgeIntersection* add(const geom::Coordinate& coord,
		int segmentIndex, double dist);

	iterator begin() { return nodeMap.begin(); }
	iterator end() { return nodeMap.end(); }
	const_iterator begin() const { return nodeMap.begin(); }
	const_iterator end() const { return nodeMap.end(); }

	bool isEmpty() const;
	bool isIntersection(const geom::Coordinate& pt) const;

	/*
	 * Adds entries for the first and last points of the edge to the list
	 */
	void addEndpoints();

	/**
	 * Creates new edges for all the edges that the intersections in this
	 * list split the parent edge into.
	 * Adds the edges to the input list (this is so a single list
	 * can be used to accumulate all split edges for a Geometry).
	 *
	 * @param edgeList a list of EdgeIntersections
	 */
	void addSplitEdges(std::vector<Edge*> *edgeList);

	Edge *createSplitEdge(EdgeIntersection *ei0, EdgeIntersection *ei1);
	std::string print() const;

};

std::ostream& operator<< (std::ostream&, const EdgeIntersectionList&);

} // namespace geos.geomgraph
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // ifndef GEOS_GEOMGRAPH_EDGEINTERSECTIONLIST_H

