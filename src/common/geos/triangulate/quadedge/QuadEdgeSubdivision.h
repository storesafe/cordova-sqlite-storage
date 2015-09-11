/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2012 Excensus LLC.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: triangulate/quadedge/QuadEdgeSubdivision.java r524
 *
 **********************************************************************/

#ifndef GEOS_TRIANGULATE_QUADEDGE_QUADEDGESUBDIVISION_H
#define GEOS_TRIANGULATE_QUADEDGE_QUADEDGESUBDIVISION_H

#include <memory>
#include <list>
#include <stack>
#include <set>

#include <geos/geom/Envelope.h>
#include <geos/geom/MultiLineString.h>
#include <geos/triangulate/quadedge/QuadEdgeLocator.h>
#include <geos/triangulate/quadedge/Vertex.h>

namespace geos {

namespace geom {

	class CoordinateSequence;
	class GeometryCollection;
	class GeometryFactory;
	class Coordinate;
}

namespace triangulate { //geos.triangulate
namespace quadedge { //geos.triangulate.quadedge

class QuadEdge;
class TriangleVisitor;

const double EDGE_COINCIDENCE_TOL_FACTOR = 1000;

/**
 * A class that contains the {@link QuadEdge}s representing a planar
 * subdivision that models a triangulation. 
 * The subdivision is constructed using the
 * quadedge algebra defined in the classs {@link QuadEdge}. 
 * All metric calculations
 * are done in the {@link Vertex} class.
 * In addition to a triangulation, subdivisions
 * support extraction of Voronoi diagrams.
 * This is easily accomplished, since the Voronoi diagram is the dual
 * of the Delaunay triangulation.
 * <p>
 * Subdivisions can be provided with a tolerance value. Inserted vertices which
 * are closer than this value to vertices already in the subdivision will be
 * ignored. Using a suitable tolerance value can prevent robustness failures
 * from happening during Delaunay triangulation.
 * <p>
 * Subdivisions maintain a <b>frame</b> triangle around the client-created
 * edges. The frame is used to provide a bounded "container" for all edges
 * within a TIN. Normally the frame edges, frame connecting edges, and frame
 * triangles are not included in client processing.
 * 
 * @author JTS: David Skea
 * @author JTS: Martin Davis
 * @author Benjamin Campbell
 */
class GEOS_DLL QuadEdgeSubdivision {
public:
	typedef std::list<QuadEdge*> QuadEdgeList;

	/**
	 * Gets the edges for the triangle to the left of the given {@link QuadEdge}.
	 * 
	 * @param startQE
	 * @param triEdge
	 * 
	 * @throws IllegalArgumentException
	 *           if the edges do not form a triangle
	 */
	static void getTriangleEdges(const QuadEdge &startQE,
			const QuadEdge* triEdge[3]);

private:
	QuadEdgeList quadEdges;
	QuadEdgeList createdEdges;
	QuadEdge* startingEdges[3];
	double tolerance;
	double edgeCoincidenceTolerance;
	Vertex frameVertex[3];
	geom::Envelope frameEnv;
	std::auto_ptr<QuadEdgeLocator> locator;

public:
	/**
	 * Creates a new instance of a quad-edge subdivision based on a frame triangle
	 * that encloses a supplied bounding box. A new super-bounding box that
	 * contains the triangle is computed and stored.
	 * 
	 * @param env
	 *          the bouding box to surround
	 * @param tolerance
	 *          the tolerance value for determining if two sites are equal
	 */
	QuadEdgeSubdivision(const geom::Envelope &env, double tolerance);

	~QuadEdgeSubdivision();

private:
	virtual void createFrame(const geom::Envelope &env);
	
	virtual void initSubdiv(QuadEdge* initEdges[3]);
	
public:
	/**
	 * Gets the vertex-equality tolerance value
	 * used in this subdivision
	 * 
	 * @return the tolerance value
	 */
	inline double getTolerance() const {
		return tolerance;
	}

	/**
	 * Gets the envelope of the Subdivision (including the frame).
	 * 
	 * @return the envelope
	 */
	inline const geom::Envelope& getEnvelope() const {
		return frameEnv;
	}

	/**
	 * Gets the collection of base {@link QuadEdge}s (one for every pair of
	 * vertices which is connected).
	 * 
	 * @return a QuadEdgeList
	 */
	inline const QuadEdgeList& getEdges() const {
		return quadEdges;
	}

