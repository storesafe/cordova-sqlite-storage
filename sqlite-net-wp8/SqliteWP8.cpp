/*
Copyright (C) 2013 Peter Huene

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

#include "pch.h"
#include "SqliteWP8.h"

using namespace Sqlite;
using namespace Platform;
using namespace std;

vector<char> convert_to_utf8_buffer(String^ str)
{
    // A null value cannot be marshalled for Platform::String^, so they should never be null
    if (str->IsEmpty())
    {
        // Return an "empty" string
        return vector<char>(1);
    }

    // Get the size of the utf-8 string
    int size = WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS, str->Data(), str->Length(), nullptr, 0, nullptr, nullptr);
    if (size == 0)
    {
        // Not much we can do here; just return an empty string
        return vector<char>(1);
    }

    // Allocate the buffer and do the conversion
    vector<char> buffer(size + 1 /* null */);
    if (WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS, str->Data(), str->Length(), buffer.data(), size, nullptr, nullptr) == 0)
    {
        // Not much we can do here; just return an empty string
        return vector<char>(1);
    }

    return std::move(buffer);
}

String^ convert_to_string(char const* str)
{
    if (!str)
    {
        return ref new String();
    }

    // Get the size of the wide string
    int size = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, str, -1, nullptr, 0);
    if (size == 0)
    {
        return ref new String();
    }

    // Allocate the buffer and do the conversion
    vector<wchar_t> buffer(size /* already includes null from pasing -1 above */);
    if (MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, str, -1, buffer.data(), size) == 0)
    {
        return ref new String();
    }

    return ref new String(buffer.data());
}

int Sqlite3::sqlite3_open(String^ filename, Database^* db)
{
    auto filename_buffer = convert_to_utf8_buffer(filename);

    // Use sqlite3_open instead of sqlite3_open16 so that the default code page for stored strings is UTF-8 and not UTF-16
    sqlite3* actual_db = nullptr;
    int result = ::sqlite3_open(filename_buffer.data(), &actual_db);
    if (db)
    {
        // If they didn't give us a pointer, the caller has leaked
        *db = ref new Database(actual_db);
    }
    return result;
}

int Sqlite3::sqlite3_open_v2(String^ filename, Database^* db, int flags, String^ zVfs)
{
    auto filename_buffer = convert_to_utf8_buffer(filename);
    auto zVfs_buffer = convert_to_utf8_buffer(zVfs);

    sqlite3* actual_db = nullptr;
    int result = ::sqlite3_open_v2(
        filename_buffer.data(),
        &actual_db,
        flags,
        zVfs_buffer.size() <= 1 /* empty string */ ? nullptr : zVfs_buffer.data());
    if (db)
    {
        // If they didn't give us a pointer, the caller has leaked
        *db = ref new Database(actual_db);
    }
    return result;
}

int Sqlite3::sqlite3_close(Database^ db)
{
    return::sqlite3_close(db ? db->Handle : nullptr);
}

int Sqlite3::sqlite3_busy_timeout(Database^ db, int miliseconds)
{
    return ::sqlite3_busy_timeout(db ? db->Handle : nullptr, miliseconds);
}

int Sqlite3::sqlite3_changes(Database^ db)
{
    return ::sqlite3_changes(db ? db->Handle : nullptr);
}

int Sqlite3::sqlite3_prepare_v2(Database^ db, String^ query, Statement^* statement)
{
    sqlite3_stmt* actual_statement = nullptr;
    int result = ::sqlite3_prepare16_v2(
        db ? db->Handle : nullptr, 
        query->IsEmpty() ? L"" : query->Data(), 
        -1, 
        &actual_statement, 
        nullptr);
    if (statement)
    {
        // If they didn't give us a pointer, the caller has leaked
        *statement = ref new Statement(actual_statement);
    }
    return result;
}

int Sqlite3::sqlite3_step(Statement^ statement)
{
    return ::sqlite3_step(statement ? statement->Handle : nullptr);
}

int Sqlite3::sqlite3_reset(Statement^ statement)
{
    return ::sqlite3_reset(statement ? statement->Handle : nullptr);
}

int Sqlite3::sqlite3_finalize(Statement^ statement)
{
    return ::sqlite3_finalize(statement ? statement->Handle : nullptr);
}

int64 Sqlite3::sqlite3_last_insert_rowid(Database^ db)
{
    return ::sqlite3_last_insert_rowid(db ? db->Handle : nullptr);
}

