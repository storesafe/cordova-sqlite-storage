/**********************************************************************
 *
 * GEOS - Geometry Engine Open Source
 * http://geos.osgeo.org
 *
 * Copyright (C) 2006 Wu Yongwei
 *
 * This is free software; you can redistribute and/or modify it under
 * the terms of the GNU Lesser General Public Licence as published
 * by the Free Software Foundation. 
 * See the COPYING file for more information.
 *
 * Note: This code is in the public domain, see 
 *       http://wyw.dcweb.cn/time.htm
 *
 **********************************************************************/

#ifndef GEOS_TIMEVAL_H
#define GEOS_TIMEVAL_H

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <winsock2.h>
#include <time.h>

#if defined(_MSC_VER) || defined(__BORLANDC__)
#define EPOCHFILETIME (116444736000000000i64)
#else
#define EPOCHFILETIME (116444736000000000LL)
#endif

struct timezone {
    int tz_minuteswest; /* minutes W of Greenwich */
    int tz_dsttime;     /* type of dst correction */
};


#if !defined(_WIN32_WCE)

__inline int gettimeofday(struct timeval *tv, struct timezone *tz)
{
    FILETIME        ft;
    LARGE_INTEGER   li;
    __int64         t;
    static int      tzflag;

    if (tv)
    {
        GetSystemTimeAsFileTime(&ft);
        li.LowPart  = ft.dwLowDateTime;
        li.HighPart = ft.dwHighDateTime;
        t  = li.QuadPart;       /* In 100-nanosecond intervals */
        t -= EPOCHFILETIME;     /* Offset to the Epoch time */
        t /= 10;                /* In microseconds */
        tv->tv_sec  = (long)(t / 1000000);
        tv->tv_usec = (long)(t % 1000000);
    }

    if (tz)
    {
        if (!tzflag)
        {
            _tzset();
            tzflag++;
        }
        tz->tz_minuteswest = _timezone / 60;
        tz->tz_dsttime = _daylight;
    }

    return 0;
}

#else

__inline int gettimeofday(struct timeval *tv, struct timezone *tz)
{
	SYSTEMTIME      st;
    FILETIME        ft;
    LARGE_INTEGER   li;
    TIME_ZONE_INFORMATION tzi;
    __int64         t;
    static int      tzflag;

    if (tv)
    {
		GetSystemTime(&st);
		SystemTimeToFileTime(&st, &ft);
        li.LowPart  = ft.dwLowDateTime;
        li.HighPart = ft.dwHighDateTime;
        t  = li.QuadPart;       /* In 100-nanosecond intervals */
        t -= EPOCHFILETIME;     /* Offset to the Epoch time */
        t /= 10;                /* In microseconds */
        tv->tv_sec  = (long)(t / 1000000);
        tv->tv_usec = (long)(t % 1000000);
    }

    if (tz)
    {   
        GetTimeZoneInformation(&tzi);
		
        tz->tz_minuteswest = tzi.Bias;
		if (tzi.StandardDate.wMonth != 0)
        {
			tz->tz_minuteswest += tzi.StandardBias * 60;
        }

        if (tzi.DaylightDate.wMonth != 0)
        {
            tz->tz_dsttime = 1;
        }
        else
        {
            tz->tz_dsttime = 0;
        }
    }

    return 0;
}

#endif /* _WIN32_WCE */

#endif /* GEOS_TIMEVAL_H */