	/**
	 * Sets the {@link QuadEdgeLocator} to use for locating containing triangles
	 * in this subdivision.
	 * 
	 * @param locator
	 *          a QuadEdgeLocator
	 */
	inline void setLocator(std::auto_ptr<QuadEdgeLocator> locator) {
		this->locator = locator;
	}

	/**
	 * Creates a new quadedge, recording it in the edges list.
	 * 
	 * @param o
	 * @param d
	 * @return
	 */
	virtual QuadEdge& makeEdge(const Vertex &o, const Vertex &d);

	/**
	 * Creates a new QuadEdge connecting the destination of a to the origin of b,
	 * in such a way that all three have the same left face after the connection
	 * is complete. The quadedge is recorded in the edges list.
	 * 
	 * @param a
	 * @param b
	 * @return
	 */
	virtual QuadEdge& connect(QuadEdge &a, QuadEdge &b);

	/**
	 * Deletes a quadedge from the subdivision. Linked quadedges are updated to
	 * reflect the deletion.
	 * 
	 * @param e
	 *          the quadedge to delete
	 */
	void remove(QuadEdge &e);

	/**
	 * Locates an edge of a triangle which contains a location 
	 * specified by a Vertex v. 
	 * The edge returned has the
	 * property that either v is on e, or e is an edge of a triangle containing v.
	 * The search starts from startEdge amd proceeds on the general direction of v.
	 * <p>
	 * This locate algorithm relies on the subdivision being Delaunay. For
	 * non-Delaunay subdivisions, this may loop for ever.
	 * 
	 * @param v the location to search for
	 * @param startEdge an edge of the subdivision to start searching at
	 * @returns a QuadEdge which contains v, or is on the edge of a triangle containing v
	 * @throws LocateFailureException
	 *           if the location algorithm fails to converge in a reasonable
	 *           number of iterations. The returned pointer should not be
	 * freed be the caller.
	 */
	QuadEdge* locateFromEdge(const Vertex &v,
			const QuadEdge &startEdge) const;

	/**
	 * Finds a quadedge of a triangle containing a location 
	 * specified by a {@link Vertex}, if one exists.
	 * 
	 * @param x the vertex to locate
	 * @return a quadedge on the edge of a triangle which touches or contains the location
	 * @return null if no such triangle exists. The returned pointer should not be
	 * freed be the caller.
	 */
	inline QuadEdge* locate(const Vertex &v) const {
		return locator->locate(v);
	}

	/**
	 * Finds a quadedge of a triangle containing a location
	 * specified by a {@link Coordinate}, if one exists.
	 * 
	 * @param p the Coordinate to locate
	 * @return a quadedge on the edge of a triangle which touches or contains the location
	 * @return null if no such triangle exists. The returned pointer should not be
	 * freed be the caller.
	 */
	inline QuadEdge* locate(const geom::Coordinate &p) {
		return locator->locate(Vertex(p));
	}

	/**
	 * Locates the edge between the given vertices, if it exists in the
	 * subdivision.
	 * 
	 * @param p0 a coordinate
	 * @param p1 another coordinate
	 * @return the edge joining the coordinates, if present
	 * @return null if no such edge exists
	 * @return the caller _should not_ free the returned pointer
	 */
	QuadEdge* locate(const geom::Coordinate &p0, const geom::Coordinate &p1);

	/**
	 * Inserts a new site into the Subdivision, connecting it to the vertices of
	 * the containing triangle (or quadrilateral, if the split point falls on an
	 * existing edge).
	 * <p>
	 * This method does NOT maintain the Delaunay condition. If desired, this must
	 * be checked and enforced by the caller.
	 * <p>
	 * This method does NOT check if the inserted vertex falls on an edge. This
	 * must be checked by the caller, since this situation may cause erroneous
	 * triangulation
	 * 
	 * @param v
	 *          the vertex to insert
	 * @return a new quad edge terminating in v
	 */
	QuadEdge& insertSite(const Vertex &v);

	/**
	 * Tests whether a QuadEdge is an edge incident on a frame triangle vertex.
	 * 
	 * @param e
	 *          the edge to test
	 * @return true if the edge is connected to the frame triangle
	 */
	bool isFrameEdge(const QuadEdge &e) const;

