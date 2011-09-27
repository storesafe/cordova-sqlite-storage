all: coffee

coffee:
	mkdir -p build
	coffee -p src/sqlite_plugin.js.coffee > build/sqlite_plugin.js

clean:
	rm -f build/sqlite_plugin.js
