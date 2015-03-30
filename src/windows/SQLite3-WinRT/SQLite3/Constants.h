#pragma once

#include "sqlite3.h"

namespace SQLite3
{
  public ref class Datatype sealed
  {
  public:
    static property int Integer { int get() { return SQLITE_INTEGER; } }
    static property int Float { int get() { return SQLITE_FLOAT; } }
    static property int Text { int get() { return SQLITE_TEXT; } }
    static property int Blob { int get() { return SQLITE_BLOB; } }
    static property int Null { int get() { return SQLITE_NULL; } }
  };

  public ref class ResultCode sealed
  {
  public:
    static property int Ok { int get() { return SQLITE_OK; } }
    static property int Error { int get() { return SQLITE_ERROR; } }
    static property int Internal { int get() { return SQLITE_INTERNAL; } }
    static property int Perm { int get() { return SQLITE_PERM; } }
    static property int Abort { int get() { return SQLITE_ABORT; } }
    static property int Busy { int get() { return SQLITE_BUSY; } }
    static property int Locked { int get() { return SQLITE_LOCKED; } }
    static property int NoMem { int get() { return SQLITE_NOMEM; } }
    static property int ReadOnly { int get() { return SQLITE_READONLY; } }
    static property int Interrupt { int get() { return SQLITE_INTERRUPT; } }
    static property int IoErr { int get() { return SQLITE_IOERR; } }
    static property int Corrupt { int get() { return SQLITE_CORRUPT; } }
    static property int NotFound { int get() { return SQLITE_NOTFOUND; } }
    static property int Full { int get() { return SQLITE_FULL; } }
    static property int CantOpen { int get() { return SQLITE_CANTOPEN; } }
    static property int Protocol { int get() { return SQLITE_PROTOCOL; } }
    static property int Empty { int get() { return SQLITE_EMPTY; } }
    static property int Schema { int get() { return SQLITE_SCHEMA; } }
    static property int TooBig { int get() { return SQLITE_TOOBIG; } }
    static property int Constraint { int get() { return SQLITE_CONSTRAINT; } }
    static property int Mismatch { int get() { return SQLITE_MISMATCH; } }
    static property int Misuse { int get() { return SQLITE_MISUSE; } }
    static property int NoLfs { int get() { return SQLITE_NOLFS; } }
    static property int Auth { int get() { return SQLITE_AUTH; } }
    static property int Format { int get() { return SQLITE_FORMAT; } }
    static property int Range { int get() { return SQLITE_RANGE; } }
    static property int NotADb { int get() { return SQLITE_NOTADB; } }
    static property int Row { int get() { return SQLITE_ROW; } }
    static property int Done { int get() { return SQLITE_DONE; } }
  };
}
