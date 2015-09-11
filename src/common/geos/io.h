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

#ifndef GEOS_IO_H
#define GEOS_IO_H

namespace geos {

/// Contains the interfaces for converting JTS objects to and from other formats.
//
/// The Java Topology Suite (JTS) is a Java API that implements a core
/// set of spatial data operations usin g an explicit precision model
/// and robust geometric algorithms. JTS is intended to be used in the
/// devel opment of applications that support the validation, cleaning,
/// integration and querying of spatial data sets.
///
/// JTS attempts to implement the OpenGIS Simple Features Specification
/// (SFS) as accurately as possible.  In some cases the SFS is unclear
/// or omits a specification; in this case JTS attempts to choose a reaso
/// nable and consistent alternative.  Differences from and elaborations
/// of the SFS are documented in this specification.
///
/// <h2>Package Specification</h2>
///
/// <ul>
/// <li>Java Topology Suite Technical Specifications
/// <li><A HREF="http://www.opengis.org/techno/specs.htm">
///   OpenGIS Simple Features Specification for SQL</A>
/// </ul>
///
namespace io { // geos.io

} // namespace geos.io
} // namespace geos

#include <geos/io/ByteOrderDataInStream.h>
#include <geos/io/ByteOrderValues.h>
#include <geos/io/ParseException.h>
//#include <geos/io/StringTokenizer.h>
#include <geos/io/WKBConstants.h>
#include <geos/io/WKBReader.h>
#include <geos/io/WKBWriter.h>
#include <geos/io/WKTReader.h>
#include <geos/io/WKTWriter.h>
#include <geos/io/CLocalizer.h>
//#include <geos/io/Writer.h>

#ifdef __GNUC__
#warning *** DEPRECATED: You are using deprecated header io.h. Please, update your sources according to new layout of GEOS headers and namespaces
#endif

using namespace geos::io;

#endif