	/**
	 * Tests whether a QuadEdge is an edge on the border of the frame facets and
	 * the internal facets. E.g. an edge which does not itself touch a frame
	 * vertex, but which touches an edge which does.
	 * 
	 * @param e
	 *          the edge to test
	 * @return true if the edge is on the border of the frame
	 */
	bool isFrameBorderEdge(const QuadEdge &e) const;

	/**
	 * Tests whether a vertex is a vertex of the outer triangle.
	 * 
	 * @param v
	 *          the vertex to test
	 * @return true if the vertex is an outer triangle vertex
	 */
	bool isFrameVertex(const Vertex &v) const;


	/**
	 * Tests whether a {@link Coordinate} lies on a {@link QuadEdge}, up to a
	 * tolerance determined by the subdivision tolerance.
	 * 
	 * @param e
	 *          a QuadEdge
	 * @param p
	 *          a point
	 * @return true if the vertex lies on the edge
	 */
	bool isOnEdge(const QuadEdge &e, const geom::Coordinate &p) const;

	/**
	 * Tests whether a {@link Vertex} is the start or end vertex of a
	 * {@link QuadEdge}, up to the subdivision tolerance distance.
	 * 
	 * @param e
	 * @param v
	 * @return true if the vertex is a endpoint of the edge
	 */
	bool isVertexOfEdge(const QuadEdge &e, const Vertex &v) const;

	/**
	 * Gets all primary quadedges in the subdivision. 
	 * A primary edge is a {@link QuadEdge}
	 * which occupies the 0'th position in its array of associated quadedges. 
	 * These provide the unique geometric edges of the triangulation.
	 * 
	 * @param includeFrame true if the frame edges are to be included
	 * @return a List of QuadEdges. The caller takes ownership of the returned QuadEdgeList but not the
	 * items it contains.
	 */
	std::auto_ptr<QuadEdgeList> getPrimaryEdges(bool includeFrame);
  
	/*****************************************************************************
	 * Visitors
	 ****************************************************************************/

	void visitTriangles(TriangleVisitor *triVisitor, bool includeFrame);

private:
	typedef std::stack<QuadEdge*> QuadEdgeStack;
	typedef std::set<QuadEdge*> QuadEdgeSet;
	typedef std::list< geom::CoordinateSequence*> TriList;

	/**
	 * The quadedges forming a single triangle.
	 * Only one visitor is allowed to be active at a
	 * time, so this is safe.
	 */
	QuadEdge* triEdges[3];

	/**
	 * Stores the edges for a visited triangle. Also pushes sym (neighbour) edges
	 * on stack to visit later.
	 * 
	 * @param edge
	 * @param edgeStack
	 * @param includeFrame
	 * @return the visited triangle edges
	 * @return null if the triangle should not be visited (for instance, if it is
	 *         outer)
	 */
	QuadEdge** fetchTriangleToVisit(QuadEdge *edge, QuadEdgeStack &edgeStack, bool includeFrame,
			QuadEdgeSet &visitedEdges);

	/**
	 * Gets the coordinates for each triangle in the subdivision as an array.
	 * 
	 * @param includeFrame
	 *          true if the frame triangles should be included
	 * @param triList a list of Coordinate[4] representing each triangle
	 */
	void getTriangleCoordinates(TriList* triList, bool includeFrame);

private:
	class TriangleCoordinatesVisitor; 

public:
	/**
	 * Gets the geometry for the edges in the subdivision as a {@link MultiLineString}
	 * containing 2-point lines.
	 * 
	 * @param geomFact the GeometryFactory to use
	 * @return a MultiLineString. The caller takes ownership of the returned object.
	 */
	std::auto_ptr<geom::MultiLineString> getEdges(const geom::GeometryFactory& geomFact);

	/**
	 * Gets the geometry for the triangles in a triangulated subdivision as a {@link GeometryCollection}
	 * of triangular {@link Polygon}s.
	 * 
	 * @param geomFact the GeometryFactory to use
	 * @return a GeometryCollection of triangular Polygons. The caller takes ownership of the returned object.
	 */
	std::auto_ptr<geom::GeometryCollection> getTriangles(const geom::GeometryFactory &geomFact);

};

} //namespace geos.triangulate.quadedge
} //namespace geos.triangulate
} //namespace goes

#endif //GEOS_TRIANGULATE_QUADEDGE_QUADEDGESUBDIVISION_H
