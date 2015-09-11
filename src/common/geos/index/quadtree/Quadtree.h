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
 * Last port: index/quadtree/Quadtree.java rev. 1.16 (JTS-1.10)
 *
 **********************************************************************/

#ifndef GEOS_IDX_QUADTREE_QUADTREE_H
#define GEOS_IDX_QUADTREE_QUADTREE_H

#include <geos/export.h>
#include <geos/index/SpatialIndex.h> // for inheritance
#include <geos/index/quadtree/Root.h> // for composition

#include <vector>
#include <string>

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

// Forward declarations
namespace geos {
	namespace geom {
		class Envelope;
	}
	namespace index {
		namespace quadtree {
			// class Root; 
		}
	}
}

namespace geos {
namespace index { // geos::index
namespace quadtree { // geos::index::quadtree

/**
 * \brief
 * A Quadtree is a spatial index structure for efficient querying
 * of 2D rectangles.  If other kinds of spatial objects
 * need to be indexed they can be represented by their
 * envelopes
 * 
 * The quadtree structure is used to provide a primary filter
 * for range rectangle queries.  The query() method returns a list of
 * all objects which <i>may</i> intersect the query rectangle.  Note that
 * it may return objects which do not in fact intersect.
 * A secondary filter is required to test for exact intersection.
 * Of course, this secondary filter may consist of other tests besides
 * intersection, such as testing other kinds of spatial relationships.
 *
 * This implementation does not require specifying the extent of the inserted
 * items beforehand.  It will automatically expand to accomodate any extent
 * of dataset.
 * 
 * This data structure is also known as an <i>MX-CIF quadtree</i>
 * following the usage of Samet and others.
 */
class GEOS_DLL Quadtree: public SpatialIndex {

private:

	std::vector<geom::Envelope *> newEnvelopes;

	void collectStats(const geom::Envelope& itemEnv);

	Root root;

	/**
	 *  Statistics
	 *
	 * minExtent is the minimum envelope extent of all items
	 * inserted into the tree so far. It is used as a heuristic value
	 * to construct non-zero envelopes for features with zero X and/or
	 * Y extent.
	 * Start with a non-zero extent, in case the first feature inserted has
	 * a zero extent in both directions.  This value may be non-optimal, but
	 * only one feature will be inserted with this value.
	 */
	double minExtent;

public:
	/**
	 * \brief
	 * Ensure that the envelope for the inserted item has non-zero extents.
	 *
	 * Use the current minExtent to pad the envelope, if necessary.
	 * Can return a new Envelope or the given one (casted to non-const).
	 */
	static geom::Envelope* ensureExtent(const geom::Envelope *itemEnv,
			double minExtent);

	/**
	 * \brief
	 * Constructs a Quadtree with zero items.
	 */
	Quadtree()
		:
		root(),
		minExtent(1.0)
	{}

	~Quadtree();

	/// Returns the number of levels in the tree.
	int depth();

	/// Returns the number of items in the tree.
	int size();
	
	void insert(const geom::Envelope *itemEnv, void *item);

	/** \brief
	 * Queries the tree and returns items which may lie
	 * in the given search envelope.
	 *
	 * Precisely, the items that are returned are all items in the tree
	 * whose envelope <b>may</b> intersect the search Envelope.
	 * Note that some items with non-intersecting envelopes may be
	 * returned as well;
	 * the client is responsible for filtering these out.
	 * In most situations there will be many items in the tree which do not
	 * intersect the search envelope and which are not returned - thus
	 * providing improved performance over a simple linear scan.
	 *
	 * @param searchEnv the envelope of the desired query area.
	 * @param ret a vector where items which may intersect the
	 * 	      search envelope are pushed
	 */
	void query(const geom::Envelope *searchEnv, std::vector<void*>& ret);


	/** \brief
	 * Queries the tree and visits items which may lie in
	 * the given search envelope.
	 *
	 * Precisely, the items that are visited are all items in the tree
	 * whose envelope <b>may</b> intersect the search Envelope.
	 * Note that some items with non-intersecting envelopes may be
	 * visited as well;
	 * the client is responsible for filtering these out.
	 * In most situations there will be many items in the tree which do not
	 * intersect the search envelope and which are not visited - thus
	 * providing improved performance over a simple linear scan.
	 *
	 * @param searchEnv the envelope of the desired query area.
	 * @param visitor a visitor object which is passed the visited items
	 */
	void query(const geom::Envelope *searchEnv, ItemVisitor& visitor)
	{
		/*
		 * the items that are matched are the items in quads which
		 * overlap the search envelope
		 */
		root.visit(searchEnv, visitor);
	}

	/**
	 * Removes a single item from the tree.
	 *
	 * @param itemEnv the Envelope of the item to be removed
	 * @param item the item to remove
	 * @return <code>true</code> if the item was found (and thus removed)
	 */
	bool remove(const geom::Envelope* itemEnv, void* item);

	/// Return a list of all items in the Quadtree
	std::vector<void*>* queryAll();

	std::string toString() const;

};

} // namespace geos::index::quadtree
} // namespace geos::index
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // GEOS_IDX_QUADTREE_QUADTREE_H
