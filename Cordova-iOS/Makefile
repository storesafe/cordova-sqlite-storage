all: coffee

coffee:
	mkdir -p build
	coffee -p src/SQLiteNative.coffee > build/SQLiteNative.js
	coffee -p src/lawnchair_sqlite_plugin_adapter.coffee > build/lawnchair_sqlite_plugin_adapter.js
	cp build/*.js lawnchair-test/www

clean:
	rm -f lawnchair-test/www/SQLiteNative.js
	rm -f lawnchair-test/www/lawnchair_sqlite_plugin_adapter.js

extraclean:
	rm -f build/SQLiteNative.js
	rm -f build/lawnchair_sqlite_plugin_adapter.js
