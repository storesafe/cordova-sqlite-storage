module('Lawnchair construction/destruction', {
    setup:function() {
    },
    teardown:function() {
    }
});

test('ctor requires callbacks in each form', function() {
    QUnit.stop();
    QUnit.expect(6);

    // raise exception if no ctor callback is supplied
    try {
        var lc2 = new Lawnchair();    
    } catch(e) {
        ok(true, 'exception raised if no callback supplied to init');
    }
    try {
        var lc3 = new Lawnchair({}, {});
    } catch(e) {
        ok(true, 'exception raised if no callback supplied to init, but two args are present');
    }
    try {
        var lc3 = new Lawnchair({});
    } catch(e) {
        ok(true, 'exception raised if no callback supplied to init, but one arg is present');
    }

    var lc = new Lawnchair({name:store.name}, function(ref) {
        ok(true, 'should call passed in callback when using obj+function ctor form')
        equals(this, ref, "lawnchair callback scoped to lawnchair instance")
        equals(ref, this, "lawnchair passes self into callback too")
        QUnit.start()
    });
});

/** NOTE: may cause a failure due to difference in SQLitePlugin database initialization.
test('independent data stores', function() {

    var store1 = new Lawnchair({name: "store1"}, function() {});

    store1 .save({key: 'apple', quantity: 3}, function() {

        var store2 = new Lawnchair({name: "store2"}, function() {});

        store1.all(function(r) {
            equals(r.length, 1);
        });

        store2.all(function(r) {
            equals(r.length, 0);
        });

    })


})
**/

module('all()', {
    setup:function() {
        QUnit.stop();

        // I like to make all my variables globals. Starting a new trend.
        me = {name:'brian', age:30};
        store.nuke(function() { QUnit.start(); });
    },
    teardown:function() {
        me = null;
    }
})

test('chainable', function() {
    QUnit.stop();
    QUnit.expect(1);

    same(store.all(function(r) { QUnit.start(); }), store, 'should be chainable (return itself)');
})

test('full callback syntax', function() {
    QUnit.stop();
    QUnit.expect(4);

    store.all(function(r) {
        ok(true, 'calls callback');
        ok(r instanceof Array, 'should provide array as parameter');
        equals(r.length, 0, 'parameter should initially have zero length');
        same(this, store, '"this" should be scoped to the lawnchair object inside callback');
        QUnit.start();
    });
}) 

test('adding, nuking and size tests', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.save(me, function() {
        store.all(function(r) {
            equals(r.length, 1, 'parameter should have length 1 after saving a single record');
            store.nuke(function() {
                store.all(function(r) {
                    equals(r.length, 0, 'parameter should have length 0 after nuking');
                    QUnit.start();                    
                });
            });
        });
    });
})

test( 'shorthand callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.all('ok(true, "shorthand syntax callback gets evaled"); same(this, store, "`this` should be scoped to the Lawnchair instance"); QUnit.start();');

    // Is this test block necessary?
    //
    // var tmp = new Lawnchair({name:'temps', record:'tmp'}, function(){
    //     QUnit.start()
    //     var Temps = this;
    //     equals(this, Temps, 'this is bound to Lawnchair')
    //     QUnit.stop()
    //     Temps.all('ok(temps, "this.name is passed to all callback"); QUnit.start()')
    // })
})

/** TBD issue with Android:
test('scoped variable in shorthand callback', function() {
    QUnit.expect(1);
    QUnit.stop();

    // FIXME fkn qunit being weird here... expect(1)
    var tmp = new Lawnchair({name:'temps', record:'tmp'}, function() {
		this.nuke(function() {
			this.save({a:1}, function() {
				this.each('ok(tmp, "this.record is passed to each callback"); QUnit.start()')
			})
		})
    })
})
**/

module('nuke()', {
    setup:function() {
		QUnit.stop();
        store.nuke(function() { 
			QUnit.start() 
		});
    },
    teardown:function() {
    }
})

test( 'chainable', function() {
    QUnit.expect(1);
	QUnit.stop()

    same(store.nuke(function() { QUnit.start() }), store, 'should be chainable');
})

test( 'full callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.nuke(function() {
        ok(true, "should call callback in nuke");
        same(this, store, '"this" should be scoped to the Lawnchair instance');
        QUnit.start();
    });
})

test( 'shorthand callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.nuke('ok(true, "shorthand syntax callback gets evaled"); same(this, store, "`this` should be scoped to the Lawnchair instance"); QUnit.start();');
})

module('save()', {
    setup:function() {
        QUnit.stop();

        // I like to make all my variables globals. Starting a new trend.
        me = {name:'brian', age:30};
        store.nuke(function() { QUnit.start(); });
    },
    teardown:function() {
        me = null;
    }
})

test( 'chainable', function() {
    QUnit.stop();
    QUnit.expect(1);

    same(store.save(me, function() { QUnit.start(); }), store, 'should be chainable');
})

test( 'full callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.save(me, function(it) {
        ok(true, 'should call passed in callback');
        same(it, me, 'should pass in original saved object in callback');
        QUnit.start();
    });
})

test( 'shorthand callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.save(me, 'ok(true, "shorthand syntax callback gets evaled"); same(this, store, "`this` should be scoped to the Lawnchair instance"); QUnit.start();');
})

