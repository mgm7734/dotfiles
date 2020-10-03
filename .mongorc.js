/** @return {DBCollection} dataset collection for give project- and dataset-code */
function data(projectCode, datasetCode='pilrhealth:mobile:survey_data', kind='data') {
    const proj = db.project.findOne({$or: [{ code: projectCode },
                                           { name: projectCode }]})
          || die('no project:', projectCode);
    const dataset = db.dataset.findOne({ code: datasetCode, project: proj._id})
          || die('no dataset:', datasetCode);
    return db[dataset._id + ':' + kind];
}

function addProjectOwner(projCode, username = 'mmendel') {
    var projId = db.project.findOne({code: projCode})._id
    var newOwnerId=db.user.findOne({username: username})._id
    0 == db.authorization.count({instanceId: projId, permission: {$exists: 0}, uid: newOwnerId})
        || die(username, 'is already an owner');

    var someOwnerAuth = db.authorization.findOne({instanceId: projId, permission: {$exists: 0}})
    printjson(someOwnerAuth.uid);
    db.authorization.find({instanceId: projId, uid: someOwnerAuth.uid}).forEach(auth => {
        auth.uid = newOwnerId;
        delete auth._id;
        db.authorization.insert(auth);
    });
}

function die(...strs) {
    throw strs.join(' ');
}

function unique(array) {
    return array.filter((el, ix) => array.indexOf(el) == ix)
}

Array.prototype.flatMap = function(f) { return this.reduce((acc,x) => acc.concat(f(x)), []); }

function arrayToObj(a, keyValFn) {
    var obj = {};
    a.forEach((x,i) => {
        var [k, v] = keyValFn(x,i)
        obj[k] = v
    });
    return obj;
}

function csvQuote(value) {
    if (typeof value == "string") {
        value = `"${ value.replace(new RegExp('"', 'g'), '""') }"`
    }
    return value
}

DBCollection.prototype.get = function(id) { return this.findOne({_id: id}) }

/**
 * Chainable queries.
 *  Example:
 *    q('project', {code: /^r21/}).child('instrument').child('instrumentConfig')
 *        .child('emaOtsCardstack', 'configuration').code()
 *    q('project', {code: /^r21/}).child('instrument').find()
 *  Projects using 'pt_card_bin'
 *    db.emaOtsCardstack.q({'sections.cards.type': 'pt_card_bin'}).parent('instrumentConfig', 'configuration')
 *       .parent('instrument').parent('project').name()
 */
function q(collName, query) { return new LazyQuery(collName, query) }
DBCollection.prototype.q = function (query = {}) { return q(this.getName(), query) }

function LazyQuery(collectionName, query = {}, opts = {}) {
    this.query = query;
    this.collectionName = collectionName;
    this.opts = opts;
    //this.collection = db[collectionName];
}
Object.assign(LazyQuery.prototype, {
    collection() {
        return db[this.collectionName]
    },
    find(query = {}) {
        let cursor = this.collection().find({$and: [this.query, query]});
        if (this.opts.offsetr) {
            cursor = cursor.offeset(this.opts.offeset);
        }
        if (this.opts.limit) {
            cursor = cursor.limit(this.opts.limit);
        }
        return cursor;
    },
    count() {  return this.collection().count(this.query) },
    at(ix) { return this.find().skip(ix).next() },
    prop(p) { return this.find().map(d=>d[p]) },
    id() { return this.prop('_id' )},
    code() { return this.prop('code')},
    name() { return this.prop('name')},
    limit(n) { return new LazyQuery(this.collectionName, this.query, {limit: n})},

    /** Refine the current query */
    where(q) {
        return new LazyQuery(this.collectionName, { $and: [ this.query, q ] });
    },

    child(childName, prop = null) {
        if (!prop) prop = this.collectionName;
        let parentIds = this.id();
        //return new LazyQuery(childName, {query: { [prop] : { $in: parentIds } }})
        return new LazyQuery(childName, { [prop] : { $in: parentIds } });
    },
    parent(parentName, prop = null) {
        if (!prop) prop = parentName;
        let parentIds = this.prop(prop);
        return new LazyQuery(parentName, { _id: { $in: parentIds } });
    }
})

//q('project', {code: 'r21testproject'}).child('instrument').child('instrumentConfig').child('emaOtsCardstack', 'configuration').count()
