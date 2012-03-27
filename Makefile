all: coffee

coffee:
	mkdir -p build
	coffee -p src/sqlite_plugin.js.coffee > build/sqlite_plugin.js
	coffee -p src/lawnchair_sqlite_plugin_adapter.js.coffee > build/lawnchair_sqlite_plugin_adapter.js

clean:
	rm -f build/sqlite_plugin.js
	rm -f build/lawnchair_sqlite_plugin_adapter.js
