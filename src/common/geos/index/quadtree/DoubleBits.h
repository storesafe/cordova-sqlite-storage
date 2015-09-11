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
 * Last port: index/quadtree/DoubleBits.java rev. 1.7 (JTS-1.10)
 *
 **********************************************************************/

#ifndef GEOS_IDX_QUADTREE_DOUBLEBITS_H
#define GEOS_IDX_QUADTREE_DOUBLEBITS_H

#include <geos/export.h>
#include <geos/platform.h> // for int64

#include <string>

namespace geos {
namespace index { // geos::index
namespace quadtree { // geos::index::quadtree


/** \brief
 * DoubleBits manipulates Double numbers
 * by using bit manipulation and bit-field extraction.
 *
 * For some operations (such as determining the exponent)
 * this is more accurate than using mathematical operations
 * (which suffer from round-off error).
 * 
 * The algorithms and constants in this class
 * apply only to IEEE-754 double-precision floating point format.
 *
 */
class GEOS_DLL DoubleBits {

public:

	static const int EXPONENT_BIAS=1023;

	static double powerOf2(int exp);

	static int exponent(double d);

	static double truncateToPowerOfTwo(double d);

	static std::string toBinaryString(double d);

	static double maximumCommonMantissa(double d1, double d2);

	DoubleBits(double nx);

	double getDouble() const;

	/// Determines the exponent for the number
	int64 biasedExponent() const;

	/// Determines the exponent for the number
	int getExponent() const;

	void zeroLowerBits(int nBits);

	int getBit(int i) const;

	/** \brief
	 * This computes the number of common most-significant bits in
	 * the mantissa.
	 *
	 * It does not count the hidden bit, which is always 1.
	 * It does not determine whether the numbers have the same exponent;
	 * if they do not, the value computed by this function is meaningless.
	 *
	 * @param db
	 *
	 * @return the number of common most-significant mantissa bits
	 */
	int numCommonMantissaBits(const DoubleBits& db) const;

	/// A representation of the Double bits formatted for easy readability
	std::string toString() const;

private:

	double x;

	int64 xBits;
};

} // namespace geos::index::quadtree
} // namespace geos::index
} // namespace geos

#endif // GEOS_IDX_QUADTREE_DOUBLEBITS_H
