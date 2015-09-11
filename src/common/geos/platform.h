/* include/geos/platform.h.  Generated from platform.h.in by configure.  */
#ifndef GEOS_PLATFORM_H
#define GEOS_PLATFORM_H

/* Set to 1 if you have `int64_t' type */
/* #undef HAVE_INT64_T_64 */

/* Set to 1 if `long int' is 64 bits */
/* #undef HAVE_LONG_INT_64 */

/* Set to 1 if `long long int' is 64 bits */
#define HAVE_LONG_LONG_INT_64 1

/* Set to 1 if you have ieeefp.h */
/* #undef HAVE_IEEEFP_H */

/* Has finite */
/* #undef HAVE_FINITE */

/* Has isfinite */
#define HAVE_ISFINITE 1

/* Has isnan */
#define HAVE_ISNAN 1

#ifdef HAVE_IEEEFP_H
extern "C"
{
#include <ieeefp.h>
}
#endif

#ifdef HAVE_INT64_T_64
extern "C"
{
#include <inttypes.h>
}
#endif

#if defined(__GNUC__) && defined(_WIN32)
/* For MingW the appropriate definitions are included in
 math.h and float.h but the definitions in 
 math.h are only included if __STRICT_ANSI__
 is not defined.  Since GEOS is compiled with -ansi that
 means those definitions are not available. */
#include <float.h>
#endif

#include <limits> // for std::numeric_limits



//Defines NaN for intel platforms
#define DoubleNotANumber std::numeric_limits<double>::quiet_NaN()

//Don't forget to define infinities
#define DoubleInfinity std::numeric_limits<double>::infinity()
#define DoubleNegInfinity -std::numeric_limits<double>::infinity()

#define DoubleMax std::numeric_limits<double>::max()

#ifdef HAVE_INT64_T_64
  typedef int64_t int64;
#else
# ifdef HAVE_LONG_LONG_INT_64
   typedef long long int int64;
# else
   typedef long int int64;
#  ifndef HAVE_LONG_INT_64
#   define INT64_IS_REALLY32 1
#   warning "Could not find 64bit integer definition!"
#  endif
# endif
#endif


#if defined(HAVE_FINITE) && !defined(HAVE_ISFINITE)
# define FINITE(x) (finite(x))
#else
# if defined(_MSC_VER)
#  define FINITE(x) _finite(static_cast<double>(x))    
# else
#  define FINITE(x) (isfinite(x))
# endif
#endif

#if defined(HAVE_ISNAN)
# define ISNAN(x) (isnan(x))
#else
# if defined(_MSC_VER)
#  define ISNAN(x) _isnan(x)
# elif defined(__MINGW32__) || defined(__CYGWIN__)
// sandro furieri: sanitizing MinGW32
#  define ISNAN(x) (std::isnan(x))
# elif defined(__OSX__) || defined(__APPLE__) || \
       defined(__NetBSD__) || defined(__DragonFly__) ||	\
       (defined(__sun) && defined(__GNUC__))
   // Hack for OS/X <cmath> incorrectly re-defining isnan() into oblivion.
   // It does leave a version in std.
#  define ISNAN(x) (std::isnan(x))
# elif (defined(__sun) || defined(__sun__)) && defined(__SUNPRO_CC)
#  include <math.h>
#  define ISNAN(x) (::isnan(x))
# endif
#endif

#ifndef FINITE
#error "Can not compile without finite or isfinite function or macro"
#endif

#ifndef ISNAN
#error "Can not compile without isnan function or macro"
#endif

#endif
