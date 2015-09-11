/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2006 Refractions Research Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: ORIGINAL WORK
 *
 **********************************************************************/

#ifndef GEOS_GEOM_GEOMETRYLIST_H
#define GEOS_GEOM_GEOMETRYLIST_H

#include <geos/export.h>
#include <geos/geom/Geometry.h> // for auto_ptr

#include <memory> // for auto_ptr
#include <vector> 

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

namespace geos {
namespace geom { // geos.geom


/** \brief
 * Manager of Geometry pointers. Owns the Geometries.
 */
class GEOS_DLL GeometryList {

public:

	/// auto_ptr needs to access private destructor
	friend class std::auto_ptr<GeometryList>;

	typedef std::vector<Geometry*>::size_type size_type;

	/// Only way to manage a GeometryList is trough
	/// this an auto_ptr<>. @see create()
	typedef std::auto_ptr<GeometryList> AutoPtr;

	/// Create an empty GeometryList 
	static GeometryList::AutoPtr create();

	/// Add a geometry to the list (takes ownership)
	void add(Geometry::AutoPtr geom);

	/// Return number of geometries in this list
	size_type size() const;

	/// Returned object lifetime is bound to GeometryList lifetime
	Geometry* operator[] (size_type);

	/// Returned object lifetime is bound to GeometryList lifetime
	const Geometry* operator[] (size_type) const;

private:

	std::vector<Geometry*> geoms;

	GeometryList();
	~GeometryList();
};

} // namespace geos.geom
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // GEOS_GEOM_GEOMETRYLIST_H
