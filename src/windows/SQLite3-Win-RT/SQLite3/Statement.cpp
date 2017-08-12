#include "Winerror.h"

#include "Statement.h"
#include "Database.h"

namespace SQLite3
{
  Statement::Statement(Database^ database, Platform::String^ sql)
  {
    int ret = sqlite3_prepare16(database->sqlite, sql->Data(), -1, &statement, 0);

    if (ret != SQLITE_OK)
    {
      sqlite3_finalize(statement);

      HRESULT hresult = MAKE_HRESULT(SEVERITY_ERROR, FACILITY_ITF, ret);
      throw ref new Platform::COMException(hresult);
    }
  }

  Statement::~Statement()
  {
    sqlite3_finalize(statement);
  }

  int Statement::Step()
  {
    return sqlite3_step(statement);
  }

  int Statement::ColumnCount()
  {
    return sqlite3_column_count(statement);
  }

  int Statement::ColumnType(int index)
  {
    return sqlite3_column_type(statement, index);
  }

  Platform::String^ Statement::ColumnName(int index)
  {
    return ref new Platform::String(static_cast<const wchar_t*>(sqlite3_column_name16(statement, index)));
  }

  Platform::String^ Statement::ColumnText(int index)
  {
	  // To preserve embedded nulls within text data and fix truncation on first null char,
	  // create platform string with corresponding length:
	  // (length is number of bytes in text column divided by size of one wide character.
	  //  see https://bugs.chromium.org/p/chromium/issues/detail?id=422690
	  //  and https://www.sqlite.org/capi3ref.html#sqlite3_column_blob)
	  // Question: is this always correct in all conditions?
	  unsigned int length = sqlite3_column_bytes16(statement, index) / sizeof(wchar_t);
	  return ref new Platform::String(static_cast<const wchar_t*>(sqlite3_column_text16(statement, index)), length);
  }

  int Statement::ColumnInt(int index)
  {
    return sqlite3_column_int(statement, index);
  }

  long long Statement::ColumnInt64(int index)
  {
    return sqlite3_column_int64(statement, index);
  }

  double Statement::ColumnDouble(int index)
  {
    return sqlite3_column_double(statement, index);
  }

  int Statement::BindText(int index, Platform::String^ val)
  {
	  // To preserve embedded nulls within text data and fix truncation on first null char,
	  // pass number of text bytes to sqlite3_bind_text16() instead of -1 as third parameter:
	  // (number of bytes are calculated by multiplying string length with the size of one wide character.
	  //  see https://bugs.chromium.org/p/chromium/issues/detail?id=422690
	  //  and https://www.sqlite.org/capi3ref.html#sqlite3_bind_blob)
	  // Question: is this always correct in all conditions?
	  int length = val->Length() * sizeof(wchar_t);
	  return sqlite3_bind_text16(statement, index, val->Begin(), length, SQLITE_TRANSIENT);
  }

  int Statement::BindInt(int index, int val)
  {
    return sqlite3_bind_int(statement, index, val);
  }

  int Statement::BindInt64(int index, long long val)
  {
    return sqlite3_bind_int64(statement, index, val);
  }

  int Statement::BindDouble(int index, double val)
  {
    return sqlite3_bind_double(statement, index, val);
  }

  int Statement::BindNull(int index)
  {
    return sqlite3_bind_null(statement, index);
  }
}
