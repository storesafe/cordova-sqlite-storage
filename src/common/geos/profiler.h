/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2001-2002 Vivid Solutions Inc.
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 **********************************************************************/

#ifndef GEOS_PROFILER_H
#define GEOS_PROFILER_H

#include <stdlib.h> /** need this to correctly detect MINGW64 **/
#include <geos/export.h>

/* For MingW builds with __STRICT_ANSI__ (-ansi) */
/** MINGW64 doesn't have a config.h **/
#if defined(__MINGW32__) && !defined(__MINGW64_VERSION_MAJOR)
/* Allow us to check for presence of gettimeofday in MingW */ 
#include <config.h>

#include <sys/time.h>
extern "C" {
  extern _CRTIMP void __cdecl	_tzset (void);
  __MINGW_IMPORT int	_daylight;
  __MINGW_IMPORT long	_timezone;
  __MINGW_IMPORT char 	*_tzname[2];
}
#endif
 
#if defined(_MSC_VER) || defined(__MINGW32__) && !defined(HAVE_GETTIMEOFDAY) && !defined(__MINGW64_VERSION_MAJOR)
#include <geos/timeval.h>
#else
#include <sys/time.h>
#endif

#include <map>
#include <memory>
#include <iostream>
#include <string>
#include <vector>

#ifndef PROFILE
#define PROFILE 0
#endif

#ifdef _MSC_VER
#pragma warning(push)
#pragma warning(disable: 4251) // warning C4251: needs to have dll-interface to be used by clients of class
#endif

namespace geos {
namespace util {


/*
 * \class Profile utils.h geos.h
 *
 * \brief Profile statistics
 */
class GEOS_DLL Profile {
public:
	/** \brief Create a named profile */
	Profile(std::string name);

	/** \brief Destructor */
	~Profile();

	/** \brief start a new timer */
	void start() {
		gettimeofday(&starttime, NULL);
	}

	/** \brief stop current timer */
	void stop()
	{
		gettimeofday(&stoptime, NULL);
		double elapsed = 1000000*(stoptime.tv_sec-starttime.tv_sec)+
			(stoptime.tv_usec-starttime.tv_usec);

		timings.push_back(elapsed);
		totaltime += elapsed;
		if ( timings.size() == 1 ) max = min = elapsed;
		else
		{
			if ( elapsed > max ) max = elapsed;
			if ( elapsed < min ) min = elapsed;
		}
		avg = totaltime / timings.size();
	}

	/** \brief Return Max stored timing */
	double getMax() const;

	/** \brief Return Min stored timing */
	double getMin() const;

	/** \brief Return total timing */
	double getTot() const;

	/** \brief Return average timing */
	double getAvg() const;

	/** \brief Return number of timings */
	size_t getNumTimings() const;

	/** \brief Profile name */
	std::string name;


private:

	/* \brief current start and stop times */
	struct timeval starttime, stoptime;

	/* \brief actual times */
	std::vector<double> timings;

	/* \brief total time */
	double totaltime;

	/* \brief max time */
	double max;

	/* \brief max time */
	double min;

	/* \brief max time */
	double avg;

};

/*
 * \class Profiler utils.h geos.h
 *
 * \brief Profiling class
 *
 */
class GEOS_DLL Profiler {

public:

	Profiler();
	~Profiler();

	/**
	 * \brief
	 * Return the singleton instance of the
	 * profiler.
	 */
	static Profiler *instance(void);

	/**
	 * \brief
	 * Start timer for named task. The task is
	 * created if does not exist.
	 */
	void start(std::string name);

	/**
	 * \brief
	 * Stop timer for named task. 
	 * Elapsed time is registered in the given task.
	 */
	void stop(std::string name);

	/** \brief get Profile of named task */
	Profile *get(std::string name);

	std::map<std::string, Profile *> profs;
};


/** \brief Return a string representing the Profile */
std::ostream& operator<< (std::ostream& os, const Profile&);

/** \brief Return a string representing the Profiler */
std::ostream& operator<< (std::ostream& os, const Profiler&);

} // namespace geos::util
} // namespace geos

#ifdef _MSC_VER
#pragma warning(pop)
#endif

#endif // ndef GEOS_PROFILER_H
