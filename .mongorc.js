// interpreterVersion()

function get_path() {
    var result = arguments.shift

}


function purgeUser(uid) {
    printjson(  db.authorization.deleteMany({uid: uid}) )
    printjson( db.userRole.deleteMany({user: uid}) )
    db.user.remove({_id: uid})
}

function getPath(obj, path) {
    if (path.length == 0)
        return obj
    if (typeof obj != 'object')
        return undefined
    return getPath(obj[path[0]], path.slice(1))
}
function getter() {
    var path
    if (arguments.length == 1 && typeof arguments[0] != 'string')
        path = arguments[0]
    else
        path = [].slice.call(arguments)
    return function(obj) {
        return getPath(obj, path)
    }
}