test( 'saving objects', function() { 
    QUnit.stop();
    QUnit.expect(1);

    store.save(me, function() {
        store.save({key:"something", value:"else"}, function(r) {
            store.all(function(r) {
                equals(r.length, 2, 'after saving two keys, num. records should equal to 2');
                QUnit.start();
            });
        });
    })
})

test( 'save without callback', function() {

    QUnit.stop();
    QUnit.expect(1);

    store.save(me, function(obj) {
        var key = obj.key;
        store.save(obj);
        equals(obj.key, key, "save without callback retains key");
        QUnit.start();
    })

});

module('batch()', {
    setup:function() {
        QUnit.stop();

        // I like to make all my variables globals. Starting a new trend.
        me = {name:'brian', age:30};
        store.nuke(function() { QUnit.start(); });
    },
    teardown:function() {
        me = null;
    }
})

test('batch insertion', function(){
    QUnit.expect(3);
    QUnit.stop();

    ok(store.batch, 'batch implemented');
    equals(store.batch([]), store, 'chainable')

    store.batch([{i:1},{i:2}], function() {
        store.all(function(r){
            equals(r.length, 2, 'should be two records from batch insert with array of two objects');
            QUnit.start();
        });
    });
})

test( 'full callback syntax', function() {
    QUnit.stop(1500); // timing changed by batch processing improvements
    QUnit.expect(2);

    store.batch([{j:'k'}], function() {
        ok(true, 'callback called with full syntax');
        same(this, store, '"this" should be the LAwnchair instance');
        QUnit.start();
    })
})

test( 'shorthand callback syntax', function() {
    QUnit.stop(1500); // timing changed by batch processing improvements
    QUnit.expect(2);

    store.batch([{o:'k'}], 'ok(true, "shorthand syntax callback gets evaled"); same(this, store, "`this` should be scoped to the Lawnchair instance"); QUnit.start();')
})

module('get()', {
    setup:function() {
        QUnit.stop();

        // I like to make all my variables globals. Starting a new trend.
        me = {name:'brian', age:30};
        store.nuke(function() { QUnit.start(); });
    },
    teardown:function() {
        me = null;
    }
});

test( 'should it be chainable?', function() {
    QUnit.expect(1);
    QUnit.stop();

    equals(store.get('foo', function() { QUnit.start(); }), store, 'get chainable');
});

test('get functionality', function() {
    QUnit.expect(4);
    QUnit.stop();

    store.save({key:'xyz', name:'tim'}, function() {
        store.get('xyz', function(r) {
            equals(r.key, 'xyz', 'should return key in loaded object');
            equals(r.name, 'tim', 'should return proper object when calling get with a key');
            store.get('doesntexist', function(s) {
                ok(true, 'should call callback even for non-existent key');
                equals(s, null, 'should return null for non-existent key');
                QUnit.start();                
            });
        });
    });
});

test('get batch functionality', function() {
    QUnit.expect(3);
    QUnit.stop(1500); // timing changed by batch processing improvements

    var t = [{key:'test-get'},{key:'test-get-1'}]
    store.batch(t, function() {
        this.get(['test-get','test-get-1'], function(r) {
            equals(r[0].key, 'test-get', "get first object");
            equals(r[1].key, 'test-get-1', "get second object");
            equals(r.length, t.length, "should batch get")
            QUnit.start()
        })
    }) 
});

test( 'full callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.get('somekey', function(r){
        ok(true, 'callback got called');
        same(this, store, '"this" should be teh Lawnchair instance');
        QUnit.start();
    });
});

test('short callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.get('somekey', 'ok(true, "shorthand syntax callback gets evaled"); same(this, store, "`this` should be scoped to the Lawnchair instance"); QUnit.start();');
});

module('remove()', {
    setup:function() {
        QUnit.stop();

        // I like to make all my variables globals. Starting a new trend.
        me = {name:'brian', age:30};
        store.nuke(function() { QUnit.start(); });
    },
    teardown:function() {
        me = null;
    }
});


test( 'chainable', function() {
    QUnit.expect(1);
    QUnit.stop();

    store.save({key:'me', name:'brian'}, function() {
        same(store.remove('me', function() { 
                QUnit.start(); 
             }), store, 'should be chainable');
         
    });
});

test( 'full callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.save({key:'somekey', name:'something'}, function() {
        store.remove('somekey', function(r){
            ok(true, 'callback got called');
            same(this, store, '"this" should be teh Lawnchair instance');
            QUnit.start();
        });
    });
});

test('short callback syntax', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.save({key:'somekey', name:'something'}, function() {
        store.remove('somekey', 'ok(true, "shorthand syntax callback gets evaled"); same(this, store, "`this` should be scoped to the Lawnchair instance"); QUnit.start();');
    });
});

// FIXME need to add tests for batch deletion 
test( 'remove functionality', function() {
    QUnit.stop();
    QUnit.expect(2);

    store.save({name:'joni'}, function(r) {
        //store.find("r.name == 'joni'", function(r){
            store.remove(r, function(r) {
                store.all(function(all) {
                    equals(all.length, 0, "should have length 0 after saving, finding, and removing a record using entire object");
                    store.save({key:'die', name:'dudeman'}, function(r) {
                        store.remove('die', function(r){
                            store.all(function(rec) {
                                equals(rec.length, 0, "should have length 0 after saving and removing by string key");
                                QUnit.start();
                            });
                        });
                    });
                });
            });
        //});
    });
}); 
