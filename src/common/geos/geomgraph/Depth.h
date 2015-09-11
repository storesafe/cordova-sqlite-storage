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
 * Last port: geomgraph/Depth.java rev. 1.4 (JTS-1.10)
 *
 **********************************************************************/


#ifndef GEOS_GEOMGRAPH_DEPTH_H
#define GEOS_GEOMGRAPH_DEPTH_H

#include <geos/export.h>
#include <string>

#include <geos/inline.h>

// Forward declarations
namespace geos {
	namespace geomgraph {
		class Label;
	}
}

namespace geos {
namespace geomgraph { // geos.geomgraph

class GEOS_DLL Depth {
public:
	static int depthAtLocation(int location);
	Depth();
	virtual ~Depth(); // FIXME: shoudn't be virtual!
	int getDepth(int geomIndex,int posIndex) const;
	void setDepth(int geomIndex,int posIndex,int depthValue);
	int getLocation(int geomIndex,int posIndex) const;
	void add(int geomIndex,int posIndex,int location);
	bool isNull() const;
	bool isNull(int geomIndex) const;
	bool isNull(int geomIndex, int posIndex) const;
	int getDelta(int geomIndex) const;
	void normalize();
	void add(const Label& lbl);
	std::string toString() const;
private:
	enum {
		NULL_VALUE=-1 //Replaces NULL
	};
	int depth[2][3];
};

} // namespace geos.geomgraph
} // namespace geos

#endif // ifndef GEOS_GEOMGRAPH_DEPTH_H
