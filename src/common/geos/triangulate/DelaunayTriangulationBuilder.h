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
 * Last port: triangulate/DelaunayTriangulationBuilder.java r524
 *
 **********************************************************************/

#ifndef GEOS_TRIANGULATE_DELAUNAYTRIANGULATIONBUILDER_H
#define GEOS_TRIANGULATE_DELAUNAYTRIANGULATIONBUILDER_H

#include <geos/triangulate/IncrementalDelaunayTriangulator.h>


namespace geos {
  namespace geom{
	  class CoordinateSequence;
	  class Geometry;
	  class MultiLineString;
	  class GeometryCollection;
	  class GeometryFactory;
	  class Envelope;
  }
  namespace triangulate { 
    namespace quadedge { 
      class QuadEdgeSubdivision;
    }
  }
}

namespace geos {
namespace triangulate { //geos.triangulate


/**
 * A utility class which creates Delaunay Triangulations
 * from collections of points and extract the resulting 
 * triangulation edges or triangles as geometries. 
 * 
 * @author JTS: Martin Davis
 * @author Benjamin Campbell
 *
 */
class GEOS_DLL DelaunayTriangulationBuilder 
{
public:
	/**
	 * Extracts the unique {@link Coordinate}s from the given {@link Geometry}.
	 * @param geom the geometry to extract from
	 * @return a List of the unique Coordinates. Caller takes ownership of the returned object.
	 */
	static geom::CoordinateSequence* extractUniqueCoordinates(const geom::Geometry& geom);
	
	static void unique(geom::CoordinateSequence& coords);
	
	/**
	 * Converts all {@link Coordinate}s in a collection to {@link Vertex}es.
	 * @param coords the coordinates to convert
	 * @return a List of Vertex objects. Call takes ownership of returned object.
	 */
	static IncrementalDelaunayTriangulator::VertexList* toVertices(const geom::CoordinateSequence &coords);
	
private:
	geom::CoordinateSequence* siteCoords;
	double tolerance;
	quadedge::QuadEdgeSubdivision *subdiv;
	
public:
	/**
	 * Creates a new triangulation builder.
	 *
	 */
	DelaunayTriangulationBuilder();

	~DelaunayTriangulationBuilder();
	
	/**
	 * Sets the sites (vertices) which will be triangulated.
	 * All vertices of the given geometry will be used as sites.
	 * 
	 * @param geom the geometry from which the sites will be extracted.
	 */
	void setSites(const geom::Geometry& geom);
	
	/**
	 * Sets the sites (vertices) which will be triangulated
	 * from a collection of {@link Coordinate}s.
	 * 
	 * @param geom a CoordinateSequence.
	 */
	void setSites(const geom::CoordinateSequence& coords);
	
	/**
	 * Sets the snapping tolerance which will be used
	 * to improved the robustness of the triangulation computation.
	 * A tolerance of 0.0 specifies that no snapping will take place.
	 * 
	 * @param tolerance the tolerance distance to use
	 */
	inline void setTolerance(double tolerance)
	{
		this->tolerance = tolerance;
	}
	
private:
	void create();
	
public:
	/**
	 * Gets the {@link quadedge::QuadEdgeSubdivision} which models the computed triangulation.
	 * 
	 * @return the subdivision containing the triangulation
	 */
	quadedge::QuadEdgeSubdivision& getSubdivision();
	
	/**
	 * Gets the edges of the computed triangulation as a {@link MultiLineString}.
	 * 
	 * @param geomFact the geometry factory to use to create the output
	 * @return the edges of the triangulation. The caller takes ownership of the returned object.
	 */
	std::auto_ptr<geom::MultiLineString> getEdges(const geom::GeometryFactory &geomFact);
	
	/**
	 * Gets the faces of the computed triangulation as a {@link GeometryCollection} 
	 * of {@link Polygon}.
	 * 
	 * @param geomFact the geometry factory to use to create the output
	 * @return the faces of the triangulation. The caller takes ownership of the returned object.
	 */
	std::auto_ptr<geom::GeometryCollection> getTriangles(const geom::GeometryFactory& geomFact);

	/** 
	 * Computes the {@link Envelope} of a collection of {@link Coordinate}s.
	 * 
	 * @param coords a List of Coordinates
	 * @return the envelope of the set of coordinates
	 */

	static geom::Envelope envelope(const geom::CoordinateSequence& coords);

};

} //namespace geos.triangulate
} //namespace goes

#endif //GEOS_TRIANGULATE_QUADEDGE_DELAUNAYTRIANGULATIONBUILDER_H

