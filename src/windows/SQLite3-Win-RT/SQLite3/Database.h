#pragma once

#include "sqlite3.h"

namespace SQLite3
{
  ref class Statement;

  public ref class Database sealed
  {
  public:
    Database(Platform::String^ dbPath);
    virtual ~Database();

    int closedb();
    int close_v2();

    Statement^ Prepare(Platform::String^ sql);

    int LastInsertRowid();
    int TotalChanges();

  private:
    friend Statement;

    sqlite3* sqlite;
  };
}
