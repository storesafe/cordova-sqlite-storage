all: coffee

coffee:
	mkdir -p build
	coffee -p src/pgsqlite_plugin.js.coffee > build/pgsqlite_plugin.js
	coffee -p src/lawnchair_pgsqlite_plugin_adapter.js.coffee > build/lawnchair_pgsqlite_plugin_adapter.js

clean:
	rm -f build/pgsqlite_plugin.js
	rm -f build/lawnchair_pgsqlite_plugin_adapter.js
