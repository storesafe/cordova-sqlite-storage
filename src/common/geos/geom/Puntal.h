/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2011  Sandro Santilli <strk@keybit.net>
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: geom/Puntal.java r320 (JTS-1.12)
 *
 **********************************************************************/

#ifndef GEOS_GEOM_PUNTAL_H
#define GEOS_GEOM_PUNTAL_H

#include <geos/export.h>
#include <geos/geom/Geometry.h> // for inheritance

namespace geos {
namespace geom { // geos::geom

/**
 * Identifies {@link Geometry} subclasses which
 * are 0-dimensional and with components which are {@link Point}s.
 */
class GEOS_DLL Puntal : public virtual Geometry
{
protected:
  Puntal(): Geometry(0) {}
};

} // namespace geos::geom
} // namespace geos

#endif // ndef GEOS_GEOM_PUNTAL_H
