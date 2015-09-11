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
 * Last port: geomgraph/GeometryGraph.java r428 (JTS-1.12+)
 *
 **********************************************************************/


#ifndef GEOS_GEOMGRAPH_GEOMETRYGRAPH_H
#define GEOS_GEOMGRAPH_GEOMETRYGRAPH_H

#include <geos/export.h>
#include <map>
#include <vector>
#include <memory>

#include <geos/geom/Coordinate.h>
#include <geos/geom/CoordinateSequence.h> // for auto_ptr<CoordinateSequence>
#include <geos/geomgraph/PlanarGraph.h>
#include <geos/geom/LineString.h> // for LineStringLT

#include <geos/inline.h>

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
	namespace geom {
		class LineString;
		class LinearRing;
		class Polygon;
		class Geometry;
		class GeometryCollection;
		class Point;
	}
	namespace algorithm {
		class LineIntersector;
		class BoundaryNodeRule;
	}
	namespace geomgraph {
		class Edge;
		class Node;
		namespace index {
			class SegmentIntersector;
			class EdgeSetIntersector;
		}
	}
}

namespace geos {
namespace geomgraph { // geos.geomgraph

/**
 * A GeometryGraph is a graph that models a given Geometry
 */
class GEOS_DLL GeometryGraph: public PlanarGraph
{
using PlanarGraph::add;
using PlanarGraph::findEdge;

private:

	const geom::Geometry* parentGeom;

	/**
	 * The lineEdgeMap is a map of the linestring components of the
	 * parentGeometry to the edges which are derived from them.
	 * This is used to efficiently perform findEdge queries
	 *
	 * Following the above description there's no need to
	 * compare LineStrings other then by pointer value.
	 */
//std::map<const geom::LineString*,Edge*,geom::LineStringLT> lineEdgeMap;
	std::map<const geom::LineString*, Edge*> lineEdgeMap;

	/**
	 * If this flag is true, the Boundary Determination Rule will
	 * used when deciding whether nodes are in the boundary or not
	 */
	bool useBoundaryDeterminationRule;

	const algorithm::BoundaryNodeRule& boundaryNodeRule;

	/**
	 * the index of this geometry as an argument to a spatial function
	 * (used for labelling)
	 */
	int argIndex;

	/// Cache for fast responses to getBoundaryPoints
	std::auto_ptr< geom::CoordinateSequence > boundaryPoints;

	std::auto_ptr< std::vector<Node*> > boundaryNodes;

	bool hasTooFewPointsVar;

	geom::Coordinate invalidPoint; 

	/// Allocates a new EdgeSetIntersector. Remember to delete it!
	index::EdgeSetIntersector* createEdgeSetIntersector();

	void add(const geom::Geometry *g);
		// throw(UnsupportedOperationException);

	void addCollection(const geom::GeometryCollection *gc);

	void addPoint(const geom::Point *p);

	void addPolygonRing(const geom::LinearRing *lr,
			int cwLeft, int cwRight);

	void addPolygon(const geom::Polygon *p);

	void addLineString(const geom::LineString *line);

	void insertPoint(int argIndex, const geom::Coordinate& coord,
			int onLocation);

	/** \brief
	 * Adds candidate boundary points using the current
	 * algorithm::BoundaryNodeRule.
	 *
	 * This is used to add the boundary
	 * points of dim-1 geometries (Curves/MultiCurves).
	 */
	void insertBoundaryPoint(int argIndex, const geom::Coordinate& coord);

	void addSelfIntersectionNodes(int argIndex);

	/** \brief
	 * Add a node for a self-intersection.
	 *
	 * If the node is a potential boundary node (e.g. came from an edge
	 * which is a boundary) then insert it as a potential boundary node.
	 * Otherwise, just add it as a regular node.
	 */
	void addSelfIntersectionNode(int argIndex,
		const geom::Coordinate& coord, int loc);

    // Declare type as noncopyable
    GeometryGraph(const GeometryGraph& other);
    GeometryGraph& operator=(const GeometryGraph& rhs);

public:

	static bool isInBoundary(int boundaryCount);

	static int determineBoundary(int boundaryCount);

	static int determineBoundary(
	             const algorithm::BoundaryNodeRule& boundaryNodeRule,
	                                            int boundaryCount);

	GeometryGraph();

	GeometryGraph(int newArgIndex, const geom::Geometry *newParentGeom);

	GeometryGraph(int newArgIndex, const geom::Geometry *newParentGeom,
	              const algorithm::BoundaryNodeRule& boundaryNodeRule);

	virtual ~GeometryGraph();


	const geom::Geometry* getGeometry();

	/// Returned object is owned by this GeometryGraph
	std::vector<Node*>* getBoundaryNodes();

	void getBoundaryNodes(std::vector<Node*>&bdyNodes);

	/// Returned object is owned by this GeometryGraph
	geom::CoordinateSequence* getBoundaryPoints();

	Edge* findEdge(const geom::LineString *line);

	void computeSplitEdges(std::vector<Edge*> *edgelist);

	void addEdge(Edge *e);

	void addPoint(geom::Coordinate& pt);

	/**
	 * \brief
	 * Compute self-nodes, taking advantage of the Geometry type to
	 * minimize the number of intersection tests.  (E.g. rings are
	 * not tested for self-intersection, since
	 * they are assumed to be valid).
	 *
	 * @param li the LineIntersector to use
	 *
	 * @param computeRingSelfNodes if <false>, intersection checks are
	 *	optimized to not test rings for self-intersection
	 *
	 * @return the SegmentIntersector used, containing information about
	 *	the intersections found
	 */
	index::SegmentIntersector* computeSelfNodes(
			algorithm::LineIntersector *li,
			bool computeRingSelfNodes);

	// Quick inline calling the function above, the above should probably
	// be deprecated.
	index::SegmentIntersector* computeSelfNodes(
			algorithm::LineIntersector& li,
			bool computeRingSelfNodes);

	index::SegmentIntersector* computeEdgeIntersections(GeometryGraph *g,
		algorithm::LineIntersector *li, bool includeProper);

	std::vector<Edge*> *getEdges();

	bool hasTooFewPoints();

	const geom::Coordinate& getInvalidPoint(); 

	const algorithm::BoundaryNodeRule& getBoundaryNodeRule() const
	{ return boundaryNodeRule; }

};


} // namespace geos.geomgraph
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#ifdef GEOS_INLINE
# include "geos/geomgraph/GeometryGraph.inl"
#endif

#endif // ifndef GEOS_GEOMGRAPH_GEOMETRYGRAPH_H
