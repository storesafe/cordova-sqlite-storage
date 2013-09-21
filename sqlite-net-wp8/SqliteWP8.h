/*
Copyright (C) 2013 Peter Huene

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

#pragma once

namespace Sqlite
{
    /*
    Utility class for wrapping sqlite3 "handles".
    */
    public ref class Database sealed
    {
    internal:
    internal:
        Database(sqlite3* db) : _handle(db)
        {
        }

        property sqlite3* Handle
        { 
            sqlite3* get()
            {
                return _handle;
            }
        }

    private:
        sqlite3* _handle;
    };

    /*
    Utility class for wrapping sqlite3_stmt "handles".
    */
    public ref class Statement sealed
    {
    internal:
        Statement(sqlite3_stmt* statement) : _handle(statement)
        {
        }

        property sqlite3_stmt* Handle
        { 
            sqlite3_stmt* get()
            {
                return _handle;
            }
        }

    private:
        sqlite3_stmt* _handle;
    };

    /*
    This class is simply a C++/CX wrapper around sqlite3 exports that sqlite.net depends on.
    Consult the sqlite documentation on what they do.
    */
    public ref class Sqlite3 sealed
    {
    public:
        static int sqlite3_open(Platform::String^ filename, Database^* db);
        static int sqlite3_open_v2(Platform::String^ filename, Database^* db, int flags, Platform::String^ zVfs);
        static int sqlite3_close(Database^ db);
        static int sqlite3_busy_timeout(Database^ db, int miliseconds);
        static int sqlite3_changes(Database^ db);
        static int sqlite3_prepare_v2(Database^ db, Platform::String^ query, Statement^* statement);
        static int sqlite3_step(Statement^ statement);
        static int sqlite3_reset(Statement^ statement);
        static int sqlite3_finalize(Statement^ statement);
        static int64 sqlite3_last_insert_rowid(Database^ db);
        static Platform::String^ sqlite3_errmsg(Database^ db);
        static int sqlite3_bind_parameter_index(Statement^ statement, Platform::String^ name);
        static int sqlite3_bind_null(Statement^ statement, int index);
        static int sqlite3_bind_int(Statement^ statement, int index, int value);
        static int sqlite3_bind_int64(Statement^ statement, int index, int64 value);
        static int sqlite3_bind_double(Statement^ statement, int index, double value);
        static int sqlite3_bind_text(Statement^ statement, int index, Platform::String^ value, int length);
        static int sqlite3_bind_blob(Statement^ statement, int index, const Platform::Array<uint8>^ value, int length);	
        static int sqlite3_column_count(Statement^rstatement);
        static Platform::String^ sqlite3_column_name(Statement^ statement, int index);
        static int sqlite3_column_type(Statement^ statement, int index);
        static int sqlite3_column_int(Statement^ statement, int index);
        static int64 sqlite3_column_int64(Statement^ statement, int index);
        static double sqlite3_column_double(Statement^ statement, int index);
        static Platform::String^ sqlite3_column_text(Statement^ statement, int index);
        static Platform::Array<uint8>^ sqlite3_column_blob(Statement^, int index);
        static int sqlite3_column_bytes(Statement^ statement, int index);
        static int sqlite3_enable_load_extension(Database^ db, int onoff);
    };
}