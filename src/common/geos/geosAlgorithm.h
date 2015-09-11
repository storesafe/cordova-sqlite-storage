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
 * This includes all headers from geos/algorithm.
 * It is reccommended you avoid to include this file, but rather
 * you include the specific headers you need. This is to reduce
 * dependency and thus build times.
 * We kept this file to provide some degree of backward compatibility.
 * This is also where Doxygen documentation for the geos::algorithm
 * namespace resides.
 *
 **********************************************************************/

#ifndef GEOS_ALGORITHM_H
#define GEOS_ALGORITHM_H

//#include <geos/algorithm/CGAlgorithms.h>
//#include <geos/algorithm/CentroidArea.h>
//#include <geos/algorithm/CentroidLine.h>
//#include <geos/algorithm/CentroidPoint.h>
//#include <geos/algorithm/ConvexHull.h>
//#include <geos/algorithm/HCoordinate.h>
//#include <geos/algorithm/InteriorPointArea.h>
//#include <geos/algorithm/InteriorPointLine.h>
//#include <geos/algorithm/InteriorPointPoint.h>
#include <geos/algorithm/LineIntersector.h>
//#include <geos/algorithm/MCPointInRing.h>
//#include <geos/algorithm/MinimumDiameter.h>
//#include <geos/algorithm/NotRepresentableException.h>
//#include <geos/algorithm/PointInRing.h>
#include <geos/algorithm/PointLocator.h>
//#include <geos/algorithm/RobustDeterminant.h>
//#include <geos/algorithm/SIRtreePointInRing.h>
//#include <geos/algorithm/SimplePointInAreaLocator.h>
//#include <geos/algorithm/SimplePointInRing.h>

namespace geos {

/** \brief
 * Contains classes and interfaces implementing fundamental computational geometry algorithms.
 * 
 * <H3>Robustness</H3>
 * 
 * Geometrical algorithms involve a combination of combinatorial and numerical computation.  As with
 * all numerical computation using finite-precision numbers, the algorithms chosen are susceptible to
 * problems of robustness.  A robustness problem occurs when a numerical calculation produces an
 * incorrect answer for some inputs due to round-off errors.  Robustness problems are especially
 * serious in geometric computation, since they can result in errors during topology building.
 * <P>
 * There are many approaches to dealing with the problem of robustness in geometrical computation.
 * Not surprisingly, most robust algorithms are substantially more complex and less performant than
 * the non-robust versions.  Fortunately, JTS is sensitive to robustness problems in only a few key
 * functions (such as line intersection and the point-in-polygon test).  There are efficient robust
 * algorithms available for these functions, and these algorithms are implemented in JTS.
 * 
 * <H3>Computational Performance</H3>
 * 
 * Runtime performance is an important consideration for a production-quality implementation of
 * geometric algorithms.  The most computationally intensive algorithm used in JTS is intersection
 * detection.  JTS methods need to determine both all intersection between the line segments in a
 * single Geometry (self-intersection) and all intersections between the line segments of two different
 * Geometries.
 * <P>
 * The obvious naive algorithm for intersection detection (comparing every segment with every other)
 * has unacceptably slow performance.  There is a large literature of faster algorithms for intersection
 * detection.  Unfortunately, many of them involve substantial code complexity.  JTS tries to balance code
 * simplicity with performance gains.  It uses some simple techniques to produce substantial performance
 * gains for common types of input data.
 * 
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
namespace algorithm { // geos::algorithm

/** \brief
 * Classes which determine the Location of points in geometries.
 */
namespace locate {
} // namespace geos::algorithm::locate
} // namespace geos::algorithm
} // namespace geos


#endif

