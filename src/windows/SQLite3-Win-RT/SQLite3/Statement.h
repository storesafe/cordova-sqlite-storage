#pragma once

#include "sqlite3.h"

namespace SQLite3
{
  ref class Database;

  public ref class Statement sealed
  {
  public:
    Statement(Database^ database, Platform::String^ sql);
    virtual ~Statement();

    int Step();

    int ColumnCount();
    int ColumnType(int index);
    Platform::String^ ColumnName(int index);

    Platform::String^ ColumnText(int index);
    int ColumnInt(int index);
    long long ColumnInt64(int index);
    double ColumnDouble(int index);

    int BindText(int index, Platform::String^ val);
    int BindInt(int index, int val);
    int BindInt64(int index, long long val);
    int BindDouble(int index, double val);
    int BindNull(int index);

  private:
    sqlite3_stmt* statement;
  };
}