String^ Sqlite3::sqlite3_errmsg(Database^ db)
{
    return convert_to_string(::sqlite3_errmsg(db ? db->Handle : nullptr));
}

int Sqlite3::sqlite3_bind_parameter_index(Statement^ statement, String^ name)
{
    auto name_buffer = convert_to_utf8_buffer(name);
    return ::sqlite3_bind_parameter_index(
        statement ? statement->Handle : nullptr, 
        name_buffer.data());
}

int Sqlite3::sqlite3_bind_null(Statement^ statement, int index)
{
    return ::sqlite3_bind_null(statement ? statement->Handle : nullptr, index);
}

int Sqlite3::sqlite3_bind_int(Statement^ statement, int index, int value)
{
    return ::sqlite3_bind_int(statement ? statement->Handle : nullptr, index, value);
}

int Sqlite3::sqlite3_bind_int64(Statement^ statement, int index, int64 value)
{
    return ::sqlite3_bind_int64(statement ? statement->Handle : nullptr, index, value);
}

int Sqlite3::sqlite3_bind_double(Statement^ statement, int index, double value)
{
    return ::sqlite3_bind_double(statement ? statement->Handle : nullptr, index, value);
}

int Sqlite3::sqlite3_bind_text(Statement^ statement, int index, String^ value, int length)
{
    // Use transient here so that the data gets copied by sqlite
    return ::sqlite3_bind_text16(
        statement ? statement->Handle : nullptr, 
        index, 
        value->IsEmpty() ? L"" : value->Data(),
        length < 0 ? value->Length() * sizeof(wchar_t) : length,
        SQLITE_TRANSIENT);
}

int Sqlite3::sqlite3_bind_blob(Statement^ statement, int index, const Array<uint8>^ value, int length)
{
    // Use transient here so that the data gets copied by sqlite
    return ::sqlite3_bind_blob(
        statement ? statement->Handle : nullptr, 
        index, 
        value ? value->Data : nullptr, 
        length < 0 ? value->Length : length,
        SQLITE_TRANSIENT);
}

int Sqlite3::sqlite3_column_count(Statement^ statement)
{
    return ::sqlite3_column_count(statement ? statement->Handle : nullptr);
}

String^ Sqlite3::sqlite3_column_name(Statement^ statement, int index)
{
    return convert_to_string(::sqlite3_column_name(statement ? statement->Handle : nullptr, index));
}

int Sqlite3::sqlite3_column_type(Statement^ statement, int index)
{
    return ::sqlite3_column_type(statement ? statement->Handle : nullptr, index);
}

int Sqlite3::sqlite3_column_int(Statement^ statement, int index)
{
    return ::sqlite3_column_int(statement ? statement->Handle : nullptr, index);
}

int64 Sqlite3::sqlite3_column_int64(Statement^ statement, int index)
{
    return ::sqlite3_column_int64(statement ? statement->Handle : nullptr, index);
}

double Sqlite3::sqlite3_column_double(Statement^ statement, int index)
{
    return ::sqlite3_column_double(statement ? statement->Handle : nullptr, index);
}

String^ Sqlite3::sqlite3_column_text(Statement^ statement, int index)
{
    return ref new String(reinterpret_cast<wchar_t const*>(::sqlite3_column_text16(statement ? statement->Handle : nullptr, index)));
}

Array<uint8>^ Sqlite3::sqlite3_column_blob(Statement^ statement, int index)
{
    int count = Sqlite3::sqlite3_column_bytes(statement, index);
    Array<uint8>^ blob = ref new Array<uint8>(count < 0 ? 0 : count);

    if (count > 0)
    {
        auto data = static_cast<uint8 const*>(::sqlite3_column_blob(statement ? statement->Handle : nullptr, index));
        std::copy(data, data + count, blob->Data);
    }

    return blob;
}

int Sqlite3::sqlite3_column_bytes(Statement^ statement, int index)
{
    return ::sqlite3_column_bytes(statement ? statement->Handle : nullptr, index);
}

int Sqlite3::sqlite3_enable_load_extension(Database^ db, int onoff)
{
    // Dummy stub to make sqlite-net work (note: sqlite-net doesn't use it directly)
    // While sqlite3_enable_load_extension is declared in sqlite3.h, 
    // sqlite3.lib provided by "SQL For Windows Phone" doesn't seem to define it
    return 1;	// Error
}
