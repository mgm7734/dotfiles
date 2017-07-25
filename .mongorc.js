// interpreterVersion()

function get_path() {
    var result = arguments.shift

}


function purgeUser(uid) {
    printjson(  db.authorization.deleteMany({uid: uid}) )
    printjson( db.userRole.deleteMany({user: uid}) )
    db.user.remove({_id: uid})
}

/*
 * Index nested object in an array or object.n
 * Path can be '.' separated key string or array of keys. For arrays, path can be a number.
 */
function getPath(obj, path) {
    if (path.length == 0)
        return obj
    if (typeof obj != 'object')
        return undefined
    if (typeof path == 'string')
        path = path.split('.')
    return getPath(obj[path[0]], path.slice(1))
}

function getter() {
    var path
    if (arguments.length == 1)
        path = arguments[0]
1    else
        path = [].slice.call(arguments)
    return function(obj) {
        return getPath(obj, path)
    }
}

function colls4proj(code) {
    var proj = db.project.findOne({code:code})
    return db.getCollectionNames().filter(function(nm) { return nm.endsWith(proj._id) })
}

//// Misc array utilities
function sum(a) { return a.reduce((a,x) => a+x, 0) }
function min(a) { return a.reduce((acc, v) => v < acc ? v : a) }
function max(a) { return a.reduce((acc, v) => v > acc ? v : a) }

Array.prototype.limit = function(n) {
    let r = []
    for (let i = 0; i < n; ++i) {
        r[i] = this[i]
    }
    return r
}

Object.prototype.tap = function(f) {f(this); return this}

/*
Function Set(hashFunction) {
	this._hashFunction = hashFunction || JSON.stringify;
	this._values = {};
	this._size = 0;
}

Set.prototype = {
	add: function add(value) {
		if (!this.contains(value)) {
			this._values[this._hashFunction(value)] = value;
			this._size++;
		}
	},

	remove: function remove(value) {
		if (this.contains(value)) {
			delete this._values[this._hashFunction(value)];
			this._size--;
		}
	},

	contains: function contains(value) {
		return typeof this._values[this._hashFunction(value)] !== "undefined";
	},

	size: function size() {
		return this._size;
	},

	forEach: function each(iteratorFunction, thisObj) {
		for (var value in this._values) {
			iteratorFunction.call(thisObj, this._values[value]);
		}
	}
}
*/

///////// PiLR

function addProjectOwner(projCode, username) {
    var projId = db.project.findOne({code: projCode})._id
    var newOwnerId=db.user.findOne({username: username})._id
    if (db.authorization.count({instanceId: projId, permission: {$exists: 0}, uid: newOwnerId}) > 0) {
        printjson('already an owner')
        return
    }
    var someOwnerAuth = db.authorization.findOne({instanceId: projId, permission: {$exists: 0}})
    printjson(someOwnerAuth.uid)
    return db.authorization.find({instanceId: projId, uid: someOwnerAuth.uid}).forEach(auth => {
        auth.uid = newOwnerId
        delete auth._id
        db.authorization.insert(auth)
    })
}
