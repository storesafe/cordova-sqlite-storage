all: coffee

coffee:
	mkdir -p build
	coffee -p src/pgsqlite_plugin.coffee > build/pgsqlite_plugin.js
	coffee -p src/lawnchair_pgsqlite_plugin_adapter.coffee > build/lawnchair_pgsqlite_plugin_adapter.js
	cp build/*.js lawnchair-test/www

clean:
	rm -f lawnchair-test/www/pgsqlite_plugin.js
	rm -f lawnchair-test/www/lawnchair_pgsqlite_plugin_adapter.js

extraclean:
	rm -f build/pgsqlite_plugin.js
	rm -f build/lawnchair_pgsqlite_plugin_adapter.js
