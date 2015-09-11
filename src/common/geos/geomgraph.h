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
 **********************************************************************
 *
 * Try not to include this header directly. It is kept
 * for backward compatibility.
 * Please include geomgraph/classname.h for new code.
 *
 **********************************************************************/


#ifndef GEOS_GEOMGRAPH_H
#define GEOS_GEOMGRAPH_H

namespace geos {

/** \brief
 * Contains classes that implement topology graphs.
 * 
 * The Java Topology Suite (JTS) is a Java API that implements a core
 * set of spatial data operations using an explicit precision model
 * and robust geometric algorithms. JTS is int ended to be used in the
 * development of applications that support the validation, cleaning,
 * integration and querying of spatial datasets.
 *
 * JTS attempts to implement the OpenGIS Simple Features Specification (SFS)
 * as accurately as possible.  In some cases the SFS is unclear or omits a
 * specification; in this case JTS attempts to choose a reasonable and
 * consistent alternative.  Differences from and elaborations of the SFS
 * are documented in this specification.
 * 
 * <h2>Package Specification</h2>
 * 
 * <ul>
 *   <li>Java Topology Suite Technical Specifications
 *   <li><A HREF="http://www.opengis.org/techno/specs.htm">
 *       OpenGIS Simple Features Specification for SQL</A>
 * </ul>
 * 
 */
namespace geomgraph { // geos.geomgraph
} // namespace geos.geomgraph
} // namespace geos

//#include <geos/geomgraph/Depth.h>
//#include <geos/geomgraph/DirectedEdge.h>
//#include <geos/geomgraph/DirectedEdgeStar.h>
//#include <geos/geomgraph/Edge.h>
#include <geos/geomgraph/EdgeEnd.h>
#include <geos/geomgraph/EdgeEndStar.h>
//#include <geos/geomgraph/EdgeIntersection.h>
//#include <geos/geomgraph/EdgeIntersectionList.h>
#include <geos/geomgraph/EdgeList.h>
//#include <geos/geomgraph/EdgeNodingValidator.h>
//#include <geos/geomgraph/EdgeRing.h>
#include <geos/geomgraph/GeometryGraph.h>
#include <geos/geomgraph/GraphComponent.h>
//#include <geos/geomgraph/Label.h>
#include <geos/geomgraph/Node.h>
//#include <geos/geomgraph/NodeFactory.h>
#include <geos/geomgraph/NodeMap.h>
#include <geos/geomgraph/PlanarGraph.h>
//#include <geos/geomgraph/Position.h>
//#include <geos/geomgraph/Quadrant.h>
//#include <geos/geomgraph/TopologyLocation.h>

#endif // ifndef GEOS_GEOMGRAPH_H
