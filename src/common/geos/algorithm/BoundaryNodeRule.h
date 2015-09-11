/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2009      Sandro Santilli <strk@keybit.net>
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************
 *
 * Last port: algorithm/BoundaryNodeRule.java rev 1.4 (JTS-1.10)
 *
 **********************************************************************/

#ifndef GEOS_ALGORITHM_BOUNDARYNODERULE_H
#define GEOS_ALGORITHM_BOUNDARYNODERULE_H

#include <geos/export.h>

// Forward declarations
// ...

namespace geos {
namespace algorithm { // geos::algorithm


/**
 * An interface for rules which determine whether node points
 * which are in boundaries of {@link Lineal} geometry components
 * are in the boundary of the parent geometry collection.
 * The SFS specifies a single kind of boundary node rule,
 * the {@link Mod2BoundaryNodeRule} rule.
 * However, other kinds of Boundary Node Rules are appropriate
 * in specific situations (for instance, linear network topology
 * usually follows the {@link EndPointBoundaryNodeRule}.)
 * Some JTS operations allow the BoundaryNodeRule to be specified,
 * and respect this rule when computing the results of the operation.
 *
 * @author Martin Davis
 * @version 1.7
 *
 * @see operation::relate::RelateOp
 * @see operation::IsSimpleOp
 * @see algorithm::PointLocator
 */
class GEOS_DLL BoundaryNodeRule {

public:

	// virtual classes should always have a virtual destructor..
	virtual ~BoundaryNodeRule() {}

	/**
	 * Tests whether a point that lies in <tt>boundaryCount</tt>
	 * geometry component boundaries is considered to form part of
	 * the boundary of the parent geometry.
	 *
 	 * @param boundaryCount the number of component boundaries that
	 *                      this point occurs in
	 * @return true if points in this number of boundaries lie in
	 *              the parent boundary
	 */
	virtual bool isInBoundary(int boundaryCount) const=0;

	/** \brief
	 * The Mod-2 Boundary Node Rule (which is the rule specified
	 * in the OGC SFS).
	 *
	 * @see Mod2BoundaryNodeRule
	 */
	//static const BoundaryNodeRule& MOD2_BOUNDARY_RULE;
    static const BoundaryNodeRule& getBoundaryRuleMod2();

	/** \brief
	 * The Endpoint Boundary Node Rule.
	 *
	 * @see EndPointBoundaryNodeRule
	 */
	//static const BoundaryNodeRule& ENDPOINT_BOUNDARY_RULE;
    static const BoundaryNodeRule& getBoundaryEndPoint();

	/** \brief
	 * The MultiValent Endpoint Boundary Node Rule.
	 *
	 * @see MultiValentEndPointBoundaryNodeRule
	 */
	//static const BoundaryNodeRule& MULTIVALENT_ENDPOINT_BOUNDARY_RULE;
    static const BoundaryNodeRule& getBoundaryMultivalentEndPoint();

	/** \brief
	 * The Monovalent Endpoint Boundary Node Rule.
	 *
	 * @see MonoValentEndPointBoundaryNodeRule
	 */
	//static const BoundaryNodeRule& MONOVALENT_ENDPOINT_BOUNDARY_RULE;
    static const BoundaryNodeRule& getBoundaryMonovalentEndPoint();

	/** \brief
	 * The Boundary Node Rule specified by the OGC Simple Features
	 * Specification, which is the same as the Mod-2 rule.
	 *
	 * @see Mod2BoundaryNodeRule
	 */
	//static const BoundaryNodeRule& OGC_SFS_BOUNDARY_RULE;
    static const BoundaryNodeRule& getBoundaryOGCSFS();
};

} // namespace geos::algorithm
} // namespace geos

#endif // GEOS_ALGORITHM_BOUNDARYNODERULE_H

