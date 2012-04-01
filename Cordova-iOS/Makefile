all: coffee

coffee:
	mkdir -p build
	coffee -p src/sqlite_plugin.coffee > build/sqlite_plugin.js
	#NOTE: lawnchair_sqlite_plugin_adapter.coffee is currently broken:
	#coffee -p src/lawnchair_sqlite_plugin_adapter.js.coffee > build/lawnchair_sqlite_plugin_adapter.js
	cp build/*.js lawnchair-test/www

clean:
	rm -f lawnchair-test/www/sqlite_plugin.js
	rm -f lawnchair-test/www/lawnchair_sqlite_plugin_adapter.js

extraclean:
	rm -f build/sqlite_plugin.js
	rm -f build/lawnchair_sqlite_plugin_adapter.js
