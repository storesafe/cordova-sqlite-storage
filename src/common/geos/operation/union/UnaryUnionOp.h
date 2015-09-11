/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2011 Sandro Santilli <strk@keybit.net>
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: operation/union/UnaryUnionOp.java r320 (JTS-1.12)
 *
 **********************************************************************/

#ifndef GEOS_OP_UNION_UNARYUNION_H
#define GEOS_OP_UNION_UNARYUNION_H

#include <memory>
#include <vector>

#include <geos/export.h>
#include <geos/geom/GeometryFactory.h>
#include <geos/geom/BinaryOp.h>
#include <geos/geom/Point.h>
#include <geos/geom/LineString.h>
#include <geos/geom/Polygon.h>
#include <geos/geom/util/GeometryExtracter.h>
#include <geos/operation/overlay/OverlayOp.h>
//#include <geos/operation/overlay/snap/SnapIfNeededOverlayOp.h>

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
    namespace geom {
        class GeometryFactory;
        class Geometry;
    }
}

namespace geos {
namespace operation { // geos::operation
namespace geounion {  // geos::operation::geounion

/**
 * Unions a collection of Geometry or a single Geometry
 * (which may be a collection) together.
 * By using this special-purpose operation over a collection of
 * geometries it is possible to take advantage of various optimizations
 * to improve performance.
 * Heterogeneous {@link GeometryCollection}s are fully supported.
 * 
 * The result obeys the following contract:
 * 
 * - Unioning a set of overlapping {@link Polygons}s has the effect of
 *   merging the areas (i.e. the same effect as
 *   iteratively unioning all individual polygons together).
 * - Unioning a set of {@link LineString}s has the effect of
 *   <b>fully noding</b> and <b>dissolving</b> the input linework.
 *   In this context "fully noded" means that there will be a node or
 *   endpoint in the output for every endpoint or line segment crossing
 *   in the input.
 *   "Dissolved" means that any duplicate (e.g. coincident) line segments
 *   or portions of line segments will be reduced to a single line segment
 *   in the output.  *   This is consistent with the semantics of the
 *   {@link Geometry#union(Geometry)} operation.
 *   If <b>merged</b> linework is required, the {@link LineMerger} class
 *   can be used.
 * - Unioning a set of {@link Points}s has the effect of merging
 *   al identical points (producing a set with no duplicates).
 *
 * <tt>UnaryUnion</tt> always operates on the individual components of
 * MultiGeometries.
 * So it is possible to use it to "clean" invalid self-intersecting
 * MultiPolygons (although the polygon components must all still be
 * individually valid.)
 */
class GEOS_DLL UnaryUnionOp
{
public:

  template <typename T>
  static std::auto_ptr<geom::Geometry> Union(const T& geoms)
  {
    UnaryUnionOp op(geoms);
    return op.Union();
  }

  template <class T>
  static std::auto_ptr<geom::Geometry> Union(const T& geoms,
      geom::GeometryFactory& geomFact)
  {
    UnaryUnionOp op(geoms, geomFact);
    return op.Union();
  }

  static std::auto_ptr<geom::Geometry> Union(const geom::Geometry& geom)
  {
    UnaryUnionOp op(geom);
    return op.Union();
  }

  template <class T>
  UnaryUnionOp(const T& geoms, geom::GeometryFactory& geomFactIn)
      :
      geomFact(&geomFactIn)
  {
    extractGeoms(geoms);
  }

  template <class T>
  UnaryUnionOp(const T& geoms)
      :
      geomFact(0)
  {
    extractGeoms(geoms);
  }

  UnaryUnionOp(const geom::Geometry& geom)
      :
      geomFact(geom.getFactory())
  {
    extract(geom);
  }

  /**
   * \brief
   * Gets the union of the input geometries.
   *
   * If no input geometries were provided, a POINT EMPTY is returned.
   *
   * @return a Geometry containing the union
   * @return an empty GEOMETRYCOLLECTION if no geometries were provided
   *         in the input
   */
  std::auto_ptr<geom::Geometry> Union();

private:

  template <typename T>
  void extractGeoms(const T& geoms)
  {
      for (typename T::const_iterator
              i=geoms.begin(),
              e=geoms.end();
              i!=e;
              ++i)
      {
          const geom::Geometry* geom = *i;
          extract(*geom);
      }
  }

  void extract(const geom::Geometry& geom)
  {
      using namespace geom::util;

      if ( ! geomFact ) geomFact = geom.getFactory();

      GeometryExtracter::extract<geom::Polygon>(geom, polygons);
      GeometryExtracter::extract<geom::LineString>(geom, lines);
      GeometryExtracter::extract<geom::Point>(geom, points);
  }

  /**
   * Computes a unary union with no extra optimization,
   * and no short-circuiting.
   * Due to the way the overlay operations
   * are implemented, this is still efficient in the case of linear
   * and puntal geometries.
   * Uses robust version of overlay operation
   * to ensure identical behaviour to the <tt>union(Geometry)</tt> operation.
   *
   * @param g0 a geometry
   * @return the union of the input geometry
   */
  std::auto_ptr<geom::Geometry> unionNoOpt(const geom::Geometry& g0)
  {
    using geos::operation::overlay::OverlayOp;
    //using geos::operation::overlay::snap::SnapIfNeededOverlayOp;

    if ( ! empty.get() ) {
      empty.reset( geomFact->createEmptyGeometry() );
    }
    //return SnapIfNeededOverlayOp::overlayOp(g0, *empty, OverlayOp::opUNION);
    return BinaryOp(&g0, empty.get(), overlay::overlayOp(OverlayOp::opUNION));
  }

  /**
   * Computes the union of two geometries,
   * either of both of which may be null.
   *
   * @param g0 a Geometry (ownership transferred)
   * @param g1 a Geometry (ownership transferred)
   * @return the union of the input(s)
   * @return null if both inputs are null
   */
  std::auto_ptr<geom::Geometry> unionWithNull(std::auto_ptr<geom::Geometry> g0,
                                              std::auto_ptr<geom::Geometry> g1);

  std::vector<const geom::Polygon*> polygons;
  std::vector<const geom::LineString*> lines;
  std::vector<const geom::Point*> points;

  const geom::GeometryFactory* geomFact;

  std::auto_ptr<geom::Geometry> empty;
};
 

} // namespace geos::operation::union
} // namespace geos::operation
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif
